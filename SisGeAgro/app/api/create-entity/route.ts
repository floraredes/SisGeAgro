import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // USAR service role key, NO el anon
);

export async function POST(req: NextRequest) {
  try {
    const { nombre, cuit_cuil } = await req.json();

    if (!nombre || !cuit_cuil) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("entity")
      .upsert(
        { nombre, cuit_cuil },
        { onConflict: "cuit_cuil" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ entity: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error creando entidad" }, { status: 500 });
  }
}
