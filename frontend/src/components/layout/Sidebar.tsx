import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, FolderKanban, CheckSquare, CalendarDays, LogOut, Layers, Music } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';
import { useToast } from '../../hooks/useToast';

const hubItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/jamsync', icon: Music, label: 'JamSync' }
];

const navLinkClass = ({ isActive }: { isActive: boolean }) => `
  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
  transition-all duration-200
  ${isActive
    ? 'bg-accent-purple/20 text-accent-purple-light shadow-[0_0_15px_rgba(168,85,247,0.2)]'
    : 'text-white/60 hover:text-white hover:bg-white/5'
  }
`;

export const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const toast = useToast();

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden md:flex flex-col w-64 bg-surface-900/80 backdrop-blur-xl border-r border-white/5 h-screen sticky top-0"
    >
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple-light to-accent-pink flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <Layers size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">Projects Hub</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {hubItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'} className={navLinkClass} aria-label={label}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User section */}
      {user && (
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-white/40 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all w-full mt-1 text-sm font-medium"
            aria-label="Sign out"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </motion.aside>
  );
};
