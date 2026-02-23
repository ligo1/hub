interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-white/5 rounded-xl ${className}`} />
);

export const CardSkeleton = () => (
  <div className="bg-surface-800 rounded-2xl border border-white/5 p-4 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-3/4" />
  </div>
);

export const ListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <CardSkeleton key={i} />
    ))}
  </div>
);
