import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic2, Users, User, LogOut, ChevronLeft, FileMusic, ListMusic } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../ui/Avatar';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../ui/Toast';

const jamItems = [
  { to: '/jamsync', icon: Mic2, label: 'Sessions' },
  { to: '/jamsync/match', icon: Users, label: 'Match' },
  { to: '/jamsync/playlists', icon: ListMusic, label: 'Playlists' },
  { to: '/jamsync/editor', icon: FileMusic, label: 'Editor' },
  { to: '/jamsync/profile', icon: User, label: 'Profile' },
];

const navLinkClass = ({ isActive }: { isActive: boolean }) => `
  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
  transition-all duration-200
  ${isActive
    ? 'bg-accent-purple/20 text-accent-purple-light shadow-[0_0_15px_rgba(168,85,247,0.2)]'
    : 'text-white/60 hover:text-white hover:bg-white/5'
  }
`;

// Desktop sidebar for JamSync
const JamSyncSidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
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
            <Mic2 size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white">JamSync</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {jamItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/jamsync'} className={navLinkClass} aria-label={label}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Back to Hub */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/30 hover:text-white/60 hover:bg-white/5 transition-all w-full text-sm"
          >
            <ChevronLeft size={15} />
            Back to Hub
          </button>
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

// Mobile top bar for JamSync
const JamSyncTopBar = () => {
  const navigate = useNavigate();
  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="md:hidden sticky top-0 z-30 bg-surface-900/80 backdrop-blur-xl border-b border-white/5 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="text-white/40 hover:text-white transition-colors p-1 -ml-1"
          aria-label="Back to Hub"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-purple-light to-accent-pink flex items-center justify-center">
          <Mic2 size={14} className="text-white" />
        </div>
        <span className="text-lg font-bold text-white">JamSync</span>
      </div>
    </motion.header>
  );
};

// Mobile bottom nav for JamSync
const JamSyncBottomNav = () => {
  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-900/90 backdrop-blur-xl border-t border-white/5 pb-safe"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {jamItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/jamsync'}
            className={({ isActive }) => `
              flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200
              ${isActive ? 'text-accent-purple-light' : 'text-white/40 hover:text-white/70'}
            `}
            aria-label={label}
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-accent-purple/20' : ''}`}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </motion.nav>
  );
};

export const JamSyncLayout = () => {
  return (
    <div className="min-h-screen bg-surface-900 flex">
      <JamSyncSidebar />
      <div className="flex-1 flex flex-col min-h-screen md:overflow-hidden">
        <JamSyncTopBar />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>
        <JamSyncBottomNav />
      </div>
      <ToastContainer />
    </div>
  );
};
