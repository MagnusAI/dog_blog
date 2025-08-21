import type { HTMLAttributes } from "react";
import Typography from "./ui/Typography";

export interface DogCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  breed: string;
  imageUrl?: string;
  imageAlt?: string;
  fallbackInitials?: string;
}

const DogCard = ({
  name,
  breed,
  imageUrl,
  imageAlt,
  fallbackInitials,
  className = "",
  ...rest
}: DogCardProps) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer ${className}`}
      {...rest}
    >
      {/* Image Section */}
      <div className="relative aspect-square">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt || `${name} - ${breed}`}
            className="w-full h-full object-cover"
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
      <div className="p-4 space-y-1">
        <Typography variant="h5" weight="semibold" className="truncate">
          {name}
        </Typography>
        <Typography variant="caption" color="secondary">
          {breed}
        </Typography>
      </div>
    </div>
  );
};

export default DogCard;
