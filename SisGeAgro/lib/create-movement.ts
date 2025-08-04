import { SupabaseClient } from "@supabase/supabase-js"

export interface MovementInput {
  description: string
  movementType: string
  paymentType: string
  customPaymentType?: string
  amount: number
  category: string
  subCategory: string
  billNumber: string
  billDate: string
  entityName: string
  entityId?: string
  entityCuitCuil?: string
  selectedTaxes?: { id: number; percentage: number }[]
  isTaxPayment?: boolean
  relatedTaxId?: number | null
  check?: boolean
}

export async function createMovement(
  formData: MovementInput,
  userId: string,
  supabase: SupabaseClient
) {
  // 1. Crear o buscar entidad
  let entityData
  if (formData.entityId) {
    const { data, error } = await supabase.from("entity").select("*").eq("id", formData.entityId).single()
    if (error) throw error
    entityData = data
  } else {
    const { data, error } = await supabase
      .from("entity")
      .upsert(
        { nombre: formData.entityName, cuit_cuil: formData.entityCuitCuil || "" },
        { onConflict: "cuit_cuil" }
      )
      .select()
      .single()
    if (error) throw error
    entityData = data
  }

  // 2. Crear pago
  const { data: paymentData, error: paymentError } = await supabase
    .from("payment")
    .insert([
      { payment_type: formData.paymentType === "Otro" ? formData.customPaymentType : formData.paymentType }
    ])
    .select()
    .single()
  if (paymentError) throw paymentError

  // 3. Crear factura
  const { data: billData, error: billError } = await supabase
    .from("bills")
    .insert([
      {
        bill_number: formData.billNumber || `AUTO-${Date.now()}`,
        bill_date: formData.billDate,
        bill_amount: formData.amount,
        entity_id: entityData.id,
      }
    ])
    .select()
    .single()
  if (billError) throw billError

  // 4. Crear o buscar categoría
  let categoryData
  const { data: existingCategories, error: categoryFetchError } = await supabase
    .from("category")
    .select("*")
    .ilike("description", formData.category.toUpperCase())
    .limit(1)
  if (categoryFetchError) throw categoryFetchError
  if (existingCategories && existingCategories.length > 0) {
    categoryData = existingCategories[0]
  } else {
    const { data: newCategory, error: categoryInsertError } = await supabase
      .from("category")
      .insert([{ description: formData.category.toUpperCase() }])
      .select()
      .single()
    if (categoryInsertError) throw categoryInsertError
    categoryData = newCategory
  }

  // 5. Crear o buscar subcategoría
  let subcategoryData
  const { data: existingSubcategories, error: subcategoryFetchError } = await supabase
    .from("sub_category")
    .select("*")
    .ilike("description", formData.subCategory.toUpperCase())
    .eq("category_id", categoryData.id)
    .limit(1)
  if (subcategoryFetchError) throw subcategoryFetchError
  if (existingSubcategories && existingSubcategories.length > 0) {
    subcategoryData = existingSubcategories[0]
  } else {
    const { data: newSubcategory, error: subcategoryInsertError } = await supabase
      .from("sub_category")
      .insert([{ description: formData.subCategory.toUpperCase(), category_id: categoryData.id }])
      .select()
      .single()
    if (subcategoryInsertError) throw subcategoryInsertError
    subcategoryData = newSubcategory
  }

  // 6. Crear operación
  const { data: operationData, error: operationError } = await supabase
    .from("operations")
    .insert([{ payment_id: paymentData.id, bill_id: billData.id }])
    .select()
    .single()
  if (operationError) throw operationError

  // 7. Crear movimiento
  const { data: movementData, error: movementError } = await supabase
    .from("movements")
    .insert([
      {
        description: formData.description,
        movement_type: formData.movementType,
        operation_id: operationData.id,
        sub_category_id: subcategoryData.id,
        created_by: userId,
        is_tax_payment: formData.isTaxPayment,
        related_tax_id: formData.isTaxPayment ? formData.relatedTaxId : null,
        check: formData.check,
      }
    ])
    .select()
    .single()
  if (movementError) throw movementError

  // 8. Crear impuestos asociados
  if (formData.selectedTaxes && formData.selectedTaxes.length > 0) {
    const movementTaxesData = formData.selectedTaxes.map((tax) => ({
      movement_id: movementData.id,
      tax_id: tax.id,
      calculated_amount: (formData.amount * tax.percentage) / 100,
    }))
    const { error: taxError } = await supabase.from("movement_taxes").insert(movementTaxesData)
    if (taxError) throw taxError
  }

  return movementData
}