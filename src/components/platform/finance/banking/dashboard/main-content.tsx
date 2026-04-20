import { AccountTabs } from "./account-tabs"
import { RecentTransactionsList } from "./recent-transactions"
import type { Dictionary } from "@/components/internationalization/types"
import type { BankAccountWithTransactions, Transaction } from "@/components/platform/finance/banking/types/bank.types"

interface DashboardMainContentProps {
  accounts: BankAccountWithTransactions[]
  transactions: Transaction[]
  accountId: string
  currentPage: number
  dictionary: Dictionary
}

export function DashboardMainContent({
  accounts,
  transactions,
  accountId,
  currentPage,
  dictionary,
}: DashboardMainContentProps) {
  return (
    <div className="mt-8 space-y-6">
      <AccountTabs
        accounts={accounts}
        currentAccountId={accountId}
        dictionary={dictionary}
      />

      <div className="bg-card rounded-lg border">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">
            {dictionary?.finance?.recentTransactions}
          </h2>
        </div>
        <div className="p-6">
          <RecentTransactionsList
            transactions={transactions}
            currentPage={currentPage}
            dictionary={dictionary}
          />
        </div>
      </div>
    </div>
  )
}
