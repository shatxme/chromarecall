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
    small: 'h-20 w-20 sm:h-24 sm:w-24',
    medium: 'h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32', // Increased size for mobile
    large: 'h-48 w-48 sm:h-64 sm:w-64 md:h-80 md:w-80'
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