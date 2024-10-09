import { useState, useCallback, useEffect } from 'react';
import { ColorSelectionResult, GameState } from '@/types';

function useColorSelection(
  handleColorSelect: (selectedColor: string) => Promise<ColorSelectionResult | null>,
  comboMultiplier: number,
  memoizedToast: (props: { title: string; description: string }) => void,
  handleGameEnd: (lost: boolean) => void,
  gameState: GameState,
  isProcessingSelection: boolean,
  setIsProcessingSelection: (value: boolean) => void,
  showConfetti: () => void
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

  const handleColorSelection = useCallback((selectedColor: string) => {
    if (isProcessingSelection || !gameState.isPlaying) {
      return;
    }

    setIsProcessingSelection(true);

    handleColorSelect(selectedColor)
      .then((result: ColorSelectionResult | null) => {
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
            }
          }

          if (gameOver) {
            handleGameEnd(true);
          }
        }
      })
      .catch((error: Error) => {
        console.error("Error during color selection:", error);
        handleGameEnd(true);
      })
      .finally(() => {
        setIsProcessingSelection(false);
      });
  }, [handleColorSelect, comboMultiplier, memoizedToast, handleGameEnd, gameState.isPlaying, isProcessingSelection, setIsProcessingSelection, isChromatisChallengeMode, showConfetti]);

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