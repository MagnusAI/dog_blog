import { SkeletonImage } from '../ui/Skeleton';

interface DogCardSkeletonProps {
  className?: string;
  animate?: boolean;
}

const DogCardSkeleton = ({ 
  className = "", 
  animate = true 
}: DogCardSkeletonProps) => {
  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden
        ${className}
      `}
    >
      {/* Image Section Skeleton */}
      <div className="relative aspect-square overflow-hidden">
        <SkeletonImage 
          className="w-full h-full rounded-none" 
          aspectRatio="aspect-square"
          animate={animate}
        />
      </div>

      {/* Content Section Skeleton */}
      <div className="p-4 space-y-1 flex flex-col h-full">
        {/* Name Skeleton */}
        <div className="space-y-2">
          <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse" />
        </div>
        
        {/* Breed/Subtitle Skeleton */}
        <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
        
        {/* Metadata Skeleton (if present) */}
        <div className="pt-2 space-y-1">
          <div className="w-full h-3 bg-gray-200 rounded animate-pulse" />
          <div className="w-2/3 h-3 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default DogCardSkeleton;
