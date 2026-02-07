"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  Check as YesIcon,
  QuestionMark as MaybeIcon,
  Bookmark as SavedIcon,
} from "@mui/icons-material";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface CalendarEvent {
  id: string;
  title: string;
  slug: string;
  address: string | null;
  starts_at: string;
  ends_at: string | null;
  tags: string[] | null;
  rsvp_status?: "yes" | "maybe";
  is_saved?: boolean;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rsvpEvents, setRsvpEvents] = useState<CalendarEvent[]>([]);
  const [savedEvents, setSavedEvents] = useState<CalendarEvent[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    async function loadEvents() {
      if (!user) return;

      setLoading(true);
      setError("");

      try {
        // Fetch RSVP'd events (yes or maybe)
        const { data: rsvps, error: rsvpError } = await supabase
          .from("rsvps")
          .select(`
            status,
            events (
              id,
              title,
              slug,
              address,
              starts_at,
              ends_at,
              tags
            )
          `)
          .eq("user_id", user.id)
          .in("status", ["yes", "maybe"]);

        if (rsvpError) {
          console.error("Error loading RSVPs:", rsvpError);
        } else {
          const events = (rsvps || [])
            .filter((r) => r.events)
            .map((r) => ({
              ...(r.events as unknown as CalendarEvent),
              rsvp_status: r.status as "yes" | "maybe",
            }))
            .filter((e) => new Date(e.starts_at) >= new Date())
            .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
          setRsvpEvents(events);
        }

        // Fetch saved events
        const { data: saves, error: saveError } = await supabase
          .from("saves")
          .select(`
            events (
              id,
              title,
              slug,
              address,
              starts_at,
              ends_at,
              tags
            )
          `)
          .eq("user_id", user.id);

        if (saveError) {
          console.error("Error loading saves:", saveError);
        } else {
          const events = (saves || [])
            .filter((s) => s.events)
            .map((s) => ({
              ...(s.events as unknown as CalendarEvent),
              is_saved: true,
            }))
            .filter((e) => new Date(e.starts_at) >= new Date())
            .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
          setSavedEvents(events);
        }
      } catch (err) {
        setError("Failed to load events");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [user, supabase]);

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const groups: { [date: string]: CalendarEvent[] } = {};

    events.forEach((event) => {
      const dateKey = new Date(event.starts_at).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    return groups;
  };

  const currentEvents = activeTab === 0 ? rsvpEvents : savedEvents;
  const groupedEvents = groupEventsByDate(currentEvents);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Loading your events...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        My Calendar
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 3 }}
      >
        <Tab
          label={`Going (${rsvpEvents.length})`}
          icon={<YesIcon />}
          iconPosition="start"
        />
        <Tab
          label={`Saved (${savedEvents.length})`}
          icon={<SavedIcon />}
          iconPosition="start"
        />
      </Tabs>

      {currentEvents.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }} variant="outlined">
          <CalendarIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {activeTab === 0 ? "No upcoming events" : "No saved events"}
          </Typography>
          <Typography color="text.secondary">
            {activeTab === 0
              ? "RSVP to events to see them here."
              : "Save events you're interested in to see them here."}
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {Object.entries(groupedEvents).map(([date, events]) => (
            <Box key={date}>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                {date}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Container>
  );
}

function EventCard({ event }: { event: CalendarEvent }) {
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
        {/* Time */}
        <Box
          sx={{
            minWidth: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight={700} color="primary">
            {startDate.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}
          </Typography>
          {event.rsvp_status && (
            <Chip
              size="small"
              icon={event.rsvp_status === "yes" ? <YesIcon /> : <MaybeIcon />}
              label={event.rsvp_status === "yes" ? "Going" : "Maybe"}
              color={event.rsvp_status === "yes" ? "success" : "warning"}
              variant="outlined"
            />
          )}
          {event.is_saved && (
            <Chip
              size="small"
              icon={<SavedIcon />}
              label="Saved"
              variant="outlined"
            />
          )}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            {event.title}
          </Typography>
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
