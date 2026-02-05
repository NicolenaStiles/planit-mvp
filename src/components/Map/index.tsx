"use client";

import dynamic from "next/dynamic";
import { Box, CircularProgress } from "@mui/material";
import { MockEvent } from "@/data/mockEvents";

// Dynamically import the map component to avoid SSR issues with Leaflet
const EventMap = dynamic(() => import("./EventMap"), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.100",
      }}
    >
      <CircularProgress />
    </Box>
  ),
});

interface MapContainerProps {
  events: MockEvent[];
  center: [number, number];
  zoom?: number;
}

export default function Map({ events, center, zoom }: MapContainerProps) {
  return <EventMap events={events} center={center} zoom={zoom} />;
}
