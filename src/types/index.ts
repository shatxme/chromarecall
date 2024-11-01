export interface GameState {
  targetColor: string
  options: string[]
  score: number
  level: number
  timeLeft: number
  isPlaying: boolean
  highScore: number
  closeMatches: number // Add this line
}

// Add any other types you might need for the game

export interface LocalUserData {
  username: string;
  highestScore: number;
  coins: number;
}

export interface ColorSelectionResult {
  gameOver: boolean;
  feedbackMessage: string;
  isExactMatch: boolean;
  totalPoints: number;
  accuracyPoints: number;
  speedPoints: number;
}

export type LeaderboardEntry = {
  username: string
  score: number
  level: number
}

// Add any other types that might be used across multiple components