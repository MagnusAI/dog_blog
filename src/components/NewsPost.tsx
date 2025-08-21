import type { HTMLAttributes } from "react";
import NewsModal from "./NewsModal";
import { formatDate, Typography } from "./ui";
import { useModal, useImageFallback } from "../hooks/useModal";

export interface NewsPostProps extends HTMLAttributes<HTMLDivElement> {
  // Content props
  imageUrl: string;
  imageAlt: string;
  date: string | Date;          // Publication date
  title: string;               // Post title
  excerpt: string;             // Brief text excerpt
  
  // Optional props
  fallbackImageUrl?: string;   // Fallback if main image fails
  size?: "sm" | "md" | "lg";   // Card size variant
  dateFormat?: "short" | "long" | "relative"; // Date display format
}

const NewsPost = ({
  imageUrl,
  imageAlt,
  date,
  title,
  excerpt,
  fallbackImageUrl,
  dateFormat = "short",
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
      content: "p-3",
      title: "text-sm font-semibold",
      date: "text-xs",
      excerpt: "text-xs",
      spacing: "space-y-2"
    },
    md: {
      container: "h-96 w-full max-w-sm",
      image: "h-44",
      content: "p-4",
      title: "text-base font-semibold",
      date: "text-sm",
      excerpt: "text-sm",
      spacing: "space-y-3"
    },
    lg: {
      container: "h-[28rem] w-full max-w-md",
      image: "h-52",
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
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover"
          onError={handleError}
          loading="lazy"
        />
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

        {/* Excerpt */}
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
          {excerpt}
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
      excerpt={excerpt}
      fallbackImageUrl={fallbackImageUrl}
      dateFormat={dateFormat}
    />
    </>
  );
};

export default NewsPost;