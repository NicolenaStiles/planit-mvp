"use client";

import { useState } from "react";
import {
  IconButton,
  Tooltip,
  Snackbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import {
  BookmarkBorder as SaveIcon,
  Bookmark as SavedIcon,
  Share as ShareIcon,
  Email as ContactIcon,
} from "@mui/icons-material";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";

interface ActionButtonsProps {
  eventId: string;
  eventTitle: string;
  eventSlug: string;
  initialSaved?: boolean;
}

export default function ActionButtons({
  eventId,
  eventTitle,
  eventSlug,
  initialSaved = false,
}: ActionButtonsProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [contactOpen, setContactOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  const handleSave = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setSaved(!saved);
    setSnackbarMessage(saved ? "Removed from saved events" : "Event saved!");
    setSnackbarOpen(true);
    // TODO: Wire up to API in Milestone 6
    console.log(`Save event ${eventId}: ${!saved}`);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/events/${eventSlug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: eventTitle,
          url: url,
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== "AbortError") {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage("Link copied to clipboard!");
    setSnackbarOpen(true);
  };

  const handleContact = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setContactOpen(true);
  };

  const handleContactSubmit = () => {
    // TODO: Wire up to API in Milestone 6
    console.log(`Contact organizers for event ${eventId}: ${message}`);
    setContactOpen(false);
    setMessage("");
    setSnackbarMessage("Message sent to organizers!");
    setSnackbarOpen(true);
  };

  return (
    <>
      <Tooltip title={saved ? "Remove from saved" : "Save event"}>
        <IconButton onClick={handleSave} color={saved ? "primary" : "default"}>
          {saved ? <SavedIcon /> : <SaveIcon />}
        </IconButton>
      </Tooltip>

      <Tooltip title="Share event">
        <IconButton onClick={handleShare}>
          <ShareIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Contact organizers">
        <IconButton onClick={handleContact}>
          <ContactIcon />
        </IconButton>
      </Tooltip>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />

      <Dialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Contact Organizers</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Your message"
            fullWidth
            multiline
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask a question about this event..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContactOpen(false)}>Cancel</Button>
          <Button
            onClick={handleContactSubmit}
            variant="contained"
            disabled={!message.trim()}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
