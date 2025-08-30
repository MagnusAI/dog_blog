import type { HTMLAttributes } from "react";
import { Button, CloseButton, Typography, formatDate, createBackdropClickHandler, createModalKeyHandler } from "./ui";
import { useImageFallback } from "../hooks/useModal";
import ClickableImage from "./ClickableImage";

export interface NewsModalProps extends HTMLAttributes<HTMLDivElement> {
  // Core props
  isOpen: boolean;
  onClose: () => void;
  
  // Content props
  imageUrl: string;
  imageAlt: string;
  date: string | Date;
  title: string;
  excerpt: string;
  
  // Optional props
  fallbackImageUrl?: string;
  dateFormat?: "short" | "long" | "relative";
}

const NewsModal = ({
  isOpen,
  onClose,
  imageUrl,
  imageAlt,
  date,
  title,
  excerpt,
  fallbackImageUrl,
  dateFormat = "short",
  className = "",
  ...rest
}: NewsModalProps) => {
  if (!isOpen) return null;

  const { handleError } = useImageFallback(fallbackImageUrl);
  const handleBackdropClick = createBackdropClickHandler(onClose);
  const handleKeyDown = createModalKeyHandler(onClose);

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 ${className}`}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      {...rest}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <time
            className="text-sm text-gray-500 font-medium"
            dateTime={typeof date === 'string' ? date : date.toISOString()}
          >
            {formatDate(date, dateFormat)}
          </time>
          <CloseButton onClose={onClose} />
        </div>
        
        {/* Modal Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Enlarged Image */}
            <div className="w-full flex justify-center">   
              <ClickableImage
                src={imageUrl}
                alt={imageAlt}
                size="xxxl"
              />
            </div>
            
            {/* Article Content */}
            <div className="space-y-4">
              <Typography variant="h2" color="primary">
                {title}
              </Typography>
              
              <div className="prose prose-lg max-w-none">
                <Typography variant="body" color="secondary" className="text-lg">
                  {excerpt}
                </Typography>
              </div>
              
              {/* Article Actions */}
              <div className="flex items-center justify-end pt-4 border-t">
                <Button onClick={onClose} variant="primary">
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsModal;
