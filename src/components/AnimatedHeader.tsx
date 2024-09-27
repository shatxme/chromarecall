'use client'

import { motion } from 'framer-motion'

export default function AnimatedHeader() {
  return (
    <motion.h1 
      className="text-5xl sm:text-7xl font-bold text-center mb-4 sm:mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-green-300 to-purple-500 animate-gradient-x">
        Chroma
      </span>
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-green-400 to-blue-500 animate-gradient-x">
        Recall
      </span>
    </motion.h1>
  )
}