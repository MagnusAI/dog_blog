import { useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import Button from "./Button";
import Typography from "./Typography";

export interface AppBarProps extends HTMLAttributes<HTMLElement> {
  logo?: ReactNode;
  links?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  actionItem?: ReactNode;
  onLogoClick?: () => void;
}

const AppBar = ({
  logo,
  links = [],
  actionItem,
  onLogoClick,
  className = "",
  ...rest
}: AppBarProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLinkClick = (link: { href?: string; onClick?: () => void }) => {
    if (link.onClick) {
      link.onClick();
    }
    // Close mobile menu when link is clicked
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`bg-white border-b border-gray-200 px-4 py-3 ${className}`}
        {...rest}
      >
        <div className="max-w-7xl mx-auto">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center justify-between">
            {/* Logo and Links */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <div
                className={`flex-shrink-0 ${onLogoClick ? 'cursor-pointer' : ''}`}
                onClick={onLogoClick}
              >
                {logo || (
                  <Typography variant="h5" weight="bold" color="primary">
                    LOGO
                  </Typography>
                )}
              </div>

              {/* Separator */}
              {links.length > 0 && (
                <div className="h-6 w-px bg-gray-300" />
              )}

              {/* Navigation Links */}
              <nav className="flex items-center space-x-6">
                {links.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => handleLinkClick(link)}
                    className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Action Item */}
            {actionItem && (
              <div className="flex-shrink-0">
                {actionItem}
              </div>
            )}
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden flex items-center justify-between">
            {/* Logo */}
            <div
              className={`flex-shrink-0 ${onLogoClick ? 'cursor-pointer' : ''}`}
              onClick={onLogoClick}
            >
              {logo || (
                <Typography variant="h5" weight="bold" color="primary">
                  LOGO
                </Typography>
              )}
            </div>

            {/* Burger Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              className="p-2"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4">
          {/* Drawer Header */}
          <div className="flex items-center justify-between mb-6">
            <Typography variant="h6" weight="semibold">
              Menu
            </Typography>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
              className="p-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-3">
            {links.map((link, index) => (
              <button
                key={index}
                onClick={() => handleLinkClick(link)}
                className="block w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors font-medium"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Action Item */}
          {actionItem && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              {actionItem}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AppBar;
