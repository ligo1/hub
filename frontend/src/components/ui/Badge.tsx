import { HTMLAttributes } from 'react';

type BadgeVariant = 'purple' | 'blue' | 'pink' | 'gold' | 'green' | 'red' | 'gray';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantClasses: Record<BadgeVariant, string> = {
  purple: 'bg-accent-purple/20 text-accent-purple-light border-accent-purple/30',
  blue: 'bg-accent-blue/20 text-accent-blue-light border-accent-blue/30',
  pink: 'bg-accent-pink/20 text-accent-pink border-accent-pink/30',
  gold: 'bg-accent-gold/20 text-accent-gold border-accent-gold/30',
  green: 'bg-green-500/20 text-green-400 border-green-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  gray: 'bg-white/10 text-white/60 border-white/20',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

export const Badge = ({ variant = 'purple', size = 'sm', children, className = '', ...props }: BadgeProps) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-semibold border
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}
      `}
      {...props}
    >
      {children}
    </span>
  );
};

// Skill level badge with color per level
export const SkillBadge = ({ level }: { level: string }) => {
  const variants: Record<string, BadgeVariant> = {
    BEGINNER: 'green',
    INTERMEDIATE: 'blue',
    ADVANCED: 'purple',
    PRO: 'gold',
  };
  return <Badge variant={variants[level] || 'gray'}>{level}</Badge>;
};
