'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'  // Change this import

export function SignInButton() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    console.log('Session status:', status)
    console.log('Session data:', session)
    if (status === 'authenticated' && window.location.pathname === '/auth/signin') {
      router.push('/')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return <Button disabled>Loading...</Button>
  }

  if (session) {
    return (
      <Button onClick={() => signOut({ callbackUrl: '/' })}>Sign out</Button>
    )
  }
  return (
    <Button onClick={() => signIn('google', { callbackUrl: '/' })}>Sign in</Button>
  )
}