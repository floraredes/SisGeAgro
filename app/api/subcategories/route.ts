import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("sub_category")
      .select(`
        id,
        description,
        category_id,
        categories:category_id (
          id,
          description
        )
      `)
      .order("description")

    if (error) {
      console.error("Error fetching subcategories:", error)
      return NextResponse.json({ error: "Error al obtener subcategorías" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in subcategories API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 