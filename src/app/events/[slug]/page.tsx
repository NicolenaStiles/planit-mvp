"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";
import { getEventBySlug } from "@/data/mockEvents";
import { getUpdatesForEvent } from "@/data/mockUpdates";
import RSVPButtons from "@/components/Event/RSVPButtons";
import ActionButtons from "@/components/Event/ActionButtons";
import UpdatesTimeline from "@/components/Event/UpdatesTimeline";
import Map from "@/components/Map";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EventPage({ params }: PageProps) {
  const { slug } = use(params);
  const event = getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const updates = getUpdatesForEvent(event.id);
  const startDate = new Date(event.starts_at);
  const endDate = event.ends_at ? new Date(event.ends_at) : null;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        component={Link}
        href="/"
        startIcon={<BackIcon />}
        sx={{ mb: 2 }}
        color="inherit"
      >
        Back to map
      </Button>

      {/* Banner placeholder */}
      <Paper
        sx={{
          height: 200,
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "primary.light",
          color: "white",
          borderRadius: 2,
        }}
      >
        <Typography variant="h3" fontWeight={700}>
          {event.title.charAt(0)}
        </Typography>
      </Paper>

      {/* Title and actions */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight={700}>
          {event.title}
        </Typography>
        <Box>
          <ActionButtons
            eventId={event.id}
            eventTitle={event.title}
            eventSlug={event.slug}
          />
        </Box>
      </Box>

      {/* Date/Time/Location */}
      <Paper sx={{ p: 3, mb: 3 }} variant="outlined">
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CalendarIcon color="action" />
            <Typography>
              {startDate.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TimeIcon color="action" />
            <Typography>
              {startDate.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
              {endDate &&
                ` - ${endDate.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}`}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LocationIcon color="action" />
            <Typography>{event.address}</Typography>
          </Box>
        </Box>
      </Paper>

      {/* Mini map */}
      <Paper sx={{ height: 200, mb: 3, overflow: "hidden" }} variant="outlined">
        <Map
          events={[event]}
          center={[event.location.lat, event.location.lng]}
          zoom={15}
        />
      </Paper>

      {/* Hosts */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Hosted by
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {event.hosts.map((host) => (
            <Chip
              key={host.id}
              label={host.name}
              component={Link}
              href={`/${host.type === "venue" ? "venue" : "org"}/${host.slug}`}
              clickable
              variant="outlined"
            />
          ))}
        </Box>
      </Box>

      {/* Description */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          About this event
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {event.description}
        </Typography>
      </Box>

      {/* Tags */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {event.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* RSVP */}
      <Box sx={{ mb: 4 }}>
        <RSVPButtons eventId={event.id} />
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Updates */}
      <Box>
        <Typography variant="h6" gutterBottom>
          Updates
        </Typography>
        <UpdatesTimeline updates={updates} />
      </Box>
    </Container>
  );
}
