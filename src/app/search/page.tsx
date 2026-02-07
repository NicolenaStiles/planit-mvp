"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Container,
  Typography,
  TextField,
  InputAdornment,
  Box,
  Paper,
  Chip,
  Tabs,
  Tab,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Search as SearchIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Event as EventIcon,
  Business as OrgIcon,
  Place as VenueIcon,
} from "@mui/icons-material";
import { Event, Entity } from "@/types/database";

const AVAILABLE_TAGS = [
  "Music",
  "Comedy",
  "Free",
  "Family",
  "Food",
  "Nightlife",
  "Tech",
  "Networking",
  "Fitness",
  "Outdoors",
  "Art",
  "Community",
];

interface SearchResults {
  query: string;
  results: {
    events: EventWithHosts[];
    entities: Entity[];
  };
  counts: {
    events: number;
    entities: number;
    total: number;
  };
}

interface EventWithHosts extends Event {
  event_hosts: {
    entity_id: string;
    entities: {
      id: string;
      name: string;
      slug: string;
      type: "organization" | "venue";
    };
  }[];
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQuery = searchParams.get("q") || "";
  const initialTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const initialTab = searchParams.get("type") === "entities" ? 1 : 0;

  const [query, setQuery] = useState(initialQuery);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const performSearch = useCallback(async () => {
    if (!query.trim() || query.trim().length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("q", query.trim());

      if (selectedTags.length > 0) {
        params.set("tags", selectedTags.join(","));
      }

      const response = await fetch(`/api/search?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Search failed");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [query, selectedTags]);

  // Perform search when query or tags change
  useEffect(() => {
    const debounce = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounce);
  }, [performSearch]);

  // Update URL when search params change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    if (selectedTags.length > 0) {
      params.set("tags", selectedTags.join(","));
    }
    if (activeTab === 1) {
      params.set("type", "entities");
    }

    const newUrl = params.toString() ? `/search?${params.toString()}` : "/search";
    router.replace(newUrl, { scroll: false });
  }, [query, selectedTags, activeTab, router]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Search Events
      </Typography>

      {/* Search Form */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 3, mb: 3 }}
        variant="outlined"
      >
        <TextField
          fullWidth
          placeholder="Search for events, venues, or organizations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        {/* Tag Filters */}
        <Typography variant="subtitle2" gutterBottom>
          Filter by tags
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {AVAILABLE_TAGS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              variant={selectedTags.includes(tag) ? "filled" : "outlined"}
              color={selectedTags.includes(tag) ? "primary" : "default"}
              onClick={() => handleTagToggle(tag)}
            />
          ))}
        </Box>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Searching...
          </Typography>
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : results ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Found {results.counts.total} results for &quot;{results.query}&quot;
          </Typography>

          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ mb: 3 }}
          >
            <Tab
              label={`Events (${results.counts.events})`}
              icon={<EventIcon />}
              iconPosition="start"
            />
            <Tab
              label={`Places & Orgs (${results.counts.entities})`}
              icon={<OrgIcon />}
              iconPosition="start"
            />
          </Tabs>

          {activeTab === 0 ? (
            <Stack spacing={2}>
              {results.results.events.length === 0 ? (
                <Typography color="text.secondary">
                  No events found matching your search.
                </Typography>
              ) : (
                results.results.events.map((event) => (
                  <EventResult key={event.id} event={event} />
                ))
              )}
            </Stack>
          ) : (
            <Stack spacing={2}>
              {results.results.entities.length === 0 ? (
                <Typography color="text.secondary">
                  No venues or organizations found matching your search.
                </Typography>
              ) : (
                results.results.entities.map((entity) => (
                  <EntityResult key={entity.id} entity={entity} />
                ))
              )}
            </Stack>
          )}
        </>
      ) : query.trim().length > 0 && query.trim().length < 2 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          Please enter at least 2 characters to search.
        </Typography>
      ) : (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
          Enter a search term to find events, venues, and organizations.
        </Typography>
      )}
    </Container>
  );
}

function EventResult({ event }: { event: EventWithHosts }) {
  const startDate = new Date(event.starts_at);

  return (
    <Paper
      component={Link}
      href={`/events/${event.slug}`}
      sx={{
        p: 2,
        display: "block",
        textDecoration: "none",
        color: "inherit",
        "&:hover": { boxShadow: 2 },
      }}
      variant="outlined"
    >
      <Box sx={{ display: "flex", gap: 2 }}>
        {/* Date badge */}
        <Box
          sx={{
            width: 60,
            minWidth: 60,
            height: 60,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "primary.main",
            color: "white",
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" sx={{ textTransform: "uppercase" }}>
            {startDate.toLocaleDateString("en-US", { month: "short" })}
          </Typography>
          <Typography variant="h6" fontWeight={700}>
            {startDate.getDate()}
          </Typography>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            {event.title}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              color: "text.secondary",
              mb: 0.5,
            }}
          >
            <CalendarIcon fontSize="small" />
            <Typography variant="body2">
              {startDate.toLocaleDateString("en-US", {
                weekday: "short",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Typography>
          </Box>
          {event.address && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "text.secondary",
              }}
            >
              <LocationIcon fontSize="small" />
              <Typography variant="body2" noWrap>
                {event.address}
              </Typography>
            </Box>
          )}
          {event.tags && event.tags.length > 0 && (
            <Box sx={{ display: "flex", gap: 0.5, mt: 1, flexWrap: "wrap" }}>
              {event.tags.slice(0, 3).map((tag) => (
                <Chip key={tag} label={tag} size="small" />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

function EntityResult({ entity }: { entity: Entity }) {
  const href =
    entity.type === "venue"
      ? `/venue/${entity.slug}`
      : `/org/${entity.slug}`;

  return (
    <Paper
      component={Link}
      href={href}
      sx={{
        p: 2,
        display: "block",
        textDecoration: "none",
        color: "inherit",
        "&:hover": { boxShadow: 2 },
      }}
      variant="outlined"
    >
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        {/* Icon */}
        <Box
          sx={{
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: entity.type === "venue" ? "secondary.main" : "primary.main",
            color: "white",
            borderRadius: 1,
          }}
        >
          {entity.type === "venue" ? <VenueIcon /> : <OrgIcon />}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {entity.name}
            </Typography>
            <Chip
              label={entity.type === "venue" ? "Venue" : "Organization"}
              size="small"
              variant="outlined"
            />
          </Box>
          {entity.description && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {entity.description}
            </Typography>
          )}
          {entity.address && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                color: "text.secondary",
                mt: 0.5,
              }}
            >
              <LocationIcon fontSize="small" />
              <Typography variant="body2" noWrap>
                {entity.address}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
          <CircularProgress />
        </Container>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
