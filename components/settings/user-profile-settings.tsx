"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase/supabaseClient"
import { useToast } from "@/components/ui/simple-toast"

export function UserProfileSettings() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Modificar la función loadUserProfile para usar la nueva tabla users
  async function loadUserProfile() {
    try {
      setLoading(true)

      // Obtener datos del usuario
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        throw error
      }

      if (user) {
        setUser(user)

        // Obtener datos del perfil de usuario de la tabla users
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single()

        if (!profileError && profileData) {
          setFormData((prev) => ({
            ...prev,
            fullName: profileData.username || "",
            email: user.email || "",
          }))
        } else {
          // Si no existe el perfil, crearlo
          const { error: insertError } = await supabase.from("users").insert({
            id: user.id,
            username: "",
            email: user.email,
            role: "user",
          })

          if (insertError && insertError.code !== "23505") {
            // Ignorar error de duplicado
            console.error("Error creating user profile:", insertError)
          }

          setFormData((prev) => ({
            ...prev,
            email: user.email || "",
          }))
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil de usuario",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUserProfile()
  }, [toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Modificar la función handleUpdateProfile para usar la nueva tabla users
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setUpdating(true)

      // Actualizar perfil de usuario en la tabla users
      if (user) {
        const { error: profileError } = await supabase.from("users").upsert({
          id: user.id,
          username: formData.fullName,
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          throw profileError
        }

        // Actualizar email si cambió
        if (formData.email !== user.email) {
          const { error: emailError } = await supabase.auth.updateUser({
            email: formData.email,
          })

          if (emailError) {
            throw emailError
          }
        }

        toast({
          title: "Perfil actualizado",
          description: "Tu perfil ha sido actualizado correctamente",
        })
      }
    } catch (error: any) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el perfil",
        type: "error",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        type: "error",
      })
      return
    }

    try {
      setUpdating(true)

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido actualizada correctamente",
      })

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (error: any) {
      console.error("Error updating password:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la contraseña",
        type: "error",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="w-8 h-8 border-4 border-t-[#4F7942] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>Actualiza tu información personal y datos de contacto</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nombre de usuario</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nombre de usuario"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updating}>
                {updating ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar Contraseña</CardTitle>
          <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updating}>
                {updating ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
