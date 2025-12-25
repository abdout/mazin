import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mazin - Port Sudan Logistics",
  description: "Export/Import Management System for Port Sudan",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return children
}
