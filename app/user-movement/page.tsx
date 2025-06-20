"use client"

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

      <button
        className="absolute top-6 right-6 py-2 px-4 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition z-10"
        onClick={handleLogout}
      >
        Salir
      </button>

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
    </div>
  )
}
