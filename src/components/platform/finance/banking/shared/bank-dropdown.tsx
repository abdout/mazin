"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatAmount } from "@/components/platform/finance/banking/lib/utils"

interface BankDropdownAccount {
  id: string
  name: string
  currentBalance: number | string
}

interface BankDropdownProps {
  accounts: BankDropdownAccount[]
  selectedAccount: string
  onSelectAccount: (accountId: string) => void
  dictionary?: Record<string, unknown>
}

export function BankDropdown({
  accounts,
  selectedAccount,
  onSelectAccount,
  dictionary,
}: BankDropdownProps) {
  return (
    <Select value={selectedAccount} onValueChange={onSelectAccount}>
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={dictionary?.selectAccount as string | undefined}
        />
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <div className="flex w-full items-center justify-between">
              <span>{account.name}</span>
              <span className="text-muted-foreground ms-2 text-sm">
                {formatAmount(Number(account.currentBalance))}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
