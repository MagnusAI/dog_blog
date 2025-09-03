import type { HTMLAttributes } from "react";
import Typography from "./ui/Typography";
import { useOptimizedImage } from "../hooks/useOptimizedImage";
import CloudinaryImage from "./CloudinaryImage";
import { dog, type FocusOnValue } from "@cloudinary/url-gen/qualifiers/focusOn";

export interface DogCardProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  breed: string;
  imageUrl?: string;
  imagePublicId?: string; // For optimized images
  imageAlt?: string;
  fallbackInitials?: string;
  subtitle?: string;
  metadata?: string[];
  dogId?: string;
  onDogClick?: (dogId: string) => void;
  imageSize?: number; // Size for optimized image
  imageQuality?: "auto" | number;
  imageFormat?: "auto" | "webp" | "jpg" | "png";
  imageCrop?: "fill" | "fit" | "scale" | "crop" | "pad" | "limitFit";
  imageGravity?: FocusOnValue;
  imageTransformations?: string[];
  imageResponsive?: boolean;
  imageEnhance?: boolean;
  // React Plugin Options
  enableLazyLoading?: boolean;
  enablePlaceholder?: boolean;
  placeholderType?: "blur" | "pixelate" | "vectorize" | "predominant";
  enableAccessibility?: boolean;
  accessibilityMode?: "monochrome" | "darkmode" | "brightmode" | "colorblind";
  responsiveStepSize?: number;
}

const DogCard = ({
  name,
  breed,
  imageUrl,
  imagePublicId,
  imageAlt,
  fallbackInitials,
  subtitle,
  metadata,
  dogId,
  onDogClick,
  imageSize = 200,
  imageQuality = "auto",
  imageFormat = "auto",
  imageCrop = "fill",
  imageGravity = dog(),
  imageTransformations = [],
  imageResponsive = true,
  imageEnhance = false,
  // React Plugin Options
  enableLazyLoading = true,
  enablePlaceholder = true,
  placeholderType = "blur",
  enableAccessibility = false,
  accessibilityMode = "darkmode",
  responsiveStepSize = 200,
  className = "",
  ...rest
}: DogCardProps) => {
  // Use optimized image if publicId is provided, otherwise fall back to imageUrl
  const optimizedUrls = useOptimizedImage({
    publicId: imagePublicId || "",
    size: imageSize,
    quality: imageQuality,
    format: imageFormat,
    transformations: [
      
    ],
  });

  const handleClick = () => {
    if (dogId && onDogClick) {
      onDogClick(dogId);
    }
  };

  // Determine which image source to use
  const finalImageUrl = imagePublicId ? optimizedUrls.standard : imageUrl;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group ${dogId && onDogClick ? 'cursor-pointer hover:shadow-xl hover:border-gray-400 hover:-translate-y-1 transition-all duration-300' : ''} ${className}`}
      onClick={handleClick}
      {...rest}
    >
      {/* Image Section */}
      <div className="relative aspect-square overflow-hidden">
        {imagePublicId ? (
          <CloudinaryImage
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          publicId={imagePublicId}
            width={imageSize}
            height={imageSize}
            alt={imageAlt || `${name} - ${breed}`}
            quality={imageQuality}
            format={imageFormat}
            crop={imageCrop}
            gravity={imageGravity}
            enableLazyLoading={enableLazyLoading}
            enablePlaceholder={enablePlaceholder}
            placeholderType={placeholderType}
            enableAccessibility={enableAccessibility}
            enableResponsive={imageResponsive}
            enhance={imageEnhance}
          />
        ) : finalImageUrl ? (
          <img
            src={finalImageUrl}
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
      </div>
    </div>
  );
};

export default DogCard;
