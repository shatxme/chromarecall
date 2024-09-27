"use client"

import React from "react"
import { GameState } from "@/types"
import { Clock } from "lucide-react"
import { motion } from "framer-motion"

interface ScoreDisplayProps {
  gameState: GameState
  streak: number
}

export default function ScoreDisplay({ gameState, streak }: ScoreDisplayProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <motion.p 
          className="text-2xl font-bold"
          animate={streak > 2 ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          Score: {gameState.score}
          {streak > 2 && (
            <span className="ml-2" role="img" aria-label="fire">
              🔥
            </span>
          )}
        </motion.p>
        <p className="text-xl">Level: {gameState.level}</p>
      </div>
      <div className="text-center">
        <p className="text-xl flex items-center justify-center">
          <Clock className="mr-2" />
          {gameState.timeLeft}s
        </p>
      </div>
    </div>
  )
}