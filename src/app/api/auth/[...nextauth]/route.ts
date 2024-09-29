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
      console.log('Sign in attempt started:', new Date().toISOString());
      console.log('Sign in attempt:', { user, account, profile, email, credentials });
      return true;
    },
    async session({ session, token }) {
      console.log('Session callback started:', new Date().toISOString());
      console.log('Session callback:', { session, token });
      if (session.user) {
        session.user.id = token.sub;
        session.user.name = session.user.email ? session.user.email.split('@')[0] : 'Anonymous';
      }
      console.log('Session callback completed:', new Date().toISOString());
      return session;
    },
    async jwt({ token, user }) {
      console.log('JWT callback started:', new Date().toISOString());
      // If you want to include additional user info in the token
      if (user) {
        token.id = user.id;
      }
      console.log('JWT callback completed:', new Date().toISOString());
      return token;
    },
  },
  events: {
    async signIn(message) { console.log('signIn', message) },
    async signOut(message) { console.log('signOut', message) },
    async createUser(message) { console.log('createUser', message) },
    async updateUser(message) { console.log('updateUser', message) },
    async linkAccount(message) { console.log('linkAccount', message) },
    async session(message) { console.log('session', message) },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug logs
});

export { handler as GET, handler as POST };