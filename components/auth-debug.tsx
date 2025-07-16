"use client"

import { useState, useEffect } from "react"
import { getCurrentUser } from "@/lib/auth-utils"
import { supabase } from "@/lib/supabase/supabaseClient"

export function AuthDebug() {
  const [authInfo, setAuthInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true)
        
        // Verificar usuario actual
        const currentUser = await getCurrentUser()
        
        // Verificar sesión de Supabase
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        // Verificar localStorage
        const localUserId = typeof window !== 'undefined' ? localStorage.getItem("user_id") : null
        
        setAuthInfo({
          currentUser,
          sessionData,
          sessionError,
          localUserId,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error("Error en debug:", error)
        setAuthInfo({ error: error instanceof Error ? error.message : String(error) })
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  if (loading) {
    return <div>Cargando información de autenticación...</div>
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Debug de Autenticación</h3>
      <pre className="text-xs overflow-auto">
        {JSON.stringify(authInfo, null, 2)}
      </pre>
    </div>
  )
} 