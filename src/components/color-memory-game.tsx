"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import ColorSwatch from "../components/color-swatch"
import ScoreDisplay from "./score-display"
import { generateColors, calculateColorDifference } from "../lib/color-utils"
import type { GameState } from "../types"

const MAX_LEVEL = 100 // Changed from 10 to 100

function calculateDifficulty(level: number) {
  const progress = (level - 1) / (MAX_LEVEL - 1) // 0 to 1
  const colorCount = Math.min(10, 3 + Math.floor((level - 1) / 10)) // 3 to 10 colors, incrementing every 10 levels
  const similarity = 0.3 + (progress * 0.65) // 0.3 to 0.95
  const viewTime = Math.max(1, Math.round(5 - progress * 3)) // 5 to 2 seconds
  const selectionTime = Math.max(5, Math.round(15 - progress * 9)) // 15 to 6 seconds
  return { colorCount, similarity, viewTime, selectionTime }
}

export function ColorMemoryGame() {
  const [gameState, setGameState] = useState<GameState>({
    targetColor: '',
    options: [],
    score: 0,
    level: 1,
    timeLeft: 2,
    isPlaying: false,
    highScore: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showTarget, setShowTarget] = useState(false)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameState.isPlaying && gameState.timeLeft > 0) {
      timer = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: Math.max(0, prev.timeLeft - 1)
        }));
      }, 1000);
    } else if (gameState.isPlaying && gameState.timeLeft === 0) {
      if (showTarget) {
        setShowTarget(false)
        const { selectionTime } = calculateDifficulty(gameState.level)
        setGameState(prev => ({ ...prev, timeLeft: selectionTime }))
      } else {
        endGame()
      }
    }
    return () => clearInterval(timer)
  }, [gameState.isPlaying, gameState.timeLeft, showTarget, gameState.level]) // Added gameState.level to the dependency array

  function startGame() {
    setIsLoading(true)
    const { colorCount, similarity, viewTime } = calculateDifficulty(1)
    const { target, options } = generateColors(colorCount, similarity)
    setGameState(prev => ({
      ...prev,
      isPlaying: true,
      score: 0,
      level: 1,
      timeLeft: viewTime,
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
    
    const newLevel = gameState.level + 1
    const { colorCount, similarity, viewTime } = calculateDifficulty(newLevel)
    const { target, options } = generateColors(colorCount, similarity)
    
    setGameState(prev => ({
      ...prev,
      score: prev.score + points,
      level: newLevel,
      timeLeft: viewTime,
      targetColor: target,
      options: options
    }))
    
    setShowTarget(true)
    
    toast({
      title: "Color Selected!",
      description: `You earned ${points} points!`,
    })

    if (newLevel > MAX_LEVEL) {
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
            <div className="flex items-center justify-between mb-2">
              <Progress 
                value={(gameState.timeLeft / calculateDifficulty(gameState.level)[showTarget ? 'viewTime' : 'selectionTime']) * 100} 
                className="h-4 flex-grow mr-2" 
              />
              <span className="text-lg font-semibold">
                {gameState.timeLeft}s
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}