"use client"

/**
 * Total Balance Box - Stubbed Implementation
 */

interface TotalBalanceBoxProps {
  accounts: unknown[]
  totalBanks: number
  totalCurrentBalance: number
  dictionary?: Record<string, string>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount)
}

export function TotalBalanceBox({
  accounts = [],
  totalBanks,
  totalCurrentBalance,
  dictionary,
}: TotalBalanceBoxProps) {
  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-muted-foreground font-medium">
            {dictionary?.totalBalance || "Total Balance"}
          </p>
          <h2 className="text-3xl font-bold">
            {formatCurrency(totalCurrentBalance)}
          </h2>
          <p className="text-muted-foreground text-sm">
            {totalBanks} {totalBanks === 1 ? "Bank Account" : "Bank Accounts"}
          </p>
        </div>

        {accounts.length > 0 && (
          <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary/20">
            <span className="text-2xl font-bold text-primary">{accounts.length}</span>
          </div>
        )}
      </div>
    </div>
  )
}
