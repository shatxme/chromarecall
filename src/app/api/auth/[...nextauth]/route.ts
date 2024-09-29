import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || '',
      clientSecret: process.env.GOOGLE_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, email, credentials }) {
      console.log('Sign in attempt started:', new Date().toISOString());
      console.log('Sign in attempt:', { user, email, credentials });
      return true;
    },
    async jwt({ token, user }) {
      console.log('JWT callback started:', new Date().toISOString());
      if (user) {
        token.id = user.id;
      }
      console.log('JWT callback completed:', new Date().toISOString());
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback started:', new Date().toISOString());
      if (session.user) {
        session.user.id = token.sub;
        session.user.name = session.user.email ? session.user.email.split('@')[0] : 'Anonymous';
      }
      console.log('Session callback completed:', new Date().toISOString());
      return session;
    },
  },
  debug: true,
});

export { handler as GET, handler as POST };