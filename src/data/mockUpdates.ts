import { EventUpdate } from "@/components/Event/UpdatesTimeline";

export const mockUpdates: Record<string, EventUpdate[]> = {
  "1": [], // Farmer's Market - no updates
  "2": [
    {
      id: "u1",
      type: "manual",
      message:
        "Excited to announce we have a special guest performer this week! Don't miss it!",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
  "3": [
    {
      id: "u2",
      type: "auto",
      field_changed: "starts_at",
      old_value: "7:00 PM",
      new_value: "8:00 PM",
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: "u3",
      type: "manual",
      message:
        "Show moved to 8 PM to accommodate our opening act. See you there!",
      created_at: new Date(Date.now() - 172800000 + 3600000).toISOString(),
    },
  ],
  "4": [],
  "5": [
    {
      id: "u4",
      type: "manual",
      message:
        "We've added a networking session after the talks. Bring your business cards!",
      created_at: new Date(Date.now() - 259200000).toISOString(),
    },
  ],
};

export function getUpdatesForEvent(eventId: string): EventUpdate[] {
  return mockUpdates[eventId] || [];
}
