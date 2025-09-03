interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

const Skeleton = ({ className = "", animate = true }: SkeletonProps) => {
  const baseClasses = "bg-gray-200 rounded";
  const animateClasses = animate ? "animate-pulse" : "";
  
  return <div className={`${baseClasses} ${animateClasses} ${className}`} />;
};

// Specific skeleton components for common patterns
export const SkeletonText = ({ 
  lines = 1, 
  className = "",
  animate = true 
}: { 
  lines?: number; 
  className?: string;
  animate?: boolean;
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton 
        key={i}
        className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        animate={animate}
      />
    ))}
  </div>
);

export const SkeletonImage = ({ 
  className = "",
  aspectRatio = "square",
  animate = true 
}: { 
  className?: string;
  aspectRatio?: "square" | "video" | "photo" | string;
  animate?: boolean;
}) => {
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video", 
    photo: "aspect-[4/3]"
  };
  
  const aspectClass = aspectClasses[aspectRatio as keyof typeof aspectClasses] || aspectRatio;
  
  return (
    <Skeleton 
      className={`${aspectClass} w-full ${className}`}
      animate={animate}
    />
  );
};

export const SkeletonAvatar = ({ 
  size = "md",
  className = "",
  animate = true 
}: { 
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  };
  
  return (
    <Skeleton 
      className={`${sizeClasses[size]} rounded-full ${className}`}
      animate={animate}
    />
  );
};

export default Skeleton;
