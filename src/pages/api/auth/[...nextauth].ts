import NextAuth, { NextAuthOptions } from 'next-auth'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import GoogleProvider from 'next-auth/providers/google'
import clientPromise from '@/lib/mongodb'

const googleId = process.env.GOOGLE_ID
const googleSecret = process.env.GOOGLE_SECRET

if (!googleId || !googleSecret) {
  console.warn('Missing Google OAuth credentials. Some functionality may be limited.')
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: googleId ?? 'dummy-client-id',
      clientSecret: googleSecret ?? 'dummy-client-secret',
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn() {
      return true
    },
    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? url : baseUrl
    },
    session: async ({ session, token, user }) => {
      if (session?.user) {
        session.user.id = token.sub || user?.id
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
}

export default NextAuth(authOptions)