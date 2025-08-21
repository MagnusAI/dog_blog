/**
 * Utility functions for common UI patterns
 */

// Date formatting utility
export const formatDate = (
  inputDate: string | Date, 
  format: "short" | "long" | "relative" = "short"
): string => {
  const dateObj = typeof inputDate === 'string' ? new Date(inputDate) : inputDate;
  
  switch (format) {
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'relative':
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - dateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    default: // 'short'
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
  }
};

// Image error handler
export const createImageErrorHandler = (fallbackImageUrl?: string) => {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (fallbackImageUrl) {
      const target = e.target as HTMLImageElement;
      target.src = fallbackImageUrl;
    }
  };
};

// Modal keyboard handler
export const createModalKeyHandler = (onClose: () => void) => {
  return (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
};

// Modal backdrop click handler
export const createBackdropClickHandler = (onClose: () => void) => {
  return (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
};
