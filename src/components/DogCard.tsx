import type { HTMLAttributes } from "react";
import Typography from "./ui/Typography";

export interface DogCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  breed: string;
  imageUrl?: string;
  imageAlt?: string;
  fallbackInitials?: string;
  subtitle?: string;
  metadata?: string[];
  dogId?: string;
  onDogClick?: (dogId: string) => void;
}

const DogCard = ({
  name,
  breed,
  imageUrl,
  imageAlt,
  fallbackInitials,
  subtitle,
  metadata,
  dogId,
  onDogClick,
  className = "",
  ...rest
}: DogCardProps) => {
  const handleClick = () => {
    if (dogId && onDogClick) {
      onDogClick(dogId);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group ${dogId && onDogClick ? 'cursor-pointer hover:shadow-xl hover:border-gray-400 hover:-translate-y-1 transition-all duration-300' : ''} ${className}`}
      onClick={handleClick}
      {...rest}
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt || `${name} - ${breed}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Typography 
              variant="h3" 
              color="muted"
              className="select-none"
            >
              {fallbackInitials || name.charAt(0).toUpperCase()}
            </Typography>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4 space-y-1 flex flex-col h-full">
        <Typography variant="h5" weight="semibold" className="truncate group-hover:text-gray-800 transition-colors duration-300">
          {name}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="muted" className="italic group-hover:text-gray-600 transition-colors duration-300">
            {subtitle}
          </Typography>
        )}
        <Typography variant="caption" color="secondary" className="group-hover:text-gray-700 transition-colors duration-300">
          {breed}
        </Typography>
        {metadata && metadata.length > 0 && (
          <div className="pt-1 space-y-0.5">
            {metadata.map((item, index) => (
              <Typography key={index} variant="caption" color="muted" className="block text-xs group-hover:text-gray-500 transition-colors duration-300">
                {item}
              </Typography>
            ))}
          </div>
        )}
        
        {/* Click indicator - only show when card is clickable */}
        {dogId && onDogClick && (
          <div className="pt-2 mt-auto">
            <span className="text-xs text-blue-600 font-medium group-hover:text-blue-800 transition-colors duration-300">
              View details →
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DogCard;
