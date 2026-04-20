import { db } from "@/lib/db";

// Get verification token by token string
export const getVerificationTokenByToken = async (token: string) => {
  try {
    const verificationToken = await db.verificationToken.findUnique({
      where: { token }
    });

    return verificationToken;
  } catch {
    return null;
  }
};

// Get verification token by email
export const getVerificationTokenByEmail = async (email: string) => {
  try {
    const verificationToken = await db.verificationToken.findFirst({
      where: { email }
    });

    return verificationToken;
  } catch {
    return null;
  }
}
