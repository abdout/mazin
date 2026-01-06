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
import type { Invoice, InvoiceItem, Client, Shipment } from "@prisma/client"
import type { Locale } from "@/components/internationalization"
import { numberToArabicWords, formatArabicNumerals } from "@/lib/utils/arabic-numbers"
import { FEE_CATEGORIES, VAT_RATE } from "./config"
import type { FeeCategory } from "@prisma/client"

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

type InvoiceWithRelations = Invoice & {
  items: InvoiceItem[]
  client?: Client | null
  shipment?: Shipment | null
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

interface ClearanceInvoicePdfProps {
  invoice: InvoiceWithRelations
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
}

// =============================================================================
// STYLES - Matching ABDOUT GROUP Invoice Format
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
  licenseNumber: {
    fontSize: 9,
    fontWeight: 700,
    marginTop: 3,
  },

  // Document Info Section
  docInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 10,
    backgroundColor: colors.headerBg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docInfoLeft: {
    flex: 1,
  },
  docInfoRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  docInfoRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  docInfoLabel: {
    fontSize: 9,
    fontWeight: 700,
    width: 80,
  },
  docInfoLabelAr: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: "right",
    width: 80,
  },
  docInfoValue: {
    fontSize: 9,
    flex: 1,
  },
  docInfoValueAr: {
    fontSize: 9,
    textAlign: "right",
    flex: 1,
  },

  // Invoice Title
  invoiceTitle: {
    textAlign: "center",
    marginBottom: 15,
    padding: 10,
    backgroundColor: colors.primary,
  },
  invoiceTitleText: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.white,
  },

  // Items Table
  table: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 700,
    padding: 8,
    textAlign: "center",
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
  },
  descCol: {
    width: "65%",
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  amountCol: {
    width: "35%",
    textAlign: "right",
  },
  descBilingual: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  descEn: {
    fontSize: 9,
  },
  descAr: {
    fontSize: 9,
    textAlign: "right",
  },

  // Totals Section
  totalsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  totalsLabel: {
    width: "65%",
    padding: 8,
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.headerBg,
  },
  totalsValue: {
    width: "35%",
    padding: 8,
    fontSize: 10,
    fontWeight: 700,
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    backgroundColor: colors.primary,
  },
  grandTotalLabel: {
    width: "65%",
    padding: 10,
    fontSize: 12,
    fontWeight: 700,
    color: colors.white,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: colors.white,
  },
  grandTotalValue: {
    width: "35%",
    padding: 10,
    fontSize: 12,
    fontWeight: 700,
    color: colors.white,
    textAlign: "right",
  },

  // Amount in Words
  amountInWords: {
    marginTop: 10,
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
    invoiceNo: "INVOICE NO",
    date: "Date",
    supplier: "Supplier",
    commodity: "Commodity",
    blNumber: "B/L NO",
    containerNo: "CN NO",
    deliveryOrder: "D/O NO",
    declaration: "Dec NO",
    vessel: "Vessel",
    description: "Description",
    amount: "Amount (SDG)",
    subtotal: "Subtotal",
    vat: "VAT (17%)",
    total: "Total",
    amountInWords: "Amount in Words:",
    accountsManager: "Accounts Manager",
    generalManager: "General Manager",
    clearance: "Clearance - Deportation - Storage",
    licenseNo: "License Number",
  },
  ar: {
    invoiceNo: "فاتورة رقم",
    date: "التاريخ",
    supplier: "المورد",
    commodity: "الصنف",
    blNumber: "رقم بوليصة الشحن",
    containerNo: "رقم الحاوية",
    deliveryOrder: "اذن تسليم رقم",
    declaration: "شهادة جمركية رقم",
    vessel: "اسم السفينة",
    description: "البيــــان",
    amount: "G/S جنيه",
    subtotal: "المجموع",
    vat: "قيمه مضافة 17%",
    total: "الجملة",
    amountInWords: "الجملة كتابة:",
    accountsManager: "اعتماد مدير الحسابات",
    generalManager: "اعتماد المدير العام",
    clearance: "تخليص - ترحيل - تخزين",
    licenseNo: "رقم الترخيص",
  },
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatCurrency(amount: number | string, locale: Locale): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount))
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

function getItemDescription(item: InvoiceItem, locale: Locale): { en: string; ar: string } {
  // If item has fee category, get bilingual description
  if (item.feeCategory) {
    const config = FEE_CATEGORIES[item.feeCategory as FeeCategory]
    if (config) {
      return { en: config.en, ar: config.ar }
    }
  }
  // Fallback to item descriptions
  return {
    en: item.description,
    ar: item.descriptionAr || item.description,
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ClearanceInvoicePdf({
  invoice,
  locale,
  settings,
}: ClearanceInvoicePdfProps) {
  const t = translations[locale]
  const isAr = locale === "ar"

  // Calculate VAT and totals
  const subtotal = Number(invoice.subtotal)
  const vat = Number(invoice.tax)
  const total = Number(invoice.total)

  // Generate amount in words
  const amountInWords = invoice.totalInWordsAr || numberToArabicWords(total, invoice.currency)

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
            <Text style={styles.companyDetail}>
              {isAr ? t.clearance : "Clearance - Deportation - Storage"}
            </Text>
            {settings?.licenseNumber && (
              <Text style={styles.licenseNumber}>
                {t.licenseNo}: {settings.licenseNumber} | البحر الأحمر
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyNameAr}>
              {settings?.companyNameAr || "مجموعة عبدالله"}
            </Text>
            <Text style={[styles.companyDetail, { textAlign: "right" }]}>
              {t.clearance}
            </Text>
          </View>
        </View>

        {/* Document Info Section */}
        <View style={styles.docInfo}>
          <View style={styles.docInfoLeft}>
            <View style={styles.docInfoRow}>
              <Text style={styles.docInfoLabel}>{t.date}:</Text>
              <Text style={styles.docInfoValue}>
                {formatDate(invoice.createdAt, locale)}
              </Text>
            </View>
            <View style={styles.docInfoRow}>
              <Text style={styles.docInfoLabel}>{t.supplier}:</Text>
              <Text style={styles.docInfoValue}>
                {invoice.supplierName || invoice.client?.companyName || "-"}
              </Text>
            </View>
            <View style={styles.docInfoRow}>
              <Text style={styles.docInfoLabel}>{t.commodity}:</Text>
              <Text style={styles.docInfoValue}>
                {invoice.commodityType || "-"}
              </Text>
            </View>
          </View>
          <View style={styles.docInfoRight}>
            <View style={styles.docInfoRow}>
              <Text style={styles.docInfoValueAr}>
                {invoice.containerNumbers?.join(", ") || "-"}
              </Text>
              <Text style={styles.docInfoLabelAr}>:{t.containerNo}</Text>
            </View>
            <View style={styles.docInfoRow}>
              <Text style={styles.docInfoValueAr}>
                {invoice.blNumber || "-"}
              </Text>
              <Text style={styles.docInfoLabelAr}>:{t.blNumber}</Text>
            </View>
            <View style={styles.docInfoRow}>
              <Text style={styles.docInfoValueAr}>
                {invoice.vesselName || "-"}
              </Text>
              <Text style={styles.docInfoLabelAr}>:{t.vessel}</Text>
            </View>
          </View>
        </View>

        {/* Invoice Title */}
        <View style={styles.invoiceTitle}>
          <Text style={styles.invoiceTitleText}>
            {t.invoiceNo}({invoice.invoiceNumber})
          </Text>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={styles.descCol}>
              <Text style={styles.tableHeaderCell}>{t.description}</Text>
            </View>
            <View style={styles.amountCol}>
              <Text style={styles.tableHeaderCell}>{t.amount}</Text>
            </View>
          </View>

          {/* Table Items */}
          {invoice.items
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
            .map((item, index) => {
              const desc = getItemDescription(item, locale)
              const itemTotal = Number(item.total)
              return (
                <View
                  key={item.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 1 ? styles.tableRowAlt : {},
                  ]}
                >
                  <View style={[styles.tableCell, styles.descCol]}>
                    <View style={styles.descBilingual}>
                      <Text style={styles.descEn}>
                        {desc.en}
                        {item.tariffCode ? ` (${item.tariffCode})` : ""}
                        {item.receiptNumber ? ` No.${item.receiptNumber}` : ""}
                      </Text>
                      <Text style={styles.descAr}>{desc.ar}</Text>
                    </View>
                  </View>
                  <View style={[styles.tableCell, styles.amountCol]}>
                    <Text>{formatCurrency(itemTotal, locale)}</Text>
                  </View>
                </View>
              )
            })}

          {/* Subtotal Row */}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{t.subtotal}</Text>
            <Text style={styles.totalsValue}>
              {formatCurrency(subtotal, locale)}
            </Text>
          </View>

          {/* VAT Row */}
          {vat > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{t.vat}</Text>
              <Text style={styles.totalsValue}>
                {formatCurrency(vat, locale)}
              </Text>
            </View>
          )}

          {/* Grand Total Row */}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>{t.total}</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(total, locale)}
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

// =============================================================================
// EXPORT HELPER - For API route selection based on invoice type
// =============================================================================

export function shouldUseClearanceFormat(invoiceType?: string): boolean {
  return invoiceType === "CLEARANCE" || invoiceType === "PORT"
}
