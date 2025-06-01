// /app/api/create-user/route.ts

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ message: "Email y contraseña requeridos" }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
    })

    if (error) {
      console.error("Supabase Admin Error:", error)
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    return NextResponse.json({ user: data.user }, { status: 200 })

  } catch (err: any) {
    console.error("API Error:", err)
    return NextResponse.json({ message: "Error al crear usuario" }, { status: 500 })
  }
}
