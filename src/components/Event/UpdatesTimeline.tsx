"use client";

import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import { Typography, Paper, Box } from "@mui/material";
import {
  Edit as EditIcon,
  Campaign as AnnouncementIcon,
} from "@mui/icons-material";

export interface EventUpdate {
  id: string;
  type: "auto" | "manual";
  field_changed?: string;
  old_value?: string;
  new_value?: string;
  message?: string;
  created_at: string;
}

interface UpdatesTimelineProps {
  updates: EventUpdate[];
}

export default function UpdatesTimeline({ updates }: UpdatesTimelineProps) {
  if (updates.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No updates yet
      </Typography>
    );
  }

  const formatFieldName = (field: string) => {
    return field
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Timeline sx={{ p: 0, m: 0 }}>
      {updates.map((update, index) => (
        <TimelineItem
          key={update.id}
          sx={{
            "&::before": { display: "none" },
            minHeight: "auto",
          }}
        >
          <TimelineSeparator>
            <TimelineDot
              color={update.type === "auto" ? "grey" : "primary"}
              variant={update.type === "auto" ? "outlined" : "filled"}
            >
              {update.type === "auto" ? (
                <EditIcon fontSize="small" />
              ) : (
                <AnnouncementIcon fontSize="small" />
              )}
            </TimelineDot>
            {index < updates.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent sx={{ py: 1, px: 2 }}>
            <Paper sx={{ p: 2 }} variant="outlined">
              {update.type === "auto" ? (
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {formatFieldName(update.field_changed || "")} updated
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Changed from &quot;{update.old_value}&quot; to &quot;
                    {update.new_value}&quot;
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2">{update.message}</Typography>
              )}
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                {new Date(update.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </Typography>
            </Paper>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}
