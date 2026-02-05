import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ slug: string }> };

// POST /api/events/[slug]/updates - Post a manual update
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

  // Get the event with host info to check permissions
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      `
      id,
      created_by,
      event_hosts (
        can_edit,
        entities (
          admin_id
        )
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (eventError) {
    if (eventError.code === "PGRST116") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  // Check if user can post updates (created the event or admins a host entity)
  const canPostUpdate =
    event.created_by === user.id ||
    event.event_hosts.some(
      (host: { can_edit: boolean; entities: { admin_id: string } }) =>
        host.can_edit && host.entities.admin_id === user.id
    );

  if (!canPostUpdate) {
    return NextResponse.json(
      { error: "You don't have permission to post updates for this event" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { message } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  // Create the manual update
  const { data: update, error: insertError } = await supabase
    .from("updates")
    .insert({
      event_id: event.id,
      type: "manual",
      message: message.trim(),
      author_id: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(update, { status: 201 });
}
