import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("category")
      .select("*")
      .order("description")

    if (error) {
      console.error("Error fetching categories:", error)
      return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 })
    }

    return NextResponse.json({ categories: data })
  } catch (error) {
    console.error("Error in categories API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 