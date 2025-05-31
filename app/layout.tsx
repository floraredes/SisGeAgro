import type React from "react"
import type { Metadata } from "next"
import { Inter, Roboto_Mono } from "next/font/google"
import "./globals.css"
import { ToastProvider, ToastListener } from "@/components/ui/simple-toast"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "SisGeAgro",
  description: "Sistema de Gestión Económica Agropecuaria",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <ToastProvider>
          {children}
          <ToastListener />
        </ToastProvider>
      </body>
    </html>
  )
}

