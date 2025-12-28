/**
 * Banking Dashboard Header - Stubbed
 */

import type { DashboardHeaderProps } from "../types"

interface StatCardProps {
  label: string
  value: string | number | React.ReactNode
  className?: string
}

function StatCard({ label, value, className }: StatCardProps) {
  return (
    <div className="bg-card rounded-lg border p-6">
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <p className={`text-2xl font-bold ${className || ""}`}>{value}</p>
    </div>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function DashboardHeader({
  user,
  totalBanks,
  totalCurrentBalance,
  dictionary,
}: DashboardHeaderProps) {
  return (
    <header className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {dictionary?.welcome || "Welcome back"}, {user?.name || "Guest"}
        </h1>
        <p className="text-muted-foreground">
          {dictionary?.subtitle ||
            "Access and manage your account and transactions efficiently."}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={dictionary?.totalBalance || "Total Balance"}
          value={formatCurrency(totalCurrentBalance)}
        />

        <StatCard
          label={dictionary?.connectedBanks || "Connected Banks"}
          value={totalBanks}
        />

        <StatCard
          label={dictionary?.activeAccounts || "Active Accounts"}
          value={0}
        />

        <StatCard
          label={dictionary?.accountStatus || "Account Status"}
          value={dictionary?.statusActive || "Active"}
          className="text-green-600"
        />
      </div>
    </header>
  )
}
