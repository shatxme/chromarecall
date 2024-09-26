import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string
    } & DefaultSession["user"]
  }
}

export interface GameState {
  targetColor: string
  options: string[]
  score: number
  level: number
  timeLeft: number
  isPlaying: boolean
  highScore: number
}

// ... rest of your types ...