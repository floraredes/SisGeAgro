"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/supabaseClient"
import { Badge } from "@/components/ui/badge"
import { BellIcon } from "lucide-react"
import { MainNavigation } from "@/components/main-navigation"
import { UserAvatar } from "@/components/user-avatar"

// Importar el CurrencyProvider y el CurrencySelector
import { CurrencyProvider } from "@/contexts/currency-context"
import { CurrencySelector } from "@/components/currency-selector"

// Modificar el componente DashboardLayout para incluir el CurrencyProvider
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error during authentication check:", error)
          router.push("/auth")
          return
        }

        if (!data.session) {
          console.log("No session found in dashboard layout, redirecting to auth")
          router.push("/auth")
          return
        }
      } catch (error) {
        console.error("Exception during authentication check:", error)
        router.push("/auth")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#4F7942] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <CurrencyProvider>
      <div className="flex h-screen overflow-hidden">
        <div className="w-64 min-w-64 border-r bg-background overflow-y-auto">
          <MainNavigation />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="flex h-16 min-h-16 items-center justify-between border-b px-6 bg-white z-10">
            <div className="flex-1">
              <CurrencySelector />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <BellIcon className="h-6 w-6 text-muted-foreground" />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500">
                  5
                </Badge>
              </div>
              <UserAvatar />
            </div>
          </header>

          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </CurrencyProvider>
  )
}
