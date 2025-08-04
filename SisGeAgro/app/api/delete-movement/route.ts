import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { movementId } = await req.json()

    if (!movementId) {
      return NextResponse.json({ error: "ID del movimiento es requerido" }, { status: 400 })
    }

    // 1. Obtener los datos del movimiento para conocer las relaciones
    const { data: movementData, error: movementError } = await supabaseAdmin
      .from("movements")
      .select("operation_id")
      .eq("id", movementId)
      .maybeSingle()

    if (movementError) {
      console.error("Error al obtener movimiento:", movementError)
      return NextResponse.json({ error: "No se pudo obtener la información del movimiento" }, { status: 500 })
    }

    if (!movementData) {
      return NextResponse.json({ error: "El movimiento no existe o ya fue eliminado" }, { status: 404 })
    }

    // 2. Eliminar los impuestos asociados al movimiento
    const { error: taxesError } = await supabaseAdmin
      .from("movement_taxes")
      .delete()
      .eq("movement_id", movementId)

    if (taxesError) {
      console.error("Error al eliminar impuestos:", taxesError)
      return NextResponse.json({ error: "Error al eliminar impuestos asociados" }, { status: 500 })
    }

    // 3. Eliminar el movimiento
    const { data: deleteResult, error: deleteError } = await supabaseAdmin
      .from("movements")
      .delete()
      .eq("id", movementId)
      .select()

    if (deleteError) {
      console.error("Error al eliminar movimiento:", deleteError)
      return NextResponse.json({ error: "No se pudo eliminar el movimiento" }, { status: 500 })
    }

    if (!deleteResult || deleteResult.length === 0) {
      return NextResponse.json({ error: "El movimiento no existe o ya fue eliminado" }, { status: 404 })
    }

    // 4. Obtener los datos de la operación
    const { data: operationData, error: operationError } = await supabaseAdmin
      .from("operations")
      .select("payment_id, bill_id")
      .eq("id", movementData.operation_id)
      .maybeSingle()

    if (operationError) {
      console.error("Error al obtener operación:", operationError)
      return NextResponse.json({ error: "No se pudo obtener la información de la operación" }, { status: 500 })
    }

    if (!operationData) {
      return NextResponse.json({ error: "La operación asociada no existe" }, { status: 404 })
    }

    // 5. Eliminar la operación
    const { error: operationDeleteError } = await supabaseAdmin
      .from("operations")
      .delete()
      .eq("id", movementData.operation_id)

    if (operationDeleteError) {
      console.error("Error al eliminar operación:", operationDeleteError)
      return NextResponse.json({ error: "Error al eliminar la operación" }, { status: 500 })
    }

    // 6. Eliminar el pago y la factura
    const { error: paymentError } = await supabaseAdmin
      .from("payment")
      .delete()
      .eq("id", operationData.payment_id)

    if (paymentError) {
      console.error("Error al eliminar pago:", paymentError)
      return NextResponse.json({ error: "Error al eliminar el pago" }, { status: 500 })
    }

    const { error: billError } = await supabaseAdmin
      .from("bills")
      .delete()
      .eq("id", operationData.bill_id)

    if (billError) {
      console.error("Error al eliminar factura:", billError)
      return NextResponse.json({ error: "Error al eliminar la factura" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Movimiento eliminado correctamente" 
    })

  } catch (error: any) {
    console.error("Error en delete-movement API:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor" 
    }, { status: 500 })
  }
} 