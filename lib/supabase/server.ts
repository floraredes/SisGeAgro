// Este archivo es para uso exclusivo en el servidor
import { createClient } from "@supabase/supabase-js"

// Estas variables deben configurarse en el servidor sin el prefijo NEXT_PUBLIC_
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase environment variables for server")
}

export const supabaseServer = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false, // No necesitamos persistir la sesión en el servidor
  },
})

