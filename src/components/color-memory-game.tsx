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
import { Leaderboard } from './Leaderboard'
import { motion, AnimatePresence } from "framer-motion"
import dynamic from 'next/dynamic'

const SignInButton = dynamic(() => import('./SignInButton').then(mod => mod.SignInButton), {
  loading: () => <Button disabled>Loading...</Button>,
  ssr: false
})

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
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [feedbackText, setFeedbackText] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [streak, setStreak] = useState(0)

  const endGame = useCallback(async (lost = false) => {
    setGameState(prev => {
      const newHighScore = prev.score > prev.highScore;
      setIsNewHighScore(newHighScore);
      const updatedHighScore = newHighScore ? prev.score : prev.highScore;
      
      if (newHighScore) {
        toast({
          title: "New High Score!",
          description: `Congratulations! You've set a new high score of ${prev.score} points!`,
        });
      }
      
      return { ...prev, isPlaying: false, highScore: updatedHighScore };
    });

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
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save score');
        }

        const result = await response.json();
        console.log(result.message);
      } catch (error) {
        console.error('Error saving score:', error);
        toast({
          title: "Error",
          description: "Failed to save your score. Please try again.",
        });
      }
    }

    if (lost) {
      setShowLossDialog(true);
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
    const difference = calculateColorDifference(gameState.targetColor, selectedColor);
    const timeBonus = Math.max(0, gameState.timeLeft / calculateDifficulty(gameState.level).selectionTime);
    
    if (difference >= 0.1) {
      setFeedbackText("Almost right!")
      setStreak(0)
      endGame(true);
      return;
    }
    
    const accuracyPoints = Math.max(0, 100 - Math.round(difference * 1000));
    const speedPoints = Math.round(timeBonus * 50);
    const bonusPoints = Math.min(50, consecutiveCorrect * 5);
    const totalPoints = accuracyPoints + speedPoints + bonusPoints;
    
    setConsecutiveCorrect(prev => prev + 1);
    setStreak(prev => prev + 1);
    
    // Set feedback text
    const perfectGuess = difference < 0.01;
    const feedbackOptions = perfectGuess 
      ? ["Perfect!", "Excellent!", "Spot on!", "Brilliant!"]
      : ["Correct!", "Nice job!", "Well done!", "Good eye!"];
    setFeedbackText(feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)]);
    
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 1000);

    const newLevel = gameState.level + 1;
    const { colorCount, similarity, viewTime } = calculateDifficulty(newLevel);
    const { target, options } = generateColors(colorCount, similarity);
    
    setGameState(prev => ({
      ...prev,
      score: prev.score + totalPoints,
      level: newLevel,
      timeLeft: viewTime,
      targetColor: target,
      options: options
    }));
    
    setShowTarget(true);
    
    toast({
      title: "Color Selected!",
      description: `You earned ${totalPoints} points! (Accuracy: ${accuracyPoints}, Speed: ${speedPoints}, Bonus: ${bonusPoints})`,
    });
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="p-4 pb-6 relative">
      <div className="absolute top-2 left-2">
        <Button onClick={() => setShowLeaderboard(true)} size="default" className="h-10">
          <TrophyIcon className="mr-2 h-5 w-5" /> Leaderboard
        </Button>
      </div>
      <div className="absolute top-2 right-2">
        <SignInButton />
      </div>
      
      {!gameState.isPlaying ? (
        <div className="text-center mt-16">
          <p className="mb-8 text-xl sm:text-2xl">Ready to test your color perception skills? Let&apos;s go!</p>
          <Button 
            onClick={startGame} 
            size="lg" 
            className="text-xl px-12 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Start Game
          </Button>
          {!session && <p className="mt-6 text-sm text-gray-600">Sign in to save your scores and compete on the leaderboard!</p>}
        </div>
      ) : (
        <div className="space-y-6 mt-12">
          <div className="h-12 flex items-center justify-center">
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="text-2xl font-bold text-center text-green-500 absolute"
                >
                  {feedbackText}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <ScoreDisplay gameState={gameState} streak={streak} />
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
      
      <Dialog open={showLossDialog} onOpenChange={setShowLossDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Game Over!</DialogTitle>
            <DialogDescription>
              {isNewHighScore 
                ? "Congratulations! You've set a new high score!" 
                : "Here's your final score:"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-2xl font-bold text-center">
              {isNewHighScore ? "New High Score: " : "Your Score: "}
              {gameState.score}
            </p>
            <p className="text-xl text-center">Level: {gameState.level}</p>
            {!isNewHighScore && (
              <p className="text-lg text-center">Your Highest Score: {gameState.highScore}</p>
            )}
          </div>
          <Button onClick={startGame} className="w-full">
            <PlayIcon className="mr-2 h-4 w-4" /> Play Again
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Leaderboard</DialogTitle>
            <DialogDescription>
              Here are the top scores:
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Leaderboard currentUserId={session?.user?.id} currentUserScore={gameState.highScore} />
          </div>
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