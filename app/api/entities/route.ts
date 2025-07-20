import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("entity")
      .select("*")
      .order("nombre")

    if (error) {
      console.error("Error fetching entities:", error)
      return NextResponse.json({ error: "Error al obtener entidades" }, { status: 500 })
    }

    return NextResponse.json({ entities: data })
  } catch (error) {
    console.error("Error in entities API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
