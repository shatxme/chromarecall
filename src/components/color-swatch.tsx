import React from "react"

interface ColorSwatchProps {
  color: string
  size?: 'small' | 'large'
  onClick?: () => void
  className?: string
}

export default function ColorSwatch({ color, size = 'small', onClick, className }: ColorSwatchProps) {
  const sizeClasses = size === 'large' 
    ? 'w-48 h-48 sm:w-72 sm:h-72' 
    : 'w-[5.5rem] h-[5.5rem] sm:w-36 sm:h-36'
  
  return (
    <button
      className={`${sizeClasses} ${className} rounded-lg shadow-lg sm:transition-transform sm:hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      aria-label={`Color: ${color}`}
    />
  )
}