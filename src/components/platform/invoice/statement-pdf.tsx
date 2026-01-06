"use client"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer"
import type { StatementOfAccount, StatementEntry, Client } from "@prisma/client"
import type { Locale } from "@/components/internationalization"
import { numberToArabicWords, formatArabicNumerals } from "@/lib/utils/arabic-numbers"

// Register fonts for Arabic support
Font.register({
  family: "Rubik",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-B4iFU0U1Z4Y.ttf",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/rubik/v28/iJWZBXyIfDnIV5PNhY1KTN7Z-Yh-NYiFU0U1Z4Y.ttf",
      fontWeight: 700,
    },
  ],
})

// =============================================================================
// TYPES
// =============================================================================

type StatementWithRelations = StatementOfAccount & {
  entries: StatementEntry[]
  client: Client
}

interface CompanySettings {
  companyName: string
  companyNameAr?: string | null
  email?: string | null
  phone?: string | null
  address1?: string | null
  city?: string | null
  country?: string | null
  logoUrl?: string | null
  signatureUrl?: string | null
  stampUrl?: string | null
  licenseNumber?: string | null
  taxId?: string | null
}

interface StatementPdfProps {
  statement: StatementWithRelations
  locale: Locale
  settings?: CompanySettings
}

// =============================================================================
// COLORS
// =============================================================================

const colors = {
  primary: "#1a365d",
  secondary: "#4a5568",
  border: "#000000",
  headerBg: "#f0f0f0",
  white: "#ffffff",
  debit: "#dc2626", // Red for debit
  credit: "#16a34a", // Green for credit
}

// =============================================================================
// STYLES - Matching كشف حساب Format
// =============================================================================

const styles = StyleSheet.create({
  page: {
    fontFamily: "Rubik",
    fontSize: 10,
    padding: 30,
    backgroundColor: colors.white,
  },

  // Header Section
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.primary,
    marginBottom: 2,
  },
  companyNameAr: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.primary,
    textAlign: "right",
    marginBottom: 2,
  },
  companyDetail: {
    fontSize: 8,
    color: colors.secondary,
    marginBottom: 1,
  },

  // Title Section
  titleSection: {
    textAlign: "center",
    marginBottom: 15,
    padding: 12,
    backgroundColor: colors.primary,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.white,
  },
  titleSubtext: {
    fontSize: 10,
    color: colors.white,
    marginTop: 4,
  },

  // Client Info Section
  clientInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 10,
    backgroundColor: colors.headerBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientInfoLeft: {
    flex: 1,
  },
  clientInfoRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  clientInfoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  clientInfoLabel: {
    fontSize: 9,
    fontWeight: 700,
    width: 100,
  },
  clientInfoValue: {
    fontSize: 9,
    flex: 1,
  },
  clientInfoLabelAr: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: "right",
    width: 80,
  },
  clientInfoValueAr: {
    fontSize: 9,
    textAlign: "right",
    flex: 1,
  },

  // Statement Table
  table: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 700,
    padding: 8,
    textAlign: "center",
    color: colors.white,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    fontSize: 9,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  tableCellLast: {
    borderRightWidth: 0,
  },

  // Column widths
  dateCol: { width: "12%" },
  refCol: { width: "15%" },
  descCol: { width: "33%" },
  debitCol: { width: "13%", textAlign: "right" },
  creditCol: { width: "13%", textAlign: "right" },
  balanceCol: { width: "14%", textAlign: "right" },

  // Totals
  totalsRow: {
    flexDirection: "row",
    backgroundColor: colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalsLabel: {
    fontSize: 10,
    fontWeight: 700,
    padding: 8,
    width: "60%",
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  totalsValue: {
    fontSize: 10,
    fontWeight: 700,
    padding: 8,
    textAlign: "right",
  },

  // Closing Balance
  closingBalanceRow: {
    flexDirection: "row",
    backgroundColor: colors.primary,
  },
  closingBalanceLabel: {
    fontSize: 11,
    fontWeight: 700,
    padding: 10,
    color: colors.white,
    width: "60%",
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: colors.white,
  },
  closingBalanceValue: {
    fontSize: 11,
    fontWeight: 700,
    padding: 10,
    color: colors.white,
    width: "40%",
    textAlign: "right",
  },

  // Amount in Words
  amountInWords: {
    marginTop: 15,
    padding: 10,
    backgroundColor: colors.headerBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountInWordsLabel: {
    fontSize: 9,
    fontWeight: 700,
    marginBottom: 3,
    textAlign: "right",
  },
  amountInWordsText: {
    fontSize: 10,
    textAlign: "right",
    lineHeight: 1.4,
  },

  // Signature Section
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingTop: 20,
  },
  signatureBox: {
    width: "40%",
    textAlign: "center",
  },
  signatureTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 5,
  },
  signatureTitleAr: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 5,
    textAlign: "right",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: 40,
    paddingTop: 5,
  },
  signatureImage: {
    width: 80,
    height: 40,
    objectFit: "contain",
    alignSelf: "center",
  },
  stampImage: {
    width: 60,
    height: 60,
    objectFit: "contain",
    position: "absolute",
    right: 10,
    bottom: 10,
    opacity: 0.8,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 8,
    color: colors.secondary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
})

// =============================================================================
// TRANSLATIONS
// =============================================================================

const translations = {
  en: {
    statementOfAccount: "Statement of Account",
    accountDetails: "Account details with supporting documents",
    client: "Client",
    period: "Period",
    from: "From",
    to: "To",
    statementNo: "Statement No",
    date: "Date",
    reference: "Reference",
    description: "Description",
    debit: "DR (Debit)",
    credit: "CT (Credit)",
    balance: "Balance",
    openingBalance: "Opening Balance",
    totalDebits: "Total Debits",
    totalCredits: "Total Credits",
    closingBalance: "Balance Due",
    amountInWords: "Amount in Words:",
    accountsManager: "Accounts Manager",
    generalManager: "General Manager",
  },
  ar: {
    statementOfAccount: "كشف حساب",
    accountDetails: "تفاصيل الحساب مع المستندات المؤيدة للصرف",
    client: "العميل",
    period: "الفترة",
    from: "من",
    to: "إلى",
    statementNo: "رقم الكشف",
    date: "التاريخ",
    reference: "المرجع",
    description: "البيــــان",
    debit: "منه DR",
    credit: "له CT",
    balance: "الرصيد",
    openingBalance: "رصيد سابق",
    totalDebits: "اجمالي المدين",
    totalCredits: "اجمالي الدائن",
    closingBalance: "الرصيد المطلوب منكم",
    amountInWords: "الجملة كتابة:",
    accountsManager: "اعتماد مدير الحسابات",
    generalManager: "اعتماد المدير العام",
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatCurrency(amount: number | string, locale: Locale): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount))
  if (isNaN(num) || num === 0) return "-"
  if (locale === "ar") {
    return formatArabicNumerals(num)
  }
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(date: Date | null | undefined, locale: Locale): string {
  if (!date) return "-"
  const d = new Date(date)
  if (locale === "ar") {
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function StatementPdf({
  statement,
  locale,
  settings,
}: StatementPdfProps) {
  const t = translations[locale]
  const isAr = locale === "ar"

  // Calculate values
  const openingBalance = Number(statement.openingBalance)
  const totalDebits = Number(statement.totalDebits)
  const totalCredits = Number(statement.totalCredits)
  const closingBalance = Number(statement.closingBalance)

  // Generate amount in words
  const amountInWords =
    statement.closingBalanceInWordsAr ||
    numberToArabicWords(Math.abs(closingBalance), statement.currency)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Company Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {settings?.logoUrl && (
              <Image src={settings.logoUrl} style={styles.logo} />
            )}
            <Text style={styles.companyName}>
              {settings?.companyName || "ABDOUT GROUP Co."}
            </Text>
            <Text style={styles.companyDetail}>
              {settings?.companyNameAr || "مازن محمد الأمين"}
            </Text>
            <Text style={styles.companyDetail}>
              {settings?.taxId || "300000981146"}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyNameAr}>
              {settings?.companyNameAr || "مجموعة عبدالله"}
            </Text>
          </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>{t.statementOfAccount}</Text>
          <Text style={styles.titleSubtext}>{t.accountDetails}</Text>
        </View>

        {/* Client Info Section */}
        <View style={styles.clientInfo}>
          <View style={styles.clientInfoLeft}>
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientInfoLabel}>{t.client}:</Text>
              <Text style={styles.clientInfoValue}>
                {statement.client.companyName}
              </Text>
            </View>
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientInfoLabel}>{t.statementNo}:</Text>
              <Text style={styles.clientInfoValue}>
                {statement.statementNumber}
              </Text>
            </View>
          </View>
          <View style={styles.clientInfoRight}>
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientInfoValueAr}>
                {formatDate(statement.periodStart, locale)} - {formatDate(statement.periodEnd, locale)}
              </Text>
              <Text style={styles.clientInfoLabelAr}>:{t.period}</Text>
            </View>
            <View style={styles.clientInfoRow}>
              <Text style={styles.clientInfoValueAr}>
                {formatDate(statement.createdAt, locale)}
              </Text>
              <Text style={styles.clientInfoLabelAr}>:{t.date}</Text>
            </View>
          </View>
        </View>

        {/* Statement Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.dateCol}>
              <Text style={styles.tableHeaderCell}>{t.date}</Text>
            </View>
            <View style={styles.refCol}>
              <Text style={styles.tableHeaderCell}>{t.reference}</Text>
            </View>
            <View style={styles.descCol}>
              <Text style={styles.tableHeaderCell}>{t.description}</Text>
            </View>
            <View style={styles.debitCol}>
              <Text style={styles.tableHeaderCell}>{t.debit}</Text>
            </View>
            <View style={styles.creditCol}>
              <Text style={styles.tableHeaderCell}>{t.credit}</Text>
            </View>
            <View style={styles.balanceCol}>
              <Text style={styles.tableHeaderCell}>{t.balance}</Text>
            </View>
          </View>

          {/* Opening Balance Row */}
          {openingBalance !== 0 && (
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.dateCol]}>
                <Text>{formatDate(statement.periodStart, locale)}</Text>
              </View>
              <View style={[styles.tableCell, styles.refCol]}>
                <Text>-</Text>
              </View>
              <View style={[styles.tableCell, styles.descCol]}>
                <Text>{t.openingBalance}</Text>
              </View>
              <View style={[styles.tableCell, styles.debitCol]}>
                <Text>{openingBalance > 0 ? formatCurrency(openingBalance, locale) : "-"}</Text>
              </View>
              <View style={[styles.tableCell, styles.creditCol]}>
                <Text>{openingBalance < 0 ? formatCurrency(Math.abs(openingBalance), locale) : "-"}</Text>
              </View>
              <View style={[styles.tableCell, styles.balanceCol, styles.tableCellLast]}>
                <Text>{formatCurrency(openingBalance, locale)}</Text>
              </View>
            </View>
          )}

          {/* Entry Rows */}
          {statement.entries
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((entry, index) => {
              const debit = Number(entry.debit)
              const credit = Number(entry.credit)
              const balance = Number(entry.balance)

              return (
                <View
                  key={entry.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <View style={[styles.tableCell, styles.dateCol]}>
                    <Text>{formatDate(entry.entryDate, locale)}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.refCol]}>
                    <Text>{entry.reference}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.descCol]}>
                    <Text>
                      {isAr && entry.descriptionAr
                        ? entry.descriptionAr
                        : entry.description}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.debitCol]}>
                    <Text>{debit > 0 ? formatCurrency(debit, locale) : "-"}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.creditCol]}>
                    <Text>{credit > 0 ? formatCurrency(credit, locale) : "-"}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.balanceCol, styles.tableCellLast]}>
                    <Text>{formatCurrency(balance, locale)}</Text>
                  </View>
                </View>
              )
            })}

          {/* Totals Row */}
          <View style={styles.totalsRow}>
            <View style={[styles.tableCell, styles.dateCol]}>
              <Text />
            </View>
            <View style={[styles.tableCell, styles.refCol]}>
              <Text />
            </View>
            <View style={[styles.tableCell, styles.descCol]}>
              <Text style={{ fontWeight: 700, textAlign: "center" }}>
                {isAr ? "الجمـــلة" : "TOTAL"}
              </Text>
            </View>
            <View style={[styles.tableCell, styles.debitCol]}>
              <Text style={{ fontWeight: 700 }}>
                {formatCurrency(totalDebits, locale)}
              </Text>
            </View>
            <View style={[styles.tableCell, styles.creditCol]}>
              <Text style={{ fontWeight: 700 }}>
                {formatCurrency(totalCredits, locale)}
              </Text>
            </View>
            <View style={[styles.tableCell, styles.balanceCol, styles.tableCellLast]}>
              <Text />
            </View>
          </View>

          {/* Closing Balance Row */}
          <View style={styles.closingBalanceRow}>
            <Text style={styles.closingBalanceLabel}>{t.closingBalance}</Text>
            <Text style={styles.closingBalanceValue}>
              {formatCurrency(closingBalance, locale)} {statement.currency}
            </Text>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={styles.amountInWords}>
          <Text style={styles.amountInWordsLabel}>{t.amountInWords}</Text>
          <Text style={styles.amountInWordsText}>{amountInWords}</Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitleAr}>{t.accountsManager}</Text>
            <Text style={styles.signatureTitle}>Accounts Manager</Text>
            {settings?.signatureUrl && (
              <Image src={settings.signatureUrl} style={styles.signatureImage} />
            )}
            <View style={styles.signatureLine} />
          </View>

          <View style={styles.signatureBox}>
            <Text style={styles.signatureTitleAr}>{t.generalManager}</Text>
            <Text style={styles.signatureTitle}>General Manager</Text>
            {settings?.stampUrl && (
              <Image src={settings.stampUrl} style={styles.stampImage} />
            )}
            <View style={styles.signatureLine} />
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {settings?.phone || "0999999999"} | {settings?.email || "info@mazin.sd"}
        </Text>
      </Page>
    </Document>
  )
}
