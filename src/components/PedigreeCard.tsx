import type { HTMLAttributes } from "react";
import { Badge, CloseButton, Typography } from "./ui";
import { useModal, useImageFallback } from "../hooks/useModal";

export interface PedigreeCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  // Image props
  imageUrl: string;
  imageAlt: string;
  
  // Pedigree details
  relation: string;        // e.g., "Father", "Mother", "Grandparents"
  regnr: string;          // Registration number
  name: string;           // Full name
  titles?: string[];      // Array of titles/achievements
  
  // Optional props
  fallbackInitials?: string;
  onClick?: () => void;   // Custom click handler
}

const PedigreeCard = ({
  imageUrl,
  imageAlt,
  relation,
  regnr,
  name,
  titles = [],
  fallbackInitials,
  onClick,
  className = "",
  ...rest
}: PedigreeCardProps) => {
  const { isOpen: isExpanded, open: openModal, close: closeModal } = useModal();
  const { handleError } = useImageFallback(undefined);

  const handleCardClick = () => {
    openModal();
    onClick?.();
  };

  const handleCloseModal = () => {
    closeModal();
  };

  // Format titles string with ellipsis
  const titlesText = titles.length > 0 ? titles.join(", ") : "";

  return (
    <>
      {/* Main Card */}
      <div
        className={`
          h-20 max-w-80 p-3
          bg-white border border-gray-200 rounded-lg shadow-sm
          hover:shadow-md hover:border-gray-300
          cursor-pointer transition-all duration-200
          flex items-center gap-3
          w-full
          ${className}
        `}
        onClick={handleCardClick}
        {...rest}
      >
        {/* Image */}
        <div className="w-16 h-16 flex-shrink-0">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-full object-cover rounded-md"
            onError={handleError}
          />
          {/* Fallback */}
          <div 
            className="w-full h-full bg-gray-300 rounded-md flex items-center justify-center text-base font-semibold text-gray-600"
            style={{ display: 'none' }}
          >
            {fallbackInitials || name.charAt(0)}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          {/* Relation */}
          <Typography 
            variant="overline"
            color="muted"
            className="truncate block text-xs"
          >
            {relation}
          </Typography>
          
          {/* Registration Number */}
          <Typography 
            variant="caption"
            color="secondary"
            className="truncate block"
          >
            Reg: {regnr}
          </Typography>
          
          {/* Name */}
          <Typography 
            variant="body"
            weight="semibold"
            className="truncate block"
          >
            {name}
          </Typography>
          
          {/* Titles (if any) */}
          {titlesText && (
            <Typography 
              variant="caption"
              color="secondary"
              className="truncate block"
            >
              {titlesText}
            </Typography>
          )}
        </div>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <Typography variant="h4" weight="semibold">Pedigree Details</Typography>
              <CloseButton onClose={handleCloseModal} />
            </div>
            
            {/* Modal Content */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Enlarged Image */}
                <div className="flex-shrink-0">
                  <img
                    src={imageUrl}
                    alt={imageAlt}
                    className="w-48 h-48 object-cover rounded-lg shadow-md mx-auto md:mx-0"
                    onError={handleError}
                  />
                  {/* Modal Fallback */}
                  <div 
                    className="w-48 h-48 bg-gray-300 rounded-lg shadow-md mx-auto md:mx-0 items-center justify-center text-4xl text-gray-600 font-semibold"
                    style={{ display: 'none' }}
                  >
                    {fallbackInitials || name.charAt(0)}
                  </div>
                </div>
                
                {/* Detailed Information */}
                <div className="flex-1 space-y-4">
                  <div>
                    <Typography variant="overline" color="muted">Relation</Typography>
                    <Typography variant="body" weight="medium">{relation}</Typography>
                  </div>
                  
                  <div>
                    <Typography variant="overline" color="muted">Registration Number</Typography>
                    <Typography variant="body">{regnr}</Typography>
                  </div>
                  
                  <div>
                    <Typography variant="overline" color="muted">Name</Typography>
                    <Typography variant="h4" weight="semibold">{name}</Typography>
                  </div>
                  
                  {titles.length > 0 && (
                    <div>
                      <Typography variant="overline" color="muted">Titles & Achievements</Typography>
                      <div className="mt-2">
                        {titles.map((title, index) => (
                          <Badge
                            key={index}
                            variant="primary"
                            className="mr-2 mb-2"
                          >
                            {title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PedigreeCard;