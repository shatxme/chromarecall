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

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ gameState, comboMultiplier, closeMatches, closeMatchLimit }) => {
  const isBossLevel = gameState.level % 10 === 0;

  return (
    <div className="flex justify-between items-start">
      <div className="text-left">
        <div className="flex items-center">
          <p className="text-2xl font-bold">Score: {gameState.score}</p>
          {comboMultiplier > 1 && (
            <p className="ml-2 text-lg font-semibold text-blue-500">{comboMultiplier.toFixed(1)}x Combo!</p>
          )}
        </div>
        <p className="text-xl">Level: {gameState.level}</p>
        <div className={`text-sm ${isBossLevel ? 'text-red-500 font-bold' : ''}`}>
          {isBossLevel ? (
            'BOSS LEVEL: No close matches!'
          ) : (
            `Close Matches: ${closeMatches}/${closeMatchLimit}`
          )}
        </div>
      </div>
      <div className="flex items-center">
        <Clock className="mr-2" />
        <span className="text-xl">{gameState.timeLeft}s</span>
      </div>
    </div>
  );
};

export default ScoreDisplay;