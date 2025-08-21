import type { HTMLAttributes, ElementType } from "react";

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body" | "caption" | "overline";
  color?: "primary" | "secondary" | "muted" | "danger" | "success" | "warning";
  weight?: "normal" | "medium" | "semibold" | "bold";
  children: React.ReactNode;
  as?: ElementType;
}

const Typography = ({
  variant = "body",
  color = "primary",
  weight,
  children,
  as,
  className = "",
  ...rest
}: TypographyProps) => {
  const variantStyles = {
    h1: "text-3xl md:text-4xl font-bold leading-tight",
    h2: "text-2xl md:text-3xl font-bold leading-tight",
    h3: "text-xl md:text-2xl font-bold leading-tight",
    h4: "text-lg md:text-xl font-semibold leading-tight",
    h5: "text-base md:text-lg font-semibold leading-tight",
    h6: "text-sm md:text-base font-semibold leading-tight",
    body: "text-base leading-none",
    caption: "text-xs leading-relaxed",
    overline: "text-xs font-medium uppercase tracking-wide"
  };
  
  const colorStyles = {
    primary: "text-gray-900",
    secondary: "text-gray-700",
    muted: "text-gray-500",
    danger: "text-red-600",
    success: "text-green-600",
    warning: "text-yellow-600"
  };
  
  const weightStyles = weight ? {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold"
  }[weight] : "";
  
  // Default element mapping for variants
  const defaultElements = {
    h1: "h1",
    h2: "h2",
    h3: "h3",
    h4: "h4",
    h5: "h5",
    h6: "h6",
    body: "p",
    caption: "span",
    overline: "span"
  } as const;
  
  const Element = (as || defaultElements[variant]) as ElementType;
  
  return (
    <Element
      className={`${variantStyles[variant]} ${colorStyles[color]} ${weightStyles} ${className}`}
      {...rest}
    >
      {children}
    </Element>
  );
};

export default Typography;
