/**
 * Keraunous Tech Store — Database Types
 * Fully-typed schema matching db/migrations/20261006000001_initial_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductStatus = 'draft' | 'published' | 'archived';
export type ItemCondition = 'brand_new' | 'uk_used' | 'open_box';
export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';
export type FulfilmentType = 'delivery' | 'pickup';
export type AdminRole = 'owner' | 'staff';
export type BannerType = 'hero' | 'promo';

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_path: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_path?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_path?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          parent_id?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          brand_id: string;
          category_id: string;
          short_description: string | null;
          description: string | null;
          specs: Json;
          badge: 'new' | 'best_seller' | 'hot' | 'limited' | null;
          is_featured: boolean;
          featured_rank: number | null;
          status: ProductStatus;
          published_at: string | null;
          search_key: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          brand_id: string;
          category_id: string;
          short_description?: string | null;
          description?: string | null;
          specs?: Json;
          badge?: 'new' | 'best_seller' | 'hot' | 'limited' | null;
          is_featured?: boolean;
          featured_rank?: number | null;
          status?: ProductStatus;
          published_at?: string | null;
          search_key?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          brand_id?: string;
          category_id?: string;
          short_description?: string | null;
          description?: string | null;
          specs?: Json;
          badge?: 'new' | 'best_seller' | 'hot' | 'limited' | null;
          is_featured?: boolean;
          featured_rank?: number | null;
          status?: ProductStatus;
          published_at?: string | null;
          search_key?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          storage_gb: number | null;
          ram_gb: number | null;
          color: string | null;
          color_hex: string | null;
          condition: ItemCondition;
          price_ngn: number;
          compare_at_price_ngn: number | null;
          sale_price_ngn: number | null;
          sale_starts_at: string | null;
          sale_ends_at: string | null;
          stock_qty: number;
          low_stock_threshold: number;
          warranty_months: number | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          storage_gb?: number | null;
          ram_gb?: number | null;
          color?: string | null;
          color_hex?: string | null;
          condition?: ItemCondition;
          price_ngn: number;
          compare_at_price_ngn?: number | null;
          sale_price_ngn?: number | null;
          sale_starts_at?: string | null;
          sale_ends_at?: string | null;
          stock_qty?: number;
          low_stock_threshold?: number;
          warranty_months?: number | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          storage_gb?: number | null;
          ram_gb?: number | null;
          color?: string | null;
          color_hex?: string | null;
          condition?: ItemCondition;
          price_ngn?: number;
          compare_at_price_ngn?: number | null;
          sale_price_ngn?: number | null;
          sale_starts_at?: string | null;
          sale_ends_at?: string | null;
          stock_qty?: number;
          low_stock_threshold?: number;
          warranty_months?: number | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          color: string | null;
          path: string;
          alt: string;
          width: number | null;
          height: number | null;
          is_primary: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          color?: string | null;
          path: string;
          alt: string;
          width?: number | null;
          height?: number | null;
          is_primary?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          product_id?: string;
          color?: string | null;
          path?: string;
          alt?: string;
          width?: number | null;
          height?: number | null;
          is_primary?: boolean;
          sort_order?: number;
        };
      };
      banners: {
        Row: {
          id: string;
          type: BannerType;
          eyebrow: string | null;
          title: string;
          subtitle: string | null;
          cta_label: string | null;
          cta_href: string | null;
          image_path: string;
          product_id: string | null;
          starts_at: string | null;
          ends_at: string | null;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          type: BannerType;
          eyebrow?: string | null;
          title: string;
          subtitle?: string | null;
          cta_label?: string | null;
          cta_href?: string | null;
          image_path: string;
          product_id?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          type?: BannerType;
          eyebrow?: string | null;
          title?: string;
          subtitle?: string | null;
          cta_label?: string | null;
          cta_href?: string | null;
          image_path?: string;
          product_id?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
      };
      campaigns: {
        Row: {
          id: string;
          title: string;
          subtitle: string | null;
          href: string | null;
          starts_at: string | null;
          ends_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          subtitle?: string | null;
          href?: string | null;
          starts_at?: string | null;
          ends_at: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          title?: string;
          subtitle?: string | null;
          href?: string | null;
          starts_at?: string | null;
          ends_at?: string;
          is_active?: boolean;
        };
      };
      site_settings: {
        Row: {
          key: string;
          value: Json;
          is_public: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value: Json;
          is_public?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          key?: string;
          value?: Json;
          is_public?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          public_id: string;
          idempotency_key: string;
          customer_name: string;
          customer_phone: string;
          fulfilment: FulfilmentType;
          delivery_state: string | null;
          delivery_city: string | null;
          delivery_address: string | null;
          customer_note: string | null;
          status: OrderStatus;
          subtotal_ngn: number;
          delivery_fee_ngn: number;
          discount_ngn: number;
          total_ngn: number;
          payment_confirmed_at: string | null;
          payment_confirmed_by: string | null;
          payment_amount_ngn: number | null;
          payment_reference: string | null;
          courier_name: string | null;
          tracking_number: string | null;
          internal_note: string | null;
          whatsapp_opened_at: string | null;
          utm: Json | null;
          ip_hash: string | null;
          created_at: string;
          confirmed_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          public_id: string;
          idempotency_key: string;
          customer_name: string;
          customer_phone: string;
          fulfilment?: FulfilmentType;
          delivery_state?: string | null;
          delivery_city?: string | null;
          delivery_address?: string | null;
          customer_note?: string | null;
          status?: OrderStatus;
          subtotal_ngn: number;
          delivery_fee_ngn?: number;
          discount_ngn?: number;
          payment_confirmed_at?: string | null;
          payment_confirmed_by?: string | null;
          payment_amount_ngn?: number | null;
          payment_reference?: string | null;
          courier_name?: string | null;
          tracking_number?: string | null;
          internal_note?: string | null;
          whatsapp_opened_at?: string | null;
          utm?: Json | null;
          ip_hash?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          public_id?: string;
          idempotency_key?: string;
          customer_name?: string;
          customer_phone?: string;
          fulfilment?: FulfilmentType;
          delivery_state?: string | null;
          delivery_city?: string | null;
          delivery_address?: string | null;
          customer_note?: string | null;
          status?: OrderStatus;
          subtotal_ngn?: number;
          delivery_fee_ngn?: number;
          discount_ngn?: number;
          payment_confirmed_at?: string | null;
          payment_confirmed_by?: string | null;
          payment_amount_ngn?: number | null;
          payment_reference?: string | null;
          courier_name?: string | null;
          tracking_number?: string | null;
          internal_note?: string | null;
          whatsapp_opened_at?: string | null;
          utm?: Json | null;
          ip_hash?: string | null;
          created_at?: string;
          confirmed_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string | null;
          product_name: string;
          variant_label: string;
          sku: string;
          listed_price_ngn: number;
          unit_price_ngn: number;
          qty: number;
          line_total_ngn: number;
          imei: string | null;
          stock_deducted: boolean;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id?: string | null;
          product_name: string;
          variant_label: string;
          sku: string;
          listed_price_ngn: number;
          unit_price_ngn: number;
          qty: number;
          imei?: string | null;
          stock_deducted?: boolean;
        };
        Update: {
          id?: string;
          order_id?: string;
          variant_id?: string | null;
          product_name?: string;
          variant_label?: string;
          sku?: string;
          listed_price_ngn?: number;
          unit_price_ngn?: number;
          qty?: number;
          imei?: string | null;
          stock_deducted?: boolean;
        };
      };
      order_events: {
        Row: {
          id: number;
          order_id: string;
          type: string;
          from_status: OrderStatus | null;
          to_status: OrderStatus | null;
          actor_id: string | null;
          note: string | null;
          is_customer_visible: boolean;
          meta: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          order_id: string;
          type: string;
          from_status?: OrderStatus | null;
          to_status?: OrderStatus | null;
          actor_id?: string | null;
          note?: string | null;
          is_customer_visible?: boolean;
          meta?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          order_id?: string;
          type?: string;
          from_status?: OrderStatus | null;
          to_status?: OrderStatus | null;
          actor_id?: string | null;
          note?: string | null;
          is_customer_visible?: boolean;
          meta?: Json | null;
          created_at?: string;
        };
      };
      admin_users: {
        Row: {
          user_id: string;
          role: AdminRole;
          display_name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role?: AdminRole;
          display_name: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: AdminRole;
          display_name?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          before: Json | null;
          after: Json | null;
          ip_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          actor_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          before?: Json | null;
          after?: Json | null;
          ip_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          actor_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          before?: Json | null;
          after?: Json | null;
          ip_hash?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      v_product_cards: {
        Row: {
          id: string;
          slug: string;
          name: string;
          badge: 'new' | 'best_seller' | 'hot' | 'limited' | null;
          is_featured: boolean;
          featured_rank: number | null;
          published_at: string | null;
          brand_name: string;
          brand_slug: string;
          category_name: string;
          category_slug: string;
          price_from_ngn: number;
          price_to_ngn: number;
          on_sale: boolean;
          max_discount_pct: number | null;
          total_stock: number;
          primary_image: string | null;
        };
      };
      v_product_variants_public: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          storage_gb: number | null;
          ram_gb: number | null;
          color: string | null;
          color_hex: string | null;
          condition: ItemCondition;
          price_ngn: number;
          compare_at_price_ngn: number | null;
          sale_price_ngn: number | null;
          sale_starts_at: string | null;
          sale_ends_at: string | null;
          current_price_ngn: number;
          stock_qty: number;
          low_stock_threshold: number;
          warranty_months: number | null;
          sort_order: number;
        };
      };
    };
    Functions: {
      effective_price: {
        Args: {
          v: Database['public']['Tables']['product_variants']['Row'];
        };
        Returns: number;
      };
      create_order: {
        Args: {
          payload: Json;
        };
        Returns: Json;
      };
      track_order: {
        Args: {
          p_public_id: string;
          p_phone: string;
        };
        Returns: Json | null;
      };
      transition_order: {
        Args: {
          p_order_id: string;
          p_to_status: OrderStatus;
          p_payload?: Json;
        };
        Returns: Json;
      };
      adjust_order_item_price: {
        Args: {
          p_item_id: string;
          p_new_price: number;
          p_reason: string;
        };
        Returns: Json;
      };
      set_delivery_fee: {
        Args: {
          p_order_id: string;
          p_fee: number;
        };
        Returns: Json;
      };
      mark_whatsapp_opened: {
        Args: {
          p_public_id: string;
          p_token_ok: boolean;
        };
        Returns: Json;
      };
      apply_bulk_price: {
        Args: {
          p_change_set: Json;
        };
        Returns: Json;
      };
      expire_stale_holds: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
    };
  };
}
