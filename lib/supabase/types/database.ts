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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      auction_launch_subscribers: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_launch_subscribers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          bidder_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          amount: number
          bidder_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          amount?: number
          bidder_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_bidder_id_fkey"
            columns: ["bidder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bids_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      business_accounts: {
        Row: {
          business_name: string
          company_type: string
          created_at: string
          description: string
          id: string
          tax_id: string | null
          trust_score: number
          updated_at: string
          verification_level: Database["public"]["Enums"]["trust_verification_level"]
          verified_business: boolean
          verified_manufacturer: boolean
          verified_supplier: boolean
          verified_wholesale: boolean
          website: string | null
        }
        Insert: {
          business_name: string
          company_type?: string
          created_at?: string
          description?: string
          id: string
          tax_id?: string | null
          trust_score?: number
          updated_at?: string
          verification_level?: Database["public"]["Enums"]["trust_verification_level"]
          verified_business?: boolean
          verified_manufacturer?: boolean
          verified_supplier?: boolean
          verified_wholesale?: boolean
          website?: string | null
        }
        Update: {
          business_name?: string
          company_type?: string
          created_at?: string
          description?: string
          id?: string
          tax_id?: string | null
          trust_score?: number
          updated_at?: string
          verification_level?: Database["public"]["Enums"]["trust_verification_level"]
          verified_business?: boolean
          verified_manufacturer?: boolean
          verified_supplier?: boolean
          verified_wholesale?: boolean
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_accounts_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_preferences: {
        Row: {
          created_at: string
          order_updates_email: boolean
          order_updates_push: boolean
          preferred_category_slugs: string[]
          region: string
          save_search_alerts: boolean
          show_recommendations: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          order_updates_email?: boolean
          order_updates_push?: boolean
          preferred_category_slugs?: string[]
          region?: string
          save_search_alerts?: boolean
          show_recommendations?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          order_updates_email?: boolean
          order_updates_push?: boolean
          preferred_category_slugs?: string[]
          region?: string
          save_search_alerts?: boolean
          show_recommendations?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          path_label: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          path_label: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          path_label?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_filter_definitions: {
        Row: {
          category_id: string
          created_at: string
          filter_key: string
          filter_type: Database["public"]["Enums"]["category_filter_type"]
          id: string
          is_required: boolean
          label: string
          options: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          filter_key: string
          filter_type?: Database["public"]["Enums"]["category_filter_type"]
          id?: string
          is_required?: boolean
          label: string
          options?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          filter_key?: string
          filter_type?: Database["public"]["Enums"]["category_filter_type"]
          id?: string
          is_required?: boolean
          label?: string
          options?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_filter_definitions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          details: string
          id: string
          product_slug: string | null
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["moderation_queue_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["moderation_target"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          product_slug?: string | null
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["moderation_queue_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["moderation_target"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          product_slug?: string | null
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["moderation_queue_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["moderation_target"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_reports: {
        Row: {
          conversation_id: string
          created_at: string
          details: string
          id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          details?: string
          id?: string
          reason: string
          reporter_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          details?: string
          id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_reports_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          buyer_archived: boolean
          buyer_blocked: boolean
          buyer_id: string
          buyer_muted: boolean
          buyer_pinned: boolean
          buyer_unread_count: number
          created_at: string
          id: string
          last_message: string
          last_message_at: string
          product_id: string
          seller_archived: boolean
          seller_blocked: boolean
          seller_id: string
          seller_muted: boolean
          seller_pinned: boolean
          seller_unread_count: number
        }
        Insert: {
          buyer_archived?: boolean
          buyer_blocked?: boolean
          buyer_id: string
          buyer_muted?: boolean
          buyer_pinned?: boolean
          buyer_unread_count?: number
          created_at?: string
          id?: string
          last_message?: string
          last_message_at?: string
          product_id: string
          seller_archived?: boolean
          seller_blocked?: boolean
          seller_id: string
          seller_muted?: boolean
          seller_pinned?: boolean
          seller_unread_count?: number
        }
        Update: {
          buyer_archived?: boolean
          buyer_blocked?: boolean
          buyer_id?: string
          buyer_muted?: boolean
          buyer_pinned?: boolean
          buyer_unread_count?: number
          created_at?: string
          id?: string
          last_message?: string
          last_message_at?: string
          product_id?: string
          seller_archived?: boolean
          seller_blocked?: boolean
          seller_id?: string
          seller_muted?: boolean
          seller_pinned?: boolean
          seller_unread_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cron_job_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          job_name: string
          result: Json
          started_at: string
          status: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name: string
          result?: Json
          started_at?: string
          status: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          job_name?: string
          result?: Json
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      email_outbox: {
        Row: {
          body_text: string
          created_at: string
          id: string
          last_error: string | null
          metadata: Json
          next_retry_at: string | null
          recipient_email: string
          retry_count: number
          sent_at: string | null
          status: string
          subject: string
          template: string | null
        }
        Insert: {
          body_text: string
          created_at?: string
          id?: string
          last_error?: string | null
          metadata?: Json
          next_retry_at?: string | null
          recipient_email: string
          retry_count?: number
          sent_at?: string | null
          status?: string
          subject: string
          template?: string | null
        }
        Update: {
          body_text?: string
          created_at?: string
          id?: string
          last_error?: string | null
          metadata?: Json
          next_retry_at?: string | null
          recipient_email?: string
          retry_count?: number
          sent_at?: string | null
          status?: string
          subject?: string
          template?: string | null
        }
        Relationships: []
      }
      help_analytics_events: {
        Row: {
          article_slug: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          search_query: string | null
          solution_id: string | null
          topic_slug: string | null
          user_id: string | null
        }
        Insert: {
          article_slug?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          search_query?: string | null
          solution_id?: string | null
          topic_slug?: string | null
          user_id?: string | null
        }
        Update: {
          article_slug?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          search_query?: string | null
          solution_id?: string | null
          topic_slug?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      help_article_versions: {
        Row: {
          article_id: string
          changed_by: string | null
          content: string
          created_at: string
          id: string
          title: string
          version: number
        }
        Insert: {
          article_id: string
          changed_by?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
          version: number
        }
        Update: {
          article_id?: string
          changed_by?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "help_article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "help_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_article_versions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          content: string
          created_at: string
          id: string
          keywords: string[]
          last_updated: string
          locale: string
          pinned: boolean
          search_ranking: number
          slug: string
          status: string
          summary: string
          title: string
          topic_slug: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          keywords?: string[]
          last_updated?: string
          locale?: string
          pinned?: boolean
          search_ranking?: number
          slug: string
          status?: string
          summary?: string
          title: string
          topic_slug: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          keywords?: string[]
          last_updated?: string
          locale?: string
          pinned?: boolean
          search_ranking?: number
          slug?: string
          status?: string
          summary?: string
          title?: string
          topic_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      help_categories: {
        Row: {
          created_at: string
          description: string
          group_name: string
          icon: string
          id: string
          keywords: string[]
          label: string
          locale: string
          search_ranking: number
          slug: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          description?: string
          group_name?: string
          icon?: string
          id?: string
          keywords?: string[]
          label: string
          locale?: string
          search_ranking?: number
          slug: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          description?: string
          group_name?: string
          icon?: string
          id?: string
          keywords?: string[]
          label?: string
          locale?: string
          search_ranking?: number
          slug?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      help_decision_trees: {
        Row: {
          created_at: string
          id: string
          locale: string
          status: string
          title: string
          topic_slug: string
          tree: Json
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          locale?: string
          status?: string
          title: string
          topic_slug: string
          tree: Json
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          locale?: string
          status?: string
          title?: string
          topic_slug?: string
          tree?: Json
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      help_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          keywords: string[]
          locale: string
          question: string
          sort_order: number
          topic_slug: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          keywords?: string[]
          locale?: string
          question: string
          sort_order?: number
          topic_slug: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          keywords?: string[]
          locale?: string
          question?: string
          sort_order?: number
          topic_slug?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      listing_promotions: {
        Row: {
          amount_cents: number
          created_at: string
          duration_id: string
          ends_at: string
          id: string
          product_id: string
          seller_id: string
          starts_at: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          type: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          duration_id: string
          ends_at: string
          id?: string
          product_id: string
          seller_id: string
          starts_at?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          type: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          duration_id?: string
          ends_at?: string
          id?: string
          product_id?: string
          seller_id?: string
          starts_at?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_promotions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_promotions_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      live_visitor_sessions: {
        Row: {
          browser: string | null
          city: string | null
          country_code: string
          country_name: string
          created_at: string
          device_category: string | null
          last_seen_at: string
          operating_system: string | null
          session_id: string
          traffic_source: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country_code: string
          country_name: string
          created_at?: string
          device_category?: string | null
          last_seen_at?: string
          operating_system?: string | null
          session_id: string
          traffic_source?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country_code?: string
          country_name?: string
          created_at?: string
          device_category?: string | null
          last_seen_at?: string
          operating_system?: string | null
          session_id?: string
          traffic_source?: string | null
        }
        Relationships: []
      }
      market_regions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          currency: string
          id: string
          locale: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          currency: string
          id?: string
          locale: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          currency?: string
          id?: string
          locale?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          deleted_at: string | null
          delivered_at: string | null
          edited_at: string | null
          id: string
          kind: Database["public"]["Enums"]["message_kind"]
          moderation_decision:
            | Database["public"]["Enums"]["moderation_decision"]
            | null
          moderation_warning: string | null
          reactions: Json
          reply_to_id: string | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["sender_role"]
          sent_at: string
          status: Database["public"]["Enums"]["message_status"]
        }
        Insert: {
          content: string
          conversation_id: string
          deleted_at?: string | null
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          moderation_decision?:
            | Database["public"]["Enums"]["moderation_decision"]
            | null
          moderation_warning?: string | null
          reactions?: Json
          reply_to_id?: string | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["sender_role"]
          sent_at?: string
          status?: Database["public"]["Enums"]["message_status"]
        }
        Update: {
          content?: string
          conversation_id?: string
          deleted_at?: string | null
          delivered_at?: string | null
          edited_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          moderation_decision?:
            | Database["public"]["Enums"]["moderation_decision"]
            | null
          moderation_warning?: string | null
          reactions?: Json
          reply_to_id?: string | null
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["sender_role"]
          sent_at?: string
          status?: Database["public"]["Enums"]["message_status"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          decision: Database["public"]["Enums"]["moderation_decision"] | null
          id: string
          metadata: Json
          new_status:
            | Database["public"]["Enums"]["moderation_queue_status"]
            | null
          notes: string
          previous_status:
            | Database["public"]["Enums"]["moderation_queue_status"]
            | null
          queue_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["moderation_decision"] | null
          id?: string
          metadata?: Json
          new_status?:
            | Database["public"]["Enums"]["moderation_queue_status"]
            | null
          notes?: string
          previous_status?:
            | Database["public"]["Enums"]["moderation_queue_status"]
            | null
          queue_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          decision?: Database["public"]["Enums"]["moderation_decision"] | null
          id?: string
          metadata?: Json
          new_status?:
            | Database["public"]["Enums"]["moderation_queue_status"]
            | null
          notes?: string
          previous_status?:
            | Database["public"]["Enums"]["moderation_queue_status"]
            | null
          queue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_audit_logs_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "moderation_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_queue: {
        Row: {
          categories: Json
          confidence: number
          created_at: string
          decision: Database["public"]["Enums"]["moderation_decision"]
          id: string
          override_decision:
            | Database["public"]["Enums"]["moderation_decision"]
            | null
          override_notes: string | null
          payload: Json
          product_id: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          risk_level: Database["public"]["Enums"]["moderation_risk_level"]
          risk_score: number
          seller_id: string | null
          source: string
          status: Database["public"]["Enums"]["moderation_queue_status"]
          summary: string
          target_id: string
          target_type: Database["public"]["Enums"]["moderation_target"]
          updated_at: string
        }
        Insert: {
          categories?: Json
          confidence?: number
          created_at?: string
          decision: Database["public"]["Enums"]["moderation_decision"]
          id?: string
          override_decision?:
            | Database["public"]["Enums"]["moderation_decision"]
            | null
          override_notes?: string | null
          payload?: Json
          product_id?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          risk_level?: Database["public"]["Enums"]["moderation_risk_level"]
          risk_score?: number
          seller_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["moderation_queue_status"]
          summary?: string
          target_id: string
          target_type: Database["public"]["Enums"]["moderation_target"]
          updated_at?: string
        }
        Update: {
          categories?: Json
          confidence?: number
          created_at?: string
          decision?: Database["public"]["Enums"]["moderation_decision"]
          id?: string
          override_decision?:
            | Database["public"]["Enums"]["moderation_decision"]
            | null
          override_notes?: string | null
          payload?: Json
          product_id?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          risk_level?: Database["public"]["Enums"]["moderation_risk_level"]
          risk_score?: number
          seller_id?: string | null
          source?: string
          status?: Database["public"]["Enums"]["moderation_queue_status"]
          summary?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["moderation_target"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_queue_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_queue_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_queue_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      monetization_plans: {
        Row: {
          active: boolean
          created_at: string
          features: Json
          id: string
          interval: string
          name: string
          price_cents: number
          slug: string
          sort_order: number
          tier: Database["public"]["Enums"]["monetization_plan_tier"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          features?: Json
          id?: string
          interval?: string
          name: string
          price_cents?: number
          slug: string
          sort_order?: number
          tier: Database["public"]["Enums"]["monetization_plan_tier"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          features?: Json
          id?: string
          interval?: string
          name?: string
          price_cents?: number
          slug?: string
          sort_order?: number
          tier?: Database["public"]["Enums"]["monetization_plan_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      monetization_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          metadata: Json
          plan_id: string
          status: Database["public"]["Enums"]["monetization_subscription_status"]
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          metadata?: Json
          plan_id: string
          status?: Database["public"]["Enums"]["monetization_subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          metadata?: Json
          plan_id?: string
          status?: Database["public"]["Enums"]["monetization_subscription_status"]
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "monetization_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "monetization_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monetization_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_delivery_log: {
        Row: {
          channel: string
          created_at: string
          event_type: string
          id: string
          payload: Json
          status: string
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          status: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_delivery_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          email_marketing: boolean
          email_messages: boolean
          email_orders: boolean
          email_promotions: boolean
          marketing: boolean
          messages: boolean
          offers: boolean
          orders: boolean
          promotions: boolean
          push_enabled: boolean
          quiet_hours_enabled: boolean
          quiet_hours_end: string
          quiet_hours_start: string
          reviews: boolean
          sound: boolean
          system: boolean
          updated_at: string
          user_id: string
          vibration: boolean
        }
        Insert: {
          email_marketing?: boolean
          email_messages?: boolean
          email_orders?: boolean
          email_promotions?: boolean
          marketing?: boolean
          messages?: boolean
          offers?: boolean
          orders?: boolean
          promotions?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          reviews?: boolean
          sound?: boolean
          system?: boolean
          updated_at?: string
          user_id: string
          vibration?: boolean
        }
        Update: {
          email_marketing?: boolean
          email_messages?: boolean
          email_orders?: boolean
          email_promotions?: boolean
          marketing?: boolean
          messages?: boolean
          offers?: boolean
          orders?: boolean
          promotions?: boolean
          push_enabled?: boolean
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          reviews?: boolean
          sound?: boolean
          system?: boolean
          updated_at?: string
          user_id?: string
          vibration?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          avatar_name: string | null
          avatar_url: string | null
          created_at: string
          detail: string | null
          href: string
          id: string
          read: boolean
          subtitle: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          avatar_name?: string | null
          avatar_url?: string | null
          created_at?: string
          detail?: string | null
          href?: string
          id?: string
          read?: boolean
          subtitle?: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          avatar_name?: string | null
          avatar_url?: string | null
          created_at?: string
          detail?: string | null
          href?: string
          id?: string
          read?: boolean
          subtitle?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          id: string
          message: string | null
          product_id: string
          seller_id: string
          status: Database["public"]["Enums"]["offer_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          id?: string
          message?: string | null
          product_id: string
          seller_id: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          id?: string
          message?: string | null
          product_id?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["offer_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          condition: string
          id: string
          image_url: string
          order_id: string
          price: number
          product_id: string | null
          quantity: number
          slug: string
          title: string
        }
        Insert: {
          condition: string
          id?: string
          image_url: string
          order_id: string
          price: number
          product_id?: string | null
          quantity?: number
          slug: string
          title: string
        }
        Update: {
          condition?: string
          id?: string
          image_url?: string
          order_id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          slug?: string
          title?: string
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
      order_shipments: {
        Row: {
          carrier: string
          created_at: string
          delivered_at: string | null
          dispatch_at: string | null
          estimated_delivery_at: string | null
          id: string
          last_event: string
          order_id: string
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          carrier: string
          created_at?: string
          delivered_at?: string | null
          dispatch_at?: string | null
          estimated_delivery_at?: string | null
          id?: string
          last_event?: string
          order_id: string
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string
          created_at?: string
          delivered_at?: string | null
          dispatch_at?: string | null
          estimated_delivery_at?: string | null
          id?: string
          last_event?: string
          order_id?: string
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_id: string
          completed_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_carrier: string
          delivery_fee: number
          dispatch_by: string | null
          disputes_disabled: boolean
          estimated_delivery_at: string | null
          id: string
          invoice_number: string | null
          item_price: number
          order_number: string
          paid_at: string | null
          platform_fee: number
          protected_fee: number
          receipt_url: string | null
          refunded_at: string | null
          reserved_until: string | null
          seller_id: string
          seller_payout: number
          shipped_at: string | null
          shipping_address_id: string | null
          shipping_method: Database["public"]["Enums"]["shipping_method"]
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          stripe_session_id: string | null
          total: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_carrier?: string
          delivery_fee?: number
          dispatch_by?: string | null
          disputes_disabled?: boolean
          estimated_delivery_at?: string | null
          id?: string
          invoice_number?: string | null
          item_price: number
          order_number: string
          paid_at?: string | null
          platform_fee?: number
          protected_fee?: number
          receipt_url?: string | null
          refunded_at?: string | null
          reserved_until?: string | null
          seller_id: string
          seller_payout?: number
          shipped_at?: string | null
          shipping_address_id?: string | null
          shipping_method?: Database["public"]["Enums"]["shipping_method"]
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_session_id?: string | null
          total: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_carrier?: string
          delivery_fee?: number
          dispatch_by?: string | null
          disputes_disabled?: boolean
          estimated_delivery_at?: string | null
          id?: string
          invoice_number?: string | null
          item_price?: number
          order_number?: string
          paid_at?: string | null
          platform_fee?: number
          protected_fee?: number
          receipt_url?: string | null
          refunded_at?: string | null
          reserved_until?: string | null
          seller_id?: string
          seller_payout?: number
          shipped_at?: string | null
          shipping_address_id?: string | null
          shipping_method?: Database["public"]["Enums"]["shipping_method"]
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_session_id?: string | null
          total?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "shipping_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          brand: string
          created_at: string
          exp_month: number
          exp_year: number
          id: string
          is_default: boolean
          last4: string
          stripe_payment_method_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string
          created_at?: string
          exp_month: number
          exp_year: number
          id?: string
          is_default?: boolean
          last4: string
          stripe_payment_method_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string
          created_at?: string
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean
          last4?: string
          stripe_payment_method_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_analytics_events: {
        Row: {
          dimensions: Json
          domain: string
          id: string
          metric: string
          recorded_at: string
          value: number
        }
        Insert: {
          dimensions?: Json
          domain: string
          id?: string
          metric: string
          recorded_at?: string
          value?: number
        }
        Update: {
          dimensions?: Json
          domain?: string
          id?: string
          metric?: string
          recorded_at?: string
          value?: number
        }
        Relationships: []
      }
      platform_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          metadata: Json
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_error_logs: {
        Row: {
          category: string
          context: Json
          created_at: string
          id: string
          level: string
          message: string
          stack_trace: string | null
        }
        Insert: {
          category: string
          context?: Json
          created_at?: string
          id?: string
          level?: string
          message: string
          stack_trace?: string | null
        }
        Update: {
          category?: string
          context?: Json
          created_at?: string
          id?: string
          level?: string
          message?: string
          stack_trace?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          storage_path: string | null
          thumbnail_url: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          storage_path?: string | null
          thumbnail_url?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          storage_path?: string | null
          thumbnail_url?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          accept_offers: boolean
          auction_ends_at: string | null
          auction_start_price: number | null
          auction_starts_at: string | null
          bid_count: number
          brand_id: string | null
          bump_count: number
          bumped_until: string | null
          category_id: string | null
          color: string | null
          condition: string
          created_at: string
          current_bid: number | null
          delivery_carriers: string[]
          description: string
          dispatch_days: number
          featured_until: string | null
          id: string
          last_bumped_at: string | null
          likes: number
          listing_type: string
          local_delivery_radius_km: number | null
          low_stock_alert: number
          moderation_confidence: number
          moderation_reviewed_at: string | null
          moderation_status: Database["public"]["Enums"]["moderation_decision"]
          moderation_summary: string
          original_price: number | null
          price: number
          promotion_score: number
          rating: number
          reserve_price: number | null
          review_count: number
          sections: string[]
          seller_id: string
          shipping_method: Database["public"]["Enums"]["shipping_method"]
          shipping_price: number | null
          size: string | null
          sku: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          title: string
          updated_at: string
          views: number
          winner_id: string | null
        }
        Insert: {
          accept_offers?: boolean
          auction_ends_at?: string | null
          auction_start_price?: number | null
          auction_starts_at?: string | null
          bid_count?: number
          brand_id?: string | null
          bump_count?: number
          bumped_until?: string | null
          category_id?: string | null
          color?: string | null
          condition: string
          created_at?: string
          current_bid?: number | null
          delivery_carriers?: string[]
          description?: string
          dispatch_days?: number
          featured_until?: string | null
          id?: string
          last_bumped_at?: string | null
          likes?: number
          listing_type?: string
          local_delivery_radius_km?: number | null
          low_stock_alert?: number
          moderation_confidence?: number
          moderation_reviewed_at?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_decision"]
          moderation_summary?: string
          original_price?: number | null
          price: number
          promotion_score?: number
          rating?: number
          reserve_price?: number | null
          review_count?: number
          sections?: string[]
          seller_id: string
          shipping_method?: Database["public"]["Enums"]["shipping_method"]
          shipping_price?: number | null
          size?: string | null
          sku?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          title: string
          updated_at?: string
          views?: number
          winner_id?: string | null
        }
        Update: {
          accept_offers?: boolean
          auction_ends_at?: string | null
          auction_start_price?: number | null
          auction_starts_at?: string | null
          bid_count?: number
          brand_id?: string | null
          bump_count?: number
          bumped_until?: string | null
          category_id?: string | null
          color?: string | null
          condition?: string
          created_at?: string
          current_bid?: number | null
          delivery_carriers?: string[]
          description?: string
          dispatch_days?: number
          featured_until?: string | null
          id?: string
          last_bumped_at?: string | null
          likes?: number
          listing_type?: string
          local_delivery_radius_km?: number | null
          low_stock_alert?: number
          moderation_confidence?: number
          moderation_reviewed_at?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_decision"]
          moderation_summary?: string
          original_price?: number | null
          price?: number
          promotion_score?: number
          rating?: number
          reserve_price?: number | null
          review_count?: number
          sections?: string[]
          seller_id?: string
          shipping_method?: Database["public"]["Enums"]["shipping_method"]
          shipping_price?: number | null
          size?: string | null
          sku?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          title?: string
          updated_at?: string
          views?: number
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_entitlements: {
        Row: {
          company_verified: boolean
          lifetime_premium: boolean
          premium: boolean
          promotion_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          company_verified?: boolean
          lifetime_premium?: boolean
          premium?: boolean
          promotion_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          company_verified?: boolean
          lifetime_premium?: boolean
          premium?: boolean
          promotion_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          stripe_customer_id: string | null
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string
          username: string
          verified: boolean
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          username: string
          verified?: boolean
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          stripe_customer_id?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string
          username?: string
          verified?: boolean
        }
        Relationships: []
      }
      promotion_analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          product_id: string
          promotion_id: string | null
          seller_id: string
          surface: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          product_id: string
          promotion_id?: string | null
          seller_id: string
          surface: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          product_id?: string
          promotion_id?: string | null
          seller_id?: string
          surface?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_analytics_events_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "listing_promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_analytics_events_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      protection_case_events: {
        Row: {
          actor_id: string | null
          case_id: string
          created_at: string
          event_type: string
          id: string
          message: string
          metadata: Json
        }
        Insert: {
          actor_id?: string | null
          case_id: string
          created_at?: string
          event_type: string
          id?: string
          message?: string
          metadata?: Json
        }
        Update: {
          actor_id?: string | null
          case_id?: string
          created_at?: string
          event_type?: string
          id?: string
          message?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "protection_case_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protection_case_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "protection_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      protection_cases: {
        Row: {
          admin_id: string | null
          admin_notes: string
          appeal_reason: string | null
          appealed_at: string | null
          buyer_id: string
          case_type: Database["public"]["Enums"]["protection_case_type"]
          created_at: string
          description: string
          id: string
          order_id: string
          outcome: Database["public"]["Enums"]["protection_case_outcome"]
          reason: string
          refund_amount: number | null
          resolved_at: string | null
          seller_id: string
          status: Database["public"]["Enums"]["protection_case_status"]
          updated_at: string
        }
        Insert: {
          admin_id?: string | null
          admin_notes?: string
          appeal_reason?: string | null
          appealed_at?: string | null
          buyer_id: string
          case_type: Database["public"]["Enums"]["protection_case_type"]
          created_at?: string
          description?: string
          id?: string
          order_id: string
          outcome?: Database["public"]["Enums"]["protection_case_outcome"]
          reason: string
          refund_amount?: number | null
          resolved_at?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["protection_case_status"]
          updated_at?: string
        }
        Update: {
          admin_id?: string | null
          admin_notes?: string
          appeal_reason?: string | null
          appealed_at?: string | null
          buyer_id?: string
          case_type?: Database["public"]["Enums"]["protection_case_type"]
          created_at?: string
          description?: string
          id?: string
          order_id?: string
          outcome?: Database["public"]["Enums"]["protection_case_outcome"]
          reason?: string
          refund_amount?: number | null
          resolved_at?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["protection_case_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protection_cases_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protection_cases_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protection_cases_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protection_cases_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      protection_evidence: {
        Row: {
          case_id: string
          created_at: string
          description: string
          file_name: string
          file_url: string
          id: string
          uploaded_by: string
        }
        Insert: {
          case_id: string
          created_at?: string
          description?: string
          file_name: string
          file_url: string
          id?: string
          uploaded_by: string
        }
        Update: {
          case_id?: string
          created_at?: string
          description?: string
          file_name?: string
          file_url?: string
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "protection_evidence_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "protection_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protection_evidence_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          platform: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          platform?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          platform?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recently_viewed: {
        Row: {
          product_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          product_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          product_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_viewed_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recently_viewed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rfq_requests: {
        Row: {
          buyer_id: string
          category_slug: string | null
          created_at: string
          description: string
          id: string
          metadata: Json
          premium: boolean
          quantity: number
          seller_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          category_slug?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json
          premium?: boolean
          quantity?: number
          seller_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          category_slug?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json
          premium?: boolean
          quantity?: number
          seller_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rfq_requests_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rfq_requests_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_items: {
        Row: {
          last_viewed_at: string | null
          product_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          last_viewed_at?: string | null
          product_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          last_viewed_at?: string | null
          product_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_search_notification_log: {
        Row: {
          id: string
          notified_at: string
          product_id: string
          saved_search_id: string
        }
        Insert: {
          id?: string
          notified_at?: string
          product_id: string
          saved_search_id: string
        }
        Update: {
          id?: string
          notified_at?: string
          product_id?: string
          saved_search_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_search_notification_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_search_notification_log_saved_search_id_fkey"
            columns: ["saved_search_id"]
            isOneToOne: false
            referencedRelation: "saved_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          last_notified_at: string | null
          notify_enabled: boolean
          query: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          last_notified_at?: string | null
          notify_enabled?: boolean
          query: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          last_notified_at?: string | null
          notify_enabled?: boolean
          query?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_follows: {
        Row: {
          created_at: string
          follower_id: string
          seller_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          seller_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_follows_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          bio: string | null
          created_at: string
          follower_count: number
          id: string
          listing_count: number
          listing_limit: number | null
          rating: number
          review_count: number
          sales_count: number
          stripe_connect_account_id: string | null
          updated_at: string
          vacation_mode: boolean
        }
        Insert: {
          bio?: string | null
          created_at?: string
          follower_count?: number
          id: string
          listing_count?: number
          listing_limit?: number | null
          rating?: number
          review_count?: number
          sales_count?: number
          stripe_connect_account_id?: string | null
          updated_at?: string
          vacation_mode?: boolean
        }
        Update: {
          bio?: string | null
          created_at?: string
          follower_count?: number
          id?: string
          listing_count?: number
          listing_limit?: number | null
          rating?: number
          review_count?: number
          sales_count?: number
          stripe_connect_account_id?: string | null
          updated_at?: string
          vacation_mode?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "seller_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_shipping_settings: {
        Row: {
          base_shipping_cost: number
          created_at: string
          default_carrier: string
          dispatch_time_days: number
          free_shipping_threshold: number | null
          handling_time_days: number
          international_shipping_enabled: boolean
          local_pickup_enabled: boolean
          return_policy_days: number
          ships_to: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_shipping_cost?: number
          created_at?: string
          default_carrier?: string
          dispatch_time_days?: number
          free_shipping_threshold?: number | null
          handling_time_days?: number
          international_shipping_enabled?: boolean
          local_pickup_enabled?: boolean
          return_policy_days?: number
          ships_to?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_shipping_cost?: number
          created_at?: string
          default_carrier?: string
          dispatch_time_days?: number
          free_shipping_threshold?: number | null
          handling_time_days?: number
          international_shipping_enabled?: boolean
          local_pickup_enabled?: boolean
          return_policy_days?: number
          ships_to?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_shipping_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_tax_profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string | null
          company_number: string | null
          country: string
          created_at: string
          director_name: string | null
          email: string | null
          full_name: string | null
          nino: string | null
          phone: string | null
          postcode: string | null
          registered_address: string | null
          registration_type: Database["public"]["Enums"]["seller_registration_type"]
          seller_id: string
          stripe_connect_completed: boolean
          submitted_at: string | null
          updated_at: string
          utr: string | null
          vat_number: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          company_number?: string | null
          country?: string
          created_at?: string
          director_name?: string | null
          email?: string | null
          full_name?: string | null
          nino?: string | null
          phone?: string | null
          postcode?: string | null
          registered_address?: string | null
          registration_type: Database["public"]["Enums"]["seller_registration_type"]
          seller_id: string
          stripe_connect_completed?: boolean
          submitted_at?: string | null
          updated_at?: string
          utr?: string | null
          vat_number?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          company_number?: string | null
          country?: string
          created_at?: string
          director_name?: string | null
          email?: string | null
          full_name?: string | null
          nino?: string | null
          phone?: string | null
          postcode?: string | null
          registered_address?: string | null
          registration_type?: Database["public"]["Enums"]["seller_registration_type"]
          seller_id?: string
          stripe_connect_completed?: boolean
          submitted_at?: string | null
          updated_at?: string
          utr?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_tax_profiles_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: true
            referencedRelation: "seller_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_redirects: {
        Row: {
          active: boolean
          created_at: string
          id: string
          source_path: string
          status_code: number
          target_path: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          source_path: string
          status_code?: number
          target_path: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          source_path?: string
          status_code?: number
          target_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      shipping_addresses: {
        Row: {
          address_line: string
          address_line_2: string | null
          address_type: string
          city: string | null
          country: string
          created_at: string
          id: string
          is_default: boolean
          postcode: string
          recipient_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line: string
          address_line_2?: string | null
          address_type?: string
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          postcode: string
          recipient_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line?: string
          address_line_2?: string | null
          address_type?: string
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          is_default?: boolean
          postcode?: string
          recipient_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          attachment_urls: string[]
          category: Database["public"]["Enums"]["support_category"]
          created_at: string
          description: string
          help_context: Json
          id: string
          status: Database["public"]["Enums"]["support_status"]
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_urls?: string[]
          category: Database["public"]["Enums"]["support_category"]
          created_at?: string
          description: string
          help_context?: Json
          id?: string
          status?: Database["public"]["Enums"]["support_status"]
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_urls?: string[]
          category?: Database["public"]["Enums"]["support_category"]
          created_at?: string
          description?: string
          help_context?: Json
          id?: string
          status?: Database["public"]["Enums"]["support_status"]
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_admin_audit: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          delta: number | null
          id: string
          metadata: Json
          reason: string
          score_after: number | null
          score_before: number | null
          user_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          delta?: number | null
          id?: string
          metadata?: Json
          reason: string
          score_after?: number | null
          score_before?: number | null
          user_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          delta?: number | null
          id?: string
          metadata?: Json
          reason?: string
          score_after?: number | null
          score_before?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_admin_audit_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_admin_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_events: {
        Row: {
          actor_id: string | null
          created_at: string
          delta: number
          event_type: string
          id: string
          idempotency_key: string | null
          metadata: Json
          reason: string | null
          score_after: number | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          delta?: number
          event_type: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          reason?: string | null
          score_after?: number | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          delta?: number
          event_type?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          reason?: string | null
          score_after?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_scores: {
        Row: {
          business_score: number
          buyer_score: number
          factors_snapshot: Json
          last_recalculated_at: string | null
          level: Database["public"]["Enums"]["trust_verification_level"]
          lock_reason: string | null
          recommendations: Json
          score: number
          score_locked: boolean
          seller_score: number
          tier: Database["public"]["Enums"]["trust_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          business_score?: number
          buyer_score?: number
          factors_snapshot?: Json
          last_recalculated_at?: string | null
          level?: Database["public"]["Enums"]["trust_verification_level"]
          lock_reason?: string | null
          recommendations?: Json
          score?: number
          score_locked?: boolean
          seller_score?: number
          tier?: Database["public"]["Enums"]["trust_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          business_score?: number
          buyer_score?: number
          factors_snapshot?: Json
          last_recalculated_at?: string | null
          level?: Database["public"]["Enums"]["trust_verification_level"]
          lock_reason?: string | null
          recommendations?: Json
          score?: number
          score_locked?: boolean
          seller_score?: number
          tier?: Database["public"]["Enums"]["trust_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trust_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trust_verifications: {
        Row: {
          created_at: string
          document_urls: string[]
          expires_at: string | null
          id: string
          level: Database["public"]["Enums"]["trust_verification_level"]
          metadata: Json
          reviewed_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["trust_verification_status"]
          updated_at: string
          user_id: string
          verification_type: Database["public"]["Enums"]["trust_verification_type"]
        }
        Insert: {
          created_at?: string
          document_urls?: string[]
          expires_at?: string | null
          id?: string
          level?: Database["public"]["Enums"]["trust_verification_level"]
          metadata?: Json
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["trust_verification_status"]
          updated_at?: string
          user_id: string
          verification_type: Database["public"]["Enums"]["trust_verification_type"]
        }
        Update: {
          created_at?: string
          document_urls?: string[]
          expires_at?: string | null
          id?: string
          level?: Database["public"]["Enums"]["trust_verification_level"]
          metadata?: Json
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["trust_verification_status"]
          updated_at?: string
          user_id?: string
          verification_type?: Database["public"]["Enums"]["trust_verification_type"]
        }
        Relationships: [
          {
            foreignKeyName: "trust_verifications_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trust_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_user_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          blocked_user_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          blocked_user_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_user_id_fkey"
            columns: ["blocked_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          last_seen_at: string
          online: boolean
          typing_conversation_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          last_seen_at?: string
          online?: boolean
          typing_conversation_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          last_seen_at?: string
          online?: boolean
          typing_conversation_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_typing_conversation_id_fkey"
            columns: ["typing_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          appearance_mode: string
          currency: string
          dark_mode: boolean
          email_notifications: boolean
          language: string
          locale_code: string
          marketing_emails: boolean
          profile_visibility: string
          push_notifications: boolean
          show_activity_status: boolean
          timezone: string
          updated_at: string
          user_id: string
          vacation_mode: boolean
        }
        Insert: {
          appearance_mode?: string
          currency?: string
          dark_mode?: boolean
          email_notifications?: boolean
          language?: string
          locale_code?: string
          marketing_emails?: boolean
          profile_visibility?: string
          push_notifications?: boolean
          show_activity_status?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
          vacation_mode?: boolean
        }
        Update: {
          appearance_mode?: string
          currency?: string
          dark_mode?: boolean
          email_notifications?: boolean
          language?: string
          locale_code?: string
          marketing_emails?: boolean
          profile_visibility?: string
          push_notifications?: boolean
          show_activity_status?: boolean
          timezone?: string
          updated_at?: string
          user_id?: string
          vacation_mode?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          fee_amount: number | null
          id: string
          order_number: string | null
          payout_available_at: string | null
          product_image_url: string | null
          product_title: string
          status: Database["public"]["Enums"]["wallet_tx_status"]
          stripe_payout_id: string | null
          stripe_transfer_id: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
          wallet_id: string
          withdraw_method_label: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          fee_amount?: number | null
          id?: string
          order_number?: string | null
          payout_available_at?: string | null
          product_image_url?: string | null
          product_title: string
          status?: Database["public"]["Enums"]["wallet_tx_status"]
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          user_id: string
          wallet_id: string
          withdraw_method_label?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          fee_amount?: number | null
          id?: string
          order_number?: string | null
          payout_available_at?: string | null
          product_image_url?: string | null
          product_title?: string
          status?: Database["public"]["Enums"]["wallet_tx_status"]
          stripe_payout_id?: string | null
          stripe_transfer_id?: string | null
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          user_id?: string
          wallet_id?: string
          withdraw_method_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          available_balance: number
          created_at: string
          id: string
          pending_available_at: string | null
          pending_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          id?: string
          pending_available_at?: string | null
          pending_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          id?: string
          pending_available_at?: string | null
          pending_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wholesale_accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["wholesale_account_type"]
          bulk_pricing_enabled: boolean
          company_name: string
          created_at: string
          id: string
          metadata: Json
          moq_default: number
          rfq_enabled: boolean
          updated_at: string
          verified: boolean
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["wholesale_account_type"]
          bulk_pricing_enabled?: boolean
          company_name: string
          created_at?: string
          id: string
          metadata?: Json
          moq_default?: number
          rfq_enabled?: boolean
          updated_at?: string
          verified?: boolean
        }
        Update: {
          account_type?: Database["public"]["Enums"]["wholesale_account_type"]
          bulk_pricing_enabled?: boolean
          company_name?: string
          created_at?: string
          id?: string
          metadata?: Json
          moq_default?: number
          rfq_enabled?: boolean
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "wholesale_accounts_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wholesale_pricing_tiers: {
        Row: {
          active: boolean
          created_at: string
          currency: string
          id: string
          min_quantity: number
          product_id: string | null
          seller_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          currency?: string
          id?: string
          min_quantity: number
          product_id?: string | null
          seller_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          currency?: string
          id?: string
          min_quantity?: number
          product_id?: string | null
          seller_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wholesale_pricing_tiers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wholesale_pricing_tiers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdraw_methods: {
        Row: {
          connected: boolean
          created_at: string
          id: string
          is_default: boolean
          label: string
          last_digits: string
          provider: Database["public"]["Enums"]["withdraw_provider"]
          user_id: string
        }
        Insert: {
          connected?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          last_digits: string
          provider: Database["public"]["Enums"]["withdraw_provider"]
          user_id: string
        }
        Update: {
          connected?: boolean
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          last_digits?: string
          provider?: Database["public"]["Enums"]["withdraw_provider"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdraw_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_promotion_score: {
        Args: {
          p_bump_count: number
          p_bumped_until: string
          p_featured_until: string
        }
        Returns: number
      }
      create_order_review: {
        Args: {
          p_comment?: string
          p_order_id: string
          p_rating: number
          p_reviewer_id: string
        }
        Returns: string
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      expire_stale_pending_promotions: { Args: never; Returns: number }
      find_or_create_brand: { Args: { brand_name: string }; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      generate_support_ticket_number: { Args: never; Returns: string }
      increment_product_views: {
        Args: { product_slug: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      place_bid: {
        Args: { p_amount: number; p_bidder_id: string; p_product_id: string }
        Returns: undefined
      }
      refresh_expired_promotions: { Args: never; Returns: number }
      refresh_seller_rating: {
        Args: { p_seller_id: string }
        Returns: undefined
      }
      release_product_inventory: {
        Args: { p_product_id: string; p_quantity?: number }
        Returns: undefined
      }
      reserve_product_inventory: {
        Args: { p_product_id: string; p_quantity?: number }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { value: string }; Returns: string }
    }
    Enums: {
      category_filter_type: "text" | "number" | "select" | "boolean" | "range"
      message_kind: "text" | "photo" | "emoji"
      message_status: "sent" | "delivered" | "read"
      moderation_decision: "approved" | "warning" | "blocked"
      moderation_queue_status:
        | "pending"
        | "approved"
        | "warning"
        | "blocked"
        | "overridden"
      moderation_risk_level: "low" | "medium" | "high" | "critical"
      moderation_target:
        | "listing"
        | "listing_image"
        | "message"
        | "profile"
        | "conversation"
      monetization_plan_tier:
        | "free"
        | "seller_pro"
        | "business"
        | "wholesale"
        | "enterprise"
      monetization_subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "cancelled"
        | "expired"
      notification_type:
        | "message"
        | "order"
        | "offer"
        | "review"
        | "saved_item_sold"
        | "price_reduced"
        | "system"
        | "payment"
        | "follower"
        | "moderation"
        | "promotion_expired"
        | "saved_search_match"
      offer_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "expired"
        | "cancelled"
      order_status:
        | "awaiting_payment"
        | "awaiting_shipment"
        | "shipped"
        | "delivered"
        | "issue_open"
        | "completed"
        | "cancelled"
      product_status: "draft" | "published" | "paused" | "sold" | "deleted"
      protection_case_outcome:
        | "pending"
        | "refund_full"
        | "refund_partial"
        | "return_accepted"
        | "return_rejected"
        | "no_action"
        | "seller_favour"
        | "buyer_favour"
      protection_case_status:
        | "open"
        | "awaiting_seller"
        | "awaiting_buyer"
        | "under_review"
        | "resolved"
        | "appealed"
        | "closed"
      protection_case_type: "refund" | "return" | "dispute" | "appeal"
      seller_registration_type:
        | "personal"
        | "pro_seller"
        | "business_sole_trader"
        | "business_company"
      sender_role: "buyer" | "seller"
      shipment_status:
        | "pending"
        | "label_created"
        | "dispatched"
        | "in_transit"
        | "out_for_delivery"
        | "delivered"
        | "failed"
      shipping_method:
        | "collection_only"
        | "local_delivery"
        | "delivery_available"
      support_category:
        | "account"
        | "buying"
        | "selling"
        | "payments"
        | "delivery"
        | "chat"
        | "technical"
        | "business"
        | "pro_seller"
        | "appeal_moderation"
        | "report_user"
        | "other"
      support_status: "open" | "in_progress" | "resolved" | "closed"
      trust_tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
      trust_verification_level: "basic" | "verified" | "premium" | "enterprise"
      trust_verification_status:
        | "not_started"
        | "pending"
        | "approved"
        | "rejected"
        | "expired"
      trust_verification_type:
        | "email"
        | "phone"
        | "identity"
        | "address"
        | "payment"
        | "business"
        | "wholesale"
        | "manufacturer"
        | "supplier"
        | "document"
      user_role: "buyer" | "seller" | "business" | "admin" | "super_admin"
      wallet_tx_status: "completed" | "pending" | "failed" | "refunded"
      wallet_tx_type: "sale" | "withdrawal" | "fee" | "refund" | "promotion"
      wholesale_account_type:
        | "wholesale"
        | "manufacturer"
        | "supplier"
        | "importer"
        | "exporter"
      withdraw_provider: "bank_account" | "stripe_connect"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      category_filter_type: ["text", "number", "select", "boolean", "range"],
      message_kind: ["text", "photo", "emoji"],
      message_status: ["sent", "delivered", "read"],
      moderation_decision: ["approved", "warning", "blocked"],
      moderation_queue_status: [
        "pending",
        "approved",
        "warning",
        "blocked",
        "overridden",
      ],
      moderation_risk_level: ["low", "medium", "high", "critical"],
      moderation_target: [
        "listing",
        "listing_image",
        "message",
        "profile",
        "conversation",
      ],
      monetization_plan_tier: [
        "free",
        "seller_pro",
        "business",
        "wholesale",
        "enterprise",
      ],
      monetization_subscription_status: [
        "trialing",
        "active",
        "past_due",
        "cancelled",
        "expired",
      ],
      notification_type: [
        "message",
        "order",
        "offer",
        "review",
        "saved_item_sold",
        "price_reduced",
        "system",
        "payment",
        "follower",
        "moderation",
        "promotion_expired",
        "saved_search_match",
      ],
      offer_status: ["pending", "accepted", "rejected", "expired", "cancelled"],
      order_status: [
        "awaiting_payment",
        "awaiting_shipment",
        "shipped",
        "delivered",
        "issue_open",
        "completed",
        "cancelled",
      ],
      product_status: ["draft", "published", "paused", "sold", "deleted"],
      protection_case_outcome: [
        "pending",
        "refund_full",
        "refund_partial",
        "return_accepted",
        "return_rejected",
        "no_action",
        "seller_favour",
        "buyer_favour",
      ],
      protection_case_status: [
        "open",
        "awaiting_seller",
        "awaiting_buyer",
        "under_review",
        "resolved",
        "appealed",
        "closed",
      ],
      protection_case_type: ["refund", "return", "dispute", "appeal"],
      seller_registration_type: [
        "personal",
        "pro_seller",
        "business_sole_trader",
        "business_company",
      ],
      sender_role: ["buyer", "seller"],
      shipment_status: [
        "pending",
        "label_created",
        "dispatched",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed",
      ],
      shipping_method: [
        "collection_only",
        "local_delivery",
        "delivery_available",
      ],
      support_category: [
        "account",
        "buying",
        "selling",
        "payments",
        "delivery",
        "chat",
        "technical",
        "business",
        "pro_seller",
        "appeal_moderation",
        "report_user",
        "other",
      ],
      support_status: ["open", "in_progress", "resolved", "closed"],
      trust_tier: ["bronze", "silver", "gold", "platinum", "diamond"],
      trust_verification_level: ["basic", "verified", "premium", "enterprise"],
      trust_verification_status: [
        "not_started",
        "pending",
        "approved",
        "rejected",
        "expired",
      ],
      trust_verification_type: [
        "email",
        "phone",
        "identity",
        "address",
        "payment",
        "business",
        "wholesale",
        "manufacturer",
        "supplier",
        "document",
      ],
      user_role: ["buyer", "seller", "business", "admin", "super_admin"],
      wallet_tx_status: ["completed", "pending", "failed", "refunded"],
      wallet_tx_type: ["sale", "withdrawal", "fee", "refund", "promotion"],
      wholesale_account_type: [
        "wholesale",
        "manufacturer",
        "supplier",
        "importer",
        "exporter",
      ],
      withdraw_provider: ["bank_account", "stripe_connect"],
    },
  },
} as const

export type UserRole = Database["public"]["Enums"]["user_role"];
export type ProductStatus = Database["public"]["Enums"]["product_status"];
