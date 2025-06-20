// app/api/create-subcategory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { description, category_id } = await req.json();
    if (!description || !category_id) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("sub_category")
      .insert([{ description: description.toUpperCase(), category_id }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ subcategory: data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error creando subcategoría" }, { status: 500 });
  }
}
