"use client";

import { Box, Chip, Paper } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";

const AVAILABLE_TAGS = [
  "Free",
  "Music",
  "Comedy",
  "Food",
  "Tech",
  "Outdoors",
  "Family",
  "21+",
  "Fitness",
  "Nightlife",
  "Networking",
];

interface EventFiltersProps {
  selectedDate: Dayjs | null;
  onDateChange: (date: Dayjs | null) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
}

export default function EventFilters({
  selectedDate,
  onDateChange,
  selectedTags,
  onTagToggle,
}: EventFiltersProps) {
  return (
    <Paper
      sx={{
        p: 2,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
        alignItems: { xs: "stretch", md: "center" },
      }}
      elevation={1}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          label="Date"
          value={selectedDate}
          onChange={onDateChange}
          slotProps={{
            textField: {
              size: "small",
              sx: { minWidth: 150 },
            },
          }}
          minDate={dayjs()}
        />
      </LocalizationProvider>

      <Box
        sx={{
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          flex: 1,
        }}
      >
        {AVAILABLE_TAGS.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            onClick={() => onTagToggle(tag)}
            color={selectedTags.includes(tag) ? "primary" : "default"}
            variant={selectedTags.includes(tag) ? "filled" : "outlined"}
            size="small"
          />
        ))}
      </Box>
    </Paper>
  );
}
