import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ slug: string }> };

// GET /api/events/[slug] - Get single event with hosts and updates
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event, error } = await supabase
    .from("events")
    .select(
      `
      *,
      event_hosts (
        entity_id,
        can_edit,
        entities (
          id,
          type,
          name,
          slug,
          banner_url
        )
      ),
      updates (
        id,
        type,
        field_changed,
        old_value,
        new_value,
        message,
        author_id,
        created_at
      ),
      created_by_user:users!events_created_by_fkey (
        id,
        username
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get current user's RSVP and save status if authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userStatus = null;
  if (user) {
    const [rsvpResult, saveResult] = await Promise.all([
      supabase
        .from("rsvps")
        .select("status")
        .eq("user_id", user.id)
        .eq("event_id", event.id)
        .maybeSingle(),
      supabase
        .from("saves")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("event_id", event.id)
        .maybeSingle(),
    ]);

    userStatus = {
      rsvp: rsvpResult.data?.status || null,
      saved: !!saveResult.data,
    };
  }

  return NextResponse.json({ ...event, userStatus });
}

// PATCH /api/events/[slug] - Update event with auto-changelog
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  // Get the existing event
  const { data: existingEvent, error: fetchError } = await supabase
    .from("events")
    .select(
      `
      *,
      event_hosts (
        entity_id,
        can_edit,
        entities (
          admin_id
        )
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Check if user can edit (created the event or admins a host entity with can_edit)
  const canEdit =
    existingEvent.created_by === user.id ||
    existingEvent.event_hosts.some(
      (host: { can_edit: boolean; entities: { admin_id: string } }) =>
        host.can_edit && host.entities.admin_id === user.id
    );

  if (!canEdit) {
    return NextResponse.json(
      { error: "You don't have permission to edit this event" },
      { status: 403 }
    );
  }

  const body = await request.json();

  // Fields that trigger auto-changelog entries
  const trackedFields = ["starts_at", "ends_at", "address", "title"];
  const updates: Array<{
    event_id: string;
    type: "auto";
    field_changed: string;
    old_value: string;
    new_value: string;
    author_id: string;
  }> = [];

  for (const field of trackedFields) {
    if (
      body[field] !== undefined &&
      body[field] !== existingEvent[field as keyof typeof existingEvent]
    ) {
      updates.push({
        event_id: existingEvent.id,
        type: "auto",
        field_changed: field,
        old_value: String(
          existingEvent[field as keyof typeof existingEvent] ?? ""
        ),
        new_value: String(body[field] ?? ""),
        author_id: user.id,
      });
    }
  }

  // Update the event
  const { data: updatedEvent, error: updateError } = await supabase
    .from("events")
    .update(body)
    .eq("id", existingEvent.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Create auto-changelog entries
  if (updates.length > 0) {
    const { error: changelogError } = await supabase
      .from("updates")
      .insert(updates);

    if (changelogError) {
      console.error("Failed to create changelog:", changelogError);
    }
  }

  return NextResponse.json(updatedEvent);
}

// DELETE /api/events/[slug] - Delete event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  // Get the event with host info
  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select(
      `
      id,
      created_by,
      event_hosts (
        entities (
          admin_id
        )
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Check if user can delete (only event creator or host entity admin)
  const canDelete =
    event.created_by === user.id ||
    event.event_hosts.some(
      (host: { entities: { admin_id: string } }) =>
        host.entities.admin_id === user.id
    );

  if (!canDelete) {
    return NextResponse.json(
      { error: "You don't have permission to delete this event" },
      { status: 403 }
    );
  }

  // Delete the event (cascade will handle related records)
  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .eq("id", event.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
