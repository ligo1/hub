import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare } from 'lucide-react';
import { useProjectsStore } from '../../stores/projectsStore';
import { TaskItem } from '../../components/hub/TaskItem';
import { useToast } from '../../hooks/useToast';
import { tasksService } from '../../services/tasks.service';
import { Task } from '../../types';

const STATUS_FILTERS: Array<{ label: string; value: Task['status'] | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'To Do', value: 'TODO' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Done', value: 'DONE' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const PRIORITY_FILTERS: Array<{ label: string; value: Task['priority'] | 'ALL' }> = [
  { label: 'All priorities', value: 'ALL' },
  { label: 'Urgent', value: 'URGENT' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export const TasksPage = () => {
  const { projects, fetchProjects, updateTask, removeTask } = useProjectsStore();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<Task['status'] | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Task['priority'] | 'ALL'>('ALL');

  useEffect(() => { fetchProjects(); }, []);

  const allTasks = projects.flatMap((p) =>
    p.tasks.map((t) => ({ ...t, projectTitle: p.title, projectColor: p.color }))
  );

  const filtered = allTasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    return true;
  });

  const handleStatusChange = async (taskId: string, status: Task['status']) => {
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      const updated = await tasksService.update(taskId, { status });
      updateTask(task.projectId, updated);
    } catch { toast.error('Failed to update task'); }
  };

  const handleDelete = async (taskId: string) => {
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return;
    try {
      await tasksService.delete(taskId);
      removeTask(task.projectId, taskId);
    } catch { toast.error('Failed to delete task'); }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">All Tasks</h1>
        <p className="text-white/40 text-sm mt-0.5">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="space-y-2 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button key={value} onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === value ? 'bg-accent-purple-light text-white' : 'bg-surface-800 text-white/50 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {PRIORITY_FILTERS.map(({ label, value }) => (
            <button key={value} onClick={() => setPriorityFilter(value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                priorityFilter === value ? 'bg-white/10 text-white' : 'bg-surface-800 text-white/40 hover:text-white'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare size={40} className="text-white/10 mx-auto mb-3" />
          <p className="text-white/30">No tasks match these filters</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
          {filtered.map((task) => (
            <motion.div key={task.id} variants={item}>
              <TaskItem
                task={task}
                showProject
                projectName={(task as any).projectTitle}
                projectColor={(task as any).projectColor}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
