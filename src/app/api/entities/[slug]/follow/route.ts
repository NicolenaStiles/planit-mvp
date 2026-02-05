import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ slug: string }> };

// POST /api/entities/[slug]/follow - Toggle follow status
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the entity
  const { data: entity, error: entityError } = await supabase
    .from("entities")
    .select("id")
    .eq("slug", slug)
    .single();

  if (entityError) {
    if (entityError.code === "PGRST116") {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }
    return NextResponse.json({ error: entityError.message }, { status: 500 });
  }

  // Check if already following
  const { data: existingFollow } = await supabase
    .from("follows")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("entity_id", entity.id)
    .maybeSingle();

  if (existingFollow) {
    // Unfollow
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("user_id", user.id)
      .eq("entity_id", entity.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ following: false });
  } else {
    // Follow
    const { error: insertError } = await supabase.from("follows").insert({
      user_id: user.id,
      entity_id: entity.id,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ following: true });
  }
}
