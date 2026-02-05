import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ slug: string }> };

// POST /api/events/[slug]/save - Toggle save status
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

  // Get the event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id")
    .eq("slug", slug)
    .single();

  if (eventError) {
    if (eventError.code === "PGRST116") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  // Check if already saved
  const { data: existingSave } = await supabase
    .from("saves")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("event_id", event.id)
    .maybeSingle();

  if (existingSave) {
    // Remove save
    const { error: deleteError } = await supabase
      .from("saves")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", event.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ saved: false });
  } else {
    // Add save
    const { error: insertError } = await supabase.from("saves").insert({
      user_id: user.id,
      event_id: event.id,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ saved: true });
  }
}
