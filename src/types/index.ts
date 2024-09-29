export interface GameState {
  targetColor: string
  options: string[]
  score: number
  level: number
  timeLeft: number
  isPlaying: boolean
  highScore: number
}

// Add any other types you might need for the game

export interface LocalUserData {
  username: string;
  highestScore: number;
}

export type LeaderboardEntry = {
  username: string
  score: number
  level: number
}

// Add any other types that might be used across multiple components