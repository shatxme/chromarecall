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
          response_type: "code",
          scope: 'https://www.googleapis.com/auth/userinfo.email openid https://www.googleapis.com/auth/userinfo.profile'
        }
      }
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      console.log('Sign in callback:', { user, account, profile, email, credentials })
      return true
    },
    async redirect({ url, baseUrl }) {
      console.log('Redirect callback:', { url, baseUrl })
      if (url.startsWith(baseUrl)) return url
      else if (url.startsWith('/')) return new URL(url, baseUrl).toString()
      return baseUrl
    },
    async session({ session, token, user }) {
      console.log('Session callback:', { session, token, user })
      console.log('Token:', token)
      console.log('User:', user)
      if (session?.user) {
        session.user.id = token?.sub || user?.id || undefined
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      console.log('JWT callback:', { token, user, account, profile })
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  events: {
    async signIn(message) { console.log('signIn event:', message) },
    async signOut(message) { console.log('signOut event:', message) },
    async createUser(message) { console.log('createUser event:', message) },
    async linkAccount(message) { console.log('linkAccount event:', message) },
    async session(message) { console.log('session event:', message) },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: true,
}

export default NextAuth(authOptions)