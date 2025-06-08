import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, role = "user", username = "" } = body

    if (!email) {
      return NextResponse.json({ message: "Email requerido" }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Invitar usuario: esto envía un mail de invitación/registro
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)

    if (error) {
      console.error("Supabase Admin Error:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    const user = data.user

    // Insertar el perfil en la tabla personalizada `users`
    if (user) {
      const insertResult = await supabaseAdmin
        .from("users")
        .insert({
          id: user.id,
          email,
          role,
          username: username || email.split("@")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          type: "local",
        })

      if (insertResult.error) {
        console.error("Error al insertar perfil en users:", insertResult.error)
        return NextResponse.json({ message: "Usuario invitado, pero falló la inserción en users" }, { status: 500 })
      }
    }

    return NextResponse.json({ user }, { status: 200 })

  } catch (err: any) {
    console.error("API Error:", err)
    return NextResponse.json({ message: "Error al crear usuario" }, { status: 500 })
  }
}
