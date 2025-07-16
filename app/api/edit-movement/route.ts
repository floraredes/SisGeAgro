import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(req: NextRequest) {
  try {
    const form = await req.json();
    const { movementId, ...fields } = form;

    // 1. Obtener datos actuales del movimiento y sus relaciones
    const { data: movementData, error: movementFetchError } = await supabase
      .from("movements")
      .select(`*, operation_id, sub_category_id, sub_category(id, description, category_id, category(id, description)), operation:operation_id(id, payment_id, bill_id, payment:payment_id(id, payment_type), bill:bill_id(id, bill_number, bill_date, bill_amount, entity:entity_id(id, nombre, cuit_cuil)))`)
      .eq("id", movementId)
      .single();
    if (movementFetchError || !movementData) throw movementFetchError || new Error("Movimiento no encontrado");

    // 2. Completar los campos faltantes con los valores actuales
    const getValue = (key: string, fallback: any) => (fields[key] !== undefined ? fields[key] : fallback);

    // --- ENTIDAD ---
    let entityName = getValue("entityName", movementData.entity?.nombre || "");
    let entityCuitCuil = getValue("entityCuitCuil", movementData.entity?.cuit_cuil || "");
    let entityData = null;
    if (entityCuitCuil) {
      let { data: entityByCuit, error: entityByCuitError } = await supabase
        .from("entity")
        .select("*")
        .eq("cuit_cuil", entityCuitCuil)
        .single();
      if (entityByCuitError && entityByCuitError.code !== 'PGRST116') throw entityByCuitError;
      if (entityByCuit) {
        entityData = entityByCuit;
      } else {
        // Buscar por nombre
        let { data: entityByName, error: entityByNameError } = await supabase
          .from("entity")
          .select("*")
          .eq("nombre", entityName)
          .single();
        if (entityByNameError && entityByNameError.code !== 'PGRST116') throw entityByNameError;
        if (entityByName) {
          if (entityByName.cuit_cuil !== entityCuitCuil) {
            return NextResponse.json({ error: `Ya existe una entidad con el nombre '${entityName}' pero con un CUIT/CUIL diferente ${entityByName.cuit_cuil} ${entityCuitCuil}` }, { status: 409 });
          } else {
            entityData = entityByName;
          }
        } else {
          // Crear entidad
          const { data: newEntity, error: entityInsertError } = await supabase
            .from("entity")
            .insert([{ nombre: entityName, cuit_cuil: entityCuitCuil }])
            .select()
            .single();
          if (entityInsertError) throw entityInsertError;
          entityData = newEntity;
        }
      }
    } else {
      // Si no hay cuit_cuil, usar la entidad actual
      entityData = movementData.entity;
    }

    // --- CATEGORÍA Y SUBCATEGORÍA ---
    let category = getValue("category", movementData.sub_category?.category?.description || "");
    let subCategory = getValue("subCategory", movementData.sub_category?.description || "");
    // Buscar o crear categoría
    let { data: categoryData, error: categoryFetchError } = await supabase
      .from("category")
      .select("*")
      .ilike("description", category.toUpperCase())
      .limit(1);
    if (categoryFetchError) throw categoryFetchError;
    if (!categoryData || categoryData.length === 0) {
      const { data: newCategory, error: categoryInsertError } = await supabase
        .from("category")
        .insert([{ description: category.toUpperCase() }])
        .select()
        .single();
      if (categoryInsertError) throw categoryInsertError;
      categoryData = [newCategory];
    }
    // Buscar o crear subcategoría
    let { data: subcategoryData, error: subcategoryFetchError } = await supabase
      .from("sub_category")
      .select("*")
      .ilike("description", subCategory.toUpperCase())
      .eq("category_id", categoryData[0].id)
      .limit(1);
    if (subcategoryFetchError) throw subcategoryFetchError;
    if (!subcategoryData || subcategoryData.length === 0) {
      const { data: newSubcategory, error: subcategoryInsertError } = await supabase
        .from("sub_category")
        .insert([{ description: subCategory.toUpperCase(), category_id: categoryData[0].id }])
        .select()
        .single();
      if (subcategoryInsertError) throw subcategoryInsertError;
      subcategoryData = [newSubcategory];
    }

    // --- OPERATION ---
    const operationData = movementData.operation;
    // --- PAYMENT ---
    const paymentType = getValue("paymentType", operationData?.payment?.payment_type || "");
    const customPaymentType = getValue("customPaymentType", "");
    const { error: paymentUpdateError } = await supabase
      .from("payment")
      .update({
        payment_type: paymentType === "Otro" ? customPaymentType : paymentType,
      })
      .eq("id", operationData.payment_id);
    if (paymentUpdateError) throw paymentUpdateError;

    // --- BILL ---
    const billNumber = getValue("billNumber", operationData?.bill?.bill_number || "");
    const billDate = getValue("billDate", operationData?.bill?.bill_date || "");
    const amount = getValue("amount", operationData?.bill?.bill_amount || 0);
    const { error: billUpdateError } = await supabase
      .from("bills")
      .update({
        bill_number: billNumber,
        bill_date: billDate,
        bill_amount: amount,
        entity_id: entityData.id,
      })
      .eq("id", operationData.bill_id);
    if (billUpdateError) throw billUpdateError;

    // --- MOVEMENT ---
    const description = getValue("description", movementData.description || "");
    const movementType = getValue("movementType", movementData.movement_type || "");
    const isTaxPayment = getValue("isTaxPayment", movementData.is_tax_payment || false);
    const relatedTaxId = getValue("relatedTaxId", movementData.related_tax_id || null);
    const check = getValue("check", movementData.check || false);
    const { error: movementUpdateError } = await supabase
      .from("movements")
      .update({
        description,
        movement_type: movementType,
        sub_category_id: subcategoryData[0].id,
        is_tax_payment: isTaxPayment,
        related_tax_id: isTaxPayment ? relatedTaxId : null,
        check,
      })
      .eq("id", movementId);
    if (movementUpdateError) throw movementUpdateError;

    // --- TAXES ---
    if (fields.selectedTaxes !== undefined) {
      const { error: taxDeleteError } = await supabase
        .from("movement_taxes")
        .delete()
        .eq("movement_id", movementId);
      if (taxDeleteError) throw taxDeleteError;
      if (fields.selectedTaxes && fields.selectedTaxes.length > 0) {
        const movementTaxesData = fields.selectedTaxes.map((tax: any) => ({
          movement_id: movementId,
          tax_id: tax.id,
          calculated_amount: (amount * tax.percentage) / 100,
        }));
        const { error: taxInsertError } = await supabase.from("movement_taxes").insert(movementTaxesData);
        if (taxInsertError) throw taxInsertError;
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating movement (API):", error);
    return NextResponse.json({ error: error.message || "Error actualizando movimiento" }, { status: 500 });
  }
}
