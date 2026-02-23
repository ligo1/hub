import { motion } from 'framer-motion';
import { Calendar, Circle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Task } from '../../types';

const PRIORITY_DOT: Record<Task['priority'], string> = {
  LOW: 'bg-white/30',
  MEDIUM: 'bg-accent-blue',
  HIGH: 'bg-accent-gold',
  URGENT: 'bg-red-400',
};

const STATUS_ICON: Record<Task['status'], React.ReactNode> = {
  TODO: <Circle size={16} className="text-white/30" />,
  IN_PROGRESS: <Clock size={16} className="text-accent-blue" />,
  DONE: <CheckCircle2 size={16} className="text-green-400" />,
  CANCELLED: <XCircle size={16} className="text-white/20" />,
};

interface TaskItemProps {
  task: Task;
  onStatusChange?: (id: string, status: Task['status']) => void;
  onDelete?: (id: string) => void;
  showProject?: boolean;
  projectName?: string;
  projectColor?: string;
}

const nextStatus: Record<Task['status'], Task['status']> = {
  TODO: 'IN_PROGRESS',
  IN_PROGRESS: 'DONE',
  DONE: 'TODO',
  CANCELLED: 'TODO',
};

export const TaskItem = ({ task, onStatusChange, onDelete, showProject, projectName, projectColor }: TaskItemProps) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-800 border border-white/5 group hover:border-white/10 transition-all ${
        task.status === 'DONE' || task.status === 'CANCELLED' ? 'opacity-50' : ''
      }`}
    >
      {/* Status toggle */}
      <button
        onClick={() => onStatusChange?.(task.id, nextStatus[task.status])}
        className="flex-shrink-0 hover:scale-110 transition-transform"
        aria-label="Toggle status"
      >
        {STATUS_ICON[task.status]}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-white/30' : 'text-white'}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {showProject && projectName && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ color: projectColor, background: `${projectColor}22` }}
            >
              {projectName}
            </span>
          )}
          {task.dueDate && (
            <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? 'text-red-400' : 'text-white/40'}`}>
              <Calendar size={9} />
              {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Priority dot */}
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`} title={task.priority} />

      {/* Delete */}
      {onDelete && (
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all text-xs px-1"
          aria-label="Delete task"
        >
          ×
        </button>
      )}
    </motion.div>
  );
};
