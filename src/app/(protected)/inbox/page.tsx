"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Container,
  Typography,
  Box,
  Paper,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from "@mui/material";
import {
  Mail as MailIcon,
  MailOutline as UnreadIcon,
  Event as EventIcon,
  Business as EntityIcon,
} from "@mui/icons-material";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

interface InboxMessage {
  id: string;
  message: string;
  created_at: string;
  read: boolean;
  event_id: string | null;
  entity_id: string;
  from_user_id: string;
  events?: {
    id: string;
    title: string;
    slug: string;
  } | null;
  entities: {
    id: string;
    name: string;
    slug: string;
    type: "organization" | "venue";
  };
  from_user?: {
    username: string | null;
    email: string;
  };
}

export default function InboxPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<InboxMessage[]>([]);

  useEffect(() => {
    async function loadMessages() {
      if (!user) return;

      setLoading(true);
      setError("");

      try {
        // First get user's entities
        const { data: userEntities, error: entitiesError } = await supabase
          .from("entities")
          .select("id")
          .eq("admin_id", user.id);

        if (entitiesError) {
          throw entitiesError;
        }

        if (!userEntities || userEntities.length === 0) {
          setMessages([]);
          setLoading(false);
          return;
        }

        const entityIds = userEntities.map((e) => e.id);

        // Get messages for those entities
        const { data: msgs, error: messagesError } = await supabase
          .from("messages")
          .select(`
            id,
            message,
            created_at,
            read,
            event_id,
            entity_id,
            from_user_id,
            events (
              id,
              title,
              slug
            ),
            entities (
              id,
              name,
              slug,
              type
            ),
            from_user:users!messages_from_user_id_fkey (
              username,
              email
            )
          `)
          .in("entity_id", entityIds)
          .order("created_at", { ascending: false });

        if (messagesError) {
          throw messagesError;
        }

        setMessages((msgs || []) as unknown as InboxMessage[]);
      } catch (err) {
        console.error("Error loading messages:", err);
        setError("Failed to load messages");
      } finally {
        setLoading(false);
      }
    }

    loadMessages();
  }, [user, supabase]);

  const markAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("id", messageId);

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, read: true } : m))
    );
  };

  const unreadCount = messages.filter((m) => !m.read).length;

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }} color="text.secondary">
          Loading messages...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" fontWeight={700}>
          Inbox
        </Typography>
        {unreadCount > 0 && (
          <Chip
            label={`${unreadCount} unread`}
            color="primary"
            size="small"
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {messages.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }} variant="outlined">
          <MailIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No messages yet
          </Typography>
          <Typography color="text.secondary">
            Messages from users contacting your organizations will appear here.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              onMarkRead={markAsRead}
            />
          ))}
        </Stack>
      )}
    </Container>
  );
}

function MessageCard({
  message,
  onMarkRead,
}: {
  message: InboxMessage;
  onMarkRead: (id: string) => void;
}) {
  const handleClick = () => {
    if (!message.read) {
      onMarkRead(message.id);
    }
  };

  return (
    <Paper
      sx={{
        p: 2,
        cursor: "pointer",
        bgcolor: message.read ? "inherit" : "action.hover",
        "&:hover": { boxShadow: 2 },
      }}
      variant="outlined"
      onClick={handleClick}
    >
      <Box sx={{ display: "flex", gap: 2 }}>
        {/* Icon */}
        <Box
          sx={{
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: message.read ? "grey.200" : "primary.main",
            color: message.read ? "text.secondary" : "white",
            borderRadius: 1,
          }}
        >
          {message.read ? <MailIcon /> : <UnreadIcon />}
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1,
            }}
          >
            <Box>
              <Typography variant="subtitle2" fontWeight={message.read ? 400 : 600}>
                {message.from_user?.username || message.from_user?.email || "Unknown user"}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Chip
                  size="small"
                  icon={<EntityIcon />}
                  label={`To: ${message.entities.name}`}
                  variant="outlined"
                />
                {message.events && (
                  <Chip
                    size="small"
                    icon={<EventIcon />}
                    label={message.events.title}
                    variant="outlined"
                    component={Link}
                    href={`/events/${message.events.slug}`}
                    clickable
                  />
                )}
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {new Date(message.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </Typography>
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Message */}
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: "pre-wrap" }}
          >
            {message.message}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
