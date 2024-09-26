import { GetServerSideProps } from 'next'
import { getProviders, signIn } from 'next-auth/react'
import { useEffect } from 'react'

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

export default function SignIn({ providers }: { providers: Record<string, Provider> }) {
  useEffect(() => {
    if (providers?.google) {
      signIn('google', { callbackUrl: '/' })
    }
  }, [providers])

  return <div>Signing in...</div>
}

export const getServerSideProps: GetServerSideProps = async () => {
  const providers = await getProviders()
  return {
    props: { providers },
  }
}