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
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
} from "@mui/icons-material";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { Entity } from "@/types/database";

const AVAILABLE_TAGS = [
  "Music",
  "Comedy",
  "Free",
  "Family",
  "Food",
  "Nightlife",
  "Tech",
  "Networking",
  "Fitness",
  "Outdoors",
  "Art",
  "Community",
  "21+",
  "DIY",
];

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedHosts, setSelectedHosts] = useState<string[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // UI state
  const [myEntities, setMyEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load user's entities on mount
  useEffect(() => {
    async function loadEntities() {
      if (!user) return;

      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("admin_id", user.id);

      if (error) {
        console.error("Error loading entities:", error);
      } else {
        setMyEntities(data || []);
      }
      setLoadingEntities(false);
    }

    loadEntities();
  }, [user, supabase]);

  // Handle address geocoding
  const handleGeocode = async () => {
    if (!address.trim()) {
      setGeocodeError("Please enter an address");
      return;
    }

    setGeocoding(true);
    setGeocodeError("");

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          address
        )}&format=json&limit=1`,
        {
          headers: {
            "User-Agent": "PlanIt-App/1.0",
          },
        }
      );

      const results: GeocodingResult[] = await response.json();

      if (results.length === 0) {
        setGeocodeError("Address not found. Please try a more specific address.");
        setLocation(null);
      } else {
        setLocation({
          lat: parseFloat(results[0].lat),
          lng: parseFloat(results[0].lon),
        });
        setAddress(results[0].display_name);
        setGeocodeError("");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      setGeocodeError("Failed to geocode address. Please try again.");
    } finally {
      setGeocoding(false);
    }
  };

  // Handle banner file selection
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!startsAt) {
      setError("Start date/time is required");
      return;
    }
    if (selectedHosts.length === 0) {
      setError("Please select at least one host entity");
      return;
    }
    if (!location) {
      setError("Please geocode the address before submitting");
      return;
    }

    setSubmitting(true);

    try {
      let bannerUrl = null;

      // Upload banner if provided
      if (bannerFile) {
        const fileExt = bannerFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("banners")
          .upload(`events/${fileName}`, bannerFile);

        if (uploadError) {
          console.error("Banner upload error:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from("banners")
            .getPublicUrl(`events/${fileName}`);
          bannerUrl = publicUrl;
        }
      }

      // Create the event via API
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          address,
          location: `POINT(${location.lng} ${location.lat})`,
          starts_at: new Date(startsAt).toISOString(),
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          tags: selectedTags,
          banner_url: bannerUrl,
          host_entity_ids: selectedHosts,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create event");
      }

      const event = await response.json();
      router.push(`/events/${event.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEntities) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (myEntities.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Button
          component={Link}
          href="/"
          startIcon={<BackIcon />}
          sx={{ mb: 2 }}
          color="inherit"
        >
          Back
        </Button>
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            No Entities Found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            You need to create an organization or venue before you can create events.
          </Typography>
          <Button
            component={Link}
            href="/entities/new"
            variant="contained"
            color="primary"
          >
            Create an Entity
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        component={Link}
        href="/"
        startIcon={<BackIcon />}
        sx={{ mb: 2 }}
        color="inherit"
      >
        Back
      </Button>

      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        Create Event
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        {/* Banner Upload */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Event Banner
          </Typography>
          <Box
            sx={{
              width: "100%",
              height: 200,
              border: "2px dashed",
              borderColor: "divider",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
              cursor: "pointer",
              "&:hover": { borderColor: "primary.main" },
            }}
            component="label"
          >
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleBannerChange}
            />
            {bannerPreview ? (
              <Box
                component="img"
                src={bannerPreview}
                alt="Banner preview"
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <Box sx={{ textAlign: "center" }}>
                <UploadIcon sx={{ fontSize: 48, color: "text.secondary" }} />
                <Typography color="text.secondary">
                  Click to upload banner image
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Title */}
        <TextField
          label="Event Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          required
          sx={{ mb: 3 }}
        />

        {/* Description */}
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          rows={4}
          sx={{ mb: 3 }}
        />

        {/* Date/Time */}
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <TextField
            label="Start Date & Time"
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date & Time"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        {/* Address with Geocoding */}
        <Box sx={{ mb: 3 }}>
          <TextField
            label="Address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setLocation(null);
            }}
            fullWidth
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleGeocode}
                    disabled={geocoding}
                    edge="end"
                  >
                    {geocoding ? (
                      <CircularProgress size={20} />
                    ) : (
                      <SearchIcon />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {geocodeError && (
            <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
              {geocodeError}
            </Typography>
          )}
          {location && (
            <Typography color="success.main" variant="caption" sx={{ mt: 0.5 }}>
              Location found: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </Typography>
          )}
        </Box>

        {/* Tags */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Tags</InputLabel>
          <Select
            multiple
            value={selectedTags}
            onChange={(e) => setSelectedTags(e.target.value as string[])}
            input={<OutlinedInput label="Tags" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
            )}
          >
            {AVAILABLE_TAGS.map((tag) => (
              <MenuItem key={tag} value={tag}>
                <Checkbox checked={selectedTags.includes(tag)} />
                <ListItemText primary={tag} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Host Entities */}
        <FormControl fullWidth sx={{ mb: 3 }} required>
          <InputLabel>Host Entities</InputLabel>
          <Select
            multiple
            value={selectedHosts}
            onChange={(e) => setSelectedHosts(e.target.value as string[])}
            input={<OutlinedInput label="Host Entities" />}
            renderValue={(selected) => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map((id) => {
                  const entity = myEntities.find((e) => e.id === id);
                  return entity ? (
                    <Chip key={id} label={entity.name} size="small" />
                  ) : null;
                })}
              </Box>
            )}
          >
            {myEntities.map((entity) => (
              <MenuItem key={entity.id} value={entity.id}>
                <Checkbox checked={selectedHosts.includes(entity.id)} />
                <ListItemText
                  primary={entity.name}
                  secondary={entity.type === "venue" ? "Venue" : "Organization"}
                />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Submit */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            component={Link}
            href="/"
            color="inherit"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? "Creating..." : "Create Event"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
