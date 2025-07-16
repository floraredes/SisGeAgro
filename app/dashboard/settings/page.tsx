"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProfileSettings } from "@/components/settings/user-profile-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { UserManagementSettings } from "@/components/settings/user-management-settings"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getCurrentUser } from "@/lib/auth-utils"
import { supabase } from "@/lib/supabase/supabaseClient"
import { AlertCircle } from "lucide-react"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function checkUserAccess() {
      try {
        setLoading(true)

        // Obtener el usuario actual usando las nuevas utilidades
        const currentUser = await getCurrentUser()

        if (!currentUser) {
          router.push("/auth")
          return
        }

        // Obtener el perfil completo del usuario desde la tabla users
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentUser.id)
          .single()

        if (profileError) {
          console.error("Error fetching user profile:", profileError)
          setError("No se pudo cargar el perfil del usuario")
          return
        }

        setUserProfile(profile)

      } catch (error) {
        console.error("Error checking user access:", error)
        setError("Error al verificar el acceso del usuario")
      } finally {
        setLoading(false)
      }
    }

    checkUserAccess()
  }, [router])

  if (loading) {
    return (
      <div className="p-6 bg-[#F5F6FA] h-full w-full overflow-auto">
        <Card className="p-6 shadow-lg border-none">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-t-[#4F7942] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando configuración...</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-[#F5F6FA] h-full w-full overflow-auto">
        <Card className="p-6 shadow-lg border-none">
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#F5F6FA] h-full w-full overflow-auto">
      <Card className="p-6 shadow-lg border-none">
        <h2 className="text-2xl font-bold mb-6">Configuración</h2>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="profile">Datos del Usuario</TabsTrigger>
            <TabsTrigger value="notifications">Configurar Alertas</TabsTrigger>
            <TabsTrigger value="permissions">Permisos de Acceso</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <UserProfileSettings userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <NotificationSettings />
          </TabsContent>

          <TabsContent value="permissions" className="mt-6">
            <UserManagementSettings />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  )
}
