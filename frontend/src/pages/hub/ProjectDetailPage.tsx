import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { useProjectsStore } from '../../stores/projectsStore';
import { ProgressRing } from '../../components/hub/ProgressRing';
import { TaskItem } from '../../components/hub/TaskItem';
import { NoteCard } from '../../components/hub/NoteCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';
import { projectsService } from '../../services/projects.service';
import { tasksService } from '../../services/tasks.service';
import { notesService } from '../../services/notes.service';
import { Task, Note, Project } from '../../types';

const TASK_STATUSES: Task['status'][] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
const STATUS_LABEL: Record<Task['status'], string> = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done', CANCELLED: 'Cancelled' };

export const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { projects, fetchProjects, updateProject, removeProject, addTask, updateTask, removeTask, addNote, updateNote, removeNote } = useProjectsStore();

  const project = projects.find((p) => p.id === id);
  const [loading, setLoading] = useState(!project);
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes'>('tasks');
  const [newTask, setNewTask] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editingProject, setEditingProject] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    if (!project) {
      fetchProjects().finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return (
    <div className="p-8 max-w-4xl mx-auto space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-20 bg-surface-800 rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!project) return (
    <div className="p-8 text-center text-white/40">Project not found</div>
  );

  const handleAddTask = async () => {
    if (!newTask.trim()) return;
    try {
      const task = await tasksService.create({ title: newTask.trim(), projectId: project.id });
      addTask(project.id, task);
      setNewTask('');
    } catch { toast.error('Failed to add task'); }
  };

  const handleTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const updated = await tasksService.update(taskId, { status });
      updateTask(project.id, updated);
    } catch { toast.error('Failed to update task'); }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await tasksService.delete(taskId);
      removeTask(project.id, taskId);
    } catch { toast.error('Failed to delete task'); }
  };

  const handleAddNote = async () => {
    if (!newNote.title.trim()) return;
    try {
      const note = await notesService.create({ ...newNote, projectId: project.id });
      addNote(project.id, note);
      setNewNote({ title: '', content: '' });
      setShowNoteForm(false);
      toast.success('Note added');
    } catch { toast.error('Failed to add note'); }
  };

  const handleUpdateNote = async (noteId: string, title: string, content: string) => {
    try {
      const updated = await notesService.update(noteId, { title, content });
      updateNote(project.id, updated);
    } catch { toast.error('Failed to update note'); }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await notesService.delete(noteId);
      removeNote(project.id, noteId);
    } catch { toast.error('Failed to delete note'); }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks and notes?')) return;
    try {
      await projectsService.delete(project.id);
      removeProject(project.id);
      navigate('/projects');
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete project'); }
  };

  const handleSaveTitle = async () => {
    try {
      const updated = await projectsService.update(project.id, { title: editTitle, description: editDesc });
      updateProject(updated);
      setEditingProject(false);
    } catch { toast.error('Failed to update project'); }
  };

  const handleStatusChange = async (status: Project['status']) => {
    try {
      const updated = await projectsService.update(project.id, { status });
      updateProject(updated);
    } catch { toast.error('Failed to update status'); }
  };

  const tasksByStatus = TASK_STATUSES.reduce((acc, s) => {
    acc[s] = project.tasks.filter((t) => t.status === s);
    return acc;
  }, {} as Record<Task['status'], Task[]>);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/projects')} className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Projects
      </button>

      {/* Header */}
      <div className="bg-surface-800 rounded-2xl border border-white/5 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: `${project.color}22`, border: `1px solid ${project.color}44` }}>
            {project.icon}
          </div>
          <div className="flex-1 min-w-0">
            {editingProject ? (
              <div className="space-y-2">
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-surface-700 text-white font-bold text-lg px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-accent-purple-light" />
                <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2}
                  className="w-full bg-surface-700 text-white/60 text-sm px-3 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:border-accent-purple-light resize-none" />
                <div className="flex gap-2">
                  <button onClick={handleSaveTitle} className="flex items-center gap-1 text-xs text-green-400 font-medium"><Check size={12} /> Save</button>
                  <button onClick={() => setEditingProject(false)} className="flex items-center gap-1 text-xs text-white/40 font-medium"><X size={12} /> Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white">{project.title}</h1>
                  <button onClick={() => { setEditTitle(project.title); setEditDesc(project.description || ''); setEditingProject(true); }}
                    className="text-white/20 hover:text-white/60 transition-colors"><Pencil size={13} /></button>
                </div>
                {project.description && <p className="text-white/50 text-sm mt-0.5">{project.description}</p>}
              </>
            )}
            <div className="flex items-center gap-2 mt-2">
              <select value={project.status} onChange={(e) => handleStatusChange(e.target.value as Project['status'])}
                className="bg-surface-700 text-white/70 text-xs px-2 py-1 rounded-lg border border-white/10 focus:outline-none">
                {(['PLANNING','ACTIVE','ON_HOLD','COMPLETED','ARCHIVED'] as Project['status'][]).map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative">
              <ProgressRing progress={project.progress} size={64} stroke={6} color={project.color} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white text-sm font-bold">{project.progress}%</span>
              </div>
            </div>
            <button onClick={handleDeleteProject} className="text-white/20 hover:text-red-400 transition-colors" aria-label="Delete project">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-800 rounded-xl p-1 mb-6 border border-white/5">
        {(['tasks', 'notes'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-accent-purple-light text-white' : 'text-white/50 hover:text-white'}`}>
            {tab} ({tab === 'tasks' ? project.tasks.length : project.notes.length})
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div>
          {/* Add task */}
          <div className="flex gap-2 mb-6">
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="Add a task… (press Enter)"
              className="flex-1 bg-surface-800 text-white text-sm px-4 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-accent-purple-light"
            />
            <Button onClick={handleAddTask} size="md"><Plus size={16} /></Button>
          </div>

          {/* Kanban columns */}
          <div className="grid md:grid-cols-2 gap-4">
            {(['TODO', 'IN_PROGRESS'] as Task['status'][]).map((status) => (
              <div key={status}>
                <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">{STATUS_LABEL[status]} · {tasksByStatus[status].length}</h3>
                <div className="space-y-2 min-h-[60px]">
                  {tasksByStatus[status].map((task) => (
                    <TaskItem key={task.id} task={task} onStatusChange={handleTaskStatus} onDelete={handleDeleteTask} />
                  ))}
                </div>
              </div>
            ))}
            {(['DONE', 'CANCELLED'] as Task['status'][]).map((status) => (
              tasksByStatus[status].length > 0 && (
                <div key={status}>
                  <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">{STATUS_LABEL[status]} · {tasksByStatus[status].length}</h3>
                  <div className="space-y-2">
                    {tasksByStatus[status].map((task) => (
                      <TaskItem key={task.id} task={task} onStatusChange={handleTaskStatus} onDelete={handleDeleteTask} />
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Notes tab */}
      {activeTab === 'notes' && (
        <div>
          {/* Add note */}
          {showNoteForm ? (
            <div className="bg-surface-800 rounded-2xl border border-white/10 p-4 mb-4 space-y-3">
              <Input label="Title" placeholder="Note title" value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} autoFocus />
              <div>
                <label className="text-xs text-white/50 font-medium mb-1.5 block">Content</label>
                <textarea value={newNote.content} onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={4} placeholder="Write your note..."
                  className="w-full bg-surface-700 text-white/80 text-sm px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-accent-purple-light resize-none" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddNote} size="sm">Save Note</Button>
                <Button variant="ghost" onClick={() => setShowNoteForm(false)} size="sm">Cancel</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowNoteForm(true)} variant="secondary" size="sm" className="mb-4">
              <Plus size={14} /> Add Note
            </Button>
          )}

          {project.notes.length === 0 ? (
            <div className="text-center py-12 text-white/30">No notes yet</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {project.notes.map((note) => (
                <NoteCard key={note.id} note={note} onUpdate={handleUpdateNote} onDelete={handleDeleteNote} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
