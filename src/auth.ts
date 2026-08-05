import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import {
  getAllowedEmailDomain,
  isAllowedInstituteEmail,
} from "@/lib/auth/email-domain";

type GoogleHostedDomainProfile = {
  email?: string | null;
  hd?: string | null;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ profile, user }) {
      const email = user.email ?? profile?.email;
      const googleProfile = profile as GoogleHostedDomainProfile | undefined;
      const hostedDomain = googleProfile?.hd?.trim().toLowerCase();
      const allowedDomain = getAllowedEmailDomain().trim().toLowerCase();

      return isAllowedInstituteEmail(email) || hostedDomain === allowedDomain;
    },
  },
});