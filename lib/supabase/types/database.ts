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
          created_at: string
          id: string
          tax_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          business_name: string
          created_at?: string
          id: string
          tax_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          business_name?: string
          created_at?: string
          id?: string
          tax_id?: string | null
          updated_at?: string
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
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          path_label: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          path_label: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          path_label?: string
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
      conversations: {
        Row: {
          buyer_id: string
          buyer_unread_count: number
          created_at: string
          id: string
          last_message: string
          last_message_at: string
          product_id: string
          seller_id: string
          seller_unread_count: number
        }
        Insert: {
          buyer_id: string
          buyer_unread_count?: number
          created_at?: string
          id?: string
          last_message?: string
          last_message_at?: string
          product_id: string
          seller_id: string
          seller_unread_count?: number
        }
        Update: {
          buyer_id?: string
          buyer_unread_count?: number
          created_at?: string
          id?: string
          last_message?: string
          last_message_at?: string
          product_id?: string
          seller_id?: string
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
      messages: {
        Row: {
          content: string
          conversation_id: string
          id: string
          kind: Database["public"]["Enums"]["message_kind"]
          sender_id: string
          sender_role: Database["public"]["Enums"]["sender_role"]
          sent_at: string
          status: Database["public"]["Enums"]["message_status"]
        }
        Insert: {
          content: string
          conversation_id: string
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
          sender_id: string
          sender_role: Database["public"]["Enums"]["sender_role"]
          sent_at?: string
          status?: Database["public"]["Enums"]["message_status"]
        }
        Update: {
          content?: string
          conversation_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["message_kind"]
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
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      notification_settings: {
        Row: {
          messages: boolean
          offers: boolean
          orders: boolean
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
          messages?: boolean
          offers?: boolean
          orders?: boolean
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
          messages?: boolean
          offers?: boolean
          orders?: boolean
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
      orders: {
        Row: {
          buyer_id: string
          completed_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_carrier: string
          delivery_fee: number
          disputes_disabled: boolean
          id: string
          item_price: number
          order_number: string
          paid_at: string | null
          protected_fee: number
          reserved_until: string | null
          seller_id: string
          shipped_at: string | null
          shipping_address_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          stripe_session_id: string | null
          refunded_at: string | null
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
          disputes_disabled?: boolean
          id?: string
          item_price: number
          order_number: string
          paid_at?: string | null
          protected_fee?: number
          reserved_until?: string | null
          seller_id: string
          shipped_at?: string | null
          shipping_address_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_session_id?: string | null
          refunded_at?: string | null
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
          disputes_disabled?: boolean
          id?: string
          item_price?: number
          order_number?: string
          paid_at?: string | null
          protected_fee?: number
          reserved_until?: string | null
          seller_id?: string
          shipped_at?: string | null
          shipping_address_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          stripe_session_id?: string | null
          refunded_at?: string | null
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
          featured_until: string | null
          id: string
          last_bumped_at: string | null
          likes: number
          listing_type: string
          low_stock_alert: number
          original_price: number | null
          price: number
          promotion_score: number
          rating: number
          reserve_price: number | null
          review_count: number
          sections: string[]
          seller_id: string
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
          featured_until?: string | null
          id?: string
          last_bumped_at?: string | null
          likes?: number
          listing_type?: string
          low_stock_alert?: number
          original_price?: number | null
          price: number
          promotion_score?: number
          rating?: number
          reserve_price?: number | null
          review_count?: number
          sections?: string[]
          seller_id: string
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
          featured_until?: string | null
          id?: string
          last_bumped_at?: string | null
          likes?: number
          listing_type?: string
          low_stock_alert?: number
          original_price?: number | null
          price?: number
          promotion_score?: number
          rating?: number
          reserve_price?: number | null
          review_count?: number
          sections?: string[]
          seller_id?: string
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string
          verified?: boolean
        }
        Relationships: []
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
      seller_profiles: {
        Row: {
          bio: string | null
          created_at: string
          follower_count: number
          id: string
          listing_count: number
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
      shipping_addresses: {
        Row: {
          address_line: string
          address_line_2: string | null
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
      user_settings: {
        Row: {
          currency: string
          dark_mode: boolean
          email_notifications: boolean
          language: string
          push_notifications: boolean
          updated_at: string
          user_id: string
          vacation_mode: boolean
        }
        Insert: {
          currency?: string
          dark_mode?: boolean
          email_notifications?: boolean
          language?: string
          push_notifications?: boolean
          updated_at?: string
          user_id: string
          vacation_mode?: boolean
        }
        Update: {
          currency?: string
          dark_mode?: boolean
          email_notifications?: boolean
          language?: string
          push_notifications?: boolean
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
      find_or_create_brand: { Args: { brand_name: string }; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      compute_promotion_score: {
        Args: {
          p_bump_count: number
          p_bumped_until: string | null
          p_featured_until: string | null
        }
        Returns: number
      }
      refresh_expired_promotions: { Args: never; Returns: number }
      release_product_inventory: {
        Args: { p_product_id: string; p_quantity?: number }
        Returns: undefined
      }
      reserve_product_inventory: {
        Args: { p_product_id: string; p_quantity?: number }
        Returns: boolean
      }
      increment_product_views: {
        Args: { product_slug: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      place_bid: {
        Args: { p_amount: number; p_bidder_id: string; p_product_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      slugify: { Args: { value: string }; Returns: string }
    }
    Enums: {
      message_kind: "text" | "photo" | "emoji"
      message_status: "sent" | "delivered" | "read"
      notification_type:
        | "message"
        | "order"
        | "offer"
        | "review"
        | "saved_item_sold"
        | "price_reduced"
        | "system"
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
      sender_role: "buyer" | "seller"
      user_role: "buyer" | "seller" | "business" | "admin"
      wallet_tx_status: "completed" | "pending" | "failed" | "refunded"
      wallet_tx_type: "sale" | "withdrawal" | "fee" | "refund" | "promotion"
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
      message_kind: ["text", "photo", "emoji"],
      message_status: ["sent", "delivered", "read"],
      notification_type: [
        "message",
        "order",
        "offer",
        "review",
        "saved_item_sold",
        "price_reduced",
        "system",
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
      sender_role: ["buyer", "seller"],
      user_role: ["buyer", "seller", "business", "admin"],
      wallet_tx_status: ["completed", "pending", "failed", "refunded"],
      wallet_tx_type: ["sale", "withdrawal", "fee", "refund", "promotion"],
      withdraw_provider: ["bank_account", "stripe_connect"],
    },
  },
} as const

export type UserRole = Database["public"]["Enums"]["user_role"];
export type ProductStatus = Database["public"]["Enums"]["product_status"];
