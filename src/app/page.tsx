'use client'

import dynamic from 'next/dynamic'
import AnimatedHeader from '@/components/AnimatedHeader'
import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

const ColorMemoryGame = dynamic(() => import('@/components/color-memory-game').then(mod => mod.ColorMemoryGame), {
  loading: () => <GameSkeleton />,
  ssr: false
})

function GameSkeleton() {
  return (
    <div className="p-4">
      <Skeleton className="h-10 w-3/4 mx-auto mb-4" /> {/* Title skeleton */}
      <div className="bg-white bg-opacity-80 p-4 sm:p-6 rounded-lg shadow-md mb-6">
        <Skeleton className="h-6 w-1/2 mx-auto mb-4" /> {/* "How to play" title skeleton */}
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6 mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-12 w-48 mx-auto rounded-xl" /> {/* "Start Game" button skeleton */}
      </div>
    </div>
  )
}

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Preload the game component
    import('@/components/color-memory-game')
  }, [])

  if (!isClient) {
    return null // Return null for server-side render
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 sm:py-12">
        <AnimatedHeader />
        <div className="max-w-4xl mx-auto bg-gray-100 rounded-lg shadow-xl overflow-hidden mt-8 sm:mt-12 md:mt-16">
          <ColorMemoryGame />
        </div>
      </div>
    </div>
  )
}
