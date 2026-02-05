"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#2E7D32", // Forest green - evokes outdoor events, nature
      light: "#4CAF50",
      dark: "#1B5E20",
    },
    secondary: {
      main: "#FF6F00", // Warm amber - energetic, event-focused
      light: "#FFA040",
      dark: "#C43E00",
    },
    background: {
      default: "#FAFAFA",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), sans-serif",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "medium",
      },
    },
  },
});

export default theme;
