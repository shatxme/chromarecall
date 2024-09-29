'use client'

import dynamic from 'next/dynamic'
import AnimatedHeader from '@/components/AnimatedHeader'
import { useState, useEffect } from 'react'

const ColorMemoryGame = dynamic(() => import('@/components/color-memory-game').then(mod => mod.ColorMemoryGame), {
  loading: () => <p>Loading game...</p>,
  ssr: false
})

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Preload the game component
    import('@/components/color-memory-game')
  }, [])

  if (!isClient) {
    return null // or a loading indicator
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <AnimatedHeader />
        <div className="max-w-4xl mx-auto bg-gray-100 rounded-lg shadow-xl overflow-hidden mt-8 sm:mt-12 md:mt-16">
          <ColorMemoryGame />
        </div>
      </div>
    </div>
  )
}
