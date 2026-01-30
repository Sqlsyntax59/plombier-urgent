/**
 * Database Types - Auto-generated placeholder
 * Story 1.2 - Configuration Supabase et Schema Initial
 *
 * NOTE: Regenerate with: npx supabase gen types typescript --project-id <ref> > types/database.types.ts
 */

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
      verticals: {
        Row: {
          id: string
          name: string
          slug: string
          price_grid: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          price_grid?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          price_grid?: Json
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          vertical_id: string | null
          role: 'artisan' | 'admin' | 'super_admin'
          first_name: string | null
          last_name: string | null
          city: string | null
          phone: string | null
          whatsapp_phone: string | null
          telegram_chat_id: string | null
          email: string | null
          trade: string | null
          company_name: string | null
          latitude: number | null
          longitude: number | null
          intervention_radius_km: number | null
          is_active: boolean
          is_suspended: boolean
          credits: number
          google_place_id: string | null
          slug: string | null
          cgv_accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          vertical_id?: string | null
          role?: 'artisan' | 'admin' | 'super_admin'
          first_name?: string | null
          last_name?: string | null
          city?: string | null
          phone?: string | null
          whatsapp_phone?: string | null
          telegram_chat_id?: string | null
          email?: string | null
          trade?: string | null
          company_name?: string | null
          latitude?: number | null
          longitude?: number | null
          intervention_radius_km?: number | null
          is_active?: boolean
          is_suspended?: boolean
          credits?: number
          google_place_id?: string | null
          slug?: string | null
          cgv_accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vertical_id?: string | null
          role?: 'artisan' | 'admin' | 'super_admin'
          first_name?: string | null
          last_name?: string | null
          city?: string | null
          phone?: string | null
          whatsapp_phone?: string | null
          telegram_chat_id?: string | null
          email?: string | null
          trade?: string | null
          company_name?: string | null
          latitude?: number | null
          longitude?: number | null
          intervention_radius_km?: number | null
          is_active?: boolean
          is_suspended?: boolean
          credits?: number
          google_place_id?: string | null
          slug?: string | null
          cgv_accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_vertical_id_fkey"
            columns: ["vertical_id"]
            isOneToOne: false
            referencedRelation: "verticals"
            referencedColumns: ["id"]
          }
        ]
      }
      leads: {
        Row: {
          id: string
          problem_type: ProblemType
          description: string
          field_summary: string | null
          photo_url: string | null
          client_phone: string
          client_email: string | null
          client_city: string | null
          latitude: number | null
          longitude: number | null
          vertical_id: string | null
          status: LeadStatus
          cascade_count: number
          satisfaction: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          problem_type: ProblemType
          description: string
          field_summary?: string | null
          photo_url?: string | null
          client_phone: string
          client_email?: string | null
          client_city?: string | null
          latitude?: number | null
          longitude?: number | null
          vertical_id?: string | null
          status?: LeadStatus
          cascade_count?: number
          satisfaction?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          problem_type?: ProblemType
          description?: string
          field_summary?: string | null
          photo_url?: string | null
          client_phone?: string
          client_email?: string | null
          client_city?: string | null
          latitude?: number | null
          longitude?: number | null
          vertical_id?: string | null
          status?: LeadStatus
          cascade_count?: number
          satisfaction?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_vertical_id_fkey"
            columns: ["vertical_id"]
            isOneToOne: false
            referencedRelation: "verticals"
            referencedColumns: ["id"]
          }
        ]
      }
      lead_assignments: {
        Row: {
          id: string
          lead_id: string
          artisan_id: string
          cascade_position: number
          status: AssignmentStatus
          notification_channel: NotificationChannel | null
          notification_external_id: string | null
          notification_error: string | null
          notified_at: string
          responded_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          lead_id: string
          artisan_id: string
          cascade_position?: number
          status?: AssignmentStatus
          notification_channel?: NotificationChannel | null
          notification_external_id?: string | null
          notification_error?: string | null
          notified_at?: string
          responded_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          lead_id?: string
          artisan_id?: string
          cascade_position?: number
          status?: AssignmentStatus
          notification_channel?: NotificationChannel | null
          notification_external_id?: string | null
          notification_error?: string | null
          notified_at?: string
          responded_at?: string | null
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      problem_type: ProblemType
      lead_status: LeadStatus
      assignment_status: AssignmentStatus
      notification_channel: NotificationChannel
    }
  }
}

// Enum types
export type ProblemType = 'fuite' | 'wc_bouche' | 'ballon_eau_chaude' | 'canalisation' | 'robinetterie' | 'autre'
export type LeadStatus = 'pending' | 'assigned' | 'accepted' | 'completed' | 'cancelled' | 'unassigned'
export type AssignmentStatus = 'pending' | 'accepted' | 'expired' | 'rejected'
export type NotificationChannel = 'whatsapp' | 'sms' | 'email'

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Typed shortcuts
export type Vertical = Tables<'verticals'>
export type Profile = Tables<'profiles'>
export type ProfileRole = Profile['role']
export type Lead = Tables<'leads'>
export type LeadAssignment = Tables<'lead_assignments'>

// Lead avec assignment pour dashboard artisan
export type LeadWithAssignment = Lead & {
  assignment: LeadAssignment
}

// Labels pour les types de pannes
export const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  fuite: 'Fuite d\'eau',
  wc_bouche: 'WC bouché',
  ballon_eau_chaude: 'Ballon d\'eau chaude',
  canalisation: 'Canalisation bouchée',
  robinetterie: 'Robinetterie',
  autre: 'Autre problème'
}

// Labels pour les statuts de lead
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  pending: 'En attente',
  assigned: 'Assigné',
  accepted: 'Accepté',
  completed: 'Réalisé',
  cancelled: 'Annulé',
  unassigned: 'Non assigné'
}

// Labels pour les statuts d'assignment
export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  pending: 'En attente',
  accepted: 'Accepté',
  expired: 'Expiré',
  rejected: 'Refusé'
}
