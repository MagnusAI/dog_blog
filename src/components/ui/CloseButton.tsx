import type { HTMLAttributes } from "react";

export interface CloseButtonProps extends HTMLAttributes<HTMLButtonElement> {
  onClose: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "modal";
}

const CloseButton = ({
  onClose,
  size = "md",
  variant = "default",
  className = "",
  ...rest
}: CloseButtonProps) => {
  const baseStyles = "leading-none transition-colors focus:outline-none";
  
  const sizeStyles = {
    sm: "text-lg",
    md: "text-2xl", 
    lg: "text-3xl"
  };
  
  const variantStyles = {
    default: "text-gray-400 hover:text-gray-600",
    modal: "text-gray-400 hover:text-gray-600"
  };
  
  return (
    <button
      onClick={onClose}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      aria-label="Close"
      {...rest}
    >
      ×
    </button>
  );
};

export default CloseButton;
