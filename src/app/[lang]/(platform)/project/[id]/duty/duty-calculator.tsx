'use client'

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import type { Locale } from '@/components/internationalization'

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

const DutyCalculator: React.FC<DutyCalculatorProps> = ({ locale, exchangeRate, exchangeRateDate, labels }) => {
  const [cifValue, setCifValue] = useState('')
  const [dutyRate, setDutyRate] = useState('5')
  const [vatRate, setVatRate] = useState('17')

  const cif = parseFloat(cifValue) || 0
  const duty = cif * (parseFloat(dutyRate) / 100)
  const vat = (cif + duty) * (parseFloat(vatRate) / 100)
  const total = duty + vat

  const rate = exchangeRate ?? 0
  const cifSDG = cif * rate
  const dutySDG = duty * rate
  const vatSDG = vat * rate
  const totalSDG = total * rate

  const numberLocale = locale === 'ar' ? 'ar-SD' : 'en-US'
  const formatAmount = (value: number) =>
    value.toLocaleString(numberLocale, { minimumFractionDigits: 2 })

  const isArabic = locale === 'ar'
  const cifValueLabel = labels.cifValue ?? 'CIF Value (USD)'
  const dutyRateLabel = isArabic ? 'معدل الرسوم (%)' : 'Duty Rate (%)'
  const vatRateLabel = isArabic ? 'معدل ضريبة القيمة المضافة (%)' : 'VAT Rate (%)'
  const inputValuesLabel = isArabic ? 'قيم الإدخال' : 'Input Values'
  const resultLabel = labels.result ?? (isArabic ? 'نتيجة الحساب' : 'Calculation Result')
  const totalDueLabel = isArabic ? 'المجموع المستحق' : 'Total Due'
  const cifPlaceholder = isArabic ? 'أدخل قيمة CIF' : 'Enter CIF value'
  const hsCodePlaceholder = 'e.g., 8471.30'
  const calculateLabel = labels.calculate ?? (isArabic ? 'احسب' : 'Calculate')
  const formulaLabel =
    labels.formula ??
    (isArabic
      ? 'إجمالي الرسوم = CIF × معدل الرسوم | ضريبة = (CIF + الرسوم) × معدل الضريبة | المجموع = الرسوم + الضريبة'
      : 'Total Duty = CIF × Duty Rate | VAT = (CIF + Duty) × VAT Rate | Total = Duty + VAT')

  // Mention calculateLabel to keep accessible for future use / prevent unused var warnings
  void calculateLabel

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{labels.title ?? 'Duty Calculator'}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isArabic
            ? 'احسب الرسوم الجمركية وضريبة القيمة المضافة لهذه الشحنة'
            : 'Calculate customs duties and VAT for this shipment'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">{inputValuesLabel}</h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">{cifValueLabel}</label>
              <input
                type="number"
                value={cifValue}
                onChange={(e) => setCifValue(e.target.value)}
                placeholder={cifPlaceholder}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">{labels.hsCode ?? 'HS Code'}</label>
              <input
                type="text"
                placeholder={hsCodePlaceholder}
                className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">{dutyRateLabel}</label>
                <input
                  type="number"
                  value={dutyRate}
                  onChange={(e) => setDutyRate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">{vatRateLabel}</label>
                <input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">{resultLabel}</h2>

          {exchangeRate ? (
            <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <span className="text-blue-700 dark:text-blue-300">
                {isArabic ? 'سعر الصرف' : 'Exchange Rate'}: 1 USD = {formatAmount(exchangeRate)} SDG
              </span>
              {exchangeRateDate && (
                <span className="text-blue-500 dark:text-blue-400 text-xs block">
                  {new Intl.DateTimeFormat(numberLocale, { dateStyle: 'medium' }).format(new Date(exchangeRateDate))}
                </span>
              )}
            </div>
          ) : null}

          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">{cifValueLabel}</span>
              <div className="text-end">
                <span className="font-medium">${formatAmount(cif)}</span>
                {rate > 0 && cif > 0 && (
                  <span className="block text-xs text-muted-foreground">{formatAmount(cifSDG)} SDG</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">
                {(labels.customsDuty ?? 'Customs Duty')} ({dutyRate}%)
              </span>
              <div className="text-end">
                <span className="font-medium">${formatAmount(duty)}</span>
                {rate > 0 && duty > 0 && (
                  <span className="block text-xs text-muted-foreground">{formatAmount(dutySDG)} SDG</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-muted-foreground">
                {(labels.vat ?? 'VAT')} ({vatRate}%)
              </span>
              <div className="text-end">
                <span className="font-medium">${formatAmount(vat)}</span>
                {rate > 0 && vat > 0 && (
                  <span className="block text-xs text-muted-foreground">{formatAmount(vatSDG)} SDG</span>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center py-3 bg-muted/50 rounded-lg px-3 -mx-3">
              <span className="font-semibold">
                {labels.totalDuty ?? totalDueLabel}
              </span>
              <div className="text-end">
                <span className="font-bold text-lg">${formatAmount(total)}</span>
                {rate > 0 && total > 0 && (
                  <span className="block text-sm font-semibold text-primary">{formatAmount(totalSDG)} SDG</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-muted/30 border rounded-xl">
        <div className="flex gap-3">
          <Icon icon="mdi:calculator" width={20} className="text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">
              {isArabic ? 'صيغة الحساب' : 'Calculation Formula'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">{formulaLabel}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DutyCalculator
