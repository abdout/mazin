"use server";

import { db } from "@/lib/db";
import { getVerificationTokenByToken } from "./verificiation-token";
import { getUserByEmail } from "../user";


export const newVerification = async (token: string) => {
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    const existingUser = await getUserByEmail(token);
    if (existingUser && existingUser.emailVerified) {
      return { success: "Email already verified!" };
    } else {
      return { error: "Token does not exist!" };
    }
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  if (existingUser.emailVerified) {
    return { success: "Email verified!" };
  }

  await db.user.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.email,
    }
  });

  // Delete verification token after use (no dangling setTimeout)
  try {
    await db.verificationToken.delete({
      where: { id: existingToken.id }
    });
  } catch {
    // Token may already be deleted; safe to ignore
  }

  return { success: "Email verified!" };
};