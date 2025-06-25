"use client"

import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase/supabaseClient"
import { MovementForm } from "@/components/movement-form"

export default function UserMovementPage() {
  const [user, setUser] = useState(null)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      const userId = localStorage.getItem("user_id")
      if (!userId) return

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single()

      if (!error && data) {
        setUser(data)
        setOpen(true)
      }
    }

    loadUser()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user_id")
    router.push("/auth")
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e6eee0]">
        <div className="text-gray-600">Cargando usuario...</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #e6eee0 0%, #4F7942 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Formas orgánicas */}
      <div style={{
        position: "absolute", top: "-20%", left: "-10%", width: "50%", height: "50%",
        borderRadius: "50%", background: "rgba(79, 121, 66, 0.2)", filter: "blur(60px)", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", right: "-10%", width: "60%", height: "60%",
        borderRadius: "50%", background: "rgba(79, 121, 66, 0.3)", filter: "blur(80px)", zIndex: 0,
      }} />
      <div style={{
        position: "absolute", top: "30%", right: "20%", width: "40%", height: "40%",
        borderRadius: "50%", background: "rgba(79, 121, 66, 0.15)", filter: "blur(50px)", zIndex: 0,
      }} />


      {/* Formulario directamente, NO en Dialog */}
      <div className="w-full max-w-2xl z-10">
        <MovementForm
          open={true}
          onOpenChange={() => {}}
          user={user}
          hideCheckField={true}
          onSuccess={() => router.push("/user-movement/success")}
        />
      </div>

      {/* Botón de logout en portal */}
      {typeof window !== "undefined" &&
        createPortal(
          <button
            id="logout-btn"
            onClick={handleLogout}
            style={{
              position: "fixed",
              top: 24,
              right: 24,
              zIndex: 2147483647,
              background: "#4F7942",
              color: "white",
              borderRadius: 8,
              padding: "10px 20px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              pointerEvents: "auto", // Forzar pointer events
            }}
          >
            Logout
          </button>,
          document.body
        )}
    </div>
  )
}
