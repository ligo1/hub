import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, ToastType } from '../../stores/toastStore';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} className="text-green-400" />,
  error: <XCircle size={16} className="text-red-400" />,
  info: <Info size={16} className="text-accent-blue-light" />,
  warning: <AlertTriangle size={16} className="text-accent-gold" />,
};

const borderColors: Record<ToastType, string> = {
  success: 'border-green-500/30',
  error: 'border-red-500/30',
  info: 'border-accent-blue/30',
  warning: 'border-accent-gold/30',
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 60, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.9 }}
            className={`
              pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl
              bg-surface-700 border ${borderColors[toast.type]} shadow-xl
              backdrop-blur-sm min-w-[280px] max-w-[360px]
            `}
          >
            {icons[toast.type]}
            <p className="text-sm text-white/90 flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white/30 hover:text-white/70 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
