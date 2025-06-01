import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables")
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

// Agregar una función para refrescar el token
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error("Error refreshing session:", error)
      return false
    }
    return !!data.session
  } catch (error) {
    console.error("Exception during session refresh:", error)
    return false
  }
}

// Mejorar la función isAuthenticated para intentar refrescar la sesión si es necesario
export async function isAuthenticated() {
  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error checking authentication:", error)
      return false
    }

    if (!data.session) {
      // Intentar refrescar la sesión
      return await refreshSession()
    }

    return true
  } catch (error) {
    console.error("Exception during authentication check:", error)
    return false
  }
}
