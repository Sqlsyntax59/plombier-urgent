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
          siret: string | null
          siret_verified: boolean
          verification_status: VerificationStatus
          insurance_provider: string | null
          insurance_policy_number: string | null
          insurance_valid_until: string | null
          insurance_attestation_path: string | null
          is_reactive: boolean
          reactive_score: number
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
          siret?: string | null
          siret_verified?: boolean
          verification_status?: VerificationStatus
          insurance_provider?: string | null
          insurance_policy_number?: string | null
          insurance_valid_until?: string | null
          insurance_attestation_path?: string | null
          is_reactive?: boolean
          reactive_score?: number
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
          siret?: string | null
          siret_verified?: boolean
          verification_status?: VerificationStatus
          insurance_provider?: string | null
          insurance_policy_number?: string | null
          insurance_valid_until?: string | null
          insurance_attestation_path?: string | null
          is_reactive?: boolean
          reactive_score?: number
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
          lead_score: number
          lead_quality: LeadQuality | null
          scoring_factors: Json
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
          lead_score?: number
          lead_quality?: LeadQuality | null
          scoring_factors?: Json
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
          lead_score?: number
          lead_quality?: LeadQuality | null
          scoring_factors?: Json
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
          response_ms: number | null
          wave_number: number
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
          response_ms?: number | null
          wave_number?: number
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
          response_ms?: number | null
          wave_number?: number
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
      geocode_cache: {
        Row: {
          id: string
          postal_code: string
          city_name: string | null
          latitude: number
          longitude: number
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          postal_code: string
          city_name?: string | null
          latitude: number
          longitude: number
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          postal_code?: string
          city_name?: string | null
          latitude?: number
          longitude?: number
          created_at?: string
          expires_at?: string
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          id: string
          lead_id: string
          event_type: string
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          event_type: string
          payload?: Json
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          event_type?: string
          payload?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
      lead_quality: LeadQuality
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
export type LeadQuality = 'low' | 'medium' | 'high' | 'premium'
export type VerificationStatus = 'registered' | 'pending_verification' | 'verified' | 'suspended'

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
export type GeocodeCache = Tables<'geocode_cache'>
export type LeadEvent = Tables<'lead_events'>

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

// Labels pour les statuts de vérification
export const VERIFICATION_STATUS_LABELS: Record<VerificationStatus, string> = {
  registered: 'Inscrit',
  pending_verification: 'Vérification en cours',
  verified: 'Vérifié',
  suspended: 'Suspendu'
}
