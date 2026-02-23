import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent-purple-light hover:bg-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]',
  secondary: 'bg-surface-600 hover:bg-surface-500 text-white border border-white/10',
  ghost: 'bg-transparent hover:bg-white/5 text-white/80 hover:text-white',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  glass: 'bg-white/10 hover:bg-white/15 backdrop-blur-sm text-white border border-white/10',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
        className={`
          inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variantClasses[variant]} ${sizeClasses[size]} ${className}
        `}
        disabled={disabled || loading}
        {...(props as any)}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
