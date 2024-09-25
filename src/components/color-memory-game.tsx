"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import ColorSwatch from "../components/color-swatch"
import ScoreDisplay from "./score-display"
import { generateColors, calculateColorDifference, calculateTimeForLevel } from "../lib/color-utils"
import type { GameState } from "../types"

export function ColorMemoryGame() {
  const [gameState, setGameState] = useState<GameState>({
    targetColor: '',
    options: [],
    score: 0,
    level: 1,
    timeLeft: 5,
    isPlaying: false,
    highScore: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showTarget, setShowTarget] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameState.isPlaying && gameState.timeLeft > 0) {
      timer = setTimeout(() => setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 })), 1000)
    } else if (gameState.isPlaying && gameState.timeLeft === 0) {
      if (showTarget) {
        setShowTarget(false)
        setGameState(prev => ({ ...prev, timeLeft: calculateTimeForLevel(prev.level) }))
      } else {
        endGame()
      }
    }
    return () => clearTimeout(timer)
  }, [gameState.isPlaying, gameState.timeLeft, showTarget])

  function startGame() {
    setIsLoading(true)
    const { target, options } = generateColors(1)
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      score: 0,
      level: 1,
      timeLeft: 5,
      targetColor: target,
      options: options
    }))
    setShowTarget(true)
    setIsLoading(false)
  }

  function endGame() {
    setGameState(prev => {
      const newHighScore = prev.score > prev.highScore ? prev.score : prev.highScore
      if (newHighScore > prev.highScore) {
        toast({
          title: "New High Score!",
          description: `Congratulations! You've set a new high score of ${newHighScore} points!`,
        })
      }
      return { ...prev, isPlaying: false, highScore: newHighScore }
    })
  }

  function handleColorSelect(selectedColor: string) {
    const difference = calculateColorDifference(gameState.targetColor, selectedColor)
    const points = Math.max(0, 100 - Math.round(difference * 1000))
    
    setGameState(prev => {
      const newLevel = prev.level + 1
      const { target, options } = generateColors(newLevel)
      return {
        ...prev,
        score: prev.score + points,
        level: newLevel,
        timeLeft: 5,
        targetColor: target,
        options: options
      }
    })
    
    setShowTarget(true)
    
    toast({
      title: "Color Selected!",
      description: `You earned ${points} points!`,
    })

    if (gameState.level >= 100) {
      endGame()
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">Color Memory Game</h1>
        
        {!gameState.isPlaying ? (
          <div className="text-center">
            <p className="mb-4 text-lg">Test your color memory! Select the color you saw after it disappears.</p>
            <Button onClick={startGame} size="lg">Start Game</Button>
            {gameState.highScore > 0 && <p className="mt-4 text-lg">High Score: {gameState.highScore}</p>}
          </div>
        ) : (
          <>
            <ScoreDisplay gameState={gameState} />
            <div className="mb-6 flex justify-center">
              {showTarget ? (
                <ColorSwatch color={gameState.targetColor} size="large" />
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {gameState.options.map((color, index) => (
                    <ColorSwatch
                      key={index}
                      color={color}
                      onClick={() => handleColorSelect(color)}
                    />
                  ))}
                </div>
              )}
            </div>
            <Progress 
              value={(gameState.timeLeft / calculateTimeForLevel(gameState.level)) * 100} 
              className="h-4" 
            />
          </>
        )}
      </div>
    </div>
  )
}