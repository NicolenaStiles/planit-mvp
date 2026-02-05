import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { Database } from "../src/types/database";

// Load environment variables from .env.local
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  console.error("Required: NEXT_PUBLIC_SUPABASE_URL");
  console.error(
    "Required: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// Charlotte, NC coordinates
const CHARLOTTE_CENTER = { lat: 35.2271, lng: -80.8431 };

// Helper to generate a date in the next N days
function futureDate(daysFromNow: number, hour: number = 19): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

// Helper to create PostGIS point
function point(lat: number, lng: number): string {
  return `POINT(${lng} ${lat})`;
}

async function seed() {
  console.log("🌱 Starting seed...\n");

  // Check for existing users in the public.users table
  const { data: existingUsers, error: usersError } = await supabase
    .from("users")
    .select("id, email")
    .limit(1);

  if (usersError) {
    console.error("Error checking users:", usersError);
    process.exit(1);
  }

  let adminId: string;

  if (existingUsers && existingUsers.length > 0) {
    adminId = existingUsers[0].id;
    console.log(`Using existing user as admin: ${existingUsers[0].email}`);
  } else {
    console.error("\n⚠️  No users found in the database.");
    console.error("   Please sign up through the app first, then run this script again.");
    console.error("   1. Start the app: npm run dev");
    console.error("   2. Navigate to /signup and create an account");
    console.error("   3. Run this seed script again");
    process.exit(1);
  }

  // Create venues
  console.log("\n📍 Creating venues...");

  const venues = [
    {
      type: "venue" as const,
      name: "The Weary Traveler",
      slug: "the-weary-traveler",
      description:
        "A cozy neighborhood bar in NoDa with craft beers, live music, and a welcoming atmosphere. Known for hosting local bands and comedy nights.",
      address: "3110 N Davidson St, Charlotte, NC 28205",
      location: point(35.2461, -80.8118),
      admin_id: adminId,
    },
    {
      type: "venue" as const,
      name: "Sunrise Roasters",
      slug: "sunrise-roasters",
      description:
        "Artisan coffee shop in Plaza Midwood featuring locally roasted beans, fresh pastries, and a rotating art gallery. Hosts open mic nights and poetry readings.",
      address: "1500 Central Ave, Charlotte, NC 28205",
      location: point(35.2205, -80.8192),
      admin_id: adminId,
    },
  ];

  const { data: createdVenues, error: venueError } = await supabase
    .from("entities")
    .upsert(venues, { onConflict: "slug" })
    .select();

  if (venueError) {
    console.error("Failed to create venues:", venueError);
  } else {
    console.log(`Created ${createdVenues?.length} venues`);
  }

  // Create organization
  console.log("\n🎭 Creating organization...");

  const org = {
    type: "organization" as const,
    name: "The Punchline Collective",
    slug: "the-punchline-collective",
    description:
      "Charlotte's premier improv and sketch comedy troupe. We perform weekly shows around the city and offer improv classes for all skill levels.",
    address: null,
    location: null,
    admin_id: adminId,
  };

  const { data: createdOrg, error: orgError } = await supabase
    .from("entities")
    .upsert([org], { onConflict: "slug" })
    .select()
    .single();

  if (orgError) {
    console.error("Failed to create organization:", orgError);
  } else {
    console.log(`Created organization: ${createdOrg?.name}`);
  }

  // Get all entity IDs for linking
  const { data: entities } = await supabase.from("entities").select("id, slug");
  const entityMap = new Map(entities?.map((e) => [e.slug, e.id]) || []);

  const wearyTravelerId = entityMap.get("the-weary-traveler");
  const sunriseRoastersId = entityMap.get("sunrise-roasters");
  const punchlineId = entityMap.get("the-punchline-collective");

  // Create events
  console.log("\n📅 Creating events...");

  const events = [
    {
      title: "Friday Night Comedy Showcase",
      slug: "friday-night-comedy-showcase",
      description:
        "Join The Punchline Collective for their signature Friday night show! Featuring improv games, sketch comedy, and audience participation. BYOB and good vibes.",
      address: "3110 N Davidson St, Charlotte, NC 28205",
      location: point(35.2461, -80.8118),
      starts_at: futureDate(2, 20), // Friday at 8pm
      ends_at: futureDate(2, 22),
      tags: ["comedy", "nightlife", "live-entertainment"],
      created_by: adminId,
      hosts: [wearyTravelerId, punchlineId],
    },
    {
      title: "Acoustic Open Mic Night",
      slug: "acoustic-open-mic-night",
      description:
        "Bring your guitar, your voice, or just your ears! Weekly open mic featuring local singer-songwriters. Sign up starts at 6:30pm, music at 7pm. All genres welcome.",
      address: "1500 Central Ave, Charlotte, NC 28205",
      location: point(35.2205, -80.8192),
      starts_at: futureDate(4, 19),
      ends_at: futureDate(4, 22),
      tags: ["music", "free", "open-mic"],
      created_by: adminId,
      hosts: [sunriseRoastersId],
    },
    {
      title: "Sunday Jazz Brunch",
      slug: "sunday-jazz-brunch",
      description:
        "Start your Sunday right with live jazz, craft coffee, and fresh pastries. Featuring the Queen City Jazz Quartet. No cover, just good music and great company.",
      address: "1500 Central Ave, Charlotte, NC 28205",
      location: point(35.2205, -80.8192),
      starts_at: futureDate(6, 11),
      ends_at: futureDate(6, 14),
      tags: ["music", "free", "food", "brunch"],
      created_by: adminId,
      hosts: [sunriseRoastersId],
    },
    {
      title: "Improv 101 Workshop",
      slug: "improv-101-workshop",
      description:
        "Always wanted to try improv? This beginner-friendly workshop covers the basics: yes-and, listening, and having fun failing! No experience needed. $15 suggested donation.",
      address: "3110 N Davidson St, Charlotte, NC 28205",
      location: point(35.2461, -80.8118),
      starts_at: futureDate(9, 14),
      ends_at: futureDate(9, 16),
      tags: ["comedy", "workshop", "beginner-friendly"],
      created_by: adminId,
      hosts: [punchlineId, wearyTravelerId],
    },
    {
      title: "Local Band Showcase: NoDa Nights",
      slug: "noda-nights-band-showcase",
      description:
        "Three local bands, one incredible night! Featuring: The Charlotteans (indie rock), Mint Hill (folk), and NoDa Sound (funk). $10 cover, doors at 7pm.",
      address: "3110 N Davidson St, Charlotte, NC 28205",
      location: point(35.2461, -80.8118),
      starts_at: futureDate(12, 19),
      ends_at: futureDate(12, 23),
      tags: ["music", "nightlife", "live-entertainment"],
      created_by: adminId,
      hosts: [wearyTravelerId],
    },
  ];

  for (const event of events) {
    const { hosts, ...eventData } = event;

    // Insert event
    const { data: createdEvent, error: eventError } = await supabase
      .from("events")
      .upsert([eventData], { onConflict: "slug" })
      .select()
      .single();

    if (eventError) {
      console.error(`Failed to create event "${event.title}":`, eventError);
      continue;
    }

    console.log(`Created event: ${createdEvent.title}`);

    // Link hosts
    if (hosts && hosts.length > 0) {
      const hostLinks = hosts
        .filter((h): h is string => h !== undefined)
        .map((entityId) => ({
          event_id: createdEvent.id,
          entity_id: entityId,
          can_edit: true,
        }));

      const { error: hostError } = await supabase
        .from("event_hosts")
        .upsert(hostLinks, { onConflict: "event_id,entity_id" });

      if (hostError) {
        console.error(`Failed to link hosts for "${event.title}":`, hostError);
      }
    }
  }

  console.log("\n✅ Seed complete!");
  console.log("\nSummary:");
  console.log("- 2 venues (The Weary Traveler, Sunrise Roasters)");
  console.log("- 1 organization (The Punchline Collective)");
  console.log("- 5 events over the next 2 weeks");
}

seed().catch(console.error);
