export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      climbing_sessions: {
        Row: {
          created_at: string
          date: string
          default_climb_type: string | null
          duration: number | null
          grade_system: string | null
          id: string
          location: string
          location_type: string | null
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          default_climb_type?: string | null
          duration?: number | null
          grade_system?: string | null
          id?: string
          location: string
          location_type?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          default_climb_type?: string | null
          duration?: number | null
          grade_system?: string | null
          id?: string
          location?: string
          location_type?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      climbs: {
        Row: {
          attempts: number | null
          color: string | null
          country: string | null
          created_at: string
          date: string
          duration: number | null
          elevation_gain: number | null
          grade: string
          gym: string | null
          id: string
          location: string
          name: string
          notes: string | null
          physical_skills: string[] | null
          rating: number | null
          send_type: string
          session_id: string
          skills: string[] | null
          stiffness: number | null
          technical_skills: string[] | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number | null
          color?: string | null
          country?: string | null
          created_at?: string
          date?: string
          duration?: number | null
          elevation_gain?: number | null
          grade: string
          gym?: string | null
          id?: string
          location: string
          name: string
          notes?: string | null
          physical_skills?: string[] | null
          rating?: number | null
          send_type: string
          session_id: string
          skills?: string[] | null
          stiffness?: number | null
          technical_skills?: string[] | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number | null
          color?: string | null
          country?: string | null
          created_at?: string
          date?: string
          duration?: number | null
          elevation_gain?: number | null
          grade?: string
          gym?: string | null
          id?: string
          location?: string
          name?: string
          notes?: string | null
          physical_skills?: string[] | null
          rating?: number | null
          send_type?: string
          session_id?: string
          skills?: string[] | null
          stiffness?: number | null
          technical_skills?: string[] | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "climbs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "climbing_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number | null
          description: string | null
          difficulty: string | null
          id: string
          notes: string | null
          priority: string | null
          status: string
          tags: string[] | null
          target_climb_type: string | null
          target_date: string | null
          target_grade: string | null
          target_location: string | null
          target_value: number | null
          title: string
          type: string
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          difficulty?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          status?: string
          tags?: string[] | null
          target_climb_type?: string | null
          target_date?: string | null
          target_grade?: string | null
          target_location?: string | null
          target_value?: number | null
          title: string
          type: string
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number | null
          description?: string | null
          difficulty?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          status?: string
          tags?: string[] | null
          target_climb_type?: string | null
          target_date?: string | null
          target_grade?: string | null
          target_location?: string | null
          target_value?: number | null
          title?: string
          type?: string
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
