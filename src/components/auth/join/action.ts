"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";

import { sendVerificationEmail } from "@/components/auth/mail";
import { generateVerificationToken } from "@/components/auth/tokens";
import { checkAuthRateLimit } from "@/components/auth/rate-limit";
import { RegisterSchema } from "../validation";
import { getUserByEmail } from "../user";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name } = validatedFields.data;

  // Per-IP rate limit — prevents signup floods filling the DB. We pass `null`
  // for the email axis because a fresh registration shouldn't punish unrelated
  // users who happen to share an email guess.
  const rl = await checkAuthRateLimit("register", null);
  if (rl.limited) return { error: rl.error };
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  // Public signup = COMMUNITY user (marketplace). Staff are created via invite only.
  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      type: "COMMUNITY",
      role: "VIEWER",
    },
  });

  const verificationToken = await generateVerificationToken(email);
  await sendVerificationEmail(
    verificationToken.email,
    verificationToken.token,
  );

  return { success: "Confirmation email sent!" };
};
