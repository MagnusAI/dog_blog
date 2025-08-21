import { useState, useCallback } from "react";

export interface UseModalReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Custom hook for managing modal state
 */
export const useModal = (initialState = false): UseModalReturn => {
  const [isOpen, setIsOpen] = useState(initialState);
  
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);
  
  return { isOpen, open, close, toggle };
};

/**
 * Custom hook for image error handling
 */
export const useImageFallback = (fallbackSrc?: string) => {
  const [hasError, setHasError] = useState(false);
  
  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (fallbackSrc && !hasError) {
      const target = e.target as HTMLImageElement;
      target.src = fallbackSrc;
      setHasError(true);
    }
  }, [fallbackSrc, hasError]);
  
  return { handleError, hasError };
};
