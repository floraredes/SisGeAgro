import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { name, percentage } = await req.json();

    if (!name || percentage === undefined) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("taxes")
      .insert([{ name, percentage }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ tax: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error creando impuesto" }, { status: 500 });
  }
}
