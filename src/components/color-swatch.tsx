import React from 'react';

interface ColorSwatchProps {
  color: string;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, onClick, size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'h-20 w-20 sm:h-24 sm:w-24',
    medium: 'h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32',
    large: 'h-48 w-48 sm:h-64 sm:w-64 md:h-80 md:w-80'
  };

  return (
    <button
      className={`${sizeClasses[size]} rounded-lg 
        sm:transition-all sm:duration-200 
        sm:hover:scale-105 
        active:sm:scale-95 active:sm:ring-4 active:sm:ring-white 
        ${className}`}
      style={{ backgroundColor: color }}
      onClick={onClick}
    />
  );
};

export default ColorSwatch;