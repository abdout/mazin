'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { Icon } from '@iconify/react'
import type { Locale } from '@/components/internationalization'
import enDict from '@/components/internationalization/en.json'
import arDict from '@/components/internationalization/ar.json'
import {
  searchHsCodes,
  calculateDuty,
  type DutyCalculationResult,
} from '@/actions/duty-calculator'

/**
 * Real-data duty calculator. Replaces the older purely-frontend widget that
 * required the operator to type rates by hand. This version:
 *  - autocompletes HS codes against the seeded `HsCode` table (`searchHsCodes`)
 *  - rates auto-fill from the selected code (no manual `dutyRate`/`vatRate`)
 *  - delegates the math to `calculateDuty` server action so the formula
 *    (VAT base = CIF + customsDuty + exciseDuty) lives in exactly one place
 *  - shows live FX (USD→SDG) when an active `ExchangeRate` exists
 */

interface DutyCalculatorProps {
  locale: Locale
  exchangeRate: number | null
  exchangeRateDate: string | null
  labels: {
    title?: string
    hsCode?: string
    cifValue?: string
    customsDuty?: string
    vat?: string
    totalDuty?: string
    calculate?: string
    result?: string
    formula?: string
  }
}

interface HsHit {
  code: string
  description: string
  descriptionAr?: string | null
  rates: {
    customsDutyRate: number
    vatRate: number
    exciseRate: number
    developmentFee: number
  }
}

const DutyCalculator: React.FC<DutyCalculatorProps> = ({
  locale,
  exchangeRate,
  exchangeRateDate,
  labels,
}) => {
  const isArabic = locale === 'ar'
  const numberLocale = isArabic ? 'ar-SD' : 'en-US'
  const t = (isArabic ? arDict : enDict).project.duty
  const formatAmount = (value: number) =>
    value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })

  const [hsQuery, setHsQuery] = useState('')
  const [hsResults, setHsResults] = useState<HsHit[]>([])
  const [selectedHs, setSelectedHs] = useState<HsHit | null>(null)
  const [cifValue, setCifValue] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'SDG' | 'SAR'>('USD')
  const [result, setResult] = useState<DutyCalculationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSearching, startSearchTransition] = useTransition()
  const [isCalculating, startCalcTransition] = useTransition()

  // Debounced HS search.
  useEffect(() => {
    if (hsQuery.length < 2) {
      setHsResults([])
      return
    }
    const handle = setTimeout(() => {
      startSearchTransition(async () => {
        try {
          const hits = await searchHsCodes(hsQuery)
          setHsResults(hits as HsHit[])
        } catch {
          setHsResults([])
        }
      })
    }, 220)
    return () => clearTimeout(handle)
  }, [hsQuery])

  function pickHs(hit: HsHit) {
    setSelectedHs(hit)
    setHsQuery(hit.code)
    setHsResults([])
  }

  async function runCalc() {
    setError(null)
    if (!selectedHs) {
      setError(t.selectHsCode)
      return
    }
    const cif = parseFloat(cifValue)
    if (!cif || cif <= 0) {
      setError(t.cifMustBePositive)
      return
    }
    startCalcTransition(async () => {
      try {
        const out = await calculateDuty({ hsCode: selectedHs.code, cifValue: cif, currency })
        setResult(out)
      } catch (err) {
        setError(err instanceof Error ? err.message : t.calculationFailed)
      }
    })
  }

  const cifPlaceholder = t.cifInputPlaceholder
  const inputValuesLabel = t.inputValues
  const resultLabel = labels.result ?? t.calculationResult
  const totalDueLabel = t.totalDue
  const calculateLabel = labels.calculate ?? t.calculate
  const hsHelper = t.hsHelper

  const totalSDG = result && exchangeRate ? result.totalDuty * exchangeRate : 0

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{labels.title ?? t.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">{inputValuesLabel}</h2>

          <div className="space-y-4">
            <div className="relative">
              <label className="text-sm text-muted-foreground">
                {labels.hsCode ?? 'HS Code'}
              </label>
              <input
                type="text"
                value={hsQuery}
                onChange={(e) => {
                  setHsQuery(e.target.value)
                  setSelectedHs(null)
                }}
                placeholder={hsHelper}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                aria-busy={isSearching}
              />
              {hsResults.length > 0 && !selectedHs && (
                <ul className="absolute z-10 mt-1 w-full max-h-64 overflow-auto rounded-lg border bg-popover shadow">
                  {hsResults.map((hit) => (
                    <li
                      key={hit.code}
                      className="cursor-pointer px-3 py-2 hover:bg-accent"
                      onClick={() => pickHs(hit)}
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-mono text-sm">{hit.code}</span>
                        <span className="text-xs text-muted-foreground">
                          {hit.rates.customsDutyRate}% + {hit.rates.vatRate}% VAT
                        </span>
                      </div>
                      <div className="text-sm">
                        {isArabic ? hit.descriptionAr ?? hit.description : hit.description}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {selectedHs && (
                <div className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                  <div className="font-medium">{selectedHs.code}</div>
                  <div className="text-xs text-muted-foreground">
                    {isArabic
                      ? selectedHs.descriptionAr ?? selectedHs.description
                      : selectedHs.description}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">
                  {labels.cifValue ?? 'CIF Value'}
                </label>
                <input
                  type="number"
                  value={cifValue}
                  onChange={(e) => setCifValue(e.target.value)}
                  placeholder={cifPlaceholder}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{t.currency}</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'USD' | 'SDG' | 'SAR')}
                  className="w-full mt-1 px-3 py-2 border rounded-lg bg-background"
                >
                  <option value="USD">USD</option>
                  <option value="SDG">SDG</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={runCalc}
              disabled={isCalculating}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
            >
              <Icon icon="mdi:calculator" width={18} />
              {isCalculating ? t.calculating : calculateLabel}
            </button>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        </div>

        <div className="border rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">{resultLabel}</h2>

          {exchangeRate ? (
            <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <span className="text-blue-700 dark:text-blue-300">
                {t.exchangeRateLabel}: 1 USD = {formatAmount(exchangeRate)} SDG
              </span>
              {exchangeRateDate && (
                <span className="text-blue-500 dark:text-blue-400 text-xs block">
                  {new Intl.DateTimeFormat(numberLocale, { dateStyle: 'medium' }).format(
                    new Date(exchangeRateDate)
                  )}
                </span>
              )}
            </div>
          ) : null}

          {!result ? (
            <p className="text-sm text-muted-foreground">{t.pickToSee}</p>
          ) : (
            <div className="space-y-3">
              <Row
                label={labels.cifValue ?? 'CIF Value'}
                value={`${formatAmount(result.cifValue)} ${result.currency}`}
              />
              <Row
                label={`${labels.customsDuty ?? 'Customs Duty'} (${result.breakdown.customsDutyRate}%)`}
                value={formatAmount(result.customsDuty)}
              />
              {result.exciseDuty > 0 && (
                <Row
                  label={`${t.exciseLabel} (${result.breakdown.exciseRate}%)`}
                  value={formatAmount(result.exciseDuty)}
                />
              )}
              {result.developmentFee > 0 && (
                <Row
                  label={`${t.developmentFee} (${result.breakdown.developmentFeeRate}%)`}
                  value={formatAmount(result.developmentFee)}
                />
              )}
              <Row
                label={`${labels.vat ?? 'VAT'} (${result.breakdown.vatRate}%)`}
                value={formatAmount(result.vat)}
              />
              <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3 -mx-3">
                <span className="font-semibold">{labels.totalDuty ?? totalDueLabel}</span>
                <div className="text-end">
                  <span className="font-bold text-lg">
                    {formatAmount(result.totalDuty)} {result.currency}
                  </span>
                  {totalSDG > 0 && currency !== 'SDG' && (
                    <span className="block text-sm font-semibold text-primary">
                      ≈ {formatAmount(totalSDG)} SDG
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground pt-2">
                {t.effectiveRate}: {result.effectiveRate.toFixed(2)}%
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export default DutyCalculator
