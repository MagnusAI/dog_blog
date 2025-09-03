import { SkeletonImage, SkeletonText } from '../ui/Skeleton';

interface NewsPostSkeletonProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
}

const NewsPostSkeleton = ({ 
  size = "md", 
  className = "", 
  animate = true 
}: NewsPostSkeletonProps) => {
  // Match the exact dimensions from NewsPost component
  const sizeConfig = {
    sm: {
      container: "h-96 w-full max-w-xs",
      image: "h-44",
      content: "p-3",
      spacing: "space-y-2"
    },
    md: {
      container: "h-96 w-full max-w-sm", 
      image: "h-44",
      content: "p-4",
      spacing: "space-y-3"
    },
    lg: {
      container: "h-[28rem] w-full max-w-md",
      image: "h-52", 
      content: "p-5",
      spacing: "space-y-4"
    }
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`
        ${config.container}
        bg-white border border-gray-200 rounded-lg shadow-sm
        overflow-hidden
        flex flex-col
        ${className}
      `}
    >
      {/* Image Section Skeleton */}
      <div className={`${config.image} w-full flex-shrink-0`}>
        <SkeletonImage 
          className="w-full h-full rounded-none" 
          aspectRatio="w-full h-full"
          animate={animate}
        />
      </div>

      {/* Content Section Skeleton */}
      <div className={`${config.content} flex-1 flex flex-col justify-between`}>
        <div className={config.spacing}>
          {/* Date Skeleton */}
          <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
          
          {/* Title Skeleton */}
          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
          
          {/* Content/Excerpt Skeleton */}
          <SkeletonText 
            lines={size === 'lg' ? 4 : size === 'md' ? 3 : 2}
            animate={animate}
          />
        </div>
      </div>
    </div>
  );
};

export default NewsPostSkeleton;
