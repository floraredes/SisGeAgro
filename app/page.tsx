"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/supabaseClient"

export default function Page() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Función para verificar la sesión
    const checkSession = async () => {
      try {
        // Obtener la sesión actual
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error checking session:", error)
          router.push("/auth")
          return
        }

        // Verificar si hay una sesión activa
        if (!data.session) {
          console.log("No session found, redirecting to auth")
          router.push("/auth")
        } else {
          console.log("Session found, redirecting to dashboard")
          router.push("/dashboard")
        }
      } catch (error) {
        console.error("Exception during authentication check:", error)
        router.push("/auth")
      } finally {
        // Establecer isLoading a false después de completar la verificación
        setIsLoading(false)
      }
    }

    // Ejecutar la verificación de sesión
    checkSession()
  }, [router])

  // Mostrar un indicador de carga mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#4F7942] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // Este contenido normalmente no se mostrará porque habrá una redirección
  return null
}

