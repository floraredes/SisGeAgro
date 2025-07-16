"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/supabaseClient"
import { Badge } from "@/components/ui/badge"
import { BellIcon } from "lucide-react"
import { MainNavigation } from "@/components/main-navigation"
import { CurrencyProvider } from "@/contexts/currency-context"
import { CurrencySelector } from "@/components/currency-selector"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState("Usuario")
  const [userId, setUserId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  // Obtener usuario y notificaciones
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.auth.getSession()

        if (error || !data.session) {
          console.error("Error durante autenticación:", error)
          router.push("/auth")
          return
        }

        const user = data.session.user
        setUserId(user.id)

        // Obtener el nombre desde la tabla unificada `profiles`
        const { data: userProfile, error: profileError } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Error al obtener perfil del usuario:", profileError)
        }

        const displayName = userProfile?.username || user.email?.split("@")[0] || "Usuario"
        setUserName(displayName)

        // Consultar notificaciones no leídas
        const { data: notifData, error: notifError } = await supabase
          .from("notifications")
          .select("id, title, body, link, read, created_at, type")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20)
        if (!notifError && notifData) {
          setNotifications(notifData)
          setUnreadCount(notifData.filter((n:any) => !n.read).length)
        }
      } catch (error) {
        console.error("Excepción al verificar autenticación:", error)
        router.push("/auth")
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  // Marcar notificación como leída
  const markAsRead = async (id: string) => {
    if (!userId) return;
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Marcar todas como leídas
  const markAllAsRead = async () => {
    if (!userId) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-[#4F7942] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <CurrencyProvider>
      <div className="flex h-screen overflow-hidden min-w-0 min-h-0">
        <MainNavigation />
        <div className="flex-1 flex flex-col w-full min-w-0 min-h-0">
          <header className="flex h-16 min-h-16 items-center justify-between border-b px-6 bg-white z-10">
            <div className="flex-1">
              <CurrencySelector />
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button onClick={() => setNotifOpen((v) => !v)} className="focus:outline-none">
                  <BellIcon className="h-6 w-6 text-muted-foreground" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-96 bg-white border rounded shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <span className="font-semibold">Notificaciones</span>
                      <button className="text-xs text-blue-600 hover:underline" onClick={markAllAsRead}>
                        Marcar todas como leídas
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No hay notificaciones</div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`px-4 py-3 border-b last:border-b-0 flex items-start gap-2 ${notif.read ? "bg-gray-50" : "bg-blue-50"}`}>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{notif.title}</div>
                            <div className="text-xs text-gray-600 whitespace-pre-line">{notif.body}</div>
                            <div className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</div>
                            {notif.link && (
                              <a href={notif.link} className="text-xs text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Ver más</a>
                            )}
                          </div>
                          {!notif.read && (
                            <button className="ml-2 text-xs text-green-600 hover:underline" onClick={() => markAsRead(notif.id)}>
                              Marcar como leída
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">Hola, {userName}</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto min-h-0 min-w-0 p-6 bg-[#F5F6FA] flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </CurrencyProvider>
  )
}
