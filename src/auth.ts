import { cache } from "react"
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { getUserById } from "@/components/auth/user"
import { getTwoFactorConfirmationByUserId } from "@/components/auth/verification/2f-confirmation"
import { getAccountByUserId } from "@/components/auth/account"
import { db } from "@/lib/db"
import authConfig from "@/auth.config"
import type { UserRole } from "@prisma/client"

// Force Node.js runtime for auth operations
export const runtime = 'nodejs'

// Helper to ensure we have a valid URL
function getBaseUrl() {
  try {
    if (process.env.NEXTAUTH_URL) {
      const url = process.env.NEXTAUTH_URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return `https://${url}`
      }
      return url
    }

    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`
    }

    return 'https://localhost:3000'
  } catch {
    return 'https://localhost:3000'
  }
}

const nextAuth = NextAuth({
  pages: {
    signIn: "/login",
    error: "/error",
  },
  events: {
    async linkAccount({ user }) {
      const existingUser = await db.user.findUnique({
        where: { id: user.id }
      });

      if (existingUser && !existingUser.emailVerified) {
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() }
        })
      }
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers (Google, Facebook, etc.)
      if (account?.provider !== "credentials") {
        if (user.email && account) {
          const existingUser = await db.user.findUnique({
            where: { email: user.email }
          });

          if (existingUser) {
            const existingAccount = await db.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                }
              }
            });

            if (!existingAccount) {
              await db.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state?.toString(),
                }
              });
            }

            if (!existingUser.emailVerified) {
              await db.user.update({
                where: { id: existingUser.id },
                data: { emailVerified: new Date() }
              });
            }
          }
        }

        return true;
      }

      // For credentials provider
      const existingUser = await getUserById(user.id!);

      // Prevent sign in without email verification
      if (!existingUser?.emailVerified) return false;

      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id);

        if (!twoFactorConfirmation) return false;

        // Delete two factor confirmation for next sign in
        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id }
        });
      }

      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
        session.user.name = token.name as string | null | undefined;
        session.user.email = token.email!;
        session.user.isOAuth = token.isOAuth as boolean;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const existingUser = await getUserById(token.sub);

      if (!existingUser) return token;

      const existingAccount = await getAccountByUserId(existingUser.id);

      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;

      return token;
    }
  },
  adapter: PrismaAdapter(db) as never,
  session: { strategy: "jwt" },
  ...authConfig,
  useSecureCookies: process.env.NODE_ENV === "production",
  trustHost: true,
})

const { handlers, auth: uncachedAuth, signIn, signOut } = nextAuth
export const auth = cache(uncachedAuth)
export { handlers, signIn, signOut }
export const { GET, POST } = handlers
