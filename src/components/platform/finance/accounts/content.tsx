"use client"

/**
 * Accounts Content - Stubbed Implementation
 *
 * TODO: This component requires:
 * 1. Prisma schema with ChartOfAccount, JournalEntry, LedgerEntry, FiscalYear models
 * 2. Tenant context with companyId instead of schoolId
 * 3. Permission system integration
 */

import {
  BarChart,
  BookOpen,
  Calendar,
  FileText,
  Lock,
  Settings,
} from "lucide-react"

import type { Locale } from "@/components/internationalization/config"
import {
  DashboardGrid,
  FeatureCard,
  StatsCard,
} from "../lib/dashboard-components"

interface Props {
  dictionary?: unknown
  lang: Locale
}

export default function AccountsContent({ lang }: Props) {
  // Stubbed stats - will be replaced with real data from Prisma
  const accountsCount = 0
  const journalEntriesCount = 0
  const ledgerEntriesCount = 0
  const fiscalYearsCount = 0
  const postedEntriesCount = 0
  const unpostedEntriesCount = 0

  // Permission flags - stub as true for now
  const canView = true
  const canCreate = true
  const canEdit = true
  const canApprove = true

  if (!canView) {
    return (
      <div>
        <p className="text-muted-foreground">
          You don&apos;t have permission to view accounting
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <DashboardGrid type="stats">
        <StatsCard
          title="Chart of Accounts"
          value={accountsCount}
          description="Configured accounts"
          icon={BookOpen}
        />
        <StatsCard
          title="Journal Entries"
          value={journalEntriesCount}
          description={`${postedEntriesCount} posted`}
          icon={FileText}
        />
        <StatsCard
          title="Ledger Entries"
          value={ledgerEntriesCount}
          description="Total transactions"
          icon={BarChart}
        />
        <StatsCard
          title="Unposted"
          value={unpostedEntriesCount}
          description="Requires posting"
          icon={Calendar}
        />
      </DashboardGrid>

      {/* Feature Cards Grid */}
      <DashboardGrid type="features">
        <FeatureCard
          title="Chart of Accounts"
          description="Define and manage account structure"
          icon={BookOpen}
          isPrimary
          primaryAction={{
            label: "View Chart",
            href: `/${lang}/finance/accounts/chart`,
            count: accountsCount,
          }}
          secondaryAction={
            canCreate
              ? {
                  label: "Add Account",
                  href: `/${lang}/finance/accounts/chart/new`,
                }
              : undefined
          }
        />
        <FeatureCard
          title="Journal Entries"
          description="Record financial transactions"
          icon={FileText}
          primaryAction={{
            label: "View Journal",
            href: `/${lang}/finance/accounts/journal`,
            count: journalEntriesCount,
          }}
          secondaryAction={
            canCreate
              ? {
                  label: "New Entry",
                  href: `/${lang}/finance/accounts/journal/new`,
                }
              : undefined
          }
        />
        <FeatureCard
          title="General Ledger"
          description="View account balances and activity"
          icon={BarChart}
          primaryAction={{
            label: "View Ledger",
            href: `/${lang}/finance/accounts/ledger`,
          }}
          secondaryAction={{
            label: "Account Balances",
            href: `/${lang}/finance/accounts/ledger/balances`,
          }}
        />
        {canEdit && (
          <FeatureCard
            title="Fiscal Years"
            description="Manage accounting periods"
            icon={Calendar}
            primaryAction={{
              label: "Fiscal Years",
              href: `/${lang}/finance/accounts/fiscal`,
              count: fiscalYearsCount,
            }}
            secondaryAction={
              canCreate
                ? {
                    label: "New Year",
                    href: `/${lang}/finance/accounts/fiscal/new`,
                  }
                : undefined
            }
          />
        )}
        {canApprove && (
          <FeatureCard
            title="Period Closing"
            description="Close accounting periods"
            icon={Lock}
            primaryAction={{
              label: "Close Period",
              href: `/${lang}/finance/accounts/closing`,
            }}
            secondaryAction={{
              label: "History",
              href: `/${lang}/finance/accounts/closing/history`,
            }}
          />
        )}
        {canEdit && (
          <FeatureCard
            title="Accounting Settings"
            description="Configure accounting rules"
            icon={Settings}
            primaryAction={{
              label: "Settings",
              href: `/${lang}/finance/accounts/settings`,
            }}
            secondaryAction={{
              label: "Posting Rules",
              href: `/${lang}/finance/accounts/settings/rules`,
            }}
          />
        )}
      </DashboardGrid>
    </div>
  )
}
