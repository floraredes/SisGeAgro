// app/api/create-operation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { payment_id, bill_id } = await req.json();
    if (!payment_id || !bill_id) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("operations")
      .insert([{ payment_id, bill_id }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ operation: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error creando operación" }, { status: 500 });
  }
}
