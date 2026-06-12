"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";


import { db } from "@/lib/db";
import { checkAuthRateLimit } from "@/components/auth/rate-limit";
import { NewPasswordSchema } from "../validation";
import { getPasswordResetTokenByToken } from "./token";
import { getUserByEmail } from "../user";

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema> ,
  token?: string | null,
) => {
  if (!token) {
    return { error: "Missing token!" };
  }

  const validatedFields = NewPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { password } = validatedFields.data;

  // Per-IP rate limit. The email isn't known until the token is resolved, so
  // we throttle by IP only at this stage.
  const rl = await checkAuthRateLimit("new-password", null);
  if (rl.limited) return { error: rl.error };

  const existingToken = await getPasswordResetTokenByToken(token);

  if (!existingToken) {
    return { error: "Invalid token!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return { error: "Email does not exist!" }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  });

  await db.passwordResetToken.delete({
    where: { id: existingToken.id }
  });

  return { success: "Password updated!" };
};
