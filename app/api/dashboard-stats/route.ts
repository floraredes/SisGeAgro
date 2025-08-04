import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "startDate y endDate son requeridos" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("movements")
      .select(`
        id,
        movement_type,
        description,
        sub_category_id,
        operations:operation_id (
          bills:bill_id (
            bill_amount,
            bill_date
          )
        ),
        movement_taxes (
          calculated_amount,
          tax_id,
          taxes (
            name,
            percentage
          )
        ),
        sub_categories:sub_category_id (
          categories:category_id (
            description
          )
        )
      `)

    if (error) {
      console.error("Error fetching dashboard stats:", error)
      return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error in dashboard-stats API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}