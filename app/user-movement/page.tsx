"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/supabaseClient"
import { MovementForm } from "@/components/movement-form"

export default function UserMovementPage() {
  const [user, setUser] = useState(null)
  const [open, setOpen] = useState(false)

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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#e6eee0]">
        <div className="text-gray-600">Cargando usuario...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e6eee0]">
      <MovementForm open={open} onOpenChange={setOpen} user={user} hideCheckField={true} />
    </div>
  )
}
