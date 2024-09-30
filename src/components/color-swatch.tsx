import React, { useState } from 'react';

interface ColorSwatchProps {
  color: string;
  onClick?: () => void;  // Make onClick optional
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, onClick, size = 'medium', className = '' }) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    onClick?.();  // Call onClick only if it's defined
    setTimeout(() => setIsClicked(false), 300); // Reset after debounce period
  };

  const sizeClasses = {
    small: 'h-20 w-20',
    medium: 'h-22 w-22 sm:h-36 sm:w-36', // Adjusted for selection colors
    large: 'h-64 w-64 sm:h-80 sm:w-80'
  };

  return (
    <button
      className={`${sizeClasses[size]} rounded-lg transition-all duration-200 ${
        isClicked ? 'scale-95 ring-4 ring-white' : 'hover:scale-105'
      } ${className}`}
      style={{ backgroundColor: color }}
      onClick={handleClick}
    />
  );
};

export default ColorSwatch;