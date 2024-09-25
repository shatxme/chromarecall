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