import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("payment")
      .select("payment_type")
      .order("payment_type")

    if (error) {
      console.error("Error fetching payment types:", error)
      return NextResponse.json({ error: "Error al obtener tipos de pago" }, { status: 500 })
    }

    const uniquePaymentTypes = [...new Set(data?.map((p) => p.payment_type) || [])]

    return NextResponse.json({ data: uniquePaymentTypes })
  } catch (error) {
    console.error("Error in payment-types API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 