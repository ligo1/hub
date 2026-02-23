import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckSquare, FileText, Calendar } from 'lucide-react';
import { Project } from '../../types';
import { ProgressRing } from './ProgressRing';

const STATUS_LABEL: Record<Project['status'], string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

const STATUS_COLOR: Record<Project['status'], string> = {
  PLANNING: 'text-accent-blue bg-accent-blue/10',
  ACTIVE: 'text-green-400 bg-green-400/10',
  ON_HOLD: 'text-accent-gold bg-accent-gold/10',
  COMPLETED: 'text-accent-purple-light bg-accent-purple/10',
  ARCHIVED: 'text-white/40 bg-white/5',
};

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const navigate = useNavigate();
  const openTasks = project.tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED').length;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-surface-800 rounded-2xl border border-white/5 p-5 cursor-pointer hover:border-white/10 hover:shadow-xl transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${project.color}22`, border: `1px solid ${project.color}44` }}
          >
            {project.icon}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm leading-tight">{project.title}</h3>
            {project.description && (
              <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{project.description}</p>
            )}
          </div>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[project.status]}`}>
          {STATUS_LABEL[project.status]}
        </span>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-4">
        <ProgressRing progress={project.progress} size={44} stroke={4} color={project.color} />
        <div>
          <p className="text-white font-bold text-lg leading-none">{project.progress}%</p>
          <p className="text-white/40 text-xs mt-0.5">complete</p>
        </div>
        <div className="flex-1">
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${project.progress}%`, background: project.color }}
            />
          </div>
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-white/40 text-xs">
        <span className="flex items-center gap-1">
          <CheckSquare size={12} />
          {openTasks} open task{openTasks !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <FileText size={12} />
          {project.notes.length} note{project.notes.length !== 1 ? 's' : ''}
        </span>
        {project.dueDate && (
          <span className="flex items-center gap-1 ml-auto">
            <Calendar size={12} />
            {new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </motion.div>
  );
};
