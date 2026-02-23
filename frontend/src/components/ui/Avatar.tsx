interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const getGradient = (name: string) => {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
  ];
  const idx = name.charCodeAt(0) % gradients.length;
  return gradients[idx];
};

export const Avatar = ({ src, name, size = 'md', className = '' }: AvatarProps) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`
        ${sizeClasses[size]} rounded-full flex items-center justify-center
        bg-gradient-to-br ${getGradient(name)} font-bold text-white flex-shrink-0 ${className}
      `}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
};
