import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { RsvpStatus } from "@/types/database";

type RouteParams = { params: Promise<{ slug: string }> };

// POST /api/events/[slug]/rsvp - Set RSVP status
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

  const body = await request.json();
  const { status } = body as { status: RsvpStatus | null };

  // Validate status
  const validStatuses: RsvpStatus[] = ["yes", "no", "maybe"];
  if (status !== null && !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be 'yes', 'no', 'maybe', or null" },
      { status: 400 }
    );
  }

  // If status is null, remove the RSVP
  if (status === null) {
    const { error: deleteError } = await supabase
      .from("rsvps")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", event.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ status: null });
  }

  // Upsert the RSVP
  const { data: rsvp, error: upsertError } = await supabase
    .from("rsvps")
    .upsert(
      {
        user_id: user.id,
        event_id: event.id,
        status,
      },
      {
        onConflict: "user_id,event_id",
      }
    )
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json(rsvp);
}
