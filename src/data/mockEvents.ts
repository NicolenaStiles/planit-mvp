export interface MockEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  starts_at: string;
  ends_at: string | null;
  banner_url: string | null;
  tags: string[];
  hosts: {
    id: string;
    name: string;
    type: "organization" | "venue";
    slug: string;
  }[];
}

// Mock events data for development
export const mockEvents: MockEvent[] = [
  {
    id: "1",
    title: "Farmer's Market",
    slug: "farmers-market-downtown",
    description:
      "Fresh local produce, artisan goods, and live music every Saturday morning.",
    address: "123 Main Street, Downtown",
    location: { lat: 35.227, lng: -80.843 },
    starts_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    ends_at: new Date(Date.now() + 86400000 + 14400000).toISOString(),
    banner_url: null,
    tags: ["Free", "Family", "Food"],
    hosts: [
      { id: "v1", name: "City Plaza", type: "venue", slug: "city-plaza" },
    ],
  },
  {
    id: "2",
    title: "Open Mic Night",
    slug: "open-mic-weary-liver",
    description:
      "Bring your guitar, your poems, or just your ears. All skill levels welcome!",
    address: "456 Oak Avenue",
    location: { lat: 35.229, lng: -80.84 },
    starts_at: new Date(Date.now() + 172800000).toISOString(), // 2 days
    ends_at: new Date(Date.now() + 172800000 + 10800000).toISOString(),
    banner_url: null,
    tags: ["Music", "Free", "21+"],
    hosts: [
      { id: "v2", name: "The Weary Liver", type: "venue", slug: "the-weary-liver" },
      { id: "o1", name: "Local Artists Collective", type: "organization", slug: "local-artists-collective" },
    ],
  },
  {
    id: "3",
    title: "The Download Comedy Show",
    slug: "download-comedy-feb",
    description:
      "Charlotte's funniest improv troupe performs their signature show with audience suggestions.",
    address: "789 Comedy Lane",
    location: { lat: 35.225, lng: -80.845 },
    starts_at: new Date(Date.now() + 259200000).toISOString(), // 3 days
    ends_at: new Date(Date.now() + 259200000 + 7200000).toISOString(),
    banner_url: null,
    tags: ["Comedy", "Nightlife"],
    hosts: [
      { id: "o2", name: "The Download", type: "organization", slug: "the-download" },
    ],
  },
  {
    id: "4",
    title: "Community Yoga in the Park",
    slug: "yoga-park-saturday",
    description:
      "Free outdoor yoga session for all levels. Bring your own mat!",
    address: "Freedom Park Meadow",
    location: { lat: 35.211, lng: -80.853 },
    starts_at: new Date(Date.now() + 345600000).toISOString(), // 4 days
    ends_at: new Date(Date.now() + 345600000 + 3600000).toISOString(),
    banner_url: null,
    tags: ["Free", "Fitness", "Outdoors"],
    hosts: [
      { id: "o3", name: "Mindful Movement CLT", type: "organization", slug: "mindful-movement-clt" },
    ],
  },
  {
    id: "5",
    title: "Tech Meetup: AI & Local Apps",
    slug: "tech-meetup-ai-local",
    description:
      "Join us for talks on building AI-powered local discovery apps. Pizza provided!",
    address: "Innovation Hub, 100 Tech Drive",
    location: { lat: 35.231, lng: -80.838 },
    starts_at: new Date(Date.now() + 432000000).toISOString(), // 5 days
    ends_at: new Date(Date.now() + 432000000 + 10800000).toISOString(),
    banner_url: null,
    tags: ["Tech", "Networking", "Free"],
    hosts: [
      { id: "o4", name: "Charlotte Developers", type: "organization", slug: "charlotte-developers" },
      { id: "v3", name: "Innovation Hub", type: "venue", slug: "innovation-hub" },
    ],
  },
];

export function getEventBySlug(slug: string): MockEvent | undefined {
  return mockEvents.find((e) => e.slug === slug);
}

export function getEventsByEntity(entityId: string): MockEvent[] {
  return mockEvents.filter((e) => e.hosts.some((h) => h.id === entityId));
}
