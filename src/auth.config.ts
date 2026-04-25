import { getUserByEmail } from "@/components/auth/user";
import { LoginSchema } from "@/components/auth/validation";
import bcrypt from "bcryptjs";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: new Date(),
          role: "CLERK" as const,
          isTwoFactorEnabled: false,
        };
      },
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      authorization: {
        url: "https://www.facebook.com/v18.0/dialog/oauth",
        params: {
          scope: "email public_profile",
          redirect_uri: (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL)
            ? `${process.env.AUTH_URL ?? process.env.NEXTAUTH_URL}/api/auth/callback/facebook`
            : undefined
        }
      },
      token: {
        url: "https://graph.facebook.com/v18.0/oauth/access_token"
      },
      userinfo: {
        url: "https://graph.facebook.com/me?fields=id,name,email,picture.width(250).height(250)"
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name || "Facebook User",
          email: profile.email || `${profile.id}@facebook.com`,
          image: profile.picture?.data?.url || null,
          emailVerified: new Date(),
          role: "CLERK" as const,
          isTwoFactorEnabled: false,
        };
      },
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(
            password,
            user.password,
          );

          if (passwordsMatch) return user;
        }

        return null;
      }
    })
  ],
} satisfies NextAuthConfig
