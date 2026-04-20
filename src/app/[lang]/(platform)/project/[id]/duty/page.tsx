import React from 'react'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization'
import { getActiveExchangeRate } from '@/actions/exchange-rate'
import DutyCalculator from './duty-calculator'

interface PageProps {
  params: Promise<{ id: string; lang: string }>
}

export default async function ProjectDuty({ params }: PageProps) {
  const { lang } = await params
  const locale = lang as Locale
  const [dict, exchangeRate] = await Promise.all([
    getDictionary(locale),
    getActiveExchangeRate('USD', 'SDG'),
  ])
  const duty = dict.project?.duty

  return (
    <DutyCalculator
      locale={locale}
      exchangeRate={exchangeRate?.rate ?? null}
      exchangeRateDate={exchangeRate?.effectiveDate?.toISOString() ?? null}
      labels={{
        title: duty?.title,
        hsCode: duty?.hsCode,
        cifValue: duty?.cifValue,
        customsDuty: duty?.customsDuty,
        vat: duty?.vat,
        totalDuty: duty?.totalDuty,
        calculate: duty?.calculate,
        result: duty?.result,
        formula: duty?.formula,
      }}
    />
  )
}
