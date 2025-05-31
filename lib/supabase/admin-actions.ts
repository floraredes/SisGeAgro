import { supabaseServer } from "./server"

// Ejemplo de función administrativa que requiere la clave de servicio
export async function adminDeleteUser(userId: string) {
  try {
    const { error } = await supabaseServer.auth.admin.deleteUser(userId)
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { success: false, error }
  }
}

// Otras funciones administrativas que requieren la clave de servicio
export async function adminGetUsers() {
  try {
    const { data, error } = await supabaseServer.auth.admin.listUsers()
    if (error) throw error
    return { success: true, users: data.users }
  } catch (error) {
    console.error("Error fetching users:", error)
    return { success: false, error }
  }
}

