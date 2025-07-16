"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabase/supabaseClient"
import { getCurrentUser } from "@/lib/auth-utils"
import { useToast } from "@/components/ui/simple-toast"

export function NotificationSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [settings, setSettings] = useState({
    emailNotifications: true,
    appNotifications: true,
    expenseThreshold: "5000",
    notificationFrequency: "daily",
    newTransactionNotifications: true,
    pendingApprovalNotifications: true,
    systemUpdates: false,
  })

  useEffect(() => {
    async function loadNotificationSettings() {
      try {
        setLoading(true)

        // Obtener usuario actual usando las nuevas utilidades
        const currentUser = await getCurrentUser()

        if (!currentUser) {
          toast({
            title: "Error de autenticación",
            description: "No se pudo verificar tu identidad",
            type: "error",
          })
          return
        }

        setUserId(currentUser.id)

        // Obtener configuraciones de notificación de la base de datos
        const { data, error } = await supabase
          .from("notification_settings")
          .select("*")
          .eq("user_id", currentUser.id)
          .single()

        if (!error && data) {
          setSettings({
            emailNotifications: data.email_notifications || true,
            appNotifications: data.app_notifications || true,
            expenseThreshold: data.expense_threshold?.toString() || "5000",
            notificationFrequency: data.notification_frequency || "daily",
            newTransactionNotifications: data.new_transaction_notifications || true,
            pendingApprovalNotifications: data.pending_approval_notifications || true,
            systemUpdates: data.system_updates || false,
          })
        } else {
          // Si no hay configuraciones, crear un registro por defecto
          try {
            const { error: insertError } = await supabase.from("notification_settings").insert({
              user_id: currentUser.id,
              email_notifications: true,
              app_notifications: true,
              expense_threshold: 5000,
              notification_frequency: "daily",
              new_transaction_notifications: true,
              pending_approval_notifications: true,
              system_updates: false,
            })

            if (insertError && insertError.code !== "23505") {
              // Ignorar error de duplicado, pero loggear otros errores
              console.warn("No se pudieron crear configuraciones por defecto:", insertError)
            }
          } catch (insertError) {
            console.warn("Error al crear configuraciones por defecto:", insertError)
          }
        }
      } catch (error) {
        console.error("Error loading notification settings:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las configuraciones de notificaciones",
          type: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    loadNotificationSettings()
  }, [toast])

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setSettings((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string) => (value: string) => {
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveSettings = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "No se pudo identificar al usuario",
        type: "error",
      })
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.from("notification_settings").upsert({
        user_id: userId,
        email_notifications: settings.emailNotifications,
        app_notifications: settings.appNotifications,
        expense_threshold: Number.parseFloat(settings.expenseThreshold),
        notification_frequency: settings.notificationFrequency,
        new_transaction_notifications: settings.newTransactionNotifications,
        pending_approval_notifications: settings.pendingApprovalNotifications,
        system_updates: settings.systemUpdates,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      }

      toast({
        title: "Configuración guardada",
        description: "Tus preferencias de notificaciones han sido actualizadas",
      })
    } catch (error: any) {
      console.error("Error saving notification settings:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar las configuraciones",
        type: "error",
      })
    } finally {
      setSaving(false)
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
          <CardTitle>Preferencias de Notificaciones</CardTitle>
          <CardDescription>Configura cómo y cuándo quieres recibir notificaciones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Notificaciones por correo electrónico</h4>
                <p className="text-sm text-muted-foreground">Recibe notificaciones en tu correo electrónico</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={handleSwitchChange("emailNotifications")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Notificaciones en la aplicación</h4>
                <p className="text-sm text-muted-foreground">Recibe notificaciones dentro de la aplicación</p>
              </div>
              <Switch checked={settings.appNotifications} onCheckedChange={handleSwitchChange("appNotifications")} />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium">Configuración de alertas</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expenseThreshold">Umbral de gastos (ARS)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <Input
                    id="expenseThreshold"
                    name="expenseThreshold"
                    type="number"
                    className="pl-6"
                    value={settings.expenseThreshold}
                    onChange={handleInputChange}
                    placeholder="5000"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Recibe alertas cuando un gasto supere este monto</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationFrequency">Frecuencia de notificaciones</Label>
                <Select
                  value={settings.notificationFrequency}
                  onValueChange={handleSelectChange("notificationFrequency")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Tiempo real</SelectItem>
                    <SelectItem value="hourly">Cada hora</SelectItem>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Con qué frecuencia quieres recibir resúmenes</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="text-sm font-medium">Tipos de notificaciones</h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Nuevas transacciones</h4>
                  <p className="text-sm text-muted-foreground">Notificaciones sobre nuevas transacciones</p>
                </div>
                <Switch
                  checked={settings.newTransactionNotifications}
                  onCheckedChange={handleSwitchChange("newTransactionNotifications")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Transacciones pendientes de aprobación</h4>
                  <p className="text-sm text-muted-foreground">
                    Notificaciones sobre transacciones que requieren aprobación
                  </p>
                </div>
                <Switch
                  checked={settings.pendingApprovalNotifications}
                  onCheckedChange={handleSwitchChange("pendingApprovalNotifications")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Actualizaciones del sistema</h4>
                  <p className="text-sm text-muted-foreground">Notificaciones sobre actualizaciones y mantenimiento</p>
                </div>
                <Switch checked={settings.systemUpdates} onCheckedChange={handleSwitchChange("systemUpdates")} />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? "Guardando..." : "Guardar configuración"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
