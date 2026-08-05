import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowedInstituteEmail } from "@/lib/auth/email-domain";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ profile, user }) {
      const email = user.email ?? profile?.email;

      return isAllowedInstituteEmail(email);
    },
  },
});
