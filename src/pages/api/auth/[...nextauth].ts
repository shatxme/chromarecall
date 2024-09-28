import NextAuth, { NextAuthOptions } from 'next-auth'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import GoogleProvider from 'next-auth/providers/google'
import type { Adapter, AdapterUser, AdapterSession, VerificationToken } from 'next-auth/adapters'
import clientPromise from '@/lib/mongodb'

const googleId = process.env.GOOGLE_ID
const googleSecret = process.env.GOOGLE_SECRET

if (!googleId || !googleSecret) {
  console.warn('Missing Google OAuth credentials. Some functionality may be limited.')
}

const isDevelopment = process.env.NODE_ENV === 'development'

// Mock adapter for development
const mockAdapter: Adapter = {
  createUser: async (user: Omit<AdapterUser, "id">) => ({ ...user, id: 'mock-user-id', emailVerified: null }) as AdapterUser,
  getUser: async (id: string) => ({ id, name: 'Mock User', email: 'mock@example.com', emailVerified: null }) as AdapterUser,
  getUserByEmail: async (email: string) => ({ id: 'mock-user-id', name: 'Mock User', email, emailVerified: null }) as AdapterUser,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getUserByAccount: async ({ providerAccountId: _providerAccountId, provider: _provider }: { providerAccountId: string, provider: string }) => 
    ({ id: 'mock-user-id', name: 'Mock User', email: 'mock@example.com', emailVerified: null }) as AdapterUser,
  updateUser: async (user: Partial<AdapterUser>) => ({ ...user, id: 'mock-user-id', emailVerified: user.emailVerified || null }) as AdapterUser,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteUser: async (_userId: string) => { /* Implementation not needed for mock */ },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  linkAccount: async (_account: unknown) => { /* Implementation not needed for mock */ },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unlinkAccount: async ({ providerAccountId: _providerAccountId, provider: _provider }: { providerAccountId: string, provider: string }) => { /* Implementation not needed for mock */ },
  createSession: async (session: { sessionToken: string; userId: string; expires: Date }) => session as AdapterSession,
  getSessionAndUser: async (sessionToken: string) => ({ 
    session: { sessionToken, userId: 'mock-user-id', expires: new Date() } as AdapterSession,
    user: { id: 'mock-user-id', name: 'Mock User', email: 'mock@example.com', emailVerified: null } as AdapterUser
  }),
  updateSession: async (session: Partial<AdapterSession>) => session as AdapterSession,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteSession: async (_sessionToken: string) => { /* Implementation not needed for mock */ },
  createVerificationToken: async (token: VerificationToken) => token,
  useVerificationToken: async ({ identifier, token }: { identifier: string, token: string }) => 
    ({ identifier, token, expires: new Date() }) as VerificationToken,
}

export const authOptions: NextAuthOptions = {
  adapter: isDevelopment ? mockAdapter : MongoDBAdapter(clientPromise),
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
      return url.startsWith(baseUrl) ? url : baseUrl
    },
    async session({ session, token, user }) {
      console.log('Session callback:', { session, token, user })
      if (session?.user) {
        session.user.id = token?.sub || user?.id || 'unknown';
        // Use email username as display name
        session.user.name = session.user.email?.split('@')[0] || 'Anonymous';
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
    error: '/auth/error', // Keep this for error handling
  },
  debug: true,
  logger: {
    error(code, metadata) {
      console.error(code, metadata)
    },
    warn(code) {
      console.warn(code)
    },
    debug(code, metadata) {
      console.debug(code, metadata)
    }
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    callbackUrl: {
      name: `__Secure-next-auth.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
    csrfToken: {
      name: `__Host-next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: true
      }
    },
  },
}

export default NextAuth(authOptions)