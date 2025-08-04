import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, role = "user", username = "" } = body

    if (!email || !password) {
      return NextResponse.json({ message: "Email y contraseña requeridos" }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Crear usuario con contraseña
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    })

    if (error) {
      console.error("Supabase Admin Error:", error)
      // Agrega esto para ver el error completo
      return NextResponse.json({ message: error.message, details: error }, { status: 500 })
    }

    const user = data.user

    // Insertar el perfil en la tabla personalizada `users`
    if (user) {
      const insertResult = await supabaseAdmin
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          role,
          type: "local",
          username: username || email.split("@")[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (insertResult.error) {
        console.error("Error al insertar perfil en users:", insertResult.error);
        return NextResponse.json({ message: insertResult.error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ user }, { status: 200 })

  } catch (err: any) {
    console.error("API Error:", err)
    return NextResponse.json({ message: err.message || "Error al crear usuario" }, { status: 500 })
  }
}

