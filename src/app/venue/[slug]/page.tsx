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
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from "@mui/material";
import {
  LocationOn as LocationIcon,
  ArrowBack as BackIcon,
  ExpandMore as ExpandIcon,
  CalendarMonth as CalendarIcon,
} from "@mui/icons-material";
import { getEntityBySlug } from "@/data/mockEntities";
import { getEventsByEntity } from "@/data/mockEvents";
import FollowButton from "@/components/Entity/FollowButton";
import Map from "@/components/Map";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function VenuePage({ params }: PageProps) {
  const { slug } = use(params);
  const entity = getEntityBySlug("venue", slug);

  if (!entity) {
    notFound();
  }

  const allEvents = getEventsByEntity(entity.id);
  const now = new Date();
  const upcomingEvents = allEvents.filter((e) => new Date(e.starts_at) >= now);
  const pastEvents = allEvents.filter((e) => new Date(e.starts_at) < now);

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

      {/* Banner */}
      <Paper
        sx={{
          height: 200,
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "secondary.light",
          color: "white",
          borderRadius: 2,
        }}
      >
        <Typography variant="h3" fontWeight={700}>
          {entity.name.charAt(0)}
        </Typography>
      </Paper>

      {/* Name and follow */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 2,
        }}
      >
        <Box>
          <Chip label="Venue" size="small" sx={{ mb: 1 }} />
          <Typography variant="h4" component="h1" fontWeight={700}>
            {entity.name}
          </Typography>
        </Box>
        <FollowButton entityId={entity.id} />
      </Box>

      {/* Address */}
      {entity.address && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <LocationIcon color="action" />
          <Typography color="text.secondary">{entity.address}</Typography>
        </Box>
      )}

      {/* Mini map */}
      {entity.location && (
        <Paper
          sx={{ height: 200, mb: 3, overflow: "hidden" }}
          variant="outlined"
        >
          <Map
            events={[]}
            center={[entity.location.lat, entity.location.lng]}
            zoom={15}
          />
        </Paper>
      )}

      {/* Description */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" color="text.secondary">
          {entity.description}
        </Typography>
      </Box>

      {/* Upcoming Events */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upcoming Events ({upcomingEvents.length})
        </Typography>
        {upcomingEvents.length === 0 ? (
          <Typography color="text.secondary">No upcoming events</Typography>
        ) : (
          <Stack spacing={2}>
            {upcomingEvents.map((event) => (
              <Paper
                key={event.id}
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
                <Typography variant="subtitle1" fontWeight={600}>
                  {event.title}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    color: "text.secondary",
                  }}
                >
                  <CalendarIcon fontSize="small" />
                  <Typography variant="body2">
                    {new Date(event.starts_at).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandIcon />}>
            <Typography>Past Events ({pastEvents.length})</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {pastEvents.map((event) => (
                <Paper
                  key={event.id}
                  component={Link}
                  href={`/events/${event.slug}`}
                  sx={{
                    p: 2,
                    display: "block",
                    textDecoration: "none",
                    color: "inherit",
                    opacity: 0.7,
                    "&:hover": { opacity: 1 },
                  }}
                  variant="outlined"
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    {event.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(event.starts_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      )}
    </Container>
  );
}
