import { GetServerSideProps } from 'next'
import { getProviders, signIn } from 'next-auth/react'
import { useEffect } from 'react'
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
  const { callbackUrl } = router.query

  useEffect(() => {
    if (providers?.google) {
      signIn('google', { callbackUrl: callbackUrl as string || '/' })
    }
  }, [providers, callbackUrl])

  return <div>Signing in...</div>
}

export const getServerSideProps: GetServerSideProps = async () => {
  const providers = await getProviders()
  return {
    props: { providers },
  }
}