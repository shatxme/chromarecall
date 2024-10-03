"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from "framer-motion"
import type { GameState, LocalUserData } from "../types"
import { calculateColorDifference, calculateDifficulty } from "../lib/color-utils"

const ColorSwatch = dynamic(() => import('./color-swatch'))
const ScoreDisplay = dynamic(() => import('./score-display'))

const MemoizedColorSwatch = React.memo(ColorSwatch)
const MemoizedScoreDisplay = React.memo(ScoreDisplay)

const AttractiveButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <Button
    className={`bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 ${className}`}
    {...props}
  />
)

const scoreSavingWorker = new Worker(new URL('../workers/scoreSavingWorker.ts', import.meta.url)) as Worker

function useGameLogic(
  setIsProcessingSelection: (value: boolean) => void,
  memoizedToast: (props: { title: string; description: string }) => void,
  setShowLossDialog: (show: boolean) => void  // Add this parameter
) {
  const [gameState, setGameState] = useState<GameState>({
    targetColor: '',
    options: [],
    score: 0,
    level: 1,
    timeLeft: 3,
    isPlaying: false,
    highScore: 0
  })
  const [showTarget, setShowTarget] = useState(false)
  const [closeMatches, setCloseMatches] = useState(0)
  const [levelStarted, setLevelStarted] = useState(0)
  const [comboMultiplier, setComboMultiplier] = useState(1)
  const [timerPhase, setTimerPhase] = useState<'target' | 'selection'>('target')

  const workerRef = useRef<Worker | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/colorWorker.ts', import.meta.url))
    return () => {
      workerRef.current?.terminate()
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const updateGameState = useCallback((updates: Partial<GameState> | ((prevState: GameState) => Partial<GameState>)) => {
    setGameState(prev => {
      const newState = typeof updates === 'function' ? updates(prev) : updates;
      return { ...prev, ...newState };
    });
  }, []);

  const endGame = useCallback((lost = false) => {
    updateGameState({ 
      isPlaying: false,
      timeLeft: 3,
      targetColor: '',
      options: []
    })
    setIsProcessingSelection(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    // Add this block to handle the loss dialog
    if (lost) {
      setShowLossDialog(true)
    }
  }, [updateGameState, setIsProcessingSelection, setShowLossDialog]);

  const generateColorsWithWorker = useCallback((level: number): Promise<{ target: string, options: string[] }> => {
    return new Promise((resolve, reject) => {
      if (workerRef.current) {
        const timeoutDuration = Math.min(5000 + (level * 100), 10000);
        const timeoutId = setTimeout(() => {
          reject(new Error('Color generation timed out'));
        }, timeoutDuration);

        workerRef.current.onmessage = (e: MessageEvent) => {
          clearTimeout(timeoutId);
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            resolve(e.data as { target: string, options: string[] });
          }
        };

        workerRef.current.onerror = (error) => {
          clearTimeout(timeoutId);
          reject(error);
        };

        workerRef.current.postMessage({ level });
      } else {
        reject(new Error('Worker not initialized'));
      }
    });
  }, []);

  const startGame = useCallback(async () => {
    setIsProcessingSelection(false)
    try {
      const colors = await generateColorsWithWorker(1)
      
      if (!colors || !colors.target || !colors.options) {
        throw new Error('Invalid colors generated');
      }
      
      updateGameState({
        isPlaying: true,
        score: 0,
        level: 1,
        timeLeft: 3,
        targetColor: colors.target,
        options: colors.options
      })
      
      setShowTarget(true)
      setComboMultiplier(1)
      setCloseMatches(0)
      setLevelStarted(0)
      setTimerPhase('target')
    } catch (error) {
      memoizedToast({
        title: "Error",
        description: "Failed to start the game. Please try again.",
      })
      updateGameState({
        isPlaying: false,
        score: 0,
        level: 1,
        timeLeft: 3,
        targetColor: '',
        options: []
      })
    }
  }, [generateColorsWithWorker, updateGameState, setIsProcessingSelection, memoizedToast])

  const handleColorSelect = useCallback(async (selectedColor: string) => {
    if (!gameState.isPlaying) {
      return null
    }

    try {
      const difference = calculateColorDifference(gameState.targetColor, selectedColor)

      const { selectionTime } = calculateDifficulty(gameState.level)
      const timeBonus = Math.max(0, gameState.timeLeft / selectionTime)
      
      const similarityThreshold = 0.1 - (Math.min(gameState.level, 50) * 0.001)
      const isExactMatch = difference < 0.01
      
      const closeMatchLimit = gameState.level <= 50 ? 3 : 1
      const currentTenLevelBlock = Math.floor(gameState.level / 10)
      
      let newCloseMatches = closeMatches
      let newComboMultiplier = comboMultiplier
      let gameOver = false
      let feedbackMessage = ""

      if (levelStarted !== currentTenLevelBlock) {
        newCloseMatches = 0
      }

      if (!isExactMatch) {
        newCloseMatches++
        newComboMultiplier = 1
      } else {
        newComboMultiplier = Math.min(5, comboMultiplier + 0.5)
      }

      // Check if the player has reached or exceeded the close match limit
      if (!isExactMatch && (newCloseMatches > closeMatchLimit || closeMatches >= closeMatchLimit)) {
        gameOver = true
      } else if (difference >= similarityThreshold) {
        gameOver = true
      } else {
        feedbackMessage = isExactMatch ? `Perfect! ${newComboMultiplier.toFixed(1)}x Combo!` : "Close enough!"
      }

      const accuracyPoints = Math.max(0, 100 - Math.round(difference * 1000))
      const speedPoints = Math.round(timeBonus * 50)
      const totalPoints = Math.round((accuracyPoints + speedPoints) * newComboMultiplier)

      if (gameOver) {
        updateGameState({ isPlaying: false })
      } else {
        let retries = 3;
        let newColors: { target: string, options: string[] } | null = null;
        while (retries > 0) {
          try {
            newColors = await generateColorsWithWorker(gameState.level + 1);
            break;
          } catch (error) {
            retries--;
            if (retries === 0) throw error;
          }
        }
        
        if (!newColors) {
          throw new Error('Failed to generate new colors');
        }
        
        updateGameState((prevState) => ({
          level: prevState.level + 1,
          score: prevState.score + totalPoints,
          targetColor: newColors.target,
          options: newColors.options,
          timeLeft: 3,
        }))
        
        setTimerPhase('target')
        setShowTarget(true)
      }

      setLevelStarted(currentTenLevelBlock)
      setCloseMatches(newCloseMatches)
      setComboMultiplier(newComboMultiplier)

      return { gameOver, feedbackMessage, isExactMatch, totalPoints, accuracyPoints, speedPoints }
    } catch (error) {
      memoizedToast({
        title: "Error",
        description: "An unexpected error occurred. The game will end.",
      });
      endGame(true);
      return null;
    }
  }, [gameState, levelStarted, closeMatches, comboMultiplier, generateColorsWithWorker, updateGameState, endGame, memoizedToast])

  useEffect(() => {
    const runTimer = () => {
      if (gameState.isPlaying) {
        if (gameState.timeLeft > 1) {
          updateGameState((prevState) => ({ 
            ...prevState,
            timeLeft: prevState.timeLeft - 1 
          }))
        } else {
          if (timerPhase === 'target') {
            setTimerPhase('selection')
            setShowTarget(false)
            const { selectionTime } = calculateDifficulty(gameState.level)
            updateGameState((prevState) => ({ 
              ...prevState,
              timeLeft: selectionTime 
            }))
          } else {
            endGame(true) // This will now show the loss dialog
          }
        }
      }
    }

    if (gameState.isPlaying) {
      timerRef.current = setInterval(runTimer, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameState.isPlaying, gameState.timeLeft, gameState.level, timerPhase, updateGameState, endGame])

  return {
    gameState,
    showTarget,
    setShowTarget,
    closeMatches,
    comboMultiplier,
    startGame,
    handleColorSelect,
    updateGameState,
    timerPhase,
    setTimerPhase,
    timerRef,
    endGame
  }
}

export function ColorMemoryGame() {
  const [localUserData, setLocalUserData] = useState<LocalUserData | null>(null)
  const [showUsernameInput, setShowUsernameInput] = useState(false)
  const [tempUsername, setTempUsername] = useState('')
  const [showLossDialog, setShowLossDialog] = useState(false)
  const [isNewHighScore, setIsNewHighScore] = useState(false)
  const [feedbackText, setFeedbackText] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  const [exactMatch, setExactMatch] = useState(false)
  const [isProcessingSelection, setIsProcessingSelection] = useState(false)

  const memoizedToast = useCallback(toast, [])

  const {
    gameState,
    showTarget,
    closeMatches,
    comboMultiplier,
    startGame,
    handleColorSelect,
    updateGameState,
    endGame
  } = useGameLogic(
    setIsProcessingSelection,
    memoizedToast,
    setShowLossDialog  // Pass setShowLossDialog to useGameLogic
  )

  useEffect(() => {
    const storedData = localStorage.getItem('userData')
    if (storedData) {
      setLocalUserData(JSON.parse(storedData))
    }
  }, [])

  const saveUserData = useCallback((username: string, score: number) => {
    const userData: LocalUserData = { username, highestScore: score }
    localStorage.setItem('userData', JSON.stringify(userData))
    setLocalUserData(userData)
  }, [])

  const updateUserData = useCallback((newScore: number) => {
    if (localUserData) {
      const updatedUserData = { 
        ...localUserData, 
        highestScore: Math.max(localUserData.highestScore, newScore) 
      }
      localStorage.setItem('userData', JSON.stringify(updatedUserData))
      setLocalUserData(updatedUserData)
    }
  }, [localUserData])

  const saveScoreInBackground = useCallback((username: string, score: number, level: number) => {
    const currentHighScore = localUserData?.highestScore || 0;
    if (score > currentHighScore) {
      scoreSavingWorker.postMessage({ username, score, level });
      scoreSavingWorker.onmessage = (event: MessageEvent) => {
        if (event.data.error) {
          console.error('Failed to save score:', event.data.error);
          memoizedToast({
            title: "Error",
            description: "Failed to save your score. Please try again.",
          });
        } else {
          updateGameState({ highScore: event.data.highestScore });
          updateUserData(event.data.highestScore);
        }
      };
    }
  }, [localUserData, memoizedToast, updateUserData, updateGameState]);

  const handleEndGame = useCallback((lost = false) => {
    endGame(lost);
    const newHighScore = gameState.score > (localUserData?.highestScore || 0);
    setIsNewHighScore(newHighScore);
    
    if (newHighScore) {
      memoizedToast({
        title: "New High Score!",
        description: `Congratulations! You've set a new high score of ${gameState.score} points!`,
      });
    }

    if (!localUserData) {
      setShowUsernameInput(true);
    } else {
      saveScoreInBackground(localUserData.username, gameState.score, gameState.level);
    }

    setShowLossDialog(true);
  }, [endGame, gameState.score, gameState.level, localUserData, memoizedToast, saveScoreInBackground]);

  const handlePlayAgain = useCallback(() => {
    setShowLossDialog(false)
    setIsProcessingSelection(false)
    startGame()
  }, [startGame])

  const handleUsernameSubmit = useCallback(async () => {
    if (tempUsername.trim()) {
      const response = await fetch(`/api/check-username?username=${encodeURIComponent(tempUsername)}`)
      const { exists, highestScore } = await response.json()

      if (exists) {
        saveUserData(tempUsername, Math.max(highestScore, gameState.score))
      } else {
        saveUserData(tempUsername, gameState.score)
      }

      setShowUsernameInput(false)
      setTempUsername('')
      
      saveScoreInBackground(tempUsername, gameState.score, gameState.level)
      handlePlayAgain()
    }
  }, [tempUsername, gameState.score, gameState.level, saveUserData, saveScoreInBackground, handlePlayAgain])

  const handleColorSelection = useCallback((selectedColor: string) => {
    if (isProcessingSelection || !gameState.isPlaying) {
      return;
    }

    setIsProcessingSelection(true);

    handleColorSelect(selectedColor)
      .then((result) => {
        if (result) {
          const { gameOver, feedbackMessage, isExactMatch, totalPoints, accuracyPoints, speedPoints } = result;
          setExactMatch(isExactMatch);
          setFeedbackText(feedbackMessage);
          setShowFeedback(true);
          
          setTimeout(() => setShowFeedback(false), 1000);

          memoizedToast({
            title: "Color Selected!",
            description: `You earned ${totalPoints} points! (Accuracy: ${accuracyPoints}, Speed: ${speedPoints}${comboMultiplier > 1 ? `, Combo: ${comboMultiplier.toFixed(1)}x` : ''})`,
          });

          if (gameOver) {
            handleEndGame(true);  // Use the existing endGame function
          }
        }
      })
      .catch((error) => {
        console.error("Error during color selection:", error);
        handleEndGame(true);  // Use the existing endGame function
      })
      .finally(() => {
        setIsProcessingSelection(false);
      });
  }, [handleColorSelect, comboMultiplier, memoizedToast, handleEndGame, setIsProcessingSelection, isProcessingSelection, gameState.isPlaying]);

  const renderColorSwatches = useCallback(() => {
    const totalColors = Math.min(6, gameState.options.length)
    return (
      <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 justify-center max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
        {gameState.options.slice(0, totalColors).map((color) => (
          <MemoizedColorSwatch
            key={color}
            color={color}
            size="medium"
            onClick={() => {
              if (!isProcessingSelection && gameState.isPlaying) {
                handleColorSelection(color)
              }
            }}
          />
        ))}
      </div>
    )
  }, [gameState.options, gameState.isPlaying, handleColorSelection, isProcessingSelection])

  return (
    <div className="p-2 sm:p-4 pb-4 sm:pb-6 relative">
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-center items-center">
        <AnimatePresence mode="wait">
          {showFeedback && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className={`text-lg sm:text-xl md:text-2xl font-bold text-center ${exactMatch ? 'text-green-500' : 'text-yellow-500'}`}
            >
              {feedbackText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="mt-8 sm:mt-12">
        {!gameState.isPlaying && (
          <div className="text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-gray-800">
              Ready to test your color perception skills?
            </h2>
            <div className="bg-white bg-opacity-80 p-4 sm:p-6 rounded-lg shadow-md mb-6">
              <p className="text-sm sm:text-base md:text-lg text-gray-700 leading-relaxed text-center mb-2">
                Here&apos;s how to play:
              </p>
              <ul className="text-sm sm:text-base md:text-lg text-gray-700 list-disc list-inside mt-2 space-y-2 text-left">
                <li>A color will appear briefly</li>
                <li>Memorize it, then choose the matching color from the options</li>
                <li>You can pick close matches, but you&apos;re limited to 3 in early levels</li>
                <li>Be quick and accurate to score high!</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Button 
                onClick={startGame} 
                size="lg" 
                className="w-full sm:w-auto text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 md:text-xl md:px-12 md:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                Start Game
              </Button>
            </div>
          </div>
        )}
        
        {gameState.isPlaying && (
          <div className="space-y-2 sm:space-y-4">
            <MemoizedScoreDisplay gameState={gameState} comboMultiplier={comboMultiplier} closeMatches={closeMatches} closeMatchLimit={gameState.level <= 50 ? 3 : 1} />
            <div className="flex justify-center my-8 sm:my-0">
              {showTarget ? (
                <MemoizedColorSwatch 
                  key={`target-${gameState.targetColor}`}
                  color={gameState.targetColor} 
                  size="large"
                />
              ) : (
                renderColorSwatches()
              )}
            </div>
            <Progress 
              value={(gameState.timeLeft / (showTarget ? calculateDifficulty(gameState.level).viewTime : calculateDifficulty(gameState.level).selectionTime)) * 100} 
              className="h-2 sm:h-3 md:h-4 w-full"
            />
          </div>
        )}
      </div>

      <Dialog open={showLossDialog} onOpenChange={setShowLossDialog}>
        <DialogContent className="sm:max-w-[425px] z-50">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-yellow-600">Game Over!</DialogTitle>
            <DialogDescription>
              {isNewHighScore 
                ? "Congratulations! You've set a new personal best!" 
                : "Great effort! Here's how you did:"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-2xl font-bold text-center">
              Your Score: {gameState.score}
            </p>
            <p className="text-xl text-center">Level Reached: {gameState.level}</p>
            {isNewHighScore && (
              <p className="text-lg text-center text-green-600">
                New High Score: {gameState.score}
              </p>
            )}
            {showUsernameInput && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Enter a username to save your score:</p>
                <Input
                  value={tempUsername}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempUsername(e.target.value)}
                  placeholder="Username"
                  required
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            {showUsernameInput ? (
              <AttractiveButton onClick={handleUsernameSubmit} disabled={!tempUsername.trim()}>
                Save Score and Play Again
              </AttractiveButton>
            ) : (
              <AttractiveButton onClick={handlePlayAgain}>
                Play Again
              </AttractiveButton>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}