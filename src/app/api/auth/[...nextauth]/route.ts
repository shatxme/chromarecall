import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

console.log('GOOGLE_ID:', process.env.GOOGLE_ID);
console.log('GOOGLE_SECRET:', process.env.GOOGLE_SECRET ? 'Set' : 'Not set');

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || '',
      clientSecret: process.env.GOOGLE_SECRET || '',
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        // Create a username from the email
        session.user.name = session.user.email ? session.user.email.split('@')[0] : 'Anonymous';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug logs
});

export { handler as GET, handler as POST };