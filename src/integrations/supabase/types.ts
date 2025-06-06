export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      climb_session_entries: {
        Row: {
          climb_id: string;
          id: string;
          session_id: string;
        };
        Insert: {
          climb_id: string;
          id?: string;
          session_id: string;
        };
        Update: {
          climb_id?: string;
          id?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "climb_session_entries_climb_id_fkey";
            columns: ["climb_id"];
            isOneToOne: false;
            referencedRelation: "climbs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "climb_session_entries_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "climbing_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      climbing_sessions: {
        Row: {
          created_at: string;
          date: string;
          default_climb_type: Database["public"]["Enums"]["climb_type"] | null;
          duration: number;
          grade_system: string | null;
          id: string;
          location: string;
          location_type: Database["public"]["Enums"]["location_type"] | null;
          notes: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          date: string;
          default_climb_type?: Database["public"]["Enums"]["climb_type"] | null;
          duration: number;
          grade_system?: string | null;
          id?: string;
          location: string;
          location_type?: Database["public"]["Enums"]["location_type"] | null;
          notes?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          date?: string;
          default_climb_type?: Database["public"]["Enums"]["climb_type"] | null;
          duration?: number;
          grade_system?: string | null;
          id?: string;
          location?: string;
          location_type?: Database["public"]["Enums"]["location_type"] | null;
          notes?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      climbs: {
        Row: {
          attempts: number;
          color: string | null;
          country: string | null;
          created_at: string;
          date: string;
          duration: number | null;
          elevation_gain: number | null;
          grade: string;
          gym: string | null;
          id: string;
          location: string;
          name: string;
          notes: string | null;
          physical_skills: string[] | null;
          rating: number | null;
          send_type: Database["public"]["Enums"]["climb_send_type"];
          skills: string[] | null;
          stiffness: number | null;
          technical_skills: string[] | null;
          type: Database["public"]["Enums"]["climb_type"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          attempts: number;
          color?: string | null;
          country?: string | null;
          created_at?: string;
          date: string;
          duration?: number | null;
          elevation_gain?: number | null;
          grade: string;
          gym?: string | null;
          id?: string;
          location: string;
          name: string;
          notes?: string | null;
          physical_skills?: string[] | null;
          rating?: number | null;
          send_type: Database["public"]["Enums"]["climb_send_type"];
          skills?: string[] | null;
          stiffness?: number | null;
          technical_skills?: string[] | null;
          type: Database["public"]["Enums"]["climb_type"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          attempts?: number;
          color?: string | null;
          country?: string | null;
          created_at?: string;
          date?: string;
          duration?: number | null;
          elevation_gain?: number | null;
          grade?: string;
          gym?: string | null;
          id?: string;
          location?: string;
          name?: string;
          notes?: string | null;
          physical_skills?: string[] | null;
          rating?: number | null;
          send_type?: Database["public"]["Enums"]["climb_send_type"];
          skills?: string[] | null;
          stiffness?: number | null;
          technical_skills?: string[] | null;
          type?: Database["public"]["Enums"]["climb_type"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      session_analyses: {
        Row: {
          created_at: string;
          id: string;
          session_id: string;
          summary: string;
          strengths: string[] | null;
          areas_for_improvement: string[] | null;
          recommendations: string[] | null;
          progress_insights: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          session_id: string;
          summary: string;
          strengths?: string[] | null;
          areas_for_improvement?: string[] | null;
          recommendations?: string[] | null;
          progress_insights?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          session_id?: string;
          summary?: string;
          strengths?: string[] | null;
          areas_for_improvement?: string[] | null;
          recommendations?: string[] | null;
          progress_insights?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      max_onsight_grades: {
        Row: {
          created_at: string;
          grade: string;
          grade_type: string | null;
          id: string;
          timestamp: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          grade: string;
          grade_type?: string | null;
          id?: string;
          timestamp?: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          grade?: string;
          grade_type?: string | null;
          id?: string;
          timestamp?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          age: number | null;
          avatar_url: string | null;
          created_at: string;
          first_name: string | null;
          id: string;
          last_name: string | null;
          nickname: string | null;
          sex: string | null;
          state: string | null;
          updated_at: string;
          username: string | null;
          zip_code: string | null;
        };
        Insert: {
          age?: number | null;
          avatar_url?: string | null;
          created_at?: string;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          nickname?: string | null;
          sex?: string | null;
          state?: string | null;
          updated_at?: string;
          username?: string | null;
          zip_code?: string | null;
        };
        Update: {
          age?: number | null;
          avatar_url?: string | null;
          created_at?: string;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          nickname?: string | null;
          sex?: string | null;
          state?: string | null;
          updated_at?: string;
          username?: string | null;
          zip_code?: string | null;
        };
        Relationships: [];
      };
      schema_migrations: {
        Row: {
          applied_at: string;
          description: string | null;
          id: number;
          version: string;
        };
        Insert: {
          applied_at?: string;
          description?: string | null;
          id?: number;
          version: string;
        };
        Update: {
          applied_at?: string;
          description?: string | null;
          id?: number;
          version?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_grade_system_for_climb_type: {
        Args: { climb_type: string };
        Returns: string;
      };
    };
    Enums: {
      climb_send_type: "send" | "attempt" | "project" | "onsight" | "flash";
      climb_type: "boulder" | "sport" | "trad" | "top rope" | "alpine";
      location_type: "indoor" | "outdoor";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      climb_send_type: ["send", "attempt", "project", "onsight", "flash"],
      climb_type: ["boulder", "sport", "trad", "top rope", "alpine"],
      location_type: ["indoor", "outdoor"],
    },
  },
} as const;
