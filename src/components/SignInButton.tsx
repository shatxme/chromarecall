'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react'

export function SignInButton() {
  const { data: session, status } = useSession()
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    console.log('SignInButton: Session status:', status, new Date().toISOString())
    console.log('SignInButton: Session data:', session)
    if (status !== 'loading') {
      setIsSigningIn(false)
    }
  }, [status, session])

  if (status === 'loading' || isSigningIn) {
    return <Button disabled size="sm" className="h-8 text-xs sm:text-sm sm:h-10">Authenticating...</Button>
  }

  if (status === 'authenticated' && session?.user) {
    return (
      <Button onClick={() => signOut({ callbackUrl: '/' })} size="sm" className="h-8 text-xs sm:text-sm sm:h-10">
        Sign Out ({session.user.name})
      </Button>
    )
  }

  return (
    <Button 
      onClick={() => {
        console.log('Initiating sign in...', new Date().toISOString())
        setIsSigningIn(true)
        signIn('google', { callbackUrl: window.location.origin })
      }}
      size="sm" 
      className="h-8 text-xs sm:text-sm sm:h-10"
    >
      Sign In
    </Button>
  )
}