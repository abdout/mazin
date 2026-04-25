// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use server"

import { revalidatePath } from "next/cache"

import { auth } from "@/auth"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

import type { ActionResult } from "./types"
import {
  createWalletSchema,
  depositSchema,
  drawdownSchema,
} from "./validation"

const log = logger.forModule("wallet")

function fail(error: string, issues?: Record<string, string[]>): ActionResult<never> {
  return { ok: false, error, ...(issues ? { issues } : {}) }
}

/**
 * Idempotently get-or-create a wallet for a client owned by the caller.
 * Safe to call from an invoice-approval flow before drawdown.
 */
export async function getOrCreateWallet(
  raw: unknown
): Promise<ActionResult<{ id: string; balance: number; currency: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return fail("UNAUTHENTICATED")
    const userId = session.user.id

    const parsed = createWalletSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(
        "INVALID_INPUT",
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      )
    }
    const input = parsed.data

    // Ownership: the caller must own the target client.
    const client = await db.client.findFirst({
      where: { id: input.clientId, userId },
      select: { id: true },
    })
    if (!client) return fail("CLIENT_NOT_FOUND")

    // clientId is @unique on Wallet → upsert is the atomic create-or-return.
    const wallet = await db.wallet.upsert({
      where: { clientId: input.clientId },
      create: {
        clientId: input.clientId,
        currency: input.currency,
        creditLimit: input.creditLimit,
      },
      update: {},
      select: { id: true, balance: true, currency: true },
    })

    revalidatePath("/finance/wallet")
    return {
      ok: true,
      data: {
        id: wallet.id,
        balance: Number(wallet.balance),
        currency: wallet.currency,
      },
    }
  } catch (err) {
    log.error("Failed to get/create wallet", err as Error)
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}

/**
 * Record a client deposit. Balance update + ledger entry are wrapped in a
 * transaction so a partially-applied deposit cannot leave the balance and
 * the ledger out of sync.
 */
export async function depositToWallet(
  raw: unknown
): Promise<ActionResult<{ transactionId: string; balance: number }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return fail("UNAUTHENTICATED")
    const userId = session.user.id

    const parsed = depositSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(
        "INVALID_INPUT",
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      )
    }
    const input = parsed.data

    const result = await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.findFirst({
        where: { id: input.walletId, client: { userId } },
        select: { id: true, balance: true, status: true },
      })
      if (!wallet) return { ok: false as const, error: "WALLET_NOT_FOUND" }
      if (wallet.status !== "ACTIVE") {
        return { ok: false as const, error: "WALLET_NOT_ACTIVE" }
      }

      const newBalance = Number(wallet.balance) + input.amount
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      })
      const entry = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEPOSIT",
          amount: input.amount,
          balanceAfter: newBalance,
          description: input.notes?.trim() || "Client deposit",
          reference: input.reference?.trim() || null,
        },
      })

      return {
        ok: true as const,
        transactionId: entry.id,
        balance: Number(updated.balance),
      }
    })

    if (!result.ok) return fail(result.error)

    revalidatePath("/finance/wallet")
    return {
      ok: true,
      data: { transactionId: result.transactionId, balance: result.balance },
    }
  } catch (err) {
    log.error("Failed to deposit to wallet", err as Error)
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}

/**
 * Debit a wallet (withdrawal, invoice payment, duty payment, etc.).
 * Stored amount is positive in the ledger; the wallet's running balance is
 * decremented. We refuse to go below zero unless credit limit allows it.
 */
export async function drawdownFromWallet(
  raw: unknown
): Promise<ActionResult<{ transactionId: string; balance: number }>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return fail("UNAUTHENTICATED")
    const userId = session.user.id

    const parsed = drawdownSchema.safeParse(raw)
    if (!parsed.success) {
      return fail(
        "INVALID_INPUT",
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      )
    }
    const input = parsed.data

    const result = await db.$transaction(async (tx) => {
      const wallet = await tx.wallet.findFirst({
        where: { id: input.walletId, client: { userId } },
        select: { id: true, balance: true, creditLimit: true, status: true },
      })
      if (!wallet) return { ok: false as const, error: "WALLET_NOT_FOUND" }
      if (wallet.status !== "ACTIVE") {
        return { ok: false as const, error: "WALLET_NOT_ACTIVE" }
      }

      const currentBalance = Number(wallet.balance)
      const creditLimit = Number(wallet.creditLimit)
      const newBalance = currentBalance - input.amount
      if (newBalance < -creditLimit) {
        return { ok: false as const, error: "INSUFFICIENT_BALANCE" }
      }

      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      })
      const entry = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: input.type,
          amount: -input.amount, // ledger stores signed amount
          balanceAfter: newBalance,
          description:
            input.notes?.trim() ||
            (input.type === "INVOICE_PAYMENT"
              ? "Invoice payment"
              : input.type === "DUTY_PAYMENT"
                ? "Customs duty payment"
                : "Withdrawal"),
          reference: input.reference?.trim() || null,
          invoiceId: input.invoiceId ?? null,
          shipmentId: input.shipmentId ?? null,
        },
      })

      return {
        ok: true as const,
        transactionId: entry.id,
        balance: Number(updated.balance),
      }
    })

    if (!result.ok) return fail(result.error)

    revalidatePath("/finance/wallet")
    if (input.invoiceId) revalidatePath(`/invoice/${input.invoiceId}`)
    return {
      ok: true,
      data: { transactionId: result.transactionId, balance: result.balance },
    }
  } catch (err) {
    log.error("Failed to drawdown wallet", err as Error)
    return fail(err instanceof Error ? err.message : "UNKNOWN_ERROR")
  }
}
