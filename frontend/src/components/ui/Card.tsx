import { HTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  elevated?: boolean;
  hover?: boolean;
}

export const Card = ({ glow, elevated, hover, children, className = '', ...props }: CardProps) => {
  const base = elevated ? 'bg-surface-700' : 'bg-surface-800';
  const glowClass = glow ? 'shadow-[0_0_30px_rgba(168,85,247,0.2)]' : 'shadow-xl';
  const hoverClass = hover ? 'hover:border-white/15 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] cursor-pointer' : '';

  return (
    <motion.div
      className={`
        ${base} rounded-2xl border border-white/5 backdrop-blur-sm
        ${glowClass} ${hoverClass} transition-all duration-300 ${className}
      `}
      {...(props as any)}
    >
      {children}
    </motion.div>
  );
};
