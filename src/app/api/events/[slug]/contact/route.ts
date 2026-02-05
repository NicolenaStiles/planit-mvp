import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ slug: string }> };

// POST /api/events/[slug]/contact - Send message to organizers
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

  // Get the event with host entities
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      `
      id,
      event_hosts (
        entity_id
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

  const body = await request.json();
  const { message, entity_id } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  // Determine which entity to send the message to
  let targetEntityId = entity_id;

  if (!targetEntityId) {
    // Default to the first host entity
    if (event.event_hosts.length === 0) {
      return NextResponse.json(
        { error: "No host entities found for this event" },
        { status: 400 }
      );
    }
    targetEntityId = event.event_hosts[0].entity_id;
  } else {
    // Verify the entity is a host of this event
    const isHost = event.event_hosts.some(
      (host: { entity_id: string }) => host.entity_id === targetEntityId
    );
    if (!isHost) {
      return NextResponse.json(
        { error: "The specified entity is not a host of this event" },
        { status: 400 }
      );
    }
  }

  // Create the message
  const { data: newMessage, error: insertError } = await supabase
    .from("messages")
    .insert({
      event_id: event.id,
      entity_id: targetEntityId,
      from_user_id: user.id,
      message: message.trim(),
      read: false,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(newMessage, { status: 201 });
}
