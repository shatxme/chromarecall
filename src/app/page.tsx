import { ColorMemoryGame } from '@/components/color-memory-game'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/pages/api/auth/[...nextauth]'
import { SignInButton } from '@/components/SignInButton'

export default async function Home() {
  let session
  try {
    session = await getServerSession(authOptions)
  } catch (error) {
    console.error('Failed to get server session:', error)
    // Proceed without a session
  }

  if (session) {
    return <ColorMemoryGame />
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-4">Welcome to Color Memory Game</h1>
      <p className="text-xl mb-8">Please sign in to play the game.</p>
      <SignInButton />
    </div>
  )
}
