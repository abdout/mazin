"use client"

import Link from "next/link"
import { format } from "date-fns"
import { ArrowDownLeft, ArrowUpRight, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { RecentTransaction } from "./actions"
import type { Locale } from "@/components/internationalization"

interface TransactionListProps {
  transactions: RecentTransaction[]
  locale: Locale
  className?: string
}

export function TransactionList({
  transactions,
  locale,
  className,
}: TransactionListProps) {
  const getIcon = (type: RecentTransaction["type"]) => {
    switch (type) {
      case "income":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case "expense":
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      case "transfer":
        return <ArrowRight className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadge = (status: RecentTransaction["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="outline" className="text-green-600 border-green-200">
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-200">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="outline" className="text-red-600 border-red-200">
            Failed
          </Badge>
        )
    }
  }

  const formatAmount = (amount: number, type: RecentTransaction["type"]) => {
    const formatted = new Intl.NumberFormat("en-SD", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

    const colorClass = type === "income" ? "text-green-600" : "text-red-600"
    const prefix = type === "income" ? "+" : "-"

    return (
      <span className={cn("font-semibold", colorClass)}>
        {prefix}SDG {formatted}
      </span>
    )
  }

  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No transactions found
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Transactions</CardTitle>
          <Link href={`/${locale}/finance/transactions`}>
            <Button variant="ghost" size="sm" className="h-8 text-xs">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="space-y-1 px-4 pb-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-muted rounded-full p-2">
                    {getIcon(transaction.type)}
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm leading-none font-medium truncate max-w-[180px]">
                      {transaction.description}
                    </p>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <span>
                        {format(new Date(transaction.date), "MMM d, yyyy")}
                      </span>
                      {transaction.category && (
                        <>
                          <span>•</span>
                          <span>{transaction.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {formatAmount(transaction.amount, transaction.type)}
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 border-t px-4 py-3 text-center">
          <div>
            <p className="text-muted-foreground text-xs">Income</p>
            <p className="text-sm font-semibold text-green-600">
              SDG{" "}
              {new Intl.NumberFormat("en-SD").format(
                transactions
                  .filter(
                    (t) => t.type === "income" && t.status === "completed"
                  )
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Expenses</p>
            <p className="text-sm font-semibold text-red-600">
              SDG{" "}
              {new Intl.NumberFormat("en-SD").format(
                transactions
                  .filter(
                    (t) => t.type === "expense" && t.status === "completed"
                  )
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Pending</p>
            <p className="text-sm font-semibold text-yellow-600">
              {transactions.filter((t) => t.status === "pending").length}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
