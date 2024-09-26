import React from "react"

interface ColorSwatchProps {
  color: string
  size?: 'small' | 'large'
  onClick?: () => void
  className?: string
}

export default function ColorSwatch({ color, size = 'small', onClick, className }: ColorSwatchProps) {
  const sizeClasses = size === 'large' ? 'w-64 h-64 sm:w-80 sm:h-80' : 'w-32 h-32 sm:w-40 sm:h-40'
  
  return (
    <button
      className={`${sizeClasses} ${className} rounded-lg shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      aria-label={`Color: ${color}`}
    />
  )
}