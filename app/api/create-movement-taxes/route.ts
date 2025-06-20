// app/api/create-movement-taxes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { movementTaxes } = await req.json();
    if (!movementTaxes || !Array.isArray(movementTaxes)) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("movement_taxes")
      .insert(movementTaxes)
      .select();
    if (error) throw error;
    return NextResponse.json({ movement_taxes: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error creando movement_taxes" }, { status: 500 });
  }
}
