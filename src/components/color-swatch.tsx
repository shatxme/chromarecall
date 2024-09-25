import React from "react"

interface ColorSwatchProps {
  color: string
  size?: 'small' | 'large'
  onClick?: () => void
}

export default function ColorSwatch({ color, size = 'small', onClick }: ColorSwatchProps) {
  const sizeClasses = size === 'large' ? 'w-48 h-48' : 'w-24 h-24'
  
  return (
    <button
      className={`${sizeClasses} rounded-lg shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      aria-label={`Color: ${color}`}
    />
  )
}