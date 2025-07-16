"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/supabaseClient"

export default function HomePage() {
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !sessionData.session) {
          setCheckingSession(false)
          router.replace("/auth")
          return
        }

        const userId = sessionData.session.user.id
        const { data: userProfile, error: userError } = await supabase
          .from("users")
          .select("id, role")
          .eq("id", userId)
          .single()

        if (userError || !userProfile) {
          await supabase.auth.signOut()
          setCheckingSession(false)
          router.replace("/auth")
          return
        }

        setCheckingSession(false)
        if (userProfile.role === "admin") {
          router.replace("/dashboard")
        } else {
          router.replace("/user-movement")
        }
      } catch (error) {
        console.error("Error verificando sesión:", error)
        setCheckingSession(false)
        router.replace("/auth")
      }
    }

    checkSessionAndRedirect()
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

  return null
}
