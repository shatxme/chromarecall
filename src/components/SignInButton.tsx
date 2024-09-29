'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { useEffect } from 'react'

export function SignInButton() {
  const { data: session, status, update } = useSession()

  useEffect(() => {
    if (status === 'loading') {
      update()
    }
  }, [status, update])

  useEffect(() => {
    console.log('SignInButton: Session data:', session)
  }, [session])

  if (status === 'loading') {
    return <Button disabled size="sm" className="h-8 text-xs sm:text-sm sm:h-10">Loading...</Button>
  }

  if (session && session.user) {
    return (
      <Button onClick={() => signOut({ callbackUrl: '/' })} size="sm" className="h-8 text-xs sm:text-sm sm:h-10">
        Sign Out
      </Button>
    )
  }

  return (
    <Button 
      onClick={() => signIn('google', { callbackUrl: '/' })}
      size="sm" 
      className="h-8 text-xs sm:text-sm sm:h-10"
    >
      Sign In
    </Button>
  )
}