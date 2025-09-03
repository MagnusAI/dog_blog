import { SkeletonImage } from '../ui/Skeleton';

interface ProfilePictureSkeletonProps {
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  animate?: boolean;
  shape?: "square" | "circle";
}

const ProfilePictureSkeleton = ({ 
  size = "md",
  className = "", 
  animate = true,
  shape = "square"
}: ProfilePictureSkeletonProps) => {
  // Size configurations to match common profile picture sizes
  const sizeConfig = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-24 h-24",
    xl: "w-32 h-32",
    "2xl": "w-48 h-48"
  };

  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-lg";
  
  return (
    <div className={`${sizeConfig[size]} ${shapeClass} overflow-hidden ${className}`}>
      <SkeletonImage 
        className={`w-full h-full ${shapeClass}`}
        aspectRatio="aspect-square"
        animate={animate}
      />
    </div>
  );
};

export default ProfilePictureSkeleton;
