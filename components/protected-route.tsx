"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/supabaseClient"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Use useCallback to prevent recreation of this function on each render
  const checkAuth = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        router.push("/auth")
        return
      }

      setIsAuthenticated(true)
    } catch (error) {
      console.error("Authentication check failed:", error)
      router.push("/auth")
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#4F7942] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : null
}

