export interface MockEntity {
  id: string;
  type: "organization" | "venue";
  name: string;
  slug: string;
  description: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  banner_url: string | null;
}

export const mockEntities: MockEntity[] = [
  {
    id: "v1",
    type: "venue",
    name: "City Plaza",
    slug: "city-plaza",
    description:
      "A beautiful outdoor plaza in the heart of downtown, perfect for community gatherings and markets.",
    address: "123 Main Street, Downtown",
    location: { lat: 35.227, lng: -80.843 },
    banner_url: null,
  },
  {
    id: "v2",
    type: "venue",
    name: "The Weary Liver",
    slug: "the-weary-liver",
    description:
      "A cozy neighborhood bar with live music, open mics, and a great craft beer selection.",
    address: "456 Oak Avenue",
    location: { lat: 35.229, lng: -80.84 },
    banner_url: null,
  },
  {
    id: "v3",
    type: "venue",
    name: "Innovation Hub",
    slug: "innovation-hub",
    description:
      "Co-working space and event venue for tech meetups, workshops, and startup events.",
    address: "100 Tech Drive",
    location: { lat: 35.231, lng: -80.838 },
    banner_url: null,
  },
  {
    id: "o1",
    type: "organization",
    name: "Local Artists Collective",
    slug: "local-artists-collective",
    description:
      "A community of local musicians, poets, and performers supporting the arts scene.",
    banner_url: null,
  },
  {
    id: "o2",
    type: "organization",
    name: "The Download",
    slug: "the-download",
    description:
      "Charlotte's premier improv comedy troupe, performing weekly shows and workshops since 2015.",
    banner_url: null,
  },
  {
    id: "o3",
    type: "organization",
    name: "Mindful Movement CLT",
    slug: "mindful-movement-clt",
    description:
      "Bringing free yoga and wellness classes to parks and public spaces across Charlotte.",
    banner_url: null,
  },
  {
    id: "o4",
    type: "organization",
    name: "Charlotte Developers",
    slug: "charlotte-developers",
    description:
      "A community for software developers to learn, share, and network. Monthly meetups and hackathons.",
    banner_url: null,
  },
];

export function getEntityBySlug(
  type: "organization" | "venue",
  slug: string
): MockEntity | undefined {
  const typePrefix = type === "organization" ? "o" : "v";
  return mockEntities.find(
    (e) => e.slug === slug && e.id.startsWith(typePrefix)
  );
}
