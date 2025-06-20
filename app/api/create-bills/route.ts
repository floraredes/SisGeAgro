// app/api/create-bill/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { bill_number, bill_date, bill_amount, entity_id } = await req.json();
    if (!bill_number || !entity_id) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("bills")
      .insert([{ bill_number, bill_date, bill_amount, entity_id }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ bill: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error creando bill" }, { status: 500 });
  }
}
