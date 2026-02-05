"use client";

import { Box, Container, Typography, Paper, Chip, Stack } from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { mockEvents } from "@/data/mockEvents";

export default function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
          Discover Local Events
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find what&apos;s happening near you
        </Typography>
      </Box>

      {/* Placeholder for map - will be added in Milestone 3 */}
      <Paper
        sx={{
          height: 300,
          mb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "grey.100",
        }}
      >
        <Typography color="text.secondary">
          Map coming in Milestone 3
        </Typography>
      </Paper>

      {/* Event list */}
      <Typography variant="h5" component="h2" gutterBottom fontWeight={600}>
        Upcoming Events
      </Typography>
      <Stack spacing={2}>
        {mockEvents.map((event) => (
          <Paper
            key={event.id}
            component={Link}
            href={`/events/${event.slug}`}
            sx={{
              p: 3,
              display: "block",
              textDecoration: "none",
              color: "inherit",
              transition: "box-shadow 0.2s",
              "&:hover": {
                boxShadow: 4,
              },
            }}
          >
            <Typography variant="h6" gutterBottom>
              {event.title}
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 3,
                mb: 1,
                color: "text.secondary",
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <LocationIcon fontSize="small" />
                <Typography variant="body2">{event.address}</Typography>
              </Box>
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, display: { xs: "none", sm: "block" } }}
            >
              {event.description}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {event.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          </Paper>
        ))}
      </Stack>
    </Container>
  );
}
