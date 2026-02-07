"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Business as OrgIcon,
  Place as VenueIcon,
  Add as AddIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { Entity } from "@/types/database";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;

      setLoading(true);

      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error loading profile:", profileError);
      } else if (profile) {
        setUsername(profile.username || "");
        setOriginalUsername(profile.username || "");
      }

      // Load user's entities
      const { data: userEntities, error: entitiesError } = await supabase
        .from("entities")
        .select("*")
        .eq("admin_id", user.id)
        .order("name");

      if (entitiesError) {
        console.error("Error loading entities:", entitiesError);
      } else {
        setEntities(userEntities || []);
      }

      setLoading(false);
    }

    loadProfile();
  }, [user, supabase]);

  const handleSaveUsername = async () => {
    if (!user) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({ username: username.trim() || null })
        .eq("id", user.id);

      if (updateError) {
        if (updateError.code === "23505") {
          throw new Error("This username is already taken");
        }
        throw updateError;
      }

      setOriginalUsername(username.trim());
      setSuccess("Username updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update username");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const hasChanges = username.trim() !== originalUsername;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Account Info */}
      <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
        <Typography variant="h6" gutterBottom>
          Account Information
        </Typography>

        <Stack spacing={3}>
          {/* Email (read-only) */}
          <TextField
            label="Email"
            value={user?.email || ""}
            fullWidth
            disabled
            InputProps={{
              startAdornment: <EmailIcon sx={{ mr: 1, color: "text.secondary" }} />,
            }}
          />

          {/* Username (editable) */}
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
            placeholder="Choose a username"
            InputProps={{
              startAdornment: <PersonIcon sx={{ mr: 1, color: "text.secondary" }} />,
            }}
            helperText="This will be displayed on your events and updates"
          />

          {hasChanges && (
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                onClick={handleSaveUsername}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : null}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* My Entities */}
      <Paper sx={{ p: 3, mb: 4 }} variant="outlined">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">My Organizations & Venues</Typography>
          <Button
            component={Link}
            href="/entities/new"
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
          >
            Create New
          </Button>
        </Box>

        {entities.length === 0 ? (
          <Typography color="text.secondary">
            You haven&apos;t created any organizations or venues yet.
          </Typography>
        ) : (
          <List disablePadding>
            {entities.map((entity, index) => (
              <Box key={entity.id}>
                {index > 0 && <Divider />}
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    href={`/${entity.type === "venue" ? "venue" : "org"}/${entity.slug}`}
                  >
                    <ListItemIcon>
                      {entity.type === "venue" ? <VenueIcon /> : <OrgIcon />}
                    </ListItemIcon>
                    <ListItemText
                      primary={entity.name}
                      secondary={entity.description}
                      secondaryTypographyProps={{ noWrap: true }}
                    />
                    <Chip
                      label={entity.type === "venue" ? "Venue" : "Organization"}
                      size="small"
                      variant="outlined"
                    />
                  </ListItemButton>
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Paper>

      {/* Sign Out */}
      <Paper sx={{ p: 3 }} variant="outlined">
        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </Paper>
    </Container>
  );
}
