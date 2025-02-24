import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export default NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify', // Add the necessary scopes
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Can be 'jwt' or 'database', depending on your setup
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!; // Ensure ID is passed to session
        session.user.username = token.name!;
        session.user.image = token.picture!;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id; // Store ID in JWT token
      }
      return token;
    },
  },
});