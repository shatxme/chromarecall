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
    async signIn({ user, account, profile, email, credentials }) {
      console.log('Sign in attempt:', { user, account, profile, email, credentials });
      return true;
    },
    async jwt({ token, user, account, profile }) {
      console.log('JWT callback:', { token, user, account, profile });
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('Session callback:', { session, token });
      if (session.user) {
        session.user.id = token.sub;
        session.user.name = session.user.email ? session.user.email.split('@')[0] : 'Anonymous';
      }
      return session;
    },
  },
  debug: true,
});

export { handler as GET, handler as POST };