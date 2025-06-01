"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase/supabaseClient"
import { useToast } from "@/components/ui/simple-toast"
import { AlertCircle, User, Lock } from "lucide-react"

interface UserProfileSettingsProps {
  userProfile: any
}

export function UserProfileSettings({ userProfile }: UserProfileSettingsProps) {
  const { toast } = useToast()

  // Estados para información personal
  const [personalInfo, setPersonalInfo] = useState({
    username: "",
    email: "",
    role: "",
  })

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Estados de carga y errores
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Cargar datos del usuario cuando se recibe el prop
  useEffect(() => {
    if (userProfile) {
      setPersonalInfo({
        username: userProfile.username || "",
        email: userProfile.email || "",
        role: userProfile.role || "usuario",
      })
    }
  }, [userProfile])

  // Función para actualizar información personal
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    setProfileError(null)

    try {
      // Validaciones básicas
      if (!personalInfo.username.trim()) {
        setProfileError("El nombre de usuario es requerido")
        return
      }

      // Actualizar en la tabla profiles
      const { error } = await supabase
        .from("profiles")
        .update({
          username: personalInfo.username.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userProfile.id)

      if (error) {
        throw error
      }

      toast({
        title: "Perfil actualizado",
        description: "Tu información personal ha sido actualizada correctamente",
        type: "success",
      })
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setProfileError(error.message || "Error al actualizar el perfil")
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        type: "error",
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // Función para cambiar contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingPassword(true)
    setPasswordError(null)

    try {
      // Validaciones
      if (!passwordData.currentPassword) {
        setPasswordError("La contraseña actual es requerida")
        return
      }

      if (!passwordData.newPassword) {
        setPasswordError("La nueva contraseña es requerida")
        return
      }

      if (passwordData.newPassword.length < 6) {
        setPasswordError("La nueva contraseña debe tener al menos 6 caracteres")
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError("Las contraseñas no coinciden")
        return
      }

      // Cambiar contraseña usando Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) {
        throw error
      }

      // Limpiar formulario
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente",
        type: "success",
      })
    } catch (error: any) {
      console.error("Error changing password:", error)
      setPasswordError(error.message || "Error al cambiar la contraseña")
      toast({
        title: "Error",
        description: "No se pudo cambiar la contraseña",
        type: "error",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>Actualiza tu información personal y datos de perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{profileError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  value={personalInfo.username}
                  onChange={(e) => setPersonalInfo((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder="Ingresa tu nombre de usuario"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={personalInfo.email}
                  disabled
                  className="bg-gray-50"
                  placeholder="Email no editable"
                />
                <p className="text-xs text-muted-foreground">El email no se puede modificar desde aquí</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Input id="role" value={personalInfo.role} disabled className="bg-gray-50" placeholder="Rol asignado" />
                <p className="text-xs text-muted-foreground">El rol es asignado por un administrador</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdatingProfile} className="bg-[#4F7942] hover:bg-[#3d5f35]">
                {isUpdatingProfile ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Cambiar Contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{passwordError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Ingresa tu contraseña actual"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Ingresa tu nueva contraseña"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirma tu nueva contraseña"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isUpdatingPassword} className="bg-[#4F7942] hover:bg-[#3d5f35]">
                {isUpdatingPassword ? "Cambiando..." : "Cambiar Contraseña"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
