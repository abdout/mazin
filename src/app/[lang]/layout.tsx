import type { Metadata } from "next"
import { Inter, Tajawal } from "next/font/google"
import { i18n, type Locale, localeConfig } from "@/components/internationalization"
import "../globals.css"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
})

export const metadata: Metadata = {
  title: "Mazin - Port Sudan Logistics",
  description: "Export/Import Management System for Port Sudan",
}

export async function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }))
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ lang: string }>
}>) {
  const { lang: langParam } = await params
  const lang = langParam as Locale
  const dir = localeConfig[lang]?.dir ?? "ltr"
  const fontClass = dir === "rtl" ? tajawal.variable : inter.variable

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body className={`${fontClass} antialiased`}>
        {children}
      </body>
    </html>
  )
}
