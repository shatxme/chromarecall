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
    medium: 'h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 lg:h-48 lg:w-48', // Increased sizes for larger screens
    large: 'h-48 w-48 sm:h-64 sm:w-64 md:h-80 md:w-80 lg:h-96 lg:w-96'
  };

  return (
    <button
      className={`${sizeClasses[size]} rounded-lg 
        sm:transition-all sm:duration-200 
        sm:hover:scale-105 
        active:sm:scale-95 active:sm:ring-4 active:sm:ring-white 
        ${className}`}
      style={{ backgroundColor: color }}
      onClick={() => {
        console.log('ColorSwatch clicked:', color);
        onClick?.();
      }}
    />
  );
};

export default ColorSwatch;