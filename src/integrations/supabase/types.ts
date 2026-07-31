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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      canteen_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_cents: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_cents?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      canteen_menu_items: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          item_id: string
          menu_id: string
          price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          item_id: string
          menu_id: string
          price_cents?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          item_id?: string
          menu_id?: string
          price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "canteen_menu_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "canteen_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canteen_menu_items_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "canteen_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      canteen_menus: {
        Row: {
          art_url: string | null
          created_at: string
          id: string
          notes: string | null
          service_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          art_url?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          service_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          art_url?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          service_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      canteen_reservation_items: {
        Row: {
          created_at: string
          id: string
          item_id: string | null
          item_name: string
          quantity: number
          reservation_id: string
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id?: string | null
          item_name: string
          quantity?: number
          reservation_id: string
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string | null
          item_name?: string
          quantity?: number
          reservation_id?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "canteen_reservation_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "canteen_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canteen_reservation_items_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "canteen_reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      canteen_reservations: {
        Row: {
          created_at: string
          id: string
          menu_id: string
          notes: string | null
          picked_up_at: string | null
          pickup_code: string
          status: string
          total_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          menu_id: string
          notes?: string | null
          picked_up_at?: string | null
          pickup_code?: string
          status?: string
          total_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          menu_id?: string
          notes?: string | null
          picked_up_at?: string | null
          pickup_code?: string
          status?: string
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canteen_reservations_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "canteen_menus"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          note: string | null
          status: Database["public"]["Enums"]["rsvp_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          kind: Database["public"]["Enums"]["event_kind"]
          location: string | null
          mesa_id: string | null
          ministry_id: string | null
          rede_id: string | null
          requires_rsvp: boolean
          scope: Database["public"]["Enums"]["event_scope"]
          starts_at: string
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          kind?: Database["public"]["Enums"]["event_kind"]
          location?: string | null
          mesa_id?: string | null
          ministry_id?: string | null
          rede_id?: string | null
          requires_rsvp?: boolean
          scope?: Database["public"]["Enums"]["event_scope"]
          starts_at: string
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          kind?: Database["public"]["Enums"]["event_kind"]
          location?: string | null
          mesa_id?: string | null
          ministry_id?: string | null
          rede_id?: string | null
          requires_rsvp?: boolean
          scope?: Database["public"]["Enums"]["event_scope"]
          starts_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
        ]
      }
      family_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          person_id: string
          relation: Database["public"]["Enums"]["family_relation"]
          relative_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          person_id: string
          relation: Database["public"]["Enums"]["family_relation"]
          relative_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          person_id?: string
          relation?: Database["public"]["Enums"]["family_relation"]
          relative_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_links_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_links_relative_id_fkey"
            columns: ["relative_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mesa_members: {
        Row: {
          id: string
          joined_at: string
          mesa_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          mesa_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          mesa_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesa_members_mesa_id_fkey"
            columns: ["mesa_id"]
            isOneToOne: false
            referencedRelation: "mesas"
            referencedColumns: ["id"]
          },
        ]
      }
      mesas: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          meeting_day: string | null
          meeting_location: string | null
          meeting_time: string | null
          name: string
          photo_url: string | null
          rede_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          meeting_day?: string | null
          meeting_location?: string | null
          meeting_time?: string | null
          name: string
          photo_url?: string | null
          rede_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          meeting_day?: string | null
          meeting_location?: string | null
          meeting_time?: string | null
          name?: string
          photo_url?: string | null
          rede_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesas_rede_id_fkey"
            columns: ["rede_id"]
            isOneToOne: false
            referencedRelation: "redes"
            referencedColumns: ["id"]
          },
        ]
      }
      ministries: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          meeting_info: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          meeting_info?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          meeting_info?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      ministry_members: {
        Row: {
          function_name: string | null
          id: string
          joined_at: string
          ministry_id: string
          user_id: string
        }
        Insert: {
          function_name?: string | null
          id?: string
          joined_at?: string
          ministry_id: string
          user_id: string
        }
        Update: {
          function_name?: string | null
          id?: string
          joined_at?: string
          ministry_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministry_members_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          unit_price_cents?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          payment_proof_url: string | null
          pickup_code: string
          status: string
          total_cents: number
          updated_at: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          payment_proof_url?: string | null
          pickup_code?: string
          status?: string
          total_cents?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          payment_proof_url?: string | null
          pickup_code?: string
          status?: string
          total_cents?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price_cents: number
          stock: number
          track_stock: boolean
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price_cents?: number
          stock?: number
          track_stock?: boolean
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price_cents?: number
          stock?: number
          track_stock?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          allergies: string | null
          availability: string | null
          avatar_url: string | null
          baptism_church: string | null
          baptism_date: string | null
          bio: string | null
          birth_date: string | null
          blood_type: string | null
          children_count: number
          city: string | null
          complement: string | null
          conversion_date: string | null
          courses: string[]
          cpf: string | null
          created_at: string
          education: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          father_name: string | null
          full_name: string
          gender: string | null
          gifts: string | null
          has_children: boolean
          health_notes: string | null
          id: string
          is_baptized: boolean | null
          marital_status: string | null
          member_since: string | null
          membership_end_date: string | null
          membership_status: string
          membership_type: string | null
          mother_name: string | null
          neighborhood: string | null
          notes: string | null
          phone: string | null
          previous_church: string | null
          profession: string | null
          rg: string | null
          spouse_name: string | null
          state: string | null
          street: string | null
          street_number: string | null
          updated_at: string
          wedding_date: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          allergies?: string | null
          availability?: string | null
          avatar_url?: string | null
          baptism_church?: string | null
          baptism_date?: string | null
          bio?: string | null
          birth_date?: string | null
          blood_type?: string | null
          children_count?: number
          city?: string | null
          complement?: string | null
          conversion_date?: string | null
          courses?: string[]
          cpf?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          father_name?: string | null
          full_name: string
          gender?: string | null
          gifts?: string | null
          has_children?: boolean
          health_notes?: string | null
          id: string
          is_baptized?: boolean | null
          marital_status?: string | null
          member_since?: string | null
          membership_end_date?: string | null
          membership_status?: string
          membership_type?: string | null
          mother_name?: string | null
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          previous_church?: string | null
          profession?: string | null
          rg?: string | null
          spouse_name?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
          wedding_date?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          allergies?: string | null
          availability?: string | null
          avatar_url?: string | null
          baptism_church?: string | null
          baptism_date?: string | null
          bio?: string | null
          birth_date?: string | null
          blood_type?: string | null
          children_count?: number
          city?: string | null
          complement?: string | null
          conversion_date?: string | null
          courses?: string[]
          cpf?: string | null
          created_at?: string
          education?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          father_name?: string | null
          full_name?: string
          gender?: string | null
          gifts?: string | null
          has_children?: boolean
          health_notes?: string | null
          id?: string
          is_baptized?: boolean | null
          marital_status?: string | null
          member_since?: string | null
          membership_end_date?: string | null
          membership_status?: string
          membership_type?: string | null
          mother_name?: string | null
          neighborhood?: string | null
          notes?: string | null
          phone?: string | null
          previous_church?: string | null
          profession?: string | null
          rg?: string | null
          spouse_name?: string | null
          state?: string | null
          street?: string | null
          street_number?: string | null
          updated_at?: string
          wedding_date?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      redes: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          target_audience: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          target_audience?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          target_audience?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          mesa_id: string | null
          ministry_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mesa_id?: string | null
          ministry_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mesa_id?: string | null
          ministry_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worship_schedule_assignments: {
        Row: {
          created_at: string
          function_name: string
          id: string
          responded_at: string | null
          response_note: string | null
          schedule_id: string
          status: Database["public"]["Enums"]["worship_assignment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          responded_at?: string | null
          response_note?: string | null
          schedule_id: string
          status?: Database["public"]["Enums"]["worship_assignment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          responded_at?: string | null
          response_note?: string | null
          schedule_id?: string
          status?: Database["public"]["Enums"]["worship_assignment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worship_schedule_assignments_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "worship_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worship_schedule_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_schedules: {
        Row: {
          created_at: string
          created_by: string | null
          event_date: string
          id: string
          location: string | null
          ministry_id: string
          notes: string | null
          schedule_type: Database["public"]["Enums"]["worship_schedule_type"]
          start_time: string | null
          status: Database["public"]["Enums"]["worship_schedule_status"]
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_date: string
          id?: string
          location?: string | null
          ministry_id?: string
          notes?: string | null
          schedule_type?: Database["public"]["Enums"]["worship_schedule_type"]
          start_time?: string | null
          status?: Database["public"]["Enums"]["worship_schedule_status"]
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_date?: string
          id?: string
          location?: string | null
          ministry_id?: string
          notes?: string | null
          schedule_type?: Database["public"]["Enums"]["worship_schedule_type"]
          start_time?: string | null
          status?: Database["public"]["Enums"]["worship_schedule_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "worship_schedules_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worship_schedules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "worship_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_setlist_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          position: number
          schedule_id: string
          song_id: string
          song_key: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          position?: number
          schedule_id: string
          song_id: string
          song_key?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          position?: number
          schedule_id?: string
          song_id?: string
          song_key?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worship_setlist_items_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "worship_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worship_setlist_items_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "worship_songs"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_songs: {
        Row: {
          artist: string | null
          bpm: number | null
          chords: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          lyrics: string | null
          ministry_id: string
          notes: string | null
          sheet_url: string | null
          song_key: string | null
          tags: string[]
          tempo: string | null
          theme: string | null
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          artist?: string | null
          bpm?: number | null
          chords?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          lyrics?: string | null
          ministry_id?: string
          notes?: string | null
          sheet_url?: string | null
          song_key?: string | null
          tags?: string[]
          tempo?: string | null
          theme?: string | null
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          artist?: string | null
          bpm?: number | null
          chords?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          lyrics?: string | null
          ministry_id?: string
          notes?: string | null
          sheet_url?: string | null
          song_key?: string | null
          tags?: string[]
          tempo?: string | null
          theme?: string | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worship_songs_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_team_members: {
        Row: {
          created_at: string
          function_name: string
          id: string
          is_titular: boolean
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          is_titular?: boolean
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          is_titular?: boolean
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worship_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "worship_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "worship_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worship_teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          minister_id: string | null
          ministry_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          minister_id?: string | null
          ministry_id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          minister_id?: string | null
          ministry_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "worship_teams_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: { _user_id: string }; Returns: boolean }
      gen_pickup_code: { Args: { _prefix: string }; Returns: string }
      has_mesa_role: {
        Args: { _mesa_id: string; _user_id: string }
        Returns: boolean
      }
      has_ministry_role: {
        Args: { _ministry_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      inverse_family_relation: {
        Args: {
          _person_gender: string
          _relation: Database["public"]["Enums"]["family_relation"]
        }
        Returns: Database["public"]["Enums"]["family_relation"]
      }
      is_cantina_admin: { Args: { _user_id: string }; Returns: boolean }
      is_livraria_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin_geral"
        | "admin_ministerio"
        | "lider_mesa"
        | "membro"
        | "admin_livraria"
        | "admin_cantina"
      event_kind:
        | "culto"
        | "ensaio"
        | "reuniao"
        | "evento"
        | "acao_social"
        | "treinamento"
      event_scope: "igreja" | "ministerio" | "rede" | "mesa"
      event_status: "rascunho" | "publicado" | "cancelado" | "concluido"
      family_relation:
        | "conjuge"
        | "filho"
        | "pai"
        | "mae"
        | "irmao"
        | "avo"
        | "neto"
        | "outro"
      rsvp_status: "vou" | "nao_vou" | "talvez"
      worship_assignment_status: "pendente" | "confirmado" | "recusado"
      worship_schedule_status: "rascunho" | "publicada" | "concluida"
      worship_schedule_type: "culto" | "ensaio" | "evento"
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
        "admin_geral",
        "admin_ministerio",
        "lider_mesa",
        "membro",
        "admin_livraria",
        "admin_cantina",
      ],
      event_kind: [
        "culto",
        "ensaio",
        "reuniao",
        "evento",
        "acao_social",
        "treinamento",
      ],
      event_scope: ["igreja", "ministerio", "rede", "mesa"],
      event_status: ["rascunho", "publicado", "cancelado", "concluido"],
      family_relation: [
        "conjuge",
        "filho",
        "pai",
        "mae",
        "irmao",
        "avo",
        "neto",
        "outro",
      ],
      rsvp_status: ["vou", "nao_vou", "talvez"],
      worship_assignment_status: ["pendente", "confirmado", "recusado"],
      worship_schedule_status: ["rascunho", "publicada", "concluida"],
      worship_schedule_type: ["culto", "ensaio", "evento"],
    },
  },
} as const
