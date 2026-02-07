"use client";

import { Container, Typography, Paper, Box } from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";

export default function SettingsPage() {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 4, textAlign: "center" }} variant="outlined">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <SettingsIcon sx={{ fontSize: 48, color: "text.secondary" }} />
          <Typography variant="h6">Settings Coming Soon</Typography>
          <Typography color="text.secondary">
            We&apos;re working on bringing you more customization options.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
