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
    <div className="flex justify-between items-center mb-6">
      <div>
        <p className="text-2xl font-bold">
          Score: {gameState.score}
          {comboMultiplier > 1 && (
            <span className="ml-2 text-blue-500">
              {comboMultiplier.toFixed(1)}x Combo!
            </span>
          )}
        </p>
        <p className="text-xl">Level: {gameState.level}</p>
        <p className="text-sm">Close Matches: {closeMatches}/{closeMatchLimit}</p>
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