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
  bankName?: string | null
  accountName?: string | null
  accountNumber?: string | null
  iban?: string | null
  termsAndConditions?: string | null
  footerNote?: string | null
}

interface InvoicePdfProps {
  invoice: InvoiceWithRelations
  locale: Locale
  settings?: CompanySettings
}

const colors = {
  primary: "#1a365d",
  secondary: "#4a5568",
  accent: "#3182ce",
  background: "#f7fafc",
  border: "#e2e8f0",
  success: "#48bb78",
  warning: "#ed8936",
  danger: "#e53e3e",
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "PAID":
      return colors.success
    case "SENT":
      return colors.accent
    case "OVERDUE":
      return colors.danger
    case "CANCELLED":
      return colors.secondary
    default:
      return colors.secondary
  }
}

const createStyles = (isRtl: boolean) =>
  StyleSheet.create({
    page: {
      fontFamily: "Rubik",
      fontSize: 10,
      padding: 40,
      backgroundColor: "#ffffff",
      direction: isRtl ? "rtl" : "ltr",
    },
    header: {
      flexDirection: isRtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginBottom: 30,
      paddingBottom: 20,
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    logo: {
      width: 120,
      height: 60,
      objectFit: "contain",
    },
    companyInfo: {
      textAlign: isRtl ? "left" : "right",
    },
    companyName: {
      fontSize: 18,
      fontWeight: 700,
      color: colors.primary,
      marginBottom: 5,
    },
    companyDetail: {
      fontSize: 9,
      color: colors.secondary,
      marginBottom: 2,
    },
    invoiceTitle: {
      flexDirection: isRtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    invoiceNumber: {
      fontSize: 24,
      fontWeight: 700,
      color: colors.primary,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 4,
      color: "#ffffff",
      fontSize: 10,
      fontWeight: 700,
    },
    infoSection: {
      flexDirection: isRtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      marginBottom: 30,
    },
    infoBox: {
      width: "45%",
    },
    infoLabel: {
      fontSize: 8,
      color: colors.secondary,
      textTransform: "uppercase",
      marginBottom: 5,
      textAlign: isRtl ? "right" : "left",
    },
    infoValue: {
      fontSize: 10,
      color: colors.primary,
      marginBottom: 3,
      textAlign: isRtl ? "right" : "left",
    },
    table: {
      marginBottom: 30,
    },
    tableHeader: {
      flexDirection: isRtl ? "row-reverse" : "row",
      backgroundColor: colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 10,
    },
    tableHeaderCell: {
      color: "#ffffff",
      fontSize: 9,
      fontWeight: 700,
      textAlign: isRtl ? "right" : "left",
    },
    tableRow: {
      flexDirection: isRtl ? "row-reverse" : "row",
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableCell: {
      fontSize: 9,
      color: colors.secondary,
      textAlign: isRtl ? "right" : "left",
    },
    descCol: { width: "50%" },
    qtyCol: { width: "15%", textAlign: "center" },
    priceCol: { width: "17.5%", textAlign: isRtl ? "left" : "right" },
    totalCol: { width: "17.5%", textAlign: isRtl ? "left" : "right" },
    totalsSection: {
      flexDirection: isRtl ? "row" : "row-reverse",
      marginBottom: 30,
    },
    totalsBox: {
      width: "40%",
    },
    totalsRow: {
      flexDirection: isRtl ? "row-reverse" : "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    totalsLabel: {
      fontSize: 10,
      color: colors.secondary,
    },
    totalsValue: {
      fontSize: 10,
      fontWeight: 700,
      color: colors.primary,
    },
    totalsFinal: {
      backgroundColor: colors.primary,
      marginTop: 5,
    },
    totalsFinalLabel: {
      fontSize: 12,
      fontWeight: 700,
      color: "#ffffff",
    },
    totalsFinalValue: {
      fontSize: 12,
      fontWeight: 700,
      color: "#ffffff",
    },
    bankDetails: {
      backgroundColor: colors.background,
      padding: 15,
      marginBottom: 20,
      borderRadius: 4,
    },
    bankTitle: {
      fontSize: 10,
      fontWeight: 700,
      color: colors.primary,
      marginBottom: 10,
      textAlign: isRtl ? "right" : "left",
    },
    bankRow: {
      flexDirection: isRtl ? "row-reverse" : "row",
      marginBottom: 5,
    },
    bankLabel: {
      fontSize: 9,
      color: colors.secondary,
      width: "30%",
      textAlign: isRtl ? "right" : "left",
    },
    bankValue: {
      fontSize: 9,
      color: colors.primary,
      width: "70%",
      textAlign: isRtl ? "right" : "left",
    },
    notes: {
      marginBottom: 20,
    },
    notesTitle: {
      fontSize: 10,
      fontWeight: 700,
      color: colors.primary,
      marginBottom: 5,
      textAlign: isRtl ? "right" : "left",
    },
    notesText: {
      fontSize: 9,
      color: colors.secondary,
      lineHeight: 1.5,
      textAlign: isRtl ? "right" : "left",
    },
    signature: {
      flexDirection: isRtl ? "row-reverse" : "row",
      justifyContent: "flex-end",
      marginTop: 20,
    },
    signatureBox: {
      textAlign: "center",
    },
    signatureImage: {
      width: 100,
      height: 50,
      objectFit: "contain",
    },
    signatureLine: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 5,
      paddingTop: 5,
      width: 150,
    },
    signatureLabel: {
      fontSize: 8,
      color: colors.secondary,
    },
    footer: {
      position: "absolute",
      bottom: 30,
      left: 40,
      right: 40,
      textAlign: "center",
      fontSize: 8,
      color: colors.secondary,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
  })

const translations = {
  en: {
    invoice: "INVOICE",
    billTo: "Bill To",
    invoiceDetails: "Invoice Details",
    invoiceNumber: "Invoice #",
    invoiceDate: "Invoice Date",
    dueDate: "Due Date",
    shipmentRef: "Shipment Ref",
    description: "Description",
    quantity: "Qty",
    unitPrice: "Unit Price",
    total: "Total",
    subtotal: "Subtotal",
    tax: "VAT (15%)",
    grandTotal: "Grand Total",
    bankDetails: "Bank Details",
    bankName: "Bank Name",
    accountName: "Account Name",
    accountNumber: "Account Number",
    iban: "IBAN",
    notes: "Notes",
    authorizedSignature: "Authorized Signature",
    thankYou: "Thank you for your business!",
  },
  ar: {
    invoice: "فاتورة",
    billTo: "فاتورة إلى",
    invoiceDetails: "تفاصيل الفاتورة",
    invoiceNumber: "رقم الفاتورة",
    invoiceDate: "تاريخ الفاتورة",
    dueDate: "تاريخ الاستحقاق",
    shipmentRef: "مرجع الشحنة",
    description: "الوصف",
    quantity: "الكمية",
    unitPrice: "سعر الوحدة",
    total: "الإجمالي",
    subtotal: "المجموع الفرعي",
    tax: "ضريبة القيمة المضافة (15%)",
    grandTotal: "الإجمالي الكلي",
    bankDetails: "التفاصيل البنكية",
    bankName: "اسم البنك",
    accountName: "اسم الحساب",
    accountNumber: "رقم الحساب",
    iban: "الآيبان",
    notes: "ملاحظات",
    authorizedSignature: "التوقيع المعتمد",
    thankYou: "شكراً لتعاملكم معنا!",
  },
}

export function InvoicePdf({ invoice, locale, settings }: InvoicePdfProps) {
  const isRtl = locale === "ar"
  const styles = createStyles(isRtl)
  const t = translations[locale]

  const formatCurrency = (amount: number | string | { toString(): string }) => {
    const num = typeof amount === "number" ? amount : parseFloat(String(amount))
    return `${invoice.currency} ${num.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", { minimumFractionDigits: 2 })}`
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const companyName = isRtl && settings?.companyNameAr
    ? settings.companyNameAr
    : settings?.companyName || "Mazin Customs Clearance"

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {settings?.logoUrl && (
            <Image src={settings.logoUrl} style={styles.logo} />
          )}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{companyName}</Text>
            {settings?.address1 && (
              <Text style={styles.companyDetail}>{settings.address1}</Text>
            )}
            {settings?.city && (
              <Text style={styles.companyDetail}>
                {settings.city}, {settings.country}
              </Text>
            )}
            {settings?.phone && (
              <Text style={styles.companyDetail}>{settings.phone}</Text>
            )}
            {settings?.email && (
              <Text style={styles.companyDetail}>{settings.email}</Text>
            )}
          </View>
        </View>

        {/* Invoice Title & Status */}
        <View style={styles.invoiceTitle}>
          <Text style={styles.invoiceNumber}>
            {t.invoice} #{invoice.invoiceNumber}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(invoice.status) },
            ]}
          >
            <Text>{invoice.status}</Text>
          </View>
        </View>

        {/* Bill To & Invoice Details */}
        <View style={styles.infoSection}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>{t.billTo}</Text>
            {invoice.client ? (
              <>
                <Text style={styles.infoValue}>{invoice.client.companyName}</Text>
                {invoice.client.contactName && (
                  <Text style={styles.infoValue}>{invoice.client.contactName}</Text>
                )}
                <Text style={styles.infoValue}>{invoice.client.billingAddress1}</Text>
                <Text style={styles.infoValue}>
                  {invoice.client.billingCity}, {invoice.client.billingCountry}
                </Text>
                {invoice.client.email && (
                  <Text style={styles.infoValue}>{invoice.client.email}</Text>
                )}
              </>
            ) : (
              <Text style={styles.infoValue}>-</Text>
            )}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>{t.invoiceDetails}</Text>
            <Text style={styles.infoValue}>
              {t.invoiceDate}: {formatDate(invoice.createdAt)}
            </Text>
            <Text style={styles.infoValue}>
              {t.dueDate}: {formatDate(invoice.dueDate)}
            </Text>
            {invoice.shipment && (
              <Text style={styles.infoValue}>
                {t.shipmentRef}: {invoice.shipment.shipmentNumber}
              </Text>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descCol]}>{t.description}</Text>
            <Text style={[styles.tableHeaderCell, styles.qtyCol]}>{t.quantity}</Text>
            <Text style={[styles.tableHeaderCell, styles.priceCol]}>{t.unitPrice}</Text>
            <Text style={[styles.tableHeaderCell, styles.totalCol]}>{t.total}</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.descCol]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.qtyCol]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.priceCol]}>
                {formatCurrency(item.unitPrice)}
              </Text>
              <Text style={[styles.tableCell, styles.totalCol]}>
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{t.subtotal}</Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{t.tax}</Text>
              <Text style={styles.totalsValue}>{formatCurrency(invoice.tax)}</Text>
            </View>
            <View style={[styles.totalsRow, styles.totalsFinal]}>
              <Text style={styles.totalsFinalLabel}>{t.grandTotal}</Text>
              <Text style={styles.totalsFinalValue}>{formatCurrency(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Bank Details */}
        {settings?.bankName && (
          <View style={styles.bankDetails}>
            <Text style={styles.bankTitle}>{t.bankDetails}</Text>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>{t.bankName}:</Text>
              <Text style={styles.bankValue}>{settings.bankName}</Text>
            </View>
            {settings.accountName && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>{t.accountName}:</Text>
                <Text style={styles.bankValue}>{settings.accountName}</Text>
              </View>
            )}
            {settings.accountNumber && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>{t.accountNumber}:</Text>
                <Text style={styles.bankValue}>{settings.accountNumber}</Text>
              </View>
            )}
            {settings.iban && (
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>{t.iban}:</Text>
                <Text style={styles.bankValue}>{settings.iban}</Text>
              </View>
            )}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>{t.notes}</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            {settings?.signatureUrl && (
              <Image src={settings.signatureUrl} style={styles.signatureImage} />
            )}
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>{t.authorizedSignature}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          {settings?.footerNote || t.thankYou}
        </Text>
      </Page>
    </Document>
  )
}
