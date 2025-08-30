import type { HTMLAttributes } from "react";
import { CloseButton, Typography, formatDate, createBackdropClickHandler, createModalKeyHandler } from "./ui";
import { useImageFallback } from "../hooks/useModal";
import ClickableImage from "./ClickableImage";
import { useState, useEffect } from "react";
import { dogService, type Dog } from "../services/supabaseService";

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
  taggedDogs?: string[];       // Array of dog IDs that are tagged in this post
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
  taggedDogs = [],
  className = "",
  ...rest
}: NewsModalProps) => {
  if (!isOpen) return null;

  const { } = useImageFallback(fallbackImageUrl);
  const handleBackdropClick = createBackdropClickHandler(onClose);
  const handleKeyDown = createModalKeyHandler(onClose);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loadingDogs, setLoadingDogs] = useState(false);

  // Fetch dog details when taggedDogs changes
  useEffect(() => {
    if (taggedDogs.length === 0) {
      setDogs([]);
      return;
    }

    const fetchDogs = async () => {
      setLoadingDogs(true);
      try {
        const dogPromises = taggedDogs.map(dogId => dogService.getDogById(dogId));
        const dogResults = await Promise.allSettled(dogPromises);

        const validDogs = dogResults
          .filter((result): result is PromiseFulfilledResult<Dog> =>
            result.status === 'fulfilled' && result.value !== null
          )
          .map(result => result.value);

        setDogs(validDogs);
      } catch (error) {
        console.error("Error fetching tagged dogs:", error);
        setDogs([]);
      } finally {
        setLoadingDogs(false);
      }
    };

    fetchDogs();
  }, [taggedDogs]);

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
        <div className="flex justify-end items-center p-6 border-b">
          <CloseButton onClose={onClose} />
        </div>

        {/* Modal Content */}
        <div className="flex flex-col h-full">
          {/* Main Content Area */}
          <div className="flex-1 px-6">
            <div className="space-y-6">
              {/* Enlarged Image */}
              <div className="w-full flex justify-center">
                <ClickableImage
                  src={imageUrl}
                  alt={imageAlt}
                  size="xxxl"
                />
              </div>
              <time
                className="text-sm text-gray-500 font-medium text-right"
                dateTime={typeof date === 'string' ? date : date.toISOString()}
              >
                {formatDate(date, dateFormat)}
              </time>

              {/* Article Content */}
              <div className="space-y-4">
                <Typography variant="h2" color="primary">
                  {title}
                </Typography>

                <div className="prose prose-lg max-w-none">
                  <Typography variant="body" color="secondary" className="text-lg leading-relaxed">
                    {excerpt}
                  </Typography>
                </div>
              </div>
            </div>
          </div>

          {/* Tagged Dogs Section - Clean Pills Only */}
          {(dogs.length === 0) && <div className="border-t bg-gray-50 py-4 px-6"/>}
          {(dogs.length > 0) && (
            <div className="border-t bg-gray-50 py-4 px-6">
              {!loadingDogs && (
                <div className="flex flex-wrap gap-2">
                  {dogs.map((dog) => (
                    <span
                      key={dog.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors cursor-default"
                    >
                      {dog.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsModal;
