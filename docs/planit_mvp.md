# PlanIt MVP Specification

> **"There's a whole world out there."**
> PlanIt is a social medium, not social media. We believe people are better when they connect — and connecting in the real world is the best way to do it.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [User Types & Permissions](#user-types--permissions)
4. [Data Models](#data-models)
5. [Screens & Features](#screens--features)
6. [API Routes](#api-routes)
7. [Milestones](#milestones)

---

## Overview

PlanIt is a local event discovery app. Users can:

- **Discover** events happening near them via an interactive map
- **Search & filter** events by tags, date, and location
- **RSVP** to events (yes / no / maybe) or save them for later
- **Follow** organizations and venues to see their upcoming events
- **Create & manage** events as an organization or venue admin

### Core User Stories

| User | Problem | PlanIt Solution |
|------|---------|-----------------|
| **Alice** (local resident) | Deleted Facebook, now misses local event info like farmer's market schedules | Follows her local library's page, sees all community events in one place |
| **Bob** (traveler) | New to a city, wants to find live music tonight but doesn't know where to start | Opens the map, filters by "Music" tag, finds an open mic 2 blocks away |
| **Cindy** (organizer) | Runs a comedy show that changes venues weekly; Instagram announcements are unreliable | Both her troupe AND the venue can push updates; followers see changes instantly |

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Frontend** | Next.js 14 (App Router) | React with SSR/SSG capabilities |
| **UI Library** | Material UI (MUI) v5 | Fast, accessible, consistent design |
| **Maps** | Leaflet + React-Leaflet | Free, no API key required for tiles |
| **Backend/DB** | Supabase | Postgres, Auth, Storage, Realtime |
| **Hosting** | Vercel | Optimized for Next.js |

### Future Considerations (Post-MVP)

- `.ics` export for calendar integration
- Push notifications (FCM/APNs)
- Flutter mobile app (same Supabase backend)

---

## User Types & Permissions

### Roles

| Role | Description | Capabilities |
|------|-------------|--------------|
| **Guest** | Unauthenticated visitor | View map, view events, view entity pages |
| **User** | Authenticated account | RSVP, save events, follow entities, contact organizers |
| **Entity Admin** | User who owns an Entity | All User capabilities + create/edit events, post updates |

### Entities

An **Entity** is a generic concept representing either:

- **Organization**: A group that hosts events (e.g., "The Download" comedy troupe)
- **Venue**: A physical location that hosts events (e.g., "The Weary Liver" bar)

For MVP:
- Each Entity has exactly **one admin** (the user who created it)
- A User can admin multiple Entities
- An Event can have **multiple host Entities** (many-to-many)

> **Post-MVP:** Multi-admin support with roles (admin, editor, viewer)

---

## Data Models

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   users     │       │  entity_admins  │       │  entities   │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │───┐   │ user_id (FK)    │   ┌───│ id (PK)     │
│ email       │   └──>│ entity_id (FK)  │<──┘   │ type        │
│ username    │       │ role            │       │ name        │
│ created_at  │       └─────────────────┘       │ description │
└─────────────┘                                 │ address     │
                                                │ location    │
      │                                         │ admin_id    │
      │ (user)                                  └─────────────┘
      v                                               │
┌─────────────┐       ┌─────────────────┐            │
│   rsvps     │       │  event_hosts    │            │
├─────────────┤       ├─────────────────┤            │
│ id (PK)     │       │ event_id (FK)   │<───────────┤
│ user_id(FK) │       │ entity_id (FK)  │            │
│ event_id(FK)│       │ can_edit        │            │
│ status      │       └─────────────────┘            │
└─────────────┘                                      │
      │                     ┌────────────────────────┘
      │                     v
      │             ┌─────────────┐       ┌─────────────┐
      └────────────>│   events    │<──────│   updates   │
                    ├─────────────┤       ├─────────────┤
                    │ id (PK)     │       │ id (PK)     │
                    │ title       │       │ event_id(FK)│
                    │ description │       │ type        │
                    │ location    │       │ message     │
                    │ address     │       │ author_id   │
                    │ starts_at   │       │ created_at  │
                    │ ends_at     │       └─────────────┘
                    │ banner_url  │
                    │ tags        │       ┌─────────────┐
                    │ created_at  │       │   saves     │
                    └─────────────┘       ├─────────────┤
                                          │ user_id(FK) │
┌─────────────┐                           │ event_id(FK)│
│  follows    │                           └─────────────┘
├─────────────┤
│ user_id(FK) │
│ entity_id(FK)│
└─────────────┘
```

### Table Definitions

#### `users`
Extends Supabase Auth. Additional profile data.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, references `auth.users` |
| `email` | text | From auth |
| `username` | text | Unique, user-chosen |
| `created_at` | timestamptz | Default: now() |

#### `entities`
Organizations and venues.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `type` | enum | `'organization'` or `'venue'` |
| `name` | text | Display name |
| `slug` | text | URL-friendly identifier, unique |
| `description` | text | Nullable |
| `address` | text | Human-readable address |
| `location` | geography(Point) | PostGIS point for map |
| `banner_url` | text | Nullable, Supabase Storage URL |
| `admin_id` | uuid | FK to `users.id` |
| `created_at` | timestamptz | |

#### `events`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `title` | text | Event name |
| `slug` | text | URL-friendly, unique per event |
| `description` | text | Nullable |
| `address` | text | Human-readable |
| `location` | geography(Point) | PostGIS point |
| `starts_at` | timestamptz | **Required** |
| `ends_at` | timestamptz | Nullable (open-ended events) |
| `banner_url` | text | Nullable |
| `tags` | text[] | Array of tag strings |
| `created_by` | uuid | FK to `users.id` |
| `created_at` | timestamptz | |

> **iCalendar Mapping:**
> `title` → SUMMARY, `description` → DESCRIPTION, `starts_at` → DTSTART, `ends_at` → DTEND, `address` → LOCATION, `location` → GEO

#### `event_hosts`
Junction table: which entities host which events.

| Column | Type | Notes |
|--------|------|-------|
| `event_id` | uuid | FK, part of composite PK |
| `entity_id` | uuid | FK, part of composite PK |
| `can_edit` | boolean | Default: true |

#### `rsvps`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | FK |
| `event_id` | uuid | FK |
| `status` | enum | `'yes'`, `'no'`, `'maybe'` |
| `created_at` | timestamptz | |

Unique constraint on `(user_id, event_id)`.

#### `saves`
Bookmarked events (no RSVP commitment).

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid | FK, part of composite PK |
| `event_id` | uuid | FK, part of composite PK |
| `created_at` | timestamptz | |

#### `follows`
Users following entities.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid | FK, part of composite PK |
| `entity_id` | uuid | FK, part of composite PK |
| `created_at` | timestamptz | |

#### `updates`
Event changelog + organizer announcements.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `event_id` | uuid | FK |
| `type` | enum | `'auto'` or `'manual'` |
| `field_changed` | text | Nullable, for auto updates (e.g., `'starts_at'`) |
| `old_value` | text | Nullable, for auto updates |
| `new_value` | text | Nullable, for auto updates |
| `message` | text | For manual updates |
| `author_id` | uuid | FK to `users.id` |
| `created_at` | timestamptz | |

---

## Screens & Features

### Public (No Auth Required)

#### 1. Landing / Map (`/`)
The main screen. Shows a map centered on user's location (or defaults to a city center).

**Components:**
- Interactive map (Leaflet) with event markers
- Time selector (date picker + optional time range)
- Tag filter chips (Music, Comedy, Free, DIY, etc.)
- Search bar (searches event titles, entity names)
- Clicking a marker opens event preview card
- "View Details" on card navigates to event page

**Map Behavior:**
- Events displayed as pins; clustered when zoomed out
- Default view: events happening "today"
- User can adjust date/time to see future events

#### 2. Event Page (`/events/[slug]`)

**Sections:**
- Banner image (or placeholder)
- Title, date/time, location with map preview
- Host entities (clickable links to entity pages)
- Description
- Tags
- RSVP buttons (yes / maybe / no) — prompts login if not authed
- Save button (bookmark icon)
- Share button (copy link, native share API)
- "Contact Organizers" button — opens simple message form
- Updates timeline (reverse-chron list of changes/announcements)

#### 3. Entity Page (`/[type]/[slug]`)
e.g., `/venue/the-weary-liver` or `/org/the-download`

**Sections:**
- Banner image
- Name, description, address (if venue)
- Follow button
- Upcoming events list
- Past events (collapsed/expandable)

#### 4. Search Results (`/search?q=...&tags=...`)
List view of events matching query/filters. Each result links to event page.

### Authenticated

#### 5. Login / Sign Up (`/login`, `/signup`)
Supabase Auth UI or custom form. Email/password for MVP.
OAuth (Google) is a nice-to-have.

#### 6. My Calendar (`/calendar`)
Shows events the user has:
- RSVP'd "yes" or "maybe" to
- Saved

**MVP Layout:** Simple chronological list grouped by date. No fancy calendar grid needed.

#### 7. Profile (`/profile`)
Minimal for MVP:
- Username (editable)
- Email (read-only)
- "My Entities" list with links to manage each
- Log out button

#### 8. Settings (`/settings`)
Placeholder for MVP. Could include:
- Change password
- Delete account
- Notification preferences (post-MVP)

### Entity Admin

#### 9. Create Entity (`/entities/new`)
Form: type (org/venue), name, description, address, banner upload.

#### 10. Manage Entity (`/entities/[id]/manage`)
Edit entity details, view list of events.

#### 11. Create Event (`/events/new`)
Form fields:
- Title
- Description
- Date/time (start, optional end)
- Address (with geocoding to get lat/lng)
- Banner upload
- Tags (multi-select or free-form chips)
- Host entities (select from user's entities; can add multiple)

#### 12. Manage Event (`/events/[slug]/manage`)
Edit event details. Posting an update here auto-logs it to the timeline.

**Update form:**
- Freeform message textarea
- On submit: creates `updates` row with `type: 'manual'`

**Auto-updates:**
- On save, if `starts_at`, `ends_at`, or `address` changed, system creates `updates` row with `type: 'auto'` and field diff.

#### 13. Organizer Inbox (`/inbox`)
Simple list of messages from users ("Contact Organizers" feature).

| Column | Type |
|--------|------|
| `id` | uuid |
| `event_id` | uuid (nullable, if about an event) |
| `entity_id` | uuid (which entity it's addressed to) |
| `from_user_id` | uuid |
| `message` | text |
| `created_at` | timestamptz |
| `read` | boolean |

---

## API Routes

Using Next.js Route Handlers (`/app/api/...`). Most data access will be direct Supabase client calls from components, but some operations need server-side logic.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/events` | List events (with geo/time/tag filters) |
| GET | `/api/events/[slug]` | Get single event with hosts, updates |
| POST | `/api/events` | Create event (authed, must admin a host entity) |
| PATCH | `/api/events/[slug]` | Update event (auto-generates changelog) |
| DELETE | `/api/events/[slug]` | Delete event |
| POST | `/api/events/[slug]/rsvp` | Set RSVP status |
| POST | `/api/events/[slug]/save` | Toggle save |
| POST | `/api/events/[slug]/updates` | Post manual update |
| POST | `/api/events/[slug]/contact` | Send message to organizers |
| GET | `/api/entities` | List entities (optional type filter) |
| GET | `/api/entities/[slug]` | Get entity with upcoming events |
| POST | `/api/entities` | Create entity |
| PATCH | `/api/entities/[slug]` | Update entity |
| POST | `/api/entities/[slug]/follow` | Toggle follow |
| GET | `/api/me/calendar` | Get user's RSVP'd + saved events |
| GET | `/api/me/entities` | Get user's administered entities |
| GET | `/api/me/inbox` | Get messages for user's entities |
| GET | `/api/search` | Full-text search events + entities |

---

## Milestones

Designed for parallel development: **Client** and **Server** tracks can run simultaneously with minimal merge conflicts.

---

### Milestone 0: Project Setup (Both Tracks)
**Time estimate:** 15 minutes

- [ ] Initialize Next.js 14 project with App Router
- [ ] Install dependencies: `@mui/material`, `@emotion/react`, `@emotion/styled`, `@supabase/supabase-js`, `@supabase/ssr`, `leaflet`, `react-leaflet`
- [ ] Set up Supabase project, get API keys
- [ ] Configure environment variables
- [ ] Set up basic folder structure

```
/app
  /api
  /(public)
    /events/[slug]
    /venue/[slug]
    /org/[slug]
    /search
  /(auth)
    /login
    /signup
  /(protected)
    /calendar
    /profile
    /settings
    /entities/[id]/manage
    /events/[slug]/manage
    /inbox
/components
/lib
  /supabase
/types
```

---

### Milestone 1: Database Schema (Server Track)
**Time estimate:** 30 minutes

- [ ] Enable PostGIS extension in Supabase
- [ ] Create all tables per data model spec
- [ ] Set up Row Level Security policies:
  - `users`: users can read/update own row
  - `entities`: public read, admin can update own
  - `events`: public read, host admins can update
  - `rsvps`: users can manage own
  - `saves`: users can manage own
  - `follows`: users can manage own
  - `updates`: public read, host admins can create
- [ ] Create indexes on `events.location`, `events.starts_at`, `events.tags`
- [ ] Seed with test data (2-3 entities, 5-10 events)

---

### Milestone 2: Auth Flow (Client Track)
**Time estimate:** 30 minutes

- [ ] Supabase Auth setup with SSR helpers
- [ ] Login page with email/password
- [ ] Sign up page
- [ ] Auth context/provider
- [ ] Protected route middleware
- [ ] Basic layout with header (logo, nav, login/profile button)

---

### Milestone 3: Map & Event Discovery (Client Track)
**Time estimate:** 1 hour

- [ ] Map component with React-Leaflet
- [ ] Geolocation hook (get user's position)
- [ ] Fetch events within map bounds
- [ ] Event markers with clustering
- [ ] Date picker for filtering
- [ ] Tag filter chips
- [ ] Event preview card on marker click
- [ ] Link to full event page

---

### Milestone 4: Event & Entity Pages (Client Track)
**Time estimate:** 45 minutes

- [ ] Event detail page layout
- [ ] Entity page layout
- [ ] Updates timeline component
- [ ] RSVP buttons (UI only, wire up in M6)
- [ ] Save button (UI only)
- [ ] Share button (copy link + navigator.share)
- [ ] Contact organizers modal/form (UI only)

---

### Milestone 5: Event API (Server Track)
**Time estimate:** 45 minutes

- [ ] `GET /api/events` with geo-filtering (PostGIS `ST_DWithin`)
- [ ] `GET /api/events/[slug]` with hosts and updates
- [ ] `POST /api/events` with auto-host linking
- [ ] `PATCH /api/events/[slug]` with auto-changelog generation
- [ ] `DELETE /api/events/[slug]`
- [ ] `POST /api/events/[slug]/rsvp`
- [ ] `POST /api/events/[slug]/save`
- [ ] `POST /api/events/[slug]/updates`
- [ ] `POST /api/events/[slug]/contact`

---

### Milestone 6: Wire Up Event Interactions (Client Track)
**Time estimate:** 30 minutes

- [ ] Connect RSVP buttons to API
- [ ] Connect Save button to API
- [ ] Connect Contact form to API
- [ ] Show user's current RSVP/save state
- [ ] Optimistic UI updates

---

### Milestone 7: Entity API (Server Track)
**Time estimate:** 30 minutes

- [ ] `GET /api/entities`
- [ ] `GET /api/entities/[slug]` with events
- [ ] `POST /api/entities`
- [ ] `PATCH /api/entities/[slug]`
- [ ] `POST /api/entities/[slug]/follow`

---

### Milestone 8: Entity Management (Client Track)
**Time estimate:** 30 minutes

- [ ] Create entity form
- [ ] Manage entity page
- [ ] Follow/unfollow button on entity pages
- [ ] "My Entities" list on profile

---

### Milestone 9: Event Creation & Management (Client Track)
**Time estimate:** 45 minutes

- [ ] Create event form with:
  - Address input with geocoding (use Nominatim or Supabase edge function)
  - Date/time pickers
  - Tag selection
  - Multi-host selection
  - Banner upload to Supabase Storage
- [ ] Manage event page
- [ ] Post update form
- [ ] Auto-update display in timeline

---

### Milestone 10: Search (Both Tracks)
**Time estimate:** 30 minutes

**Server:**
- [ ] `GET /api/search` with Postgres full-text search on events + entities
- [ ] Filter by tags, date range, location radius

**Client:**
- [ ] Search bar in header
- [ ] Search results page
- [ ] Integrate with map view (search → pan to results)

---

### Milestone 11: Calendar & User Pages (Client Track)
**Time estimate:** 30 minutes

- [ ] Calendar page showing RSVP'd + saved events
- [ ] Profile page with username edit
- [ ] Settings page (placeholder)
- [ ] Inbox page for organizer messages

---

### Milestone 12: Polish & Testing (Both Tracks)
**Time estimate:** Remaining time

- [ ] Error handling and loading states
- [ ] Empty states (no events found, etc.)
- [ ] Mobile responsiveness check
- [ ] Quick smoke test of all flows

---

## Summary: Time Estimates

| Milestone | Track | Time |
|-----------|-------|------|
| M0: Setup | Both | 15 min |
| M1: Database | Server | 30 min |
| M2: Auth | Client | 30 min |
| M3: Map | Client | 60 min |
| M4: Event/Entity Pages | Client | 45 min |
| M5: Event API | Server | 45 min |
| M6: Wire Interactions | Client | 30 min |
| M7: Entity API | Server | 30 min |
| M8: Entity Management | Client | 30 min |
| M9: Event Management | Client | 45 min |
| M10: Search | Both | 30 min |
| M11: User Pages | Client | 30 min |
| M12: Polish | Both | ∞ |

**Total estimated time:** ~6-7 hours (aggressive but doable for a hackathon!)

---

## Parallel Track Overview

```
TIME    SERVER TRACK                 CLIENT TRACK
────────────────────────────────────────────────────
0:00    ┌─ M0: Project Setup ─────────────────────┐
0:15    └─────────────────────────────────────────┘
        │                            │
0:15    M1: Database Schema          M2: Auth Flow
0:45    │                            │
        │                            M3: Map & Discovery
1:00    M5: Event API                │
        │                            │
1:45    │                            M4: Event/Entity Pages
        │                            │
2:30    M7: Entity API               M6: Wire Interactions
        │                            │
3:00    │                            M8: Entity Management
        │                            │
3:30    M10: Search (server)         M9: Event Management
        │                            │
4:00    │                            M10: Search (client)
        │                            │
4:30    │                            M11: Calendar & User
        │                            │
5:00    └─ M12: Polish & Testing ─────────────────┘
```

---

## Quick Reference: Key Files

```
/app/api/events/route.ts          → List/create events
/app/api/events/[slug]/route.ts   → Get/update/delete event
/app/api/entities/route.ts        → List/create entities
/app/api/entities/[slug]/route.ts → Get/update entity
/app/page.tsx                     → Map view (home)
/app/events/[slug]/page.tsx       → Event detail
/app/venue/[slug]/page.tsx        → Venue page
/app/org/[slug]/page.tsx          → Organization page
/components/Map/EventMap.tsx      → Main map component
/components/Event/EventCard.tsx   → Event preview card
/components/Event/RSVPButtons.tsx → RSVP interaction
/lib/supabase/client.ts           → Browser Supabase client
/lib/supabase/server.ts           → Server Supabase client
/types/database.ts                → Generated Supabase types
```

---

## Notes for Claude Code

1. **Start with M0 + M1** — nothing else works without the database
2. **Use Supabase CLI** to generate TypeScript types from the schema
3. **PostGIS queries** — use `ST_DWithin(location, ST_MakePoint(lng, lat)::geography, radius_meters)`
4. **RLS is critical** — test that users can't edit others' content
5. **Optimistic updates** — makes the app feel snappy; revert on error
6. **Don't over-engineer** — this is an MVP. Ship it, then iterate.

---

*Last updated: Pre-flight LAX → CLT hackathon*
