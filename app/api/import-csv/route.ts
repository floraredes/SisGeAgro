import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { rows, userId } = await req.json()
    if (!Array.isArray(rows) || !userId) {
      return NextResponse.json({ error: "No se enviaron datos válidos o falta userId" }, { status: 400 })
    }

    // Inicializar resultados por fila
    const results: { row: number; success: boolean; error?: string }[] = rows.map((_, i) => ({ row: i + 2, success: true }))

    // 1. Procesar entidades únicas a crear
    const entitiesToCreate: any[] = []
    const entityKeyMap = new Map() // key: nombre+cuit_cuil, value: index en entitiesToCreate
    const entityNameCuitSet = new Set()
    rows.forEach((row, idx) => {
      if (!row.entityId && (row.entityName || row.entityCuitCuil)) {
        const key = `${row.entityName || ""}|${row.entityCuitCuil || ""}`
        if (!entityNameCuitSet.has(key)) {
          entitiesToCreate.push({ nombre: row.entityName, cuit_cuil: row.entityCuitCuil })
          entityKeyMap.set(key, null) // lo llenaremos luego con el id
          entityNameCuitSet.add(key)
        }
      }
    })
    // Crear entidades en lote
    let createdEntities: any[] = []
    if (entitiesToCreate.length > 0) {
      const { data, error } = await supabase
        .from("entity")
        .upsert(entitiesToCreate, { onConflict: "cuit_cuil" })
        .select()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      createdEntities = data
      // Mapear los ids a los keys
      createdEntities.forEach(ent => {
        const key = `${ent.nombre || ""}|${ent.cuit_cuil || ""}`
        entityKeyMap.set(key, ent.id)
      })
    }

    // 2. Procesar categorías únicas a crear
    const categoriesToCreate: any[] = []
    const categoryKeyMap = new Map()
    const categorySet = new Set()
    rows.forEach(row => {
      if (row.category) {
        const key = row.category.trim().toUpperCase()
        if (!categorySet.has(key)) {
          categoriesToCreate.push({ description: key })
          categoryKeyMap.set(key, null)
          categorySet.add(key)
        }
      }
    })
    // Buscar existentes y crear las que faltan
    let allCategories: any[] = []
    if (categoriesToCreate.length > 0) {
      // Buscar existentes
      const { data: existingCategories, error: fetchCatErr } = await supabase
        .from("category")
        .select("id, description")
        .in("description", Array.from(categorySet))
      if (fetchCatErr) return NextResponse.json({ error: fetchCatErr.message }, { status: 500 })
      allCategories = existingCategories || []
      // Crear las que faltan
      const existingDesc = new Set(allCategories.map(c => c.description))
      const toInsert = categoriesToCreate.filter(c => !existingDesc.has(c.description))
      if (toInsert.length > 0) {
        const { data: newCats, error: insCatErr } = await supabase
          .from("category")
          .insert(toInsert)
          .select()
        if (insCatErr) return NextResponse.json({ error: insCatErr.message }, { status: 500 })
        allCategories = allCategories.concat(newCats)
      }
      // Mapear ids
      allCategories.forEach(cat => {
        categoryKeyMap.set(cat.description, cat.id)
      })
    }

    // 3. Procesar subcategorías únicas a crear
    const subcategoriesToCreate: any[] = []
    const subcategoryKeyMap = new Map() // key: desc|catId
    const subcategorySet = new Set()
    rows.forEach(row => {
      if (row.subCategory && row.category) {
        const catKey = row.category.trim().toUpperCase()
        const catId = categoryKeyMap.get(catKey)
        if (!catId) return // skip si no hay catId
        const subKey = `${row.subCategory.trim().toUpperCase()}|${catId}`
        if (!subcategorySet.has(subKey)) {
          subcategoriesToCreate.push({ description: row.subCategory.trim().toUpperCase(), category_id: catId })
          subcategoryKeyMap.set(subKey, null)
          subcategorySet.add(subKey)
        }
      }
    })
    // Buscar existentes y crear las que faltan
    let allSubcategories: any[] = []
    if (subcategoriesToCreate.length > 0) {
      // Buscar existentes
      const { data: existingSubs, error: fetchSubErr } = await supabase
        .from("sub_category")
        .select("id, description, category_id")
        .in("description", subcategoriesToCreate.map(s => s.description))
      if (fetchSubErr) return NextResponse.json({ error: fetchSubErr.message }, { status: 500 })
      allSubcategories = existingSubs || []
      // Crear las que faltan
      const existingSubKeys = new Set(allSubcategories.map(s => `${s.description}|${s.category_id}`))
      const toInsert = subcategoriesToCreate.filter(s => !existingSubKeys.has(`${s.description}|${s.category_id}`))
      if (toInsert.length > 0) {
        const { data: newSubs, error: insSubErr } = await supabase
          .from("sub_category")
          .insert(toInsert)
          .select()
        if (insSubErr) return NextResponse.json({ error: insSubErr.message }, { status: 500 })
        allSubcategories = allSubcategories.concat(newSubs)
      }
      // Mapear ids
      allSubcategories.forEach(sub => {
        const subKey = `${sub.description}|${sub.category_id}`
        subcategoryKeyMap.set(subKey, sub.id)
      })
    }

    // 4. Crear payments en lote
    const paymentsToCreate = rows.map(row => ({
      payment_type: row.paymentType === "Otro" ? row.customPaymentType : row.paymentType
    }))
    let payments;
    try {
      const res = await supabase.from("payment").insert(paymentsToCreate).select()
      if (res.error) throw res.error
      payments = res.data
    } catch (err: any) {
      // Si falla el insert masivo, todas las filas fallan
      results.forEach(r => { r.success = false; r.error = "Error creando payments: " + (err.message || err) })
      return NextResponse.json({ results })
    }

    // 5. Crear bills en lote
    const billsToCreate = rows.map((row, idx) => {
      let entityId = row.entityId
      if (!entityId && (row.entityName || row.entityCuitCuil)) {
        const key = `${row.entityName || ""}|${row.entityCuitCuil || ""}`
        entityId = entityKeyMap.get(key)
      }
      return {
        bill_number: row.billNumber || `AUTO-${Date.now()}-${idx}`,
        bill_date: row.billDate,
        bill_amount: row.amount,
        entity_id: entityId,
      }
    })
    let bills;
    try {
      const res = await supabase.from("bills").insert(billsToCreate).select()
      if (res.error) throw res.error
      bills = res.data
    } catch (err: any) {
      results.forEach(r => { r.success = false; r.error = "Error creando bills: " + (err.message || err) })
      return NextResponse.json({ results })
    }

    // 6. Crear operations en lote
    const operationsToCreate = payments.map((pay, idx) => ({
      payment_id: pay.id,
      bill_id: bills[idx].id
    }))
    let operations;
    try {
      const res = await supabase.from("operations").insert(operationsToCreate).select()
      if (res.error) throw res.error
      operations = res.data
    } catch (err: any) {
      results.forEach(r => { r.success = false; r.error = "Error creando operations: " + (err.message || err) })
      return NextResponse.json({ results })
    }

    // 7. Crear movements en lote
    const movementsToCreate = rows.map((row, idx) => {
      const catKey = row.category.trim().toUpperCase()
      const catId = categoryKeyMap.get(catKey)
      const subKey = `${row.subCategory.trim().toUpperCase()}|${catId}`
      const subCatId = subcategoryKeyMap.get(subKey)
      return {
        description: row.description,
        movement_type: row.movementType,
        operation_id: operations[idx].id,
        sub_category_id: subCatId,
        created_by: userId,
        is_tax_payment: row.isTaxPayment,
        related_tax_id: row.isTaxPayment ? row.relatedTaxId : null,
        check: row.check,
      }
    })
    let movements;
    try {
      const res = await supabase.from("movements").insert(movementsToCreate).select()
      if (res.error) throw res.error
      movements = res.data
    } catch (err: any) {
      results.forEach(r => { r.success = false; r.error = "Error creando movements: " + (err.message || err) })
      return NextResponse.json({ results })
    }

    // --- NUEVO: Procesar taxes únicos a crear ---
    // Alternativas de entrada: 
    // 1. selectedTaxes como JSON string (array de objetos)
    // 2. selectedTaxes como string de nombres separados por coma y selectedTaxesPercentages como string de porcentajes separados por coma

    // 1. Parsear taxes por fila y recolectar todos los taxes únicos
    const allTaxesSet = new Set<string>()
    const taxesToCreate: { name: string, percentage: number }[] = []
    const taxesPerRow: { name: string, percentage: number }[][] = rows.map((row, idx) => {
      let taxes: { name: string, percentage: number }[] = []
      // Caso 1: selectedTaxes como JSON string
      if (row.selectedTaxes && typeof row.selectedTaxes === 'string' && row.selectedTaxes.trim().startsWith('[')) {
        try {
          taxes = JSON.parse(row.selectedTaxes)
        } catch { console.log(`[IMPORT BULK] Error parseando JSON en fila ${idx + 2}`) }
      }
      // Caso 2: selectedTaxes y selectedTaxesPercentages como strings separados por coma
      else if (row.selectedTaxes && typeof row.selectedTaxes === 'string') {
        const names = row.selectedTaxes.split(',').map((s: string) => s.trim()).filter(Boolean)
        let percentages: string[] = []
        if (row.selectedTaxesPercentages && typeof row.selectedTaxesPercentages === 'string') {
          percentages = row.selectedTaxesPercentages.split(',').map((s: string) => s.trim())
        }
        taxes = names.map((name: string, idx2: number) => ({
          name,
          percentage: Number(percentages[idx2] || 0)
        }))
      }
      // Caso 3: selectedTaxes como array de objetos (ya parseado)
      else if (Array.isArray(row.selectedTaxes)) {
        taxes = row.selectedTaxes
      }
      // Recolectar taxes únicos
      taxes.forEach(tax => {
        const key = `${tax.name}|${tax.percentage}`
        if (!allTaxesSet.has(key) && tax.name && tax.percentage) {
          taxesToCreate.push({ name: tax.name, percentage: tax.percentage })
          allTaxesSet.add(key)
        }
      })
      if (taxes.length > 0)
      return taxes
    })

    // 2. Buscar/crear taxes en lote
    let allTaxes: any[] = []
    if (taxesToCreate.length > 0) {
      // Buscar existentes
      const { data: existingTaxes, error: fetchTaxErr } = await supabase
        .from("taxes")
        .select("id, name, percentage")
        .in("name", taxesToCreate.map(t => t.name))
      if (fetchTaxErr) { console.log("[IMPORT BULK] Error buscando taxes:", fetchTaxErr); return NextResponse.json({ error: fetchTaxErr.message }, { status: 500 }) }
      allTaxes = existingTaxes || []
      // Crear los que faltan
      const existingKeys = new Set(allTaxes.map(t => `${t.name}|${t.percentage}`))
      const toInsert = taxesToCreate.filter(t => !existingKeys.has(`${t.name}|${t.percentage}`))
      if (toInsert.length > 0) {
        console.log("[IMPORT BULK] Taxes a crear:", toInsert)
        const { data: newTaxes, error: insTaxErr } = await supabase
          .from("taxes")
          .insert(toInsert)
          .select()
        if (insTaxErr) { console.log("[IMPORT BULK] Error creando taxes:", insTaxErr); return NextResponse.json({ error: insTaxErr.message }, { status: 500 }) }
        allTaxes = allTaxes.concat(newTaxes)
      }
    }
    // Mapear tax name+percentage a id
    const taxKeyToId = new Map<string, number>()
    allTaxes.forEach(tax => {
      taxKeyToId.set(`${tax.name}|${tax.percentage}`, tax.id)
    })
    // Log extra: mostrar mapeo por fila
    taxesPerRow.forEach((taxes, idx) => {
      taxes.forEach(tax => {
        const key = `${tax.name}|${tax.percentage}`
        const id = taxKeyToId.get(key)
      })
    })

    // 8. Crear movement_taxes en lote (si hay)
    let movementTaxesToCreate: any[] = []
    rows.forEach((row, idx) => {
      const taxes = taxesPerRow[idx]
      if (taxes && taxes.length > 0) {
        taxes.forEach((tax: any) => {
          const taxId = taxKeyToId.get(`${tax.name}|${tax.percentage}`)
          if (taxId) {
            movementTaxesToCreate.push({
              movement_id: movements[idx].id,
              tax_id: taxId,
              calculated_amount: (row.amount * tax.percentage) / 100,
            })
          } else {
            console.log(`[IMPORT BULK] No se encontró taxId para tax`, tax, `en fila ${idx + 2}`)
          }
        })
      }
    })
    if (movementTaxesToCreate.length > 0) {
      try {
        const { error: movTaxErr } = await supabase.from("movement_taxes").insert(movementTaxesToCreate)
        if (movTaxErr) throw movTaxErr
      } catch (err: any) {
        // Si falla el insert masivo de taxes, marca error solo en las filas afectadas
        rows.forEach((row, idx) => {
          if (taxesPerRow[idx] && taxesPerRow[idx].length > 0) {
            results[idx].success = false
            results[idx].error = "Error creando movement_taxes: " + (err.message || err)
          }
        })
        console.log("[IMPORT BULK] Error creando movement_taxes:", err)
      }
    } else {
    }

    // 9. (Opcional) Notificaciones: puedes implementar lógica en lote aquí si lo necesitas

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error inesperado" }, { status: 500 })
  }
}
