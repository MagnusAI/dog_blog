import type { HTMLAttributes } from "react";
import NewsModal from "./NewsModal";
import { formatDate, Typography } from "./ui";
import { useModal, useImageFallback } from "../hooks/useModal";

export interface HighlightedNewsPostProps extends HTMLAttributes<HTMLDivElement> {
  // Content props
  imageUrl: string;
  imageAlt: string;
  date: string | Date;          // Publication date
  title: string;               // Post title
  excerpt: string;             // Brief text excerpt
  
  // Optional props
  fallbackImageUrl?: string;   // Fallback if main image fails
  dateFormat?: "short" | "long" | "relative"; // Date display format
  backgroundColor?: string;    // Custom background color (CSS color value)
}

const HighlightedNewsPost = ({
  imageUrl,
  imageAlt,
  date,
  title,
  excerpt,
  fallbackImageUrl,
  dateFormat = "short",
  backgroundColor = "transparent",
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
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-full object-cover"
            onError={handleError}
            loading="lazy"
          />
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

          {/* Excerpt */}
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
            {excerpt}
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
        excerpt={excerpt}
        fallbackImageUrl={fallbackImageUrl}
        dateFormat={dateFormat}
      />
    </>
  );
};

export default HighlightedNewsPost;
