"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/supabaseClient"
import LoginForm from "@/components/login-form"

export default function HomePage() {
  const router = useRouter()
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError || !sessionData.session) {
          setCheckingSession(false)
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
          router.push("/auth")
          return
        }

        if (userProfile.role === "admin") {
          router.push("/dashboard")
        } else {
          router.push("/user-movement")
        }
      } catch (error) {
        console.error("Error verificando sesión:", error)
        router.push("/auth")
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6eee0]">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <LoginForm />
      </div>
    </div>
  )
}
