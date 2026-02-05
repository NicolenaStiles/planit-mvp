"use client";

import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MockEvent } from "@/data/mockEvents";
import EventPreviewCard from "./EventPreviewCard";

// Fix for default marker icons in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

interface EventMapProps {
  events: MockEvent[];
  center: [number, number];
  zoom?: number;
}

// Component to handle map center changes
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();

  useMemo(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);

  return null;
}

export default function EventMap({
  events,
  center,
  zoom = 13,
}: EventMapProps) {
  const [selectedEvent, setSelectedEvent] = useState<MockEvent | null>(null);

  const handleMarkerClick = (event: MockEvent) => {
    setSelectedEvent(event);
  };

  return (
    <div style={{ position: "relative", height: "100%", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} />

        <MarkerClusterGroup chunkedLoading>
          {events.map((event) => (
            <Marker
              key={event.id}
              position={[event.location.lat, event.location.lng]}
              eventHandlers={{
                click: () => handleMarkerClick(event),
              }}
            >
              <Popup>
                <strong>{event.title}</strong>
                <br />
                {new Date(event.starts_at).toLocaleDateString()}
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {selectedEvent && (
        <EventPreviewCard
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
