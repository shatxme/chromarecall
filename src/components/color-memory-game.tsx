"use client"

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
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
import { generateGameColors, calculateColorDifference, calculateDifficulty } from "../lib/color-utils"
import { Skeleton } from "@/components/ui/skeleton"
import { saveScore, awardCoins } from '../lib/api';
import GameIntro from './GameIntro'
import Confetti from 'react-confetti'
import useColorSelection from '../hooks/useColorSelection';

const ColorSwatch = dynamic(() => import('./color-swatch'), {
  loading: () => <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-md" />
})
const ScoreDisplay = dynamic(() => import('./score-display'), {
  loading: () => <Skeleton className="w-full h-12" />
})

const MemoizedColorSwatch = React.memo(ColorSwatch)
const MemoizedScoreDisplay = React.memo(ScoreDisplay)

const AttractiveButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => (
  <Button
    className={`bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 ${className}`}
    {...props}
  />
)

// Utility functions
const getCloseMatchLimit = (level: number) => level <= 50 ? 3 : 1;

function useGameLogic(
  setIsProcessingSelection: (value: boolean) => void,
  memoizedToast: (props: { title: string; description: string }) => void,
  setShowLossDialog: (show: boolean) => void,
  setIsNewHighScore: (value: boolean) => void,
  setShowUsernameInput: (value: boolean) => void,
  localUserData: LocalUserData | null,
  setLocalUserData: React.Dispatch<React.SetStateAction<LocalUserData | null>>
) {
  const [gameState, setGameState] = useState<GameState>({
    targetColor: '',
    options: [],
    score: 0,
    level: 1,
    timeLeft: 3,
    isPlaying: false,
    highScore: 0,
    closeMatches: 0
  })
  const [showTarget, setShowTarget] = useState(false)
  const [comboMultiplier, setComboMultiplier] = useState(1)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const updateGameState = useCallback((updates: Partial<GameState> | ((prevState: GameState) => Partial<GameState>)) => {
    setGameState(prev => {
      const newState = typeof updates === 'function' ? updates(prev) : updates;
      const updatedState = { ...prev, ...newState };
      console.log('Updating game state:', updatedState);
      return Object.keys(newState).some(key => prev[key as keyof GameState] !== newState[key as keyof GameState])
        ? updatedState
        : prev;
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
    
    if (lost) {
      setShowLossDialog(true)
    }
  }, [updateGameState, setIsProcessingSelection, setShowLossDialog]);

  const generateColors = useCallback((level: number): { target: string, options: string[] } => {
    const result = generateGameColors(level);
    console.log(`Target color generated for level ${level}: ${result.target}`);
    console.log(`Color options generated for level ${level}: ${result.options.join(', ')}`);
    return result;
  }, []);

  const startGame = useCallback(async () => {
    setIsProcessingSelection(false)
    try {
      const colors = generateColors(1)
      
      if (!colors || !colors.target || !colors.options) {
        throw new Error('Invalid colors generated');
      }
      
      updateGameState({
        isPlaying: true,
        score: 0,
        level: 1,
        timeLeft: 3,
        targetColor: colors.target,
        options: colors.options,
        closeMatches: 0 // Ensure closeMatches is reset
      })
      
      setShowTarget(true)
      setComboMultiplier(1)
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
        options: [],
        closeMatches: 0
      })
    }
  }, [generateColors, updateGameState, setIsProcessingSelection, memoizedToast])

  const handleGameEnd = useCallback((lost = false) => {
    endGame(lost);
    const newHighScore = gameState.score > (localUserData?.highestScore || 0);
    setIsNewHighScore(newHighScore);
    
    if (localUserData) {
      if (newHighScore) {
        try {
          saveScore(localUserData.username, gameState.score, gameState.level);
          const updatedUserData = {
            ...localUserData,
            highestScore: gameState.score
          };
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
          setLocalUserData(updatedUserData);
          
          memoizedToast({
            title: "New High Score!",
            description: `Your new high score of ${gameState.score} has been saved!`,
          });
        } catch (error) {
          console.error('Error saving score:', error);
          memoizedToast({
            title: "Error",
            description: "Failed to save your score to the server.",
          });
        }
      } else {
        memoizedToast({
          title: "Game Over",
          description: `Your score: ${gameState.score}. Your high score: ${localUserData.highestScore}`,
        });
      }
    } else {
      setShowUsernameInput(true);
    }

    setShowLossDialog(true);
  }, [endGame, gameState.score, gameState.level, localUserData, setLocalUserData, memoizedToast, setIsNewHighScore, setShowUsernameInput, setShowLossDialog]);

  const handleColorSelect = useCallback(async (selectedColor: string) => {
    if (!gameState.isPlaying) {
      return null;
    }

    console.log(`Color chosen for level ${gameState.level}: ${selectedColor}`);

    const difference = calculateColorDifference(gameState.targetColor, selectedColor);
    const { selectionTime, similarity } = calculateDifficulty(gameState.level);
    const timeBonus = Math.max(0, gameState.timeLeft / selectionTime);
    
    const isExactMatch = difference < 1;
    const isBossLevel = gameState.level % 10 === 0;
    const isCloseMatch = !isBossLevel && difference < 25 * (1 - similarity);
    
    let newCloseMatches = gameState.closeMatches;
    let newComboMultiplier = comboMultiplier;
    let gameOver = false;
    let feedbackMessage = "";

    const closeMatchLimit = 3; // Constant for all non-boss levels

    if (isExactMatch) {
      newComboMultiplier = Math.min(5, comboMultiplier + 0.5);
      feedbackMessage = `Perfect! ${newComboMultiplier.toFixed(1)}x Combo!`;
    } else if (isCloseMatch) {
      newCloseMatches++;
      newComboMultiplier = 1;
      feedbackMessage = "Close match!";
      if (newCloseMatches > closeMatchLimit) {
        gameOver = true;
        feedbackMessage = "";
      }
    } else {
      gameOver = true;
      feedbackMessage = ""; // Remove the "Wrong color!" feedback
    }

    const accuracyPoints = Math.max(0, 100 - Math.round(difference * 1000));
    const speedPoints = Math.round(timeBonus * 50);
    const totalPoints = Math.round((accuracyPoints + speedPoints) * newComboMultiplier);

    console.log(`Close matches before update: ${gameState.closeMatches}/${closeMatchLimit}`);
    console.log(`New close matches: ${newCloseMatches}/${closeMatchLimit}`);

    if (gameOver) {
      updateGameState({ isPlaying: false, closeMatches: newCloseMatches });
      handleGameEnd(true);
    } else {
      const newColors = generateColors(gameState.level + 1);
      
      updateGameState((prevState) => {
        const updatedState = {
          ...prevState,
          level: prevState.level + 1,
          score: prevState.score + totalPoints,
          targetColor: newColors.target,
          options: newColors.options,
          timeLeft: 3,
          closeMatches: (prevState.level + 1) % 10 === 1 ? 0 : newCloseMatches // Reset close matches at the start of each 10-level cycle
        };
        console.log(`Updated game state:`, updatedState);
        return updatedState;
      });
      
      setShowTarget(true);
    }

    setComboMultiplier(newComboMultiplier);

    return { gameOver, feedbackMessage, isExactMatch, totalPoints, accuracyPoints, speedPoints };
  }, [gameState, comboMultiplier, generateColors, updateGameState, handleGameEnd]);

  useEffect(() => {
    const runTimer = () => {
      if (gameState.isPlaying) {
        if (gameState.timeLeft > 1) {
          updateGameState((prevState) => ({ 
            ...prevState,
            timeLeft: prevState.timeLeft - 1 
          }))
        } else {
          if (showTarget) {
            setShowTarget(false)
            const { selectionTime } = calculateDifficulty(gameState.level)
            updateGameState((prevState) => ({ 
              ...prevState,
              timeLeft: selectionTime 
            }))
          } else {
            handleGameEnd(true)
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
  }, [gameState.isPlaying, gameState.timeLeft, showTarget, gameState.level, updateGameState, handleGameEnd])

  return {
    gameState,
    showTarget,
    setShowTarget,
    comboMultiplier,
    startGame,
    handleColorSelect,
    handleGameEnd,
  }
}

export function ColorMemoryGame() {
  const [localUserData, setLocalUserData] = useState<LocalUserData | null>(null)
  const [showUsernameInput, setShowUsernameInput] = useState(false)
  const [tempUsername, setTempUsername] = useState('')
  const [showLossDialog, setShowLossDialog] = useState(false)
  const [isNewHighScore, setIsNewHighScore] = useState(false)
  const [isProcessingSelection, setIsProcessingSelection] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const memoizedToast = useCallback(toast, [])

  const updateUserData = useCallback((username: string, newScore: number, newCoins = 0) => {
    const updatedUserData: LocalUserData = { 
      username, 
      highestScore: Math.max(localUserData?.highestScore || 0, newScore),
      coins: (localUserData?.coins || 0) + newCoins
    };
    localStorage.setItem('userData', JSON.stringify(updatedUserData));
    setLocalUserData(updatedUserData);
  }, [localUserData]);

  const {
    gameState,
    showTarget,
    comboMultiplier,
    startGame,
    handleColorSelect,
    handleGameEnd: handleGameEndFromHook,
  } = useGameLogic(
    setIsProcessingSelection,
    memoizedToast,
    setShowLossDialog,
    setIsNewHighScore,
    setShowUsernameInput,
    localUserData,
    setLocalUserData
  )

  const handleGameEnd = useCallback(async (lost = false) => {
    console.log('handleGameEnd called. Lost:', lost, 'Level:', gameState.level, 'Score:', gameState.score);
    await handleGameEndFromHook(lost);
    
    if (gameState.score > 0) {
      if (localUserData?.username) {
        const isNewHighScore = gameState.score > (localUserData.highestScore || 0);
        
        // Check if the player just completed a Chromatic Challenge (level 10, 20, 30, etc.)
        if (gameState.level % 10 === 0 && !lost) {
          console.log('Chromatic Challenge completed. Attempting to award coins.');
          try {
            const selectionTime = calculateDifficulty(gameState.level).selectionTime;
            console.log('Calling awardCoins with:', localUserData.username, gameState.timeLeft, selectionTime);
            const awardedCoins = await awardCoins(localUserData.username, gameState.timeLeft, selectionTime);
            console.log('Coins awarded:', awardedCoins);
            updateUserData(localUserData.username, gameState.score, awardedCoins);
            memoizedToast({
              title: "Chromatic Challenge Completed!",
              description: `You've been awarded ${awardedCoins} coins!`,
            });
          } catch (error) {
            console.error('Error awarding coins:', error);
            memoizedToast({
              title: "Error",
              description: "Failed to award coins. Please try again.",
            });
          }
        } else {
          console.log('Updating user data without awarding coins.');
          updateUserData(localUserData.username, gameState.score);
        }
        
        if (isNewHighScore) {
          try {
            await saveScore(localUserData.username, gameState.score, gameState.level);
            memoizedToast({
              title: "New High Score!",
              description: `Your new high score of ${gameState.score} has been saved!`,
            });
            setIsNewHighScore(true);
          } catch (error) {
            console.error('Error saving score:', error);
            memoizedToast({
              title: "Error",
              description: "Failed to save your score to the server.",
            });
          }
        } else {
          memoizedToast({
            title: "Game Over",
            description: `Your score: ${gameState.score}. Your high score: ${localUserData.highestScore}`,
          });
        }
      } else {
        setShowUsernameInput(true);
      }
    }

    setShowLossDialog(true);
  }, [handleGameEndFromHook, gameState.score, gameState.level, gameState.timeLeft, localUserData, updateUserData, memoizedToast, setIsNewHighScore, setShowUsernameInput]);

  const handleConfetti = useCallback(() => {
    setShowConfetti(true);
    
    // Clear any existing timeout
    if (confettiTimeoutRef.current) {
      clearTimeout(confettiTimeoutRef.current);
    }
    
    // Set a new timeout to hide confetti after 1 second
    confettiTimeoutRef.current = setTimeout(() => {
      setShowConfetti(false);
    }, 1000);
  }, []);

  const {
    feedbackText,
    showFeedback,
    handleColorSelection,
    setChromatisChallengeMode,
    feedbackColor
  } = useColorSelection(
    handleColorSelect,
    comboMultiplier,
    memoizedToast,
    handleGameEnd,
    gameState,
    isProcessingSelection,
    setIsProcessingSelection,
    handleConfetti,
    localUserData,  // Add this
    updateUserData  // Add this
  );

  // Use useEffect to set Chromatic Challenge mode
  useEffect(() => {
    if (gameState.level % 10 === 0) {
      setChromatisChallengeMode(true);
    } else {
      setChromatisChallengeMode(false);
    }
  }, [gameState.level, setChromatisChallengeMode]);

  useEffect(() => {
    const storedData = localStorage.getItem('userData')
    if (storedData) {
      setLocalUserData(JSON.parse(storedData))
    }
  }, [])

  const handlePlayAgain = useCallback(() => {
    setShowLossDialog(false)
    setIsProcessingSelection(false)
    startGame()
  }, [startGame])

  const handleUsernameSubmit = useCallback(async () => {
    if (tempUsername.trim()) {
      try {
        const response = await fetch(`/api/check-username?username=${encodeURIComponent(tempUsername)}`);
        const { exists, highestScore } = await response.json();

        let updatedHighScore = gameState.score;
        if (exists) {
          updatedHighScore = Math.max(highestScore, gameState.score);
        }

        updateUserData(tempUsername, updatedHighScore);

        if (updatedHighScore === gameState.score) {
          await saveScore(tempUsername, gameState.score, gameState.level);
        }

        setShowUsernameInput(false);
        setTempUsername('');
        
        memoizedToast({
          title: "Username Saved",
          description: `Welcome, ${tempUsername}! Your score has been saved.`,
        });

        handlePlayAgain();
      } catch (error) {
        console.error('Error checking username:', error);
        memoizedToast({
          title: "Error",
          description: "Failed to submit username. Please try again.",
        });
      }
    }
  }, [tempUsername, gameState.score, gameState.level, memoizedToast, handlePlayAgain, updateUserData]);

  const memoizedScoreDisplay = useMemo(() => (
    <MemoizedScoreDisplay 
      gameState={gameState} 
      comboMultiplier={comboMultiplier} 
      closeMatches={gameState.closeMatches} 
      closeMatchLimit={getCloseMatchLimit(gameState.level)} 
    />
  ), [gameState, comboMultiplier]);

  // Cleanup effect for confetti timeout
  useEffect(() => {
    return () => {
      if (confettiTimeoutRef.current) {
        clearTimeout(confettiTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="p-2 sm:p-4 pb-4 sm:pb-6 relative" role="main" aria-label="Color Memory Game">
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={200}
          gravity={0.5} // Increase gravity to make confetti fall faster
          tweenDuration={100} // Reduce tween duration for quicker animation
        />
      )}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 flex justify-center items-center">
        <AnimatePresence mode="wait">
          {showFeedback && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className={`text-lg sm:text-xl md:text-2xl font-bold text-center ${
                feedbackColor === 'green'
                  ? 'text-green-500'
                  : feedbackColor === 'purple'
                    ? 'text-purple-600'
                    : 'text-yellow-500'
              }`}
              aria-live="polite"
            >
              {feedbackText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <div className="mt-8 sm:mt-12">
        {!gameState.isPlaying && (
          <GameIntro startGame={startGame} />
        )}
        
        {gameState.isPlaying && (
          <div className="space-y-2 sm:space-y-4">
            <React.Suspense fallback={<Skeleton className="w-full h-12" />}>
              {memoizedScoreDisplay}
            </React.Suspense>
            
            <div className="flex justify-center my-8 sm:my-0">
              {showTarget ? (
                <React.Suspense fallback={<Skeleton className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-md" />}>
                  <MemoizedColorSwatch 
                    key={`target-${gameState.targetColor}`}
                    color={gameState.targetColor} 
                    size="large"
                    aria-label="Target color"
                  />
                </React.Suspense>
              ) : (
                <div 
                  className={`grid gap-3 sm:gap-4 md:gap-6 lg:gap-8 justify-center max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl mx-auto ${
                    gameState.options.length === 2 ? 'grid-cols-2' : 
                    gameState.options.length === 3 ? 'grid-cols-3' : 
                    gameState.options.length === 4 ? 'grid-cols-2' : 
                    'grid-cols-3'
                  }`}
                  role="group" 
                  aria-label="Color options"
                >
                  {gameState.options.map((color, index) => (
                    <React.Suspense key={color} fallback={<Skeleton className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-md" />}>
                      <MemoizedColorSwatch
                        color={color}
                        size="medium"
                        onClick={() => handleColorSelection(color)} // Use the handleColorSelection from the hook
                        aria-label={`Color option ${index + 1}`}
                      />
                    </React.Suspense>
                  ))}
                </div>
              )}
            </div>
            <Progress 
              value={(gameState.timeLeft / (showTarget ? calculateDifficulty(gameState.level).viewTime : calculateDifficulty(gameState.level).selectionTime)) * 100} 
              className="h-2 sm:h-3 md:h-4 w-full"
              aria-label="Time remaining"
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
              {isNewHighScore ? "New High Score: " : "Your Score: "}{gameState.score}
            </p>
            <p className="text-xl text-center">Level Reached: {gameState.level}</p>
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