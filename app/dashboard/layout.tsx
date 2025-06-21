"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/supabaseClient"
import { Badge } from "@/components/ui/badge"
import { BellIcon } from "lucide-react"
import { MainNavigation } from "@/components/main-navigation"

// Importar el CurrencyProvider y el CurrencySelector
import { CurrencyProvider } from "@/contexts/currency-context"
import { CurrencySelector } from "@/components/currency-selector"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("Usuario")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          console.error("Error durante autenticación:", error)
          router.push("/auth")
          return
        }

        const user = data.session.user

        // Obtener el nombre desde la tabla unificada `users`
        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Error al obtener perfil del usuario:", profileError)
        }

        const displayName = userProfile?.username || user.email?.split("@")[0] || "Usuario"
        setUserName(displayName)

      } catch (error) {
        console.error("Excepción al verificar autenticación:", error)
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
      <div className="flex h-screen overflow-hidden min-w-0 min-h-0">
        <MainNavigation />
        <div className="flex-1 flex flex-col w-full min-w-0 min-h-0">
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
              <span className="text-sm font-medium text-gray-700">Hola, {userName}</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto min-h-0 min-w-0 p-6 bg-[#F5F6FA] flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </CurrencyProvider>
  )
}
