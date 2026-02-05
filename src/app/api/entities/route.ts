import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EntityInsert, EntityType } from "@/types/database";

// GET /api/entities - List entities with optional type filter
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const type = searchParams.get("type") as EntityType | null;
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const search = searchParams.get("q");

  let query = supabase
    .from("entities")
    .select("*")
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq("type", type);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data: entities, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(entities);
}

// POST /api/entities - Create a new entity
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

  // Validate required fields
  if (!body.name || !body.type) {
    return NextResponse.json(
      { error: "Missing required fields: name, type" },
      { status: 400 }
    );
  }

  // Validate type
  if (!["organization", "venue"].includes(body.type)) {
    return NextResponse.json(
      { error: "Type must be 'organization' or 'venue'" },
      { status: 400 }
    );
  }

  // Generate slug from name
  const slug = generateSlug(body.name);

  const entityInsert: EntityInsert = {
    name: body.name,
    type: body.type,
    slug,
    description: body.description || null,
    address: body.address || null,
    location: body.location || null,
    banner_url: body.banner_url || null,
    admin_id: user.id,
  };

  const { data: entity, error: insertError } = await supabase
    .from("entities")
    .insert(entityInsert)
    .select()
    .single();

  if (insertError) {
    // Handle unique constraint violation on slug
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "An entity with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(entity, { status: 201 });
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}
