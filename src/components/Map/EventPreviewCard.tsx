"use client";

import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Button,
} from "@mui/material";
import {
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import Link from "next/link";
import { MockEvent } from "@/data/mockEvents";

interface EventPreviewCardProps {
  event: MockEvent;
  onClose: () => void;
}

export default function EventPreviewCard({
  event,
  onClose,
}: EventPreviewCardProps) {
  return (
    <Card
      sx={{
        position: "absolute",
        bottom: 16,
        left: 16,
        right: 16,
        maxWidth: 400,
        zIndex: 1000,
        mx: "auto",
      }}
      elevation={4}
    >
      <CardContent sx={{ pb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography variant="h6" component="h3" sx={{ pr: 2 }}>
            {event.title}
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -1 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
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
        </Box>

        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>
          {event.tags.slice(0, 3).map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>

        <Button
          component={Link}
          href={`/events/${event.slug}`}
          variant="contained"
          fullWidth
          size="small"
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
