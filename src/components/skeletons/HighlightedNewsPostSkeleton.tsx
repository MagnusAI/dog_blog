import { SkeletonImage, SkeletonText } from '../ui/Skeleton';

interface HighlightedNewsPostSkeletonProps {
  className?: string;
  animate?: boolean;
}

const HighlightedNewsPostSkeleton = ({ 
  className = "", 
  animate = true 
}: HighlightedNewsPostSkeletonProps) => {
  return (
    <div
      className={`
        h-full md:h-96
        w-full
        overflow-hidden
        flex flex-col md:flex-row
        rounded-lg
        bg-white border border-gray-200 shadow-sm
        ${className}
      `}
    >
      {/* Image Section Skeleton */}
      <div className="w-full md:w-1/2 flex-shrink-0 overflow-hidden relative">
        <SkeletonImage 
          className="w-full h-full rounded-none min-h-[200px] md:min-h-full" 
          aspectRatio="w-full h-full"
          animate={animate}
        />
      </div>

      {/* Content Section Skeleton */}
      <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center space-y-6">
        {/* Date Skeleton */}
        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
        
        {/* Title Skeleton */}
        <div className="space-y-3">
          <div className="w-full h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-4/5 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-3/5 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
        
        {/* Content/Excerpt Skeleton */}
        <div className="space-y-3">
          <SkeletonText 
            lines={4}
            animate={animate}
          />
        </div>

        {/* Read More Button Skeleton */}
        <div className="pt-4">
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export default HighlightedNewsPostSkeleton;
