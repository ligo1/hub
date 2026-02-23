import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, CheckSquare, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
];

export const BottomNav = () => {
  return (
    <motion.nav
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-900/90 backdrop-blur-xl border-t border-white/5 pb-safe"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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
