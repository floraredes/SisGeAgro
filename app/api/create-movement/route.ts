import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const form = await req.json();

    // 1. Crear payment
    const { data: payment, error: paymentError } = await supabase
      .from("payment")
      .insert([{ payment_type: form.paymentType === "Otro" ? form.customPaymentType : form.paymentType }])
      .select()
      .single();
    if (paymentError) throw paymentError;

    // 2. Crear bill
    const { data: bill, error: billError } = await supabase
      .from("bills")
      .insert([{
        bill_number: form.billNumber || `AUTO-${Date.now()}`,
        bill_date: form.billDate,
        bill_amount: form.amount,
        entity_id: form.entityId,
      }])
      .select()
      .single();
    if (billError) throw billError;

    // 3. Buscar o crear categoría
    let { data: category, error: categoryFetchError } = await supabase
      .from("category")
      .select("*")
      .ilike("description", form.category.toUpperCase())
      .limit(1);
    if (categoryFetchError) throw categoryFetchError;
    if (!category || category.length === 0) {
      const { data: newCategory, error: categoryInsertError } = await supabase
        .from("category")
        .insert([{ description: form.category.toUpperCase() }])
        .select()
        .single();
      if (categoryInsertError) throw categoryInsertError;
      category = [newCategory];
    }

    // 4. Buscar o crear subcategoría
    let { data: subcategory, error: subcategoryFetchError } = await supabase
      .from("sub_category")
      .select("*")
      .ilike("description", form.subCategory.toUpperCase())
      .eq("category_id", category[0].id)
      .limit(1);
    if (subcategoryFetchError) throw subcategoryFetchError;
    if (!subcategory || subcategory.length === 0) {
      const { data: newSubcategory, error: subcategoryInsertError } = await supabase
        .from("sub_category")
        .insert([{ description: form.subCategory.toUpperCase(), category_id: category[0].id }])
        .select()
        .single();
      if (subcategoryInsertError) throw subcategoryInsertError;
      subcategory = [newSubcategory];
    }

    // 5. Crear operation
    const { data: operation, error: operationError } = await supabase
      .from("operations")
      .insert([{ payment_id: payment.id, bill_id: bill.id }])
      .select()
      .single();
    if (operationError) throw operationError;

    // 6. Crear movement
    const { data: movement, error: movementError } = await supabase
      .from("movements")
      .insert([{
        description: form.description,
        movement_type: form.movementType,
        operation_id: operation.id,
        sub_category_id: subcategory[0].id,
        created_by: form.username,
        is_tax_payment: form.isTaxPayment,
        related_tax_id: form.isTaxPayment ? form.relatedTaxId : null,
        check: form.check,
      }])
      .select()
      .single();
    if (movementError) throw movementError;

    // 7. Crear movement_taxes (si hay impuestos seleccionados)
    if (form.selectedTaxes && Array.isArray(form.selectedTaxes) && form.selectedTaxes.length > 0) {
      const movementTaxesData = form.selectedTaxes.map((tax: any) => ({
        movement_id: movement.id,
        tax_id: tax.id,
        calculated_amount: (form.amount * tax.percentage) / 100,
      }));
      const { error: taxError } = await supabase.from("movement_taxes").insert(movementTaxesData);
      if (taxError) throw taxError;
    }

    return NextResponse.json({ movement }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating movement (API):", error);
    return NextResponse.json({ error: error.message || "Error creando movimiento" }, { status: 500 });
  }
}
