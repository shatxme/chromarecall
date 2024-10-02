'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Crown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import dynamic from 'next/dynamic'

const Leaderboard = dynamic(() => import('./Leaderboard').then(mod => mod.Leaderboard))

export default function AnimatedHeader() {
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false)

  const openLeaderboard = useCallback(() => {
    if (!showLeaderboard) {
      setIsLeaderboardLoading(true)
      setShowLeaderboard(true)
    }
  }, [showLeaderboard])

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.h1 
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-center mb-6 sm:mb-8"
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

      <Button 
        onClick={openLeaderboard} 
        size="lg" 
        className="w-full sm:w-auto text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white font-bold transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg rounded-xl"
        aria-label="Open Leaderboard"
      >
        <Crown className="mr-2 h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" /> 
        <span>Champions</span>
      </Button>

      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto overflow-x-hidden z-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-yellow-600">Champions</DialogTitle>
            <DialogDescription className="text-gray-600">
              Behold the top color masters:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Leaderboard 
              localUserData={null} 
              isLoading={isLeaderboardLoading}
              setIsLoading={setIsLeaderboardLoading}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}