import React from "react"
import { motion } from "framer-motion"

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
    <motion.button
      className={`${sizeClasses} ${className} rounded-lg shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 hidden sm:block`}
      style={{ backgroundColor: color }}
      onClick={onClick}
      aria-label={`Color: ${color}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Desktop version with animation */}
    </motion.button>
  )
}