import { GetServerSideProps } from 'next'
import { getProviders, signIn } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

export default function SignIn({ providers }: { providers: Record<string, Provider> }) {
  const router = useRouter()
  const { callbackUrl, error } = router.query
  const [signInError, setSignInError] = useState<string | null>(error as string | null)

  useEffect(() => {
    if (!signInError) {
      const signInToGoogle = async () => {
        if (providers?.google) {
          try {
            const result = await signIn('google', { 
              callbackUrl: callbackUrl as string || '/', 
              redirect: false 
            })
            if (result?.error) {
              setSignInError(result.error)
            } else if (result?.url) {
              router.push(result.url)
            }
          } catch (e) {
            console.error('Sign in error:', e)
            setSignInError('An error occurred during sign in')
          }
        }
      }
      signInToGoogle()
    }
  }, [providers, callbackUrl, router, signInError])

  if (signInError) {
    return <div>Error: {signInError}</div>
  }

  return <div>Signing in...</div>
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const providers = await getProviders()
  return {
    props: { providers },
  }
}