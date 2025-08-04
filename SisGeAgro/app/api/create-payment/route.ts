// app/api/create-payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { payment_type } = await req.json();
    if (!payment_type) {
      return NextResponse.json({ error: "Falta el tipo de pago" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("payment")
      .insert([{ payment_type }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ payment: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error creando payment" }, { status: 500 });
  }
}
