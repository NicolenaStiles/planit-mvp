import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EventInsert } from "@/types/database";

// GET /api/events - List events with geo/time/tag filtering
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") || "10000"; // default 10km in meters
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const tags = searchParams.get("tags"); // comma-separated
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  // Build base query
  let query = supabase
    .from("events")
    .select(`
      *,
      event_hosts (
        entity_id,
        can_edit,
        entities (
          id,
          type,
          name,
          slug
        )
      )
    `)
    .order("starts_at", { ascending: true })
    .range(offset, offset + limit - 1);

  // Time filtering - default to upcoming events
  if (startDate) {
    query = query.gte("starts_at", startDate);
  } else {
    query = query.gte("starts_at", new Date().toISOString());
  }

  if (endDate) {
    query = query.lte("starts_at", endDate);
  }

  // Tag filtering
  if (tags) {
    const tagList = tags.split(",").map((t) => t.trim());
    query = query.overlaps("tags", tagList);
  }

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If geo filtering requested, use PostGIS via RPC
  if (lat && lng) {
    const { data: geoEvents, error: geoError } = await supabase.rpc(
      "events_within_radius",
      {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius_meters: parseFloat(radius),
        start_date: startDate || new Date().toISOString(),
        end_date: endDate || null,
        tag_filter: tags ? tags.split(",").map((t) => t.trim()) : null,
        result_limit: limit,
        result_offset: offset,
      }
    );

    if (geoError) {
      // Fallback to non-geo results if RPC doesn't exist
      console.error("Geo filtering RPC error:", geoError);
      return NextResponse.json(events);
    }

    return NextResponse.json(geoEvents);
  }

  return NextResponse.json(events);
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { host_entity_ids, ...eventData } = body;

  // Validate required fields
  if (!eventData.title || !eventData.starts_at) {
    return NextResponse.json(
      { error: "Missing required fields: title, starts_at" },
      { status: 400 }
    );
  }

  // Validate user owns at least one host entity
  if (!host_entity_ids || host_entity_ids.length === 0) {
    return NextResponse.json(
      { error: "At least one host entity is required" },
      { status: 400 }
    );
  }

  const { data: ownedEntities, error: entitiesError } = await supabase
    .from("entities")
    .select("id")
    .eq("admin_id", user.id)
    .in("id", host_entity_ids);

  if (entitiesError || !ownedEntities || ownedEntities.length === 0) {
    return NextResponse.json(
      { error: "You must own at least one of the host entities" },
      { status: 403 }
    );
  }

  // Generate slug from title
  const slug = generateSlug(eventData.title);

  // Create the event
  const eventInsert: EventInsert = {
    ...eventData,
    slug,
    created_by: user.id,
  };

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert(eventInsert)
    .select()
    .single();

  if (eventError) {
    return NextResponse.json({ error: eventError.message }, { status: 500 });
  }

  // Create event_hosts entries
  const hostEntries = host_entity_ids.map((entityId: string) => ({
    event_id: event.id,
    entity_id: entityId,
    can_edit: ownedEntities.some((e) => e.id === entityId),
  }));

  const { error: hostsError } = await supabase
    .from("event_hosts")
    .insert(hostEntries);

  if (hostsError) {
    // Rollback: delete the event if host creation fails
    await supabase.from("events").delete().eq("id", event.id);
    return NextResponse.json({ error: hostsError.message }, { status: 500 });
  }

  return NextResponse.json(event, { status: 201 });
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}
