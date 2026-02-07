"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
import { createClient } from "@/lib/supabase/client";
import { EntityType } from "@/types/database";

interface GeocodingResult {
  lat: string;
  lon: string;
  display_name: string;
}

export default function CreateEntityPage() {
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [type, setType] = useState<EntityType>("organization");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // UI state
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    // Venues require an address
    if (type === "venue" && !address.trim()) {
      setError("Address is required for venues");
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
          .upload(`entities/${fileName}`, bannerFile);

        if (uploadError) {
          console.error("Banner upload error:", uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from("banners")
            .getPublicUrl(`entities/${fileName}`);
          bannerUrl = publicUrl;
        }
      }

      // Create the entity via API
      const response = await fetch("/api/entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name: name.trim(),
          description: description.trim() || null,
          address: address || null,
          location: location ? `POINT(${location.lng} ${location.lat})` : null,
          banner_url: bannerUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create entity");
      }

      const entity = await response.json();
      router.push(`/${type === "venue" ? "venue" : "org"}/${entity.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entity");
    } finally {
      setSubmitting(false);
    }
  };

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
        Create {type === "venue" ? "Venue" : "Organization"}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        {/* Type Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            label="Type"
            onChange={(e) => setType(e.target.value as EntityType)}
          >
            <MenuItem value="organization">Organization</MenuItem>
            <MenuItem value="venue">Venue</MenuItem>
          </Select>
        </FormControl>

        {/* Banner Upload */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Banner Image
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

        {/* Name */}
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
            required={type === "venue"}
            helperText={type === "venue" ? "Required for venues" : "Optional for organizations"}
            InputProps={{
              endAdornment: address ? (
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
              ) : null,
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
            {submitting ? "Creating..." : `Create ${type === "venue" ? "Venue" : "Organization"}`}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
