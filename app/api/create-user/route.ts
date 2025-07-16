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
      const updateResult = await supabaseAdmin
        .from("users")
        .update({
          role,
          type: "local",
          username: username || email.split("@")[0],
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateResult.error) {
        console.error("Error al actualizar perfil en users:", updateResult.error);
        return NextResponse.json({ message: updateResult.error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ user }, { status: 200 })

  } catch (err: any) {
    console.error("API Error:", err)
    return NextResponse.json({ message: err.message || "Error al crear usuario" }, { status: 500 })
  }
}

