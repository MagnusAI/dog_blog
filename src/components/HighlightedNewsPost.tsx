import type { HTMLAttributes } from "react";
import NewsModal from "./NewsModal";
import { formatDate, Typography } from "./ui";
import { useModal, useImageFallback } from "../hooks/useModal";
import CloudinaryImage from "./CloudinaryImage";
import { dog, FocusOnValue } from "@cloudinary/url-gen/qualifiers/focusOn";

export interface HighlightedNewsPostProps extends HTMLAttributes<HTMLDivElement> {
  // Content props
  imageUrl: string;
  imageAlt: string;
  date: string | Date;          // Publication date
  title: string;               // Post title
  content: string;             // Article content/description
  
  // Optional props
  fallbackImageUrl?: string;   // Fallback if main image fails
  dateFormat?: "short" | "long" | "relative"; // Date display format
  backgroundColor?: string;    // Custom background color (CSS color value)
  taggedDogs?: string[];       // Array of dog IDs that are tagged in this post
  
  // Cloudinary image optimization props
  imagePublicId?: string;      // Cloudinary public ID for optimized images
  imageQuality?: "auto" | number;
  imageFormat?: "auto" | "webp" | "jpg" | "png";
  imageCrop?: "fill" | "fit" | "scale" | "crop" | "pad" | "limitFit";
  imageGravity?: FocusOnValue;
  enableLazyLoading?: boolean;
  enablePlaceholder?: boolean;
  placeholderType?: "blur" | "pixelate" | "vectorize";
  enableAccessibility?: boolean;
  enableResponsive?: boolean;
  imageEnhance?: boolean;
}

const HighlightedNewsPost = ({
  imageUrl,
  imageAlt,
  date,
  title,
  content,
  fallbackImageUrl,
  dateFormat = "short",
  backgroundColor = "transparent",
  taggedDogs = [],
  // Cloudinary optimization props with defaults
  imagePublicId,
  imageQuality = "auto",
  imageFormat = "auto", 
  imageCrop = "fill",
  imageGravity = dog(),
  enableLazyLoading = true,
  enablePlaceholder = true,
  placeholderType = "blur",
  enableAccessibility = false,
  enableResponsive = true,
  imageEnhance = true,
  className = "",
  ...rest
}: HighlightedNewsPostProps) => {
  const { isOpen: isExpanded, open: openModal, close: closeModal } = useModal();
  const { handleError } = useImageFallback(fallbackImageUrl);

  const handleClick = () => {
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
  };

  return (
    <>
      {/* Hero Section */}
      <section
        className={`
          h-full md:h-96
          w-full
          cursor-pointer transition-all duration-500
          overflow-hidden
          flex flex-col md:flex-row
          group
          relative
          rounded-lg
          ${className}
        `}
        style={{ backgroundColor }}
        onClick={handleClick}
        {...rest}
      >
        {/* Image Section */}
        <div className="w-full md:w-1/2 flex-shrink-0 overflow-hidden relative rounded-lg md:rounded-lg">
          {imagePublicId ? (
            <CloudinaryImage
              publicId={imagePublicId}
              width={600}
              height={400}
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
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              className="w-full h-full object-cover"
              onError={handleError}
              loading="lazy"
            />
          ) : null}
        </div>

        {/* Content Section */}
        <div className="
          w-full md:w-1/2 
          p-8 md:p-10 
          space-y-4 md:space-y-6
          flex flex-col justify-center
          relative z-10
        ">
          {/* Date */}
          <time
            className="text-sm md:text-base text-gray-500 font-medium uppercase tracking-wide"
            dateTime={typeof date === 'string' ? date : date.toISOString()}
          >
            {formatDate(date, dateFormat)}
          </time>

          {/* Title */}
          <Typography 
            variant="h2" 
            className="text-2xl md:text-3xl font-bold leading-tight overflow-clip"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {title}
          </Typography>

          {/* Content */}
          <Typography 
            variant="body" 
            color="secondary"
            className="text-base md:text-lg leading-relaxed overflow-clip"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {content}
          </Typography>



          {/* Read More Indicator */}
          <div className="flex items-center mt-4">
            <span className="text-blue-600 font-medium hover:text-blue-800 transition-colors flex items-center gap-2">
              Read Full Article
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </section>

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

export default HighlightedNewsPost;
