export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      legal_signatures: {
        Row: {
          audit_data: Json
          confirmation_text: string
          form_id: string | null
          id: string
          module_id: string | null
          signature_data: Json
          signature_hash: string
          signed_at: string
          signed_content_title: string
          signed_content_version: string
          signer_name: string
          signer_role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          audit_data?: Json
          confirmation_text: string
          form_id?: string | null
          id?: string
          module_id?: string | null
          signature_data: Json
          signature_hash: string
          signed_at?: string
          signed_content_title: string
          signed_content_version: string
          signer_name: string
          signer_role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          audit_data?: Json
          confirmation_text?: string
          form_id?: string | null
          id?: string
          module_id?: string | null
          signature_data?: Json
          signature_hash?: string
          signed_at?: string
          signed_content_title?: string
          signed_content_version?: string
          signer_name?: string
          signer_role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_signatures_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "onboarding_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_signatures_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "onboarding_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_assignments: {
        Row: {
          assigned_by: string | null
          assigned_to: string
          created_at: string
          due_at: string | null
          id: string
          module_id: string
          notes: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          assigned_to: string
          created_at?: string
          due_at?: string | null
          id?: string
          module_id: string
          notes?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string
          created_at?: string
          due_at?: string | null
          id?: string
          module_id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "onboarding_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_forms: {
        Row: {
          created_at: string
          form_data: Json
          id: string
          kind: Database["public"]["Enums"]["form_kind"]
          review_notes: string | null
          review_status: Database["public"]["Enums"]["form_review_status"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          submitted_at: string | null
          submitted_by_role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          form_data?: Json
          id?: string
          kind: Database["public"]["Enums"]["form_kind"]
          review_notes?: string | null
          review_status?: Database["public"]["Enums"]["form_review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          submitted_at?: string | null
          submitted_by_role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          form_data?: Json
          id?: string
          kind?: Database["public"]["Enums"]["form_kind"]
          review_notes?: string | null
          review_status?: Database["public"]["Enums"]["form_review_status"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          submitted_at?: string | null
          submitted_by_role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_modules: {
        Row: {
          audience_roles: Database["public"]["Enums"]["app_role"][]
          created_at: string
          created_by: string | null
          id: string
          is_public_teaser: boolean
          key_points: string[]
          public_summary: string | null
          public_teaser_updated_at: string | null
          released_roles: Database["public"]["Enums"]["app_role"][]
          slug: string
          status: Database["public"]["Enums"]["onboarding_status"]
          summary: string
          title: string
          updated_at: string
          version: string
          visibility_scope: Database["public"]["Enums"]["module_visibility_scope"]
        }
        Insert: {
          audience_roles?: Database["public"]["Enums"]["app_role"][]
          created_at?: string
          created_by?: string | null
          id?: string
          is_public_teaser?: boolean
          key_points?: string[]
          public_summary?: string | null
          public_teaser_updated_at?: string | null
          released_roles?: Database["public"]["Enums"]["app_role"][]
          slug: string
          status?: Database["public"]["Enums"]["onboarding_status"]
          summary: string
          title: string
          updated_at?: string
          version?: string
          visibility_scope?: Database["public"]["Enums"]["module_visibility_scope"]
        }
        Update: {
          audience_roles?: Database["public"]["Enums"]["app_role"][]
          created_at?: string
          created_by?: string | null
          id?: string
          is_public_teaser?: boolean
          key_points?: string[]
          public_summary?: string | null
          public_teaser_updated_at?: string | null
          released_roles?: Database["public"]["Enums"]["app_role"][]
          slug?: string
          status?: Database["public"]["Enums"]["onboarding_status"]
          summary?: string
          title?: string
          updated_at?: string
          version?: string
          visibility_scope?: Database["public"]["Enums"]["module_visibility_scope"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          first_name: string | null
          full_name: string
          id: string
          intake_completed: boolean
          integration_request: string | null
          last_name: string | null
          linkedin_url: string | null
          onboarding_status: Database["public"]["Enums"]["assignment_status"]
          organization: string | null
          phone: string | null
          position_title: string | null
          team_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          first_name?: string | null
          full_name?: string
          id?: string
          intake_completed?: boolean
          integration_request?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          onboarding_status?: Database["public"]["Enums"]["assignment_status"]
          organization?: string | null
          phone?: string | null
          position_title?: string | null
          team_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          first_name?: string | null
          full_name?: string
          id?: string
          intake_completed?: boolean
          integration_request?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          onboarding_status?: Database["public"]["Enums"]["assignment_status"]
          organization?: string | null
          phone?: string | null
          position_title?: string | null
          team_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_management_or_admin: { Args: { _user_id: string }; Returns: boolean }
      refresh_overdue_assignments: { Args: never; Returns: number }
    }
    Enums: {
      app_role:
        | "admin"
        | "management"
        | "team"
        | "colleague"
        | "employee"
        | "partner"
        | "applicant"
      assignment_status: "open" | "in_progress" | "signed" | "overdue"
      form_kind: "applicant" | "partner" | "employee" | "team" | "management"
      form_review_status:
        | "draft"
        | "submitted"
        | "in_review"
        | "approved"
        | "rejected"
        | "changes_requested"
      module_visibility_scope: "internal" | "external" | "both"
      onboarding_status: "draft" | "active" | "archived"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "management",
        "team",
        "colleague",
        "employee",
        "partner",
        "applicant",
      ],
      assignment_status: ["open", "in_progress", "signed", "overdue"],
      form_kind: ["applicant", "partner", "employee", "team", "management"],
      form_review_status: [
        "draft",
        "submitted",
        "in_review",
        "approved",
        "rejected",
        "changes_requested",
      ],
      module_visibility_scope: ["internal", "external", "both"],
      onboarding_status: ["draft", "active", "archived"],
    },
  },
} as const
