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

function calculateDifficulty(level: number, performanceRating: number) {
  // Color count calculation
  const baseColorCount = 3;
  const additionalColors = Math.floor(level / 10);
  const colorCount = Math.min(10, baseColorCount + additionalColors);

  // Similarity calculation
  let similarity;
  if (level <= 10) {
    similarity = 0.7 + (level * 0.01); // Start at 0.7, increase by 0.01 per level for first 10 levels
  } else if (level <= 30) {
    similarity = 0.8 + ((level - 10) * 0.005); // Gradual increase from level 11 to 30
  } else if (level <= 50) {
    similarity = 0.9 + ((level - 30) * 0.003); // Steeper increase from level 31 to 50
  } else {
    similarity = 0.96 + ((level - 50) * 0.0005); // Slower increase after level 50
  }
  similarity = Math.min(0.99, similarity * performanceRating);

  // Selection time calculation
  let selectionTime;
  if (level <= 10) {
    selectionTime = 15;
  } else if (level <= 80) {
    selectionTime = Math.max(2, 15 - Math.floor((level - 10) / 5));
  } else {
    selectionTime = 2;
  }
  selectionTime = Math.max(2, Math.round(selectionTime / performanceRating));

  const viewTime = 3; // Constant view time of 3 seconds

  return { colorCount, similarity, viewTime, selectionTime };
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
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [feedbackText, setFeedbackText] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [exactMatch, setExactMatch] = useState(false);
  const [performanceRating, setPerformanceRating] = useState(1);
  const [closeMatches, setCloseMatches] = useState(0);
  const [levelStarted, setLevelStarted] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);

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
        const { selectionTime } = calculateDifficulty(gameState.level, performanceRating)
        setGameState(prev => ({ ...prev, timeLeft: selectionTime }))
      } else {
        endGame(true)
      }
    }
    return () => clearInterval(timer)
  }, [gameState.isPlaying, gameState.timeLeft, showTarget, gameState.level, endGame, performanceRating])

  function startGame() {
    setIsLoading(true)
    const { colorCount, similarity, viewTime } = calculateDifficulty(1, 1) // Start with neutral performance rating
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
    setComboMultiplier(1)
    setCloseMatches(0)
    setLevelStarted(0)
    setPerformanceRating(1) // Reset performance rating when starting a new game
  }

  function handleColorSelect(selectedColor: string) {
    const difference = calculateColorDifference(gameState.targetColor, selectedColor);
    const { selectionTime } = calculateDifficulty(gameState.level, performanceRating);
    const timeBonus = Math.max(0, gameState.timeLeft / selectionTime);
    
    const similarityThreshold = 0.1 - (Math.min(gameState.level, 50) * 0.001);
    const isExactMatch = difference < 0.01;
    setExactMatch(isExactMatch);
    
    // Check if we've exceeded the close match limit
    const closeMatchLimit = gameState.level <= 50 ? 3 : 1;
    const currentTenLevelBlock = Math.floor(gameState.level / 10);
    
    if (levelStarted !== currentTenLevelBlock) {
      setLevelStarted(currentTenLevelBlock);
      setCloseMatches(0);
    }

    if (!isExactMatch && closeMatches >= closeMatchLimit) {
      setFeedbackText("Game Over! Too many close matches.");
      endGame(true);
      return;
    }

    if (difference >= similarityThreshold) {
      setFeedbackText("Game Over! Color mismatch.");
      endGame(true);
      return;
    }
    
    if (!isExactMatch) {
      setCloseMatches(prev => prev + 1);
      setPerformanceRating(prev => Math.max(0.9, prev - 0.02)); // Slightly decrease performance rating
    } else {
      setPerformanceRating(prev => Math.min(1.1, prev + 0.01)); // Increase performance rating
    }
    
    let newComboMultiplier = comboMultiplier;
    if (isExactMatch) {
      newComboMultiplier = Math.min(5, comboMultiplier + 0.5);
      setComboMultiplier(newComboMultiplier);
    } else {
      newComboMultiplier = 1;
      setComboMultiplier(1); // Reset multiplier on close match
    }
    
    const accuracyPoints = Math.max(0, 100 - Math.round(difference * 1000));
    const speedPoints = Math.round(timeBonus * 50);
    const totalPoints = Math.round((accuracyPoints + speedPoints) * newComboMultiplier);
    
    setFeedbackText(isExactMatch ? `Perfect! ${newComboMultiplier.toFixed(1)}x Combo!` : "Close enough!");
    
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 1000);

    const newLevel = gameState.level + 1;
    const { colorCount, similarity, viewTime } = calculateDifficulty(newLevel, performanceRating);
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
      description: `You earned ${totalPoints} points! (Accuracy: ${accuracyPoints}, Speed: ${speedPoints}${newComboMultiplier > 1 ? `, Combo: ${newComboMultiplier.toFixed(1)}x` : ''})`,
    });
  }

  const renderColorSwatches = () => {
    const totalColors = gameState.options.length;
    const firstRowColors = Math.min(3, totalColors);
    const secondRowColors = Math.min(3, totalColors - 3);
    const thirdRowColors = Math.max(0, totalColors - 6);

    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex justify-center gap-4 flex-wrap">
          {gameState.options.slice(0, firstRowColors).map((color, index) => (
            <ColorSwatch
              key={`first-row-${index}`}
              color={color}
              onClick={() => handleColorSelect(color)}
              className="w-24 h-24 sm:w-28 sm:h-28"
            />
          ))}
        </div>
        {secondRowColors > 0 && (
          <div className="flex justify-center gap-4 flex-wrap">
            {gameState.options.slice(3, 6).map((color, index) => (
              <ColorSwatch
                key={`second-row-${index}`}
                color={color}
                onClick={() => handleColorSelect(color)}
                className="w-24 h-24 sm:w-28 sm:h-28"
              />
            ))}
          </div>
        )}
        {thirdRowColors > 0 && (
          <div className="flex justify-center gap-4 flex-wrap">
            {gameState.options.slice(6).map((color, index) => (
              <ColorSwatch
                key={`third-row-${index}`}
                color={color}
                onClick={() => handleColorSelect(color)}
                className="w-24 h-24 sm:w-28 sm:h-28"
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <div className="p-4 pb-6 relative">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <Button onClick={() => setShowLeaderboard(true)} size="sm" className="h-8 text-xs sm:text-sm sm:h-10">
          <TrophyIcon className="mr-1 h-4 w-4" /> Leaderboard
        </Button>
        <SignInButton />
      </div>
      
      {!gameState.isPlaying ? (
        <div className="text-center mt-16 sm:mt-20">
          <p className="mb-6 text-lg sm:text-xl">Ready to test your color perception skills? Let&apos;s go!</p>
          <Button 
            onClick={startGame} 
            size="lg" 
            className="text-lg px-8 py-4 sm:text-xl sm:px-12 sm:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            Start Game
          </Button>
          {!session && <p className="mt-4 text-xs sm:text-sm text-gray-600">Sign in to save your scores and compete on the leaderboard!</p>}
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6 mt-14 sm:mt-16">
          <div className="h-10 sm:h-12 flex items-center justify-center">
            <AnimatePresence>
              {showFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className={`text-xl sm:text-2xl font-bold text-center absolute ${exactMatch ? 'text-green-500' : 'text-yellow-500'}`}
                >
                  {feedbackText}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <ScoreDisplay gameState={gameState} comboMultiplier={comboMultiplier} closeMatches={closeMatches} closeMatchLimit={gameState.level <= 50 ? 3 : 1} />
          <div className="flex justify-center">
            {showTarget ? (
              <ColorSwatch color={gameState.targetColor} size="large" className="w-56 h-56 sm:w-72 sm:h-72" />
            ) : (
              <div className="w-full max-w-md sm:max-w-lg">
                {renderColorSwatches()}
              </div>
            )}
          </div>
          <Progress 
            value={(gameState.timeLeft / calculateDifficulty(gameState.level, performanceRating)[showTarget ? 'viewTime' : 'selectionTime']) * 100} 
            className="h-3 sm:h-4 w-full"
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