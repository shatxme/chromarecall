"use client"

import React from "react"
import { GameState } from "@/types"
import { Clock } from "lucide-react"

interface ScoreDisplayProps {
  gameState: GameState
}

export default function ScoreDisplay({ gameState }: ScoreDisplayProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <p className="text-2xl font-bold">Score: {gameState.score}</p>
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