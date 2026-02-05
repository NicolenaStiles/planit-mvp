import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteParams = { params: Promise<{ slug: string }> };

// GET /api/entities/[slug] - Get entity with upcoming events
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get the entity
  const { data: entity, error: entityError } = await supabase
    .from("entities")
    .select("*")
    .eq("slug", slug)
    .single();

  if (entityError) {
    if (entityError.code === "PGRST116") {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }
    return NextResponse.json({ error: entityError.message }, { status: 500 });
  }

  // Get upcoming events hosted by this entity
  const { data: upcomingEvents } = await supabase
    .from("events")
    .select(
      `
      *,
      event_hosts!inner (
        entity_id
      )
    `
    )
    .eq("event_hosts.entity_id", entity.id)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(20);

  // Get past events (limited)
  const { data: pastEvents } = await supabase
    .from("events")
    .select(
      `
      *,
      event_hosts!inner (
        entity_id
      )
    `
    )
    .eq("event_hosts.entity_id", entity.id)
    .lt("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: false })
    .limit(10);

  // Get follower count
  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("entity_id", entity.id);

  // Check if current user follows this entity
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isFollowing = false;
  if (user) {
    const { data: followRecord } = await supabase
      .from("follows")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("entity_id", entity.id)
      .maybeSingle();

    isFollowing = !!followRecord;
  }

  return NextResponse.json({
    ...entity,
    upcoming_events: upcomingEvents || [],
    past_events: pastEvents || [],
    follower_count: followerCount || 0,
    is_following: isFollowing,
  });
}

// PATCH /api/entities/[slug] - Update entity
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

  // Get the entity to check ownership
  const { data: entity, error: fetchError } = await supabase
    .from("entities")
    .select("id, admin_id")
    .eq("slug", slug)
    .single();

  if (fetchError) {
    if (fetchError.code === "PGRST116") {
      return NextResponse.json({ error: "Entity not found" }, { status: 404 });
    }
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  // Check if user is the admin
  if (entity.admin_id !== user.id) {
    return NextResponse.json(
      { error: "You don't have permission to edit this entity" },
      { status: 403 }
    );
  }

  const body = await request.json();

  // Don't allow changing admin_id or type via PATCH
  delete body.admin_id;
  delete body.type;
  delete body.id;
  delete body.slug;

  const { data: updatedEntity, error: updateError } = await supabase
    .from("entities")
    .update(body)
    .eq("id", entity.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(updatedEntity);
}
