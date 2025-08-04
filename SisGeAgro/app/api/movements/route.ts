import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const movementType = searchParams.get("movementType") || "all"

    // Construir la consulta base
    let query = supabaseAdmin
      .from("movements")
      .select(`
        id,
        description,
        movement_type,
        operation_id,
        sub_category_id,
        created_by,
        check,
        operations (
          id,
          payment_id,
          bill_id,
          payments:payment_id (
            id,
            payment_type
          ),
          bills:bill_id (
            id,
            bill_number,
            bill_date,
            bill_amount,
            entity_id,
            entity:entity_id (
              id,
              nombre
            )
          )
        ),
        sub_categories:sub_category_id (
          id,
          description,
          category_id,
          categories:category_id (
            id,
            description
          )
        ),
        movement_taxes (
          id,
          tax_id,
          calculated_amount,
          taxes:tax_id (
            id,
            name,
            percentage
          )
        )
      `)
      .order("id", { ascending: false })

    // Aplicar filtro de tipo de movimiento si es necesario
    if (movementType !== "all") {
      query = query.eq("movement_type", movementType)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching movements:", error)
      return NextResponse.json({ error: "Error al obtener movimientos" }, { status: 500 })
    }

    return NextResponse.json({ movements: data })
  } catch (error) {
    console.error("Error in movements API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      startDate, 
      endDate, 
      movementType = "all",
      categoryId,
      subcategoryId,
      entityId,
      paymentType,
      includeStats = false 
    } = body



    // Construir la consulta base
    let query = supabaseAdmin
      .from("movements")
      .select(`
        id,
        description,
        movement_type,
        operation_id,
        sub_category_id,
        created_by,
        check,
        operations (
          id,
          payment_id,
          bill_id,
          payments:payment_id (
            id,
            payment_type
          ),
          bills:bill_id (
            id,
            bill_number,
            bill_date,
            bill_amount,
            entity_id,
            entity:entity_id (
              id,
              nombre
            )
          )
        ),
        sub_categories:sub_category_id (
          id,
          description,
          category_id,
          categories:category_id (
            id,
            description
          )
        ),
        movement_taxes (
          id,
          tax_id,
          calculated_amount,
          taxes:tax_id (
            id,
            name,
            percentage
          )
        )
      `)
      .order("id", { ascending: false })

    // Aplicar filtros
    if (movementType !== "all") {
      query = query.eq("movement_type", movementType)
    }

    if (categoryId) {
      query = query.eq("sub_categories.category_id", categoryId)
    }

    if (subcategoryId) {
      query = query.eq("sub_category_id", subcategoryId)
    }

    if (entityId) {
      query = query.eq("operations.bills.entity_id", entityId)
    }

    if (paymentType) {
      query = query.eq("operations.payments.payment_type", paymentType)
    }

    // Aplicar filtro de fechas si se proporcionan
    if (startDate && endDate) {
      query = query.gte("operations.bills.bill_date", startDate)
      query = query.lte("operations.bills.bill_date", endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching movements:", error)
      return NextResponse.json({ error: "Error al obtener movimientos" }, { status: 500 })
    }



    return NextResponse.json({ movements: data || [] })
  } catch (error) {
    console.error("Error in movements POST API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
} 