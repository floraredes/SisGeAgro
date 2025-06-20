import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from("taxes")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ taxes: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error fetching taxes" }, { status: 500 });
  }
}
