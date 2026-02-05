// Database types for Supabase
// Based on the PlanIt MVP specification

export type EntityType = "organization" | "venue";
export type RsvpStatus = "yes" | "no" | "maybe";
export type UpdateType = "auto" | "manual";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      entities: {
        Row: {
          id: string;
          type: EntityType;
          name: string;
          slug: string;
          description: string | null;
          address: string | null;
          location: unknown | null;
          banner_url: string | null;
          admin_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: EntityType;
          name: string;
          slug: string;
          description?: string | null;
          address?: string | null;
          location?: unknown | null;
          banner_url?: string | null;
          admin_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: EntityType;
          name?: string;
          slug?: string;
          description?: string | null;
          address?: string | null;
          location?: unknown | null;
          banner_url?: string | null;
          admin_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "entities_admin_id_fkey";
            columns: ["admin_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      events: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          address: string | null;
          location: unknown | null;
          starts_at: string;
          ends_at: string | null;
          banner_url: string | null;
          tags: string[] | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          address?: string | null;
          location?: unknown | null;
          starts_at: string;
          ends_at?: string | null;
          banner_url?: string | null;
          tags?: string[] | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          address?: string | null;
          location?: unknown | null;
          starts_at?: string;
          ends_at?: string | null;
          banner_url?: string | null;
          tags?: string[] | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      event_hosts: {
        Row: {
          event_id: string;
          entity_id: string;
          can_edit: boolean;
        };
        Insert: {
          event_id: string;
          entity_id: string;
          can_edit?: boolean;
        };
        Update: {
          event_id?: string;
          entity_id?: string;
          can_edit?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "event_hosts_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_hosts_entity_id_fkey";
            columns: ["entity_id"];
            referencedRelation: "entities";
            referencedColumns: ["id"];
          }
        ];
      };
      rsvps: {
        Row: {
          id: string;
          user_id: string;
          event_id: string;
          status: RsvpStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_id: string;
          status: RsvpStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_id?: string;
          status?: RsvpStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rsvps_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rsvps_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      saves: {
        Row: {
          user_id: string;
          event_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          event_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          event_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saves_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saves_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          }
        ];
      };
      follows: {
        Row: {
          user_id: string;
          entity_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          entity_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          entity_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "follows_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_entity_id_fkey";
            columns: ["entity_id"];
            referencedRelation: "entities";
            referencedColumns: ["id"];
          }
        ];
      };
      updates: {
        Row: {
          id: string;
          event_id: string;
          type: UpdateType;
          field_changed: string | null;
          old_value: string | null;
          new_value: string | null;
          message: string | null;
          author_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          type: UpdateType;
          field_changed?: string | null;
          old_value?: string | null;
          new_value?: string | null;
          message?: string | null;
          author_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          type?: UpdateType;
          field_changed?: string | null;
          old_value?: string | null;
          new_value?: string | null;
          message?: string | null;
          author_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "updates_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "updates_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          event_id: string | null;
          entity_id: string;
          from_user_id: string;
          message: string;
          created_at: string;
          read: boolean;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          entity_id: string;
          from_user_id: string;
          message: string;
          created_at?: string;
          read?: boolean;
        };
        Update: {
          id?: string;
          event_id?: string | null;
          entity_id?: string;
          from_user_id?: string;
          message?: string;
          created_at?: string;
          read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "messages_event_id_fkey";
            columns: ["event_id"];
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_entity_id_fkey";
            columns: ["entity_id"];
            referencedRelation: "entities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_from_user_id_fkey";
            columns: ["from_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      events_within_radius: {
        Args: {
          lat: number;
          lng: number;
          radius_meters: number;
          start_date: string;
          end_date: string | null;
          tag_filter: string[] | null;
          result_limit: number;
          result_offset: number;
        };
        Returns: Event[];
      };
    };
    Enums: {
      entity_type: EntityType;
      rsvp_status: RsvpStatus;
      update_type: UpdateType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience type aliases for table rows
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Entity = Database["public"]["Tables"]["entities"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventHost = Database["public"]["Tables"]["event_hosts"]["Row"];
export type Rsvp = Database["public"]["Tables"]["rsvps"]["Row"];
export type Save = Database["public"]["Tables"]["saves"]["Row"];
export type Follow = Database["public"]["Tables"]["follows"]["Row"];
export type Update = Database["public"]["Tables"]["updates"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

// Convenience type aliases for inserts
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type EntityInsert = Database["public"]["Tables"]["entities"]["Insert"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventHostInsert = Database["public"]["Tables"]["event_hosts"]["Insert"];
export type RsvpInsert = Database["public"]["Tables"]["rsvps"]["Insert"];
export type SaveInsert = Database["public"]["Tables"]["saves"]["Insert"];
export type FollowInsert = Database["public"]["Tables"]["follows"]["Insert"];
export type UpdateInsert = Database["public"]["Tables"]["updates"]["Insert"];
export type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

// Convenience type aliases for updates
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
export type EntityUpdate = Database["public"]["Tables"]["entities"]["Update"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];
export type EventHostUpdate = Database["public"]["Tables"]["event_hosts"]["Update"];
export type RsvpUpdate = Database["public"]["Tables"]["rsvps"]["Update"];
export type SaveUpdate = Database["public"]["Tables"]["saves"]["Update"];
export type FollowUpdate = Database["public"]["Tables"]["follows"]["Update"];
export type UpdateUpdate = Database["public"]["Tables"]["updates"]["Update"];
export type MessageUpdate = Database["public"]["Tables"]["messages"]["Update"];

// Types for joined queries
export type EventWithHosts = Event & {
  event_hosts: Array<
    EventHost & {
      entities: Pick<Entity, "id" | "type" | "name" | "slug" | "banner_url">;
    }
  >;
};

export type EventWithHostsAndUpdates = EventWithHosts & {
  updates: Update[];
  created_by_user?: Pick<User, "id" | "username">;
};

export type EventHostWithEntity = EventHost & {
  entities: Entity;
};
