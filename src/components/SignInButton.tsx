'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function SignInButton() {
  const { data: session, status } = useSession()

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