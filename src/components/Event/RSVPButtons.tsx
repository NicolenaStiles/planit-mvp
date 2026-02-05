"use client";

import { useState } from "react";
import { ToggleButton, ToggleButtonGroup, Typography, Box } from "@mui/material";
import {
  CheckCircle as YesIcon,
  Help as MaybeIcon,
  Cancel as NoIcon,
} from "@mui/icons-material";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

type RSVPStatus = "yes" | "maybe" | "no" | null;

interface RSVPButtonsProps {
  eventId: string;
  initialStatus?: RSVPStatus;
}

export default function RSVPButtons({
  eventId,
  initialStatus = null,
}: RSVPButtonsProps) {
  const [status, setStatus] = useState<RSVPStatus>(initialStatus);
  const { user } = useAuth();
  const router = useRouter();

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newStatus: RSVPStatus
  ) => {
    if (!user) {
      router.push("/login");
      return;
    }
    // Toggle off if clicking the same status
    setStatus(newStatus);
    // TODO: Wire up to API in Milestone 6
    console.log(`RSVP for event ${eventId}: ${newStatus}`);
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        Are you going?
      </Typography>
      <ToggleButtonGroup
        value={status}
        exclusive
        onChange={handleChange}
        aria-label="RSVP status"
        size="small"
      >
        <ToggleButton
          value="yes"
          aria-label="yes"
          color="success"
          sx={{ px: 2 }}
        >
          <YesIcon sx={{ mr: 0.5 }} fontSize="small" />
          Yes
        </ToggleButton>
        <ToggleButton
          value="maybe"
          aria-label="maybe"
          color="warning"
          sx={{ px: 2 }}
        >
          <MaybeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Maybe
        </ToggleButton>
        <ToggleButton value="no" aria-label="no" color="error" sx={{ px: 2 }}>
          <NoIcon sx={{ mr: 0.5 }} fontSize="small" />
          No
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
