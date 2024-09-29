'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"

export function SignInButton() {
  const { data: session, status } = useSession()

  console.log('Session status:', status)
  console.log('Session data:', session)

  if (session && session.user) {
    return (
      <Button onClick={() => signOut()} size="sm" className="h-8 text-xs sm:text-sm sm:h-10">
        Sign Out
      </Button>
    )
  }

  return (
    <Button 
      onClick={() => {
        console.log('Sign In button clicked')
        signIn('google', { callbackUrl: '/' })
      }} 
      size="sm" 
      className="h-8 text-xs sm:text-sm sm:h-10"
    >
      Sign In
    </Button>
  )
}