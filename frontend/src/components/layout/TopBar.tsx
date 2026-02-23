import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';

export const TopBar = () => {
  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="md:hidden sticky top-0 z-30 bg-surface-900/80 backdrop-blur-xl border-b border-white/5 px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-purple-light to-accent-pink flex items-center justify-center">
          <Layers size={14} className="text-white" />
        </div>
        <span className="text-lg font-bold text-white">Projects Hub</span>
      </div>
    </motion.header>
  );
};
