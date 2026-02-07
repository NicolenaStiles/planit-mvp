"use client";

import { useState, useEffect, use } from "react";
import { useRouter, notFound } from "next/navigation";
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
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { EventWithHostsAndUpdates } from "@/types/database";
import UpdatesTimeline, { EventUpdate } from "@/components/Event/UpdatesTimeline";

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

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ManageEventPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  // Event data
  const [event, setEvent] = useState<EventWithHostsAndUpdates | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Update form
  const [updateMessage, setUpdateMessage] = useState("");
  const [postingUpdate, setPostingUpdate] = useState(false);

  // UI state
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load event and entities on mount
  useEffect(() => {
    async function loadData() {
      if (!user) return;

      // Load event
      const eventResponse = await fetch(`/api/events/${slug}`);
      if (!eventResponse.ok) {
        if (eventResponse.status === 404) {
          notFound();
        }
        setError("Failed to load event");
        setLoading(false);
        return;
      }

      const eventData = await eventResponse.json();
      setEvent(eventData);

      // Populate form
      setTitle(eventData.title);
      setDescription(eventData.description || "");
      setAddress(eventData.address || "");
      setSelectedTags(eventData.tags || []);
      setBannerPreview(eventData.banner_url);

      // Parse dates for input
      if (eventData.starts_at) {
        const startDate = new Date(eventData.starts_at);
        setStartsAt(formatDateForInput(startDate));
      }
      if (eventData.ends_at) {
        const endDate = new Date(eventData.ends_at);
        setEndsAt(formatDateForInput(endDate));
      }

      // Parse location (assuming it's stored as string "POINT(lng lat)" or object)
      if (eventData.location) {
        // Try to extract from PostGIS format or use directly if object
        if (typeof eventData.location === "string") {
          const match = eventData.location.match(/POINT\(([^ ]+) ([^)]+)\)/);
          if (match) {
            setLocation({ lng: parseFloat(match[1]), lat: parseFloat(match[2]) });
          }
        } else if (eventData.location.coordinates) {
          setLocation({
            lng: eventData.location.coordinates[0],
            lat: eventData.location.coordinates[1],
          });
        }
      }

      setLoading(false);
    }

    loadData();
  }, [slug, user, supabase]);

  function formatDateForInput(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

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
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!startsAt) {
      setError("Start date/time is required");
      return;
    }

    setSaving(true);

    try {
      let bannerUrl = event?.banner_url || null;

      // Upload new banner if provided
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

      // Build update payload
      const updatePayload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() || null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        tags: selectedTags,
        banner_url: bannerUrl,
      };

      // Only update address/location if changed
      if (address !== event?.address) {
        updatePayload.address = address;
        if (location) {
          updatePayload.location = `POINT(${location.lng} ${location.lat})`;
        }
      }

      const response = await fetch(`/api/events/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update event");
      }

      const updatedEvent = await response.json();
      setSuccess("Event updated successfully!");

      // Redirect if slug changed
      if (updatedEvent.slug !== slug) {
        router.push(`/events/${updatedEvent.slug}/manage`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  // Handle posting update
  const handlePostUpdate = async () => {
    if (!updateMessage.trim()) return;

    setPostingUpdate(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${slug}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: updateMessage.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to post update");
      }

      const newUpdate = await response.json();

      // Add to local state
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              updates: [newUpdate, ...(prev.updates || [])],
            }
          : null
      );

      setUpdateMessage("");
      setSuccess("Update posted successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post update");
    } finally {
      setPostingUpdate(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`/api/events/${slug}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete event");
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
      setDeleteDialogOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!event) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Event not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        component={Link}
        href={`/events/${slug}`}
        startIcon={<BackIcon />}
        sx={{ mb: 2 }}
        color="inherit"
      >
        View Event
      </Button>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Manage Event
        </Typography>
        <Button
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => setDeleteDialogOpen(true)}
        >
          Delete
        </Button>
      </Box>

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

      {/* Edit Form */}
      <Paper component="form" onSubmit={handleSave} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Event Details
        </Typography>

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
              Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
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

        {/* Submit */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ mb: 4 }} />

      {/* Post Update */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Post an Update
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Share news or announcements with attendees
        </Typography>
        <TextField
          label="Update Message"
          value={updateMessage}
          onChange={(e) => setUpdateMessage(e.target.value)}
          fullWidth
          multiline
          rows={3}
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            onClick={handlePostUpdate}
            disabled={postingUpdate || !updateMessage.trim()}
            startIcon={postingUpdate ? <CircularProgress size={20} /> : null}
          >
            {postingUpdate ? "Posting..." : "Post Update"}
          </Button>
        </Box>
      </Paper>

      {/* Updates Timeline */}
      {event.updates && event.updates.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Update History
          </Typography>
          <UpdatesTimeline
            updates={event.updates.map((u) => ({
              id: u.id,
              type: u.type,
              field_changed: u.field_changed ?? undefined,
              old_value: u.old_value ?? undefined,
              new_value: u.new_value ?? undefined,
              message: u.message ?? undefined,
              created_at: u.created_at,
            } as EventUpdate))}
          />
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Event?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{event.title}&quot;? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : null}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
