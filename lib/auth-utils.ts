import { supabase } from "./supabase/supabaseClient"

export interface AuthUser {
  id: string
  email: string
  role: string
  type: "local" | "supabase"
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    // Primero verificar si hay un usuario local en localStorage
    if (typeof window !== 'undefined') {
      const localUserId = localStorage.getItem("user_id")
      
      if (localUserId) {
        // Verificar que el usuario local existe en la base de datos
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, email, role, type")
          .eq("id", localUserId)
          .single()

        if (userError || !userData) {
          localStorage.removeItem("user_id")
          return null
        }

        return {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          type: "local" as const
        }
      }
    }

    // Si no hay usuario local, verificar sesión de Supabase Auth
    const { data, error } = await supabase.auth.getSession()

    if (error || !data.session) {
      return null
    }

    const user = data.session.user

    // Obtener información adicional del usuario desde la tabla users
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role, type")
      .eq("id", user.id)
      .single()

    if (userError) {
      console.error("Error al obtener datos del usuario:", userError)
      return null
    }

    return {
      id: user.id,
      email: user.email || "",
      role: userData?.role || "user",
      type: "supabase" as const
    }
  } catch (error) {
    console.error("Error al obtener usuario actual:", error)
    return null
  }
}

export async function logout(): Promise<void> {
  try {
    // Limpiar localStorage para usuarios locales
    if (typeof window !== 'undefined') {
      localStorage.removeItem("user_id")
    }
    
    // Cerrar sesión de Supabase Auth si existe
    await supabase.auth.signOut()
  } catch (error) {
    console.error("Error durante logout:", error)
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser()
  return user !== null
} 