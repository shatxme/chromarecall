import { useState, useCallback, useEffect } from 'react';
import { ColorSelectionResult, GameState, LocalUserData } from '@/types';
import { awardCoins } from '@/lib/api';
import { calculateDifficulty } from '@/lib/color-utils';

function useColorSelection(
  handleColorSelect: (selectedColor: string) => Promise<ColorSelectionResult | null>,
  comboMultiplier: number,
  memoizedToast: (props: { title: string; description: string }) => void,
  handleGameEnd: (lost: boolean) => void,
  gameState: GameState,
  isProcessingSelection: boolean,
  setIsProcessingSelection: (value: boolean) => void,
  showConfetti: () => void,
  localUserData: LocalUserData | null,
  updateUserData: (username: string, newScore: number, newCoins?: number) => void
) {
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);
  const [isChromatisChallengeMode, setIsChromatisChallengeMode] = useState(false);
  const [feedbackColor, setFeedbackColor] = useState<'green' | 'yellow' | 'purple'>('green');

  const setChromatisChallengeMode = useCallback((isChromatisChallengeMode: boolean) => {
    setIsChromatisChallengeMode(isChromatisChallengeMode);
    if (isChromatisChallengeMode) {
      setFeedbackText("Chromatic Challenge! Spot the subtle difference.");
      setShowFeedback(true);
      setExactMatch(false);
    } else {
      setShowFeedback(false);
    }
  }, []);

  useEffect(() => {
    if (gameState.level % 10 === 0) {
      setChromatisChallengeMode(true);
    } else {
      setChromatisChallengeMode(false);
    }
  }, [gameState.level, setChromatisChallengeMode]);

  const handleColorSelection = useCallback(async (selectedColor: string) => {
    if (isProcessingSelection || !gameState.isPlaying) {
      return;
    }

    setIsProcessingSelection(true);

    try {
      const result = await handleColorSelect(selectedColor);
      if (result) {
        const { gameOver, feedbackMessage, isExactMatch, totalPoints, accuracyPoints, speedPoints } = result;
        setExactMatch(isExactMatch);
        
        if (!gameOver) {
          setFeedbackText(feedbackMessage);
          setFeedbackColor(isExactMatch ? 'green' : isChromatisChallengeMode ? 'purple' : 'yellow');
          setShowFeedback(true);
          setTimeout(() => setShowFeedback(false), 800);

          memoizedToast({
            title: "Color Selected!",
            description: `You earned ${totalPoints} points! (Accuracy: ${accuracyPoints}, Speed: ${speedPoints}${comboMultiplier > 1 ? `, Combo: ${comboMultiplier.toFixed(1)}x` : ''})`,
          });

          if (isChromatisChallengeMode && isExactMatch) {
            showConfetti();
            
            // Award coins for completing Chromatic Challenge
            if (localUserData?.username) {
              try {
                const selectionTime = calculateDifficulty(gameState.level).selectionTime;
                console.log('Calling awardCoins with:', localUserData.username, gameState.timeLeft, selectionTime);
                const awardedCoins = await awardCoins(localUserData.username, gameState.timeLeft, selectionTime);
                console.log('Coins awarded:', awardedCoins);
                updateUserData(localUserData.username, gameState.score + totalPoints, awardedCoins);
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
            }
          }
        }

        if (gameOver) {
          handleGameEnd(true);
        }
      }
    } catch (error) {
      console.error("Error during color selection:", error);
      handleGameEnd(true);
    } finally {
      setIsProcessingSelection(false);
    }
  }, [handleColorSelect, comboMultiplier, memoizedToast, handleGameEnd, gameState, isProcessingSelection, setIsProcessingSelection, isChromatisChallengeMode, showConfetti, localUserData, updateUserData]);

  return {
    feedbackText,
    showFeedback,
    exactMatch,
    handleColorSelection,
    setChromatisChallengeMode,
    feedbackColor
  };
}

export default useColorSelection;