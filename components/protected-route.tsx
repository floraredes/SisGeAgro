"use client"

import type React from "react"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { isAuthenticated } from "@/lib/auth-utils"

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticatedState, setIsAuthenticatedState] = useState(false)

  // Use useCallback to prevent recreation of this function on each render
  const checkAuth = useCallback(async () => {
    try {
      const authenticated = await isAuthenticated()

      if (!authenticated) {
        router.push("/auth")
        return
      }

      setIsAuthenticatedState(true)
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

  return isAuthenticatedState ? <>{children}</> : null
}

