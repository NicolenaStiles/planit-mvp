"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Box, CircularProgress, Container, Typography } from "@mui/material";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Loading...
        </Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          Redirecting to login...
        </Typography>
      </Container>
    );
  }

  return <Box>{children}</Box>;
}
