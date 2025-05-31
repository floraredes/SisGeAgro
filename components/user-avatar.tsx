"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from "@/lib/supabase/supabaseClient"

export function UserAvatar() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
          console.error("Error fetching user:", error)
          return
        }

        if (data.user) {
          setUser(data.user)
        }
      } catch (error) {
        console.error("Exception during user fetch:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  // Obtener las iniciales del usuario para el fallback
  const getUserInitials = () => {
    if (!user) return "U"

    // Si tenemos un nombre de usuario en los metadatos
    if (user.user_metadata?.username) {
      return user.user_metadata.username.substring(0, 2).toUpperCase()
    }

    // Si no, usamos el email
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase()
    }

    return "U"
  }

  // Obtener el nombre para mostrar
  const getDisplayName = () => {
    if (!user) return "Usuario"

    // Si tenemos un nombre de usuario en los metadatos
    if (user.user_metadata?.username) {
      return user.user_metadata.username
    }

    // Si no, usamos la parte del email antes del @
    if (user.email) {
      return user.email.split("@")[0]
    }

    return "Usuario"
  }

  return (
    <div className="flex items-center gap-2">
      <Avatar>
        <AvatarImage src={user?.user_metadata?.avatar_url || ""} />
        <AvatarFallback>{loading ? "..." : getUserInitials()}</AvatarFallback>
      </Avatar>
      <div className="hidden md:block">
        <p className="text-sm font-medium">{loading ? "Cargando..." : getDisplayName()}</p>
        <p className="text-xs text-muted-foreground">{user?.user_metadata?.role || "Usuario"}</p>
      </div>
    </div>
  )
}

