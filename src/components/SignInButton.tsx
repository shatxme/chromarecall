'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function SignInButton() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status !== 'loading') {
      setIsLoading(false)
    }
    if (status === 'authenticated' && window.location.pathname === '/auth/signin') {
      router.push('/')
    }
  }, [session, status, router])

  useEffect(() => {
    // Preload Google sign-in URL
    const preloadGoogleSignIn = () => {
      const link = document.createElement('link')
      link.rel = 'preconnect'
      link.href = 'https://accounts.google.com'
      document.head.appendChild(link)
    }
    preloadGoogleSignIn()
  }, [])

  const handleSignIn = () => {
    setIsLoading(true)
    signIn('google', { callbackUrl: '/' })
  }

  const handleSignOut = () => {
    setIsLoading(true)
    signOut({ callbackUrl: '/' })
  }

  if (isLoading) {
    return <Button disabled>Loading...</Button>
  }

  if (session) {
    return (
      <Button onClick={handleSignOut}>Sign out</Button>
    )
  }
  return (
    <Button onClick={handleSignIn}>Sign in</Button>
  )
}