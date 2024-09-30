import React from "react"

interface ColorSwatchProps {
  color: string
  size?: 'small' | 'large'
  onClick?: () => void
  className?: string
}

export default function ColorSwatch({ color, size = 'small', onClick, className }: ColorSwatchProps) {
  const sizeClasses = size === 'large' 
    ? 'w-64 h-64 sm:w-80 sm:h-80' 
    : 'w-24 h-24 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-44 lg:h-44'
  
  return (
    <button
      className={`${sizeClasses} ${className} rounded-lg shadow-lg sm:transition-transform sm:hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      aria-label={`Color: ${color}`}
    />
  )
}