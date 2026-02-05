import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EntityType } from "@/types/database";

// GET /api/search - Full-text search on events and entities
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q");
  const type = searchParams.get("type"); // 'events', 'entities', or null for both
  const tags = searchParams.get("tags"); // comma-separated, for events only
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radius = searchParams.get("radius") || "10000"; // meters
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters" },
      { status: 400 }
    );
  }

  const searchTerm = query.trim();
  const results: {
    events: unknown[];
    entities: unknown[];
  } = {
    events: [],
    entities: [],
  };

  // Search events
  if (!type || type === "events") {
    let eventsQuery = supabase
      .from("events")
      .select(
        `
        *,
        event_hosts (
          entity_id,
          entities (
            id,
            name,
            slug,
            type
          )
        )
      `
      )
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order("starts_at", { ascending: true })
      .limit(limit);

    // Default to upcoming events unless date range specified
    if (startDate) {
      eventsQuery = eventsQuery.gte("starts_at", startDate);
    } else {
      eventsQuery = eventsQuery.gte("starts_at", new Date().toISOString());
    }

    if (endDate) {
      eventsQuery = eventsQuery.lte("starts_at", endDate);
    }

    // Tag filtering
    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim());
      eventsQuery = eventsQuery.overlaps("tags", tagList);
    }

    const { data: events, error: eventsError } = await eventsQuery;

    if (eventsError) {
      console.error("Events search error:", eventsError);
    } else {
      results.events = events || [];
    }

    // If geo filtering requested, use RPC for more accurate results
    if (lat && lng && !eventsError) {
      const { data: geoEvents, error: geoError } = await supabase.rpc(
        "search_events_within_radius",
        {
          search_term: searchTerm,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius_meters: parseFloat(radius),
          start_date: startDate || new Date().toISOString(),
          end_date: endDate || null,
          tag_filter: tags ? tags.split(",").map((t) => t.trim()) : null,
          result_limit: limit,
        }
      );

      if (!geoError && geoEvents) {
        results.events = geoEvents;
      }
      // Fall back to non-geo results if RPC fails
    }
  }

  // Search entities
  if (!type || type === "entities") {
    const entityTypeParam = searchParams.get("entity_type");
    const entityType: EntityType | null =
      entityTypeParam === "organization" || entityTypeParam === "venue"
        ? entityTypeParam
        : null;

    let entitiesQuery = supabase
      .from("entities")
      .select("*")
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order("name", { ascending: true })
      .limit(limit);

    if (entityType) {
      entitiesQuery = entitiesQuery.eq("type", entityType);
    }

    const { data: entities, error: entitiesError } = await entitiesQuery;

    if (entitiesError) {
      console.error("Entities search error:", entitiesError);
    } else {
      results.entities = entities || [];
    }

    // Geo filtering for entities (venues)
    if (lat && lng && !entitiesError) {
      const { data: geoEntities, error: geoError } = await supabase.rpc(
        "search_entities_within_radius",
        {
          search_term: searchTerm,
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          radius_meters: parseFloat(radius),
          entity_type: entityType || null,
          result_limit: limit,
        }
      );

      if (!geoError && geoEntities) {
        results.entities = geoEntities;
      }
      // Fall back to non-geo results if RPC fails
    }
  }

  return NextResponse.json({
    query: searchTerm,
    results,
    counts: {
      events: results.events.length,
      entities: results.entities.length,
      total: results.events.length + results.entities.length,
    },
  });
}
