"use server";

import * as z from "zod";


import { sendPasswordResetEmail } from "@/components/auth/mail";
import { generatePasswordResetToken } from "@/components/auth/tokens";
import { checkAuthRateLimit } from "@/components/auth/rate-limit";
import { ResetSchema } from "../validation";
import { getUserByEmail } from "../user";

// Use the same generic copy regardless of whether the email is registered.
// Reveals nothing to an attacker; legitimate users who own the email find
// the message in their inbox, others see no response.
const RESET_GENERIC_SUCCESS =
  "If an account exists for that email, a reset link is on the way.";

// Permissive shape so the existing form (`form.tsx:51-52`) can keep doing
// `data?.error` / `data?.success` without narrowing.
type ResetResult = { error?: string; success?: string };

export const reset = async (
  values: z.infer<typeof ResetSchema>,
): Promise<ResetResult> => {
  const validatedFields = ResetSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid emaiL!" };
  }

  const { email } = validatedFields.data;

  // Per-email + per-IP rate limit. Returns a generic message on block.
  const rl = await checkAuthRateLimit("reset", email);
  if (rl.limited) return { error: rl.error };

  const existingUser = await getUserByEmail(email);

  // Don't echo "Email not found" — that's an enumeration oracle. Pretend the
  // request succeeded and return the same generic message either way.
  if (!existingUser) {
    return { success: RESET_GENERIC_SUCCESS };
  }

  const passwordResetToken = await generatePasswordResetToken(email);
  await sendPasswordResetEmail(
    passwordResetToken.email,
    passwordResetToken.token,
  );

  return { success: RESET_GENERIC_SUCCESS };
}