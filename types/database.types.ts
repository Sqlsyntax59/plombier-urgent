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
          city: string | null
          phone: string | null
          whatsapp_phone: string | null
          is_active: boolean
          credits: number
          google_place_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          vertical_id?: string | null
          role?: 'artisan' | 'admin' | 'super_admin'
          first_name?: string | null
          city?: string | null
          phone?: string | null
          whatsapp_phone?: string | null
          is_active?: boolean
          credits?: number
          google_place_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vertical_id?: string | null
          role?: 'artisan' | 'admin' | 'super_admin'
          first_name?: string | null
          city?: string | null
          phone?: string | null
          whatsapp_phone?: string | null
          is_active?: boolean
          credits?: number
          google_place_id?: string | null
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
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Typed shortcuts
export type Vertical = Tables<'verticals'>
export type Profile = Tables<'profiles'>
export type ProfileRole = Profile['role']
