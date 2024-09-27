"use client"

import React from "react"
import { GameState } from "@/types"
import { Clock } from "lucide-react"

interface ScoreDisplayProps {
  gameState: GameState
  comboMultiplier: number
  closeMatches: number
  closeMatchLimit: number
}

export default function ScoreDisplay({ gameState, comboMultiplier, closeMatches, closeMatchLimit }: ScoreDisplayProps) {
  return (
    <div className="flex justify-between items-center mb-4 sm:mb-6">
      <div>
        <p className="text-xl sm:text-2xl font-bold">
          Score: {gameState.score}
          {comboMultiplier > 1 && (
            <span className="ml-1 sm:ml-2 text-blue-500 text-sm sm:text-base">
              {comboMultiplier.toFixed(1)}x Combo!
            </span>
          )}
        </p>
        <p className="text-lg sm:text-xl">Level: {gameState.level}</p>
        <p className="text-xs sm:text-sm">Close Matches: {closeMatches}/{closeMatchLimit}</p>
      </div>
      <div className="text-center">
        <p className="text-lg sm:text-xl flex items-center justify-center">
          <Clock className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
          {gameState.timeLeft}s
        </p>
      </div>
    </div>
  )
}