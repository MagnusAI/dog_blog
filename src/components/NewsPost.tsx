import type { HTMLAttributes } from "react";
import NewsModal from "./NewsModal";
import { formatDate, Typography } from "./ui";
import { useModal, useImageFallback } from "../hooks/useModal";
import CloudinaryImage from "./CloudinaryImage";

export interface NewsPostProps extends HTMLAttributes<HTMLDivElement> {
  // Content props
  imageUrl: string;
  imageAlt: string;
  date: string | Date;          // Publication date
  title: string;               // Post title
  content: string;             // Article content/description
  
  // Optional props
  fallbackImageUrl?: string;   // Fallback if main image fails
  size?: "sm" | "md" | "lg";   // Card size variant
  dateFormat?: "short" | "long" | "relative"; // Date display format
  taggedDogs?: string[];       // Array of dog IDs that are tagged in this post
  
  // Cloudinary image optimization props
  imagePublicId?: string;      // Cloudinary public ID for optimized images
  imageQuality?: "auto" | number;
  imageFormat?: "auto" | "webp" | "jpg" | "png";
  imageCrop?: "fill" | "fit" | "scale" | "crop" | "pad" | "limitFit";
  imageGravity?: "auto" | "face" | "faces" | "center" | "north" | "south" | "east" | "west" | "auto:subject" | "auto:classic";
  enableLazyLoading?: boolean;
  enablePlaceholder?: boolean;
  placeholderType?: "blur" | "pixelate" | "vectorize";
  enableAccessibility?: boolean;
  enableResponsive?: boolean;
  imageEnhance?: boolean;
}

const NewsPost = ({
  imageUrl,
  imageAlt,
  date,
  title,
  content,
  fallbackImageUrl,
  dateFormat = "short",
  taggedDogs = [],
  // Cloudinary optimization props with defaults
  imagePublicId,
  imageQuality = "auto",
  imageFormat = "auto", 
  imageCrop = "fill",
  imageGravity = "face",
  enableLazyLoading = true,
  enablePlaceholder = true,
  placeholderType = "blur",
  enableAccessibility = true,
  enableResponsive = true,
  imageEnhance = true,
  className = "",
  ...rest
}: NewsPostProps) => {
  const { isOpen: isExpanded, open: openModal, close: closeModal } = useModal();
  const { handleError } = useImageFallback(fallbackImageUrl);
  const size = "sm";

  // Size configurations for consistent dimensions
  const sizeConfig = {
    sm: {
      container: "h-96 w-full max-w-xs",
      image: "h-44",
      imageWidth: 320,
      imageHeight: 176,
      content: "p-3",
      title: "text-sm font-semibold",
      date: "text-xs",
      excerpt: "text-xs",
      spacing: "space-y-2"
    },
    md: {
      container: "h-96 w-full max-w-sm",
      image: "h-44",
      imageWidth: 384,
      imageHeight: 176,
      content: "p-4",
      title: "text-base font-semibold",
      date: "text-sm",
      excerpt: "text-sm",
      spacing: "space-y-3"
    },
    lg: {
      container: "h-[28rem] w-full max-w-md",
      image: "h-52",
      imageWidth: 448,
      imageHeight: 208,
      content: "p-5",
      title: "text-lg font-semibold",
      date: "text-sm",
      excerpt: "text-base",
      spacing: "space-y-4"
    }
  };

  const config = sizeConfig[size];

  const handleClick = () => {
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
  };

  return (
    <>
      <article
        className={`
          ${config.container}
          bg-white border border-gray-200 rounded-lg shadow-sm
          hover:shadow-xl hover:border-gray-400 hover:-translate-y-1
          cursor-pointer transition-all duration-300
          overflow-hidden
          flex flex-col
          group
          ${className}
        `}
        onClick={handleClick}
        {...rest}
    >
      {/* Image Section */}
      <div className={`${config.image} w-full flex-shrink-0 overflow-hidden rounded-t-lg`}>
        {imagePublicId ? (
          <CloudinaryImage
            publicId={imagePublicId}
            width={config.imageWidth}
            height={config.imageHeight}
            alt={imageAlt}
            className="w-full h-full object-cover"
            quality={imageQuality}
            format={imageFormat}
            crop={imageCrop}
            gravity={imageGravity}
            enableLazyLoading={enableLazyLoading}
            enablePlaceholder={enablePlaceholder}
            placeholderType={placeholderType}
            enableAccessibility={enableAccessibility}
            enableResponsive={enableResponsive}
            enhance={imageEnhance}
          />
        ) : (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-full object-cover"
            onError={handleError}
            loading="lazy"
          />
        )}
      </div>

      {/* Content Section */}
      <div className={`${config.content} ${config.spacing} flex-1 flex flex-col justify-between`}>
        {/* Date */}
        <time
          className={`${config.date} text-gray-500 font-medium`}
          dateTime={typeof date === 'string' ? date : date.toISOString()}
        >
          {formatDate(date, dateFormat)}
        </time>

        {/* Title */}
        <Typography 
          variant="h5" 
          weight="semibold"
          className={`${config.title} leading-tight overflow-hidden`}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {title}
        </Typography>

        {/* Content */}
        <Typography 
          variant="body" 
          color="secondary"
          className={`${config.excerpt} leading-relaxed flex-1 overflow-hidden max-h-20`}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {content}
        </Typography>



        {/* Read More Indicator */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className={`${config.date} text-blue-600 font-medium group-hover:text-blue-800 transition-colors`}>
            Read more →
          </span>
        </div>
      </div>
    </article>

    {/* News Modal */}
    <NewsModal
      isOpen={isExpanded}
      onClose={handleCloseModal}
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      date={date}
      title={title}
      excerpt={content}
      fallbackImageUrl={fallbackImageUrl}
      dateFormat={dateFormat}
      taggedDogs={taggedDogs}
    />
    </>
  );
};

export default NewsPost;