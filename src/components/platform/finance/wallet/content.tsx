"use client"

/**
 * Wallet Content - Stubbed Implementation
 */

import {
  CircleArrowDown,
  CircleArrowUp,
  DollarSign,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"

import type { Locale } from "@/components/internationalization/config"

import {
  DashboardGrid,
  FeatureCard,
  formatCurrency,
  StatsCard,
} from "../lib/dashboard-components"

interface Props {
  dictionary?: unknown
  lang: Locale
}

export default function WalletContent({ lang }: Props) {
  const isRTL = lang === "ar"

  // Stub data
  const walletsCount = 0
  const transactionsCount = 0
  const totalBalance = 0
  const totalTopups = 0

  return (
    <div className="space-y-6">
      <DashboardGrid type="stats">
        <StatsCard
          title={isRTL ? "إجمالي الرصيد" : "Total Balance"}
          value={formatCurrency(totalBalance)}
          description={isRTL ? "عبر جميع المحافظ" : "Across all wallets"}
          icon={DollarSign}
        />
        <StatsCard
          title={isRTL ? "المحافظ النشطة" : "Active Wallets"}
          value={walletsCount}
          description={isRTL ? "محافظ الشركة والعملاء" : "Company & client wallets"}
          icon={Wallet}
        />
        <StatsCard
          title={isRTL ? "المعاملات" : "Transactions"}
          value={transactionsCount}
          description={isRTL ? "جميع المعاملات" : "All time transactions"}
          icon={TrendingUp}
        />
        <StatsCard
          title={isRTL ? "إجمالي الإيداعات" : "Total Top-ups"}
          value={formatCurrency(totalTopups)}
          description={isRTL ? "الإيداعات مدى الحياة" : "Lifetime top-ups"}
          icon={CircleArrowUp}
        />
      </DashboardGrid>

      <DashboardGrid type="features">
        <FeatureCard
          title={isRTL ? "جميع المحافظ" : "All Wallets"}
          description={isRTL ? "عرض وإدارة جميع حسابات المحافظ" : "View and manage all wallet accounts"}
          icon={Wallet}
          isPrimary
          primaryAction={{
            label: isRTL ? "عرض المحافظ" : "View Wallets",
            href: `/${lang}/finance/wallet/all`,
            count: walletsCount,
          }}
          secondaryAction={{
            label: isRTL ? "إنشاء محفظة" : "Create Wallet",
            href: `/${lang}/finance/wallet/new`,
          }}
        />
        <FeatureCard
          title={isRTL ? "شحن المحفظة" : "Top-up Wallet"}
          description={isRTL ? "إضافة رصيد إلى محافظ العملاء أو الشركة" : "Add funds to client or company wallets"}
          icon={CircleArrowUp}
          primaryAction={{
            label: isRTL ? "شحن" : "Top-up",
            href: `/${lang}/finance/wallet/topup`,
          }}
          secondaryAction={{
            label: isRTL ? "شحن جماعي" : "Bulk Top-up",
            href: `/${lang}/finance/wallet/topup/bulk`,
          }}
        />
        <FeatureCard
          title={isRTL ? "المعاملات" : "Transactions"}
          description={isRTL ? "عرض سجل معاملات المحفظة" : "View wallet transaction history"}
          icon={TrendingUp}
          primaryAction={{
            label: isRTL ? "عرض المعاملات" : "View Transactions",
            href: `/${lang}/finance/wallet/transactions`,
          }}
          secondaryAction={{
            label: isRTL ? "تصدير" : "Export",
            href: `/${lang}/finance/wallet/transactions/export`,
          }}
        />
        <FeatureCard
          title={isRTL ? "المبالغ المستردة" : "Refunds"}
          description={isRTL ? "معالجة المبالغ المستردة والتعديلات" : "Process wallet refunds and adjustments"}
          icon={CircleArrowDown}
          primaryAction={{
            label: isRTL ? "معالجة الاسترداد" : "Process Refund",
            href: `/${lang}/finance/wallet/refund`,
          }}
          secondaryAction={{
            label: isRTL ? "سجل الاسترداد" : "Refund History",
            href: `/${lang}/finance/wallet/refund/history`,
          }}
        />
        <FeatureCard
          title={isRTL ? "محافظ العملاء" : "Client Wallets"}
          description={isRTL ? "إدارة حسابات محافظ العملاء" : "Manage client wallet accounts"}
          icon={Users}
          primaryAction={{
            label: isRTL ? "عرض محافظ العملاء" : "View Client Wallets",
            href: `/${lang}/finance/wallet/clients`,
          }}
          secondaryAction={{
            label: isRTL ? "كشوف الحساب" : "Statements",
            href: `/${lang}/finance/wallet/clients/statements`,
          }}
        />
        <FeatureCard
          title={isRTL ? "تقارير المحفظة" : "Wallet Reports"}
          description={isRTL ? "إنشاء تقارير الرصيد والمعاملات" : "Generate balance and transaction reports"}
          icon={DollarSign}
          primaryAction={{
            label: isRTL ? "عرض التقارير" : "View Reports",
            href: `/${lang}/finance/wallet/reports`,
          }}
          secondaryAction={{
            label: isRTL ? "ميزان المراجعة" : "Balance Sheet",
            href: `/${lang}/finance/wallet/reports/balance`,
          }}
        />
      </DashboardGrid>
    </div>
  )
}
