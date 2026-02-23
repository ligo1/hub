import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FolderKanban, CheckSquare, Calendar, TrendingUp, Plus } from 'lucide-react';
import { useProjectsStore } from '../../stores/projectsStore';
import { useAuthStore } from '../../stores/authStore';
import { ProjectCard } from '../../components/hub/ProjectCard';
import { TaskItem } from '../../components/hub/TaskItem';
import { useToast } from '../../hooks/useToast';
import { tasksService } from '../../services/tasks.service';
import { Task } from '../../types';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export const HubDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, loading, fetchProjects, updateTask, removeTask } = useProjectsStore();
  const toast = useToast();

  useEffect(() => { fetchProjects(); }, []);

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE' || p.status === 'PLANNING');
  const allTasks = projects.flatMap((p) => p.tasks.map((t) => ({ ...t, project: p })));
  const openTasks = allTasks.filter((t) => t.status === 'TODO' || t.status === 'IN_PROGRESS')
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    }).slice(0, 5);

  const upcoming = projects
    .filter((p) => p.dueDate && new Date(p.dueDate) >= new Date())
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3);

  const avgProgress = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
    : 0;

  const handleTaskStatus = async (taskId: string, status: Task['status'], projectId: string) => {
    try {
      const updated = await tasksService.update(taskId, { status });
      updateTask(projectId, updated);
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId: string, projectId: string) => {
    try {
      await tasksService.delete(taskId);
      removeTask(projectId, taskId);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Greeting */}
      <motion.div variants={item} initial="hidden" animate="show" className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          {user?.name.split(' ')[0]} 👋
        </h1>
        <p className="text-white/50 text-sm mt-1">Here's your project overview</p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Total Projects', value: projects.length, icon: FolderKanban, color: 'text-accent-purple-light', bg: 'from-accent-purple/20' },
          { label: 'Active', value: activeProjects.length, icon: TrendingUp, color: 'text-green-400', bg: 'from-green-500/20' },
          { label: 'Open Tasks', value: openTasks.length, icon: CheckSquare, color: 'text-accent-blue', bg: 'from-blue-500/20' },
          { label: 'Avg Progress', value: `${avgProgress}%`, icon: Calendar, color: 'text-accent-gold', bg: 'from-yellow-500/20' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div key={label} variants={item} className={`bg-gradient-to-br ${bg} to-surface-800 rounded-2xl border border-white/5 p-4`}>
            <Icon size={18} className={color} />
            <p className="text-white text-2xl font-bold mt-2">{value}</p>
            <p className="text-white/40 text-xs mt-0.5">{label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Projects */}
        <motion.div variants={container} initial="hidden" animate="show">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">Active Projects</h2>
            <button onClick={() => navigate('/projects')} className="text-accent-purple-light text-xs hover:underline">View all</button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-32 bg-surface-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : activeProjects.length === 0 ? (
            <motion.div variants={item} className="bg-surface-800 rounded-2xl border border-white/5 p-8 text-center">
              <FolderKanban size={32} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">No active projects</p>
              <button onClick={() => navigate('/projects')} className="mt-3 flex items-center gap-1 text-accent-purple-light text-xs font-medium mx-auto hover:underline">
                <Plus size={12} /> Create one
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {activeProjects.slice(0, 3).map((p) => (
                <motion.div key={p.id} variants={item}>
                  <ProjectCard project={p} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="space-y-6">
          {/* Open Tasks */}
          <motion.div variants={container} initial="hidden" animate="show">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold">Open Tasks</h2>
              <button onClick={() => navigate('/tasks')} className="text-accent-purple-light text-xs hover:underline">View all</button>
            </div>
            {openTasks.length === 0 ? (
              <div className="bg-surface-800 rounded-2xl border border-white/5 p-6 text-center">
                <CheckSquare size={28} className="text-white/20 mx-auto mb-2" />
                <p className="text-white/40 text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {openTasks.map((t) => (
                  <motion.div key={t.id} variants={item}>
                    <TaskItem
                      task={t}
                      showProject
                      projectName={(t as any).project?.title}
                      projectColor={(t as any).project?.color}
                      onStatusChange={(id, status) => handleTaskStatus(id, status, t.projectId)}
                      onDelete={(id) => handleTaskDelete(id, t.projectId)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Upcoming Deadlines */}
          {upcoming.length > 0 && (
            <motion.div variants={container} initial="hidden" animate="show">
              <h2 className="text-white font-semibold mb-3">Upcoming Deadlines</h2>
              <div className="space-y-2">
                {upcoming.map((p) => {
                  const daysLeft = Math.ceil((new Date(p.dueDate!).getTime() - Date.now()) / 86400000);
                  return (
                    <motion.div
                      key={p.id} variants={item}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="flex items-center gap-3 p-3 bg-surface-800 rounded-xl border border-white/5 cursor-pointer hover:border-white/10 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: `${p.color}22` }}>
                        {p.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{p.title}</p>
                        <p className="text-white/40 text-xs">{new Date(p.dueDate!).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${daysLeft <= 3 ? 'bg-red-500/20 text-red-400' : 'bg-accent-purple/20 text-accent-purple-light'}`}>
                        {daysLeft}d
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
