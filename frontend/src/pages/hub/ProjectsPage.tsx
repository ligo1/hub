import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FolderKanban, X } from 'lucide-react';
import { useProjectsStore } from '../../stores/projectsStore';
import { ProjectCard } from '../../components/hub/ProjectCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../hooks/useToast';
import { projectsService } from '../../services/projects.service';
import { Project } from '../../types';

const STATUSES: Array<{ label: string; value: Project['status'] | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Planning', value: 'PLANNING' },
  { label: 'On Hold', value: 'ON_HOLD' },
  { label: 'Completed', value: 'COMPLETED' },
];

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4'];
const ICONS  = ['📁', '🚀', '💡', '🎯', '🛠️', '📊', '🎨', '📝', '🔬', '⚡'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item      = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export const ProjectsPage = () => {
  const { projects, loading, fetchProjects, addProject } = useProjectsStore();
  const toast = useToast();
  const [filter, setFilter] = useState<Project['status'] | 'ALL'>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', color: COLORS[0], icon: ICONS[0], dueDate: '' });

  useEffect(() => { fetchProjects(); }, []);

  const filtered = filter === 'ALL' ? projects : projects.filter((p) => p.status === filter);

  const handleCreate = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const project = await projectsService.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        color: form.color,
        icon: form.icon,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      });
      addProject(project);
      setShowCreate(false);
      setForm({ title: '', description: '', color: COLORS[0], icon: ICONS[0], dueDate: '' });
      toast.success('Project created');
    } catch {
      toast.error('Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-white/40 text-sm mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="md">
          <Plus size={16} /> New Project
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {STATUSES.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === value ? 'bg-accent-purple-light text-white' : 'bg-surface-800 text-white/50 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-44 bg-surface-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/40">{filter === 'ALL' ? 'No projects yet' : `No ${filter.toLowerCase()} projects`}</p>
          {filter === 'ALL' && (
            <Button onClick={() => setShowCreate(true)} variant="ghost" size="sm" className="mt-3">
              <Plus size={14} /> Create your first project
            </Button>
          )}
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <motion.div key={p.id} variants={item}>
              <ProjectCard project={p} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-surface-800 rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-white font-bold text-lg">New Project</h2>
                <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white"><X size={18} /></button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Title"
                  placeholder="My awesome project"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  autoFocus
                />
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Description</label>
                  <textarea
                    placeholder="What's this project about?"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full bg-surface-700 text-white/80 text-sm px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-accent-purple-light resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Color</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setForm({ ...form, color: c })}
                        className={`w-7 h-7 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white scale-110' : ''}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map((icon) => (
                      <button key={icon} onClick={() => setForm({ ...form, icon })}
                        className={`w-9 h-9 rounded-xl text-lg transition-all ${form.icon === icon ? 'bg-accent-purple/30 ring-1 ring-accent-purple-light' : 'bg-surface-700 hover:bg-surface-600'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-white/50 font-medium mb-1.5 block">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full bg-surface-700 text-white/80 text-sm px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-accent-purple-light"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
                <Button onClick={handleCreate} loading={saving} className="flex-1">Create Project</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
