"use client";

import { useState, useMemo } from "react";
import { Box, Typography, Paper, Chip, Stack } from "@mui/material";
import {
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import Link from "next/link";
import dayjs, { Dayjs } from "dayjs";
import { mockEvents } from "@/data/mockEvents";
import Map from "@/components/Map";
import EventFilters from "@/components/Map/EventFilters";
import { useGeolocation } from "@/hooks/useGeolocation";

export default function Home() {
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Filter events based on selected date and tags
  const filteredEvents = useMemo(() => {
    return mockEvents.filter((event) => {
      // Date filter
      if (selectedDate) {
        const eventDate = dayjs(event.starts_at);
        if (!eventDate.isSame(selectedDate, "day")) {
          return false;
        }
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasMatchingTag = event.tags.some((tag) =>
          selectedTags.includes(tag)
        );
        if (!hasMatchingTag) {
          return false;
        }
      }

      return true;
    });
  }, [selectedDate, selectedTags]);

  // Default center (Charlotte, NC) or user's location
  const mapCenter: [number, number] = [
    latitude ?? 35.2271,
    longitude ?? -80.8431,
  ];

  return (
    <Box sx={{ height: "calc(100vh - 64px)", display: "flex", flexDirection: "column" }}>
      {/* Filters */}
      <Box sx={{ p: 2, pb: 0 }}>
        <EventFilters
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
        />
      </Box>

      {/* Map and Event List */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: { xs: "column", md: "row" }, p: 2, gap: 2, minHeight: 0 }}>
        {/* Map */}
        <Paper
          sx={{
            flex: { xs: "0 0 300px", md: 2 },
            minHeight: { xs: 300, md: 0 },
            overflow: "hidden",
          }}
          elevation={2}
        >
          {!geoLoading && (
            <Map events={filteredEvents} center={mapCenter} zoom={13} />
          )}
        </Paper>

        {/* Event List */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            minHeight: { xs: 200, md: 0 },
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight={600} sx={{ px: 1 }}>
            {filteredEvents.length === 0
              ? "No events found"
              : `${filteredEvents.length} event${filteredEvents.length !== 1 ? "s" : ""}`}
          </Typography>
          <Stack spacing={2}>
            {filteredEvents.map((event) => (
              <Paper
                key={event.id}
                component={Link}
                href={`/events/${event.slug}`}
                sx={{
                  p: 2,
                  display: "block",
                  textDecoration: "none",
                  color: "inherit",
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: 4,
                  },
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {event.title}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
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
                    <Typography variant="body2" noWrap>
                      {event.address}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                  {event.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Paper>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
