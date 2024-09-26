"use client"

import React, { useState, useEffect, useCallback } from "react"
import { SessionProvider, useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ColorSwatch from "./color-swatch"
import ScoreDisplay from "./score-display"
import { generateColors, calculateColorDifference } from "../lib/color-utils"
import { PlayIcon, TrophyIcon } from "lucide-react"
import type { GameState } from "../types"
import { SignInButton } from './SignInButton'
import { Leaderboard } from './Leaderboard'

function calculateDifficulty(level: number) {
  // Slower progression for color count
  const colorCount = Math.min(10, 3 + Math.floor((level - 1) / 15)) // 3 to 10 colors, incrementing every 15 levels
  
  // Slower increase in similarity
  const similarity = 0.3 + (Math.min(level, 100) / 100) * 0.65 // 0.3 to 0.95, capped at level 100
  
  // Constant view time of 3 seconds
  const viewTime = 3
  
  // Adjusted time reduction for selection time
  const selectionTime = Math.max(6, Math.round(15 - Math.min(level, 90) / 10)) // 15 to 6 seconds, stabilizes at level 90
  
  return { colorCount, similarity, viewTime, selectionTime }
}

function GameComponent() {
  const { data: session } = useSession()
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
  const [showLossDialog, setShowLossDialog] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  const endGame = useCallback(async (lost = false) => {
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

    if (session?.user) {
      try {
        const response = await fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            username: session.user.name || 'Anonymous',
            score: gameState.score,
            level: gameState.level,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to save score')
        }

        const result = await response.json()
        console.log(result.message)
      } catch (error) {
        console.error('Error saving score:', error)
        toast({
          title: "Error",
          description: "Failed to save your score. Please try again.",
        })
      }
    }

    if (lost) {
      setShowLossDialog(true)
    }
  }, [session, gameState.score, gameState.level])

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
        endGame(true)
      }
    }
    return () => clearInterval(timer)
  }, [gameState.isPlaying, gameState.timeLeft, showTarget, gameState.level, endGame])

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
    setShowLossDialog(false)
  }

  function handleColorSelect(selectedColor: string) {
    const difference = calculateColorDifference(gameState.targetColor, selectedColor)
    if (difference >= 0.1) {
      endGame(true)
      return
    }
    
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
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Color Memory Game</h1>
          <div className="flex justify-center items-center space-x-4">
            <Button onClick={() => setShowLeaderboard(true)} size="sm">
              <TrophyIcon className="mr-2 h-4 w-4" /> Leaderboard
            </Button>
            <SignInButton />
          </div>
        </div>
        
        {!session ? (
          <div className="text-center">
            <p className="mb-6 text-lg sm:text-xl">Sign in to play and save your scores!</p>
          </div>
        ) : !gameState.isPlaying ? (
          <div className="text-center">
            <p className="mb-6 text-lg sm:text-xl">Test your color memory! Select the color you saw after it disappears.</p>
            <Button onClick={startGame} size="lg" className="text-lg px-8 py-4">Start Game</Button>
            {gameState.highScore > 0 && <p className="mt-6 text-xl">High Score: {gameState.highScore}</p>}
          </div>
        ) : (
          <div className="space-y-8">
            <ScoreDisplay gameState={gameState} />
            <div className="flex justify-center">
              {showTarget ? (
                <ColorSwatch color={gameState.targetColor} size="large" className="w-64 h-64 sm:w-80 sm:h-80" />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
                  {gameState.options.map((color, index) => (
                    <ColorSwatch
                      key={index}
                      color={color}
                      onClick={() => handleColorSelect(color)}
                      className="w-32 h-32 sm:w-40 sm:h-40"
                    />
                  ))}
                </div>
              )}
            </div>
            <Progress 
              value={(gameState.timeLeft / calculateDifficulty(gameState.level)[showTarget ? 'viewTime' : 'selectionTime']) * 100} 
              className="h-4 w-full"
            />
          </div>
        )}
      </div>
      
      <Dialog open={showLossDialog} onOpenChange={setShowLossDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Game Over!</DialogTitle>
            <DialogDescription>
              You&apos;ve lost the game. Here&apos;s your final score:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-2xl font-bold text-center">Score: {gameState.score}</p>
            <p className="text-xl text-center">Level: {gameState.level}</p>
          </div>
          <Button onClick={startGame} className="w-full">
            <PlayIcon className="mr-2 h-4 w-4" /> Play Again
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Leaderboard</DialogTitle>
          </DialogHeader>
          <Leaderboard />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function ColorMemoryGame() {
  return (
    <SessionProvider>
      <GameComponent />
    </SessionProvider>
  )
}