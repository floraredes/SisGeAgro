"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-utils"
import dynamic from "next/dynamic"

export default function HomePage() {
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          setIsAuthenticated(true)
          // Redirigir según el rol
          if (currentUser.role === "admin") {
            router.replace("/dashboard")
          } else {
            router.replace("/user-movement")
          }
        }
      } catch (error) {
        // No hacer nada, mostrar landing
      } finally {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [router])

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#4F7942] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const LandingPage = dynamic(() => import("./LandingPage"), { ssr: false })
    return <LandingPage />
  }

  return null
}
