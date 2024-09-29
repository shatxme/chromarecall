'use client'

import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { useEffect } from 'react'

export function SignInButton() {
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log('SignInButton: Session status:', status, new Date().toISOString())
    console.log('SignInButton: Session data:', session)
  }, [status, session])

  if (status === 'loading') {
    return <Button disabled size="sm" className="h-8 text-xs sm:text-sm sm:h-10">Loading...</Button>
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
        signIn('google', { callbackUrl: window.location.origin })
      }}
      size="sm" 
      className="h-8 text-xs sm:text-sm sm:h-10"
    >
      Sign In
    </Button>
  )
}