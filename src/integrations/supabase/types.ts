export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      drift_alerts: {
        Row: {
          created_at: string
          features: Json | null
          id: string
          message: string
          metadata: Json | null
          resolved: boolean
          severity: string
          timestamp: string
          type: string
        }
        Insert: {
          created_at?: string
          features?: Json | null
          id?: string
          message: string
          metadata?: Json | null
          resolved?: boolean
          severity: string
          timestamp: string
          type: string
        }
        Update: {
          created_at?: string
          features?: Json | null
          id?: string
          message?: string
          metadata?: Json | null
          resolved?: boolean
          severity?: string
          timestamp?: string
          type?: string
        }
        Relationships: []
      }
      market_data: {
        Row: {
          change_amount: number | null
          change_percent: number | null
          data_source: string
          id: string
          last_updated: string
          market_cap: number | null
          price: number
          symbol: string
          volume: number | null
        }
        Insert: {
          change_amount?: number | null
          change_percent?: number | null
          data_source: string
          id?: string
          last_updated?: string
          market_cap?: number | null
          price: number
          symbol: string
          volume?: number | null
        }
        Update: {
          change_amount?: number | null
          change_percent?: number | null
          data_source?: string
          id?: string
          last_updated?: string
          market_cap?: number | null
          price?: number
          symbol?: string
          volume?: number | null
        }
        Relationships: []
      }
      market_news: {
        Row: {
          created_at: string
          description: string | null
          id: string
          published_at: string
          sentiment: string | null
          source: string
          symbols: string[] | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          published_at: string
          sentiment?: string | null
          source: string
          symbols?: string[] | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          published_at?: string
          sentiment?: string | null
          source?: string
          symbols?: string[] | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      model_deployments: {
        Row: {
          config: Json | null
          created_at: string
          deployed_at: string
          id: string
          job_id: string | null
          metrics: Json | null
          status: string
          version: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          deployed_at: string
          id?: string
          job_id?: string | null
          metrics?: Json | null
          status?: string
          version: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          deployed_at?: string
          id?: string
          job_id?: string | null
          metrics?: Json | null
          status?: string
          version?: string
        }
        Relationships: []
      }
      online_learning_logs: {
        Row: {
          created_at: string
          data_points: number
          id: string
          symbols: string[] | null
          timestamp: string
          update_metrics: Json | null
        }
        Insert: {
          created_at?: string
          data_points: number
          id?: string
          symbols?: string[] | null
          timestamp: string
          update_metrics?: Json | null
        }
        Update: {
          created_at?: string
          data_points?: number
          id?: string
          symbols?: string[] | null
          timestamp?: string
          update_metrics?: Json | null
        }
        Relationships: []
      }
      order_book_data: {
        Row: {
          asks: Json
          bids: Json
          created_at: string
          exchange: string
          id: string
          symbol: string
          timestamp: string
        }
        Insert: {
          asks: Json
          bids: Json
          created_at?: string
          exchange: string
          id?: string
          symbol: string
          timestamp: string
        }
        Update: {
          asks?: Json
          bids?: Json
          created_at?: string
          exchange?: string
          id?: string
          symbol?: string
          timestamp?: string
        }
        Relationships: []
      }
      prediction_logs: {
        Row: {
          confidence: number
          created_at: string
          features: Json | null
          id: string
          latency: number
          model_version: string | null
          prediction: number
          symbol: string
          timestamp: string
        }
        Insert: {
          confidence: number
          created_at?: string
          features?: Json | null
          id?: string
          latency: number
          model_version?: string | null
          prediction: number
          symbol: string
          timestamp: string
        }
        Update: {
          confidence?: number
          created_at?: string
          features?: Json | null
          id?: string
          latency?: number
          model_version?: string | null
          prediction?: number
          symbol?: string
          timestamp?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stream_buffers: {
        Row: {
          buffer_data: Json
          id: string
          updated_at: string
        }
        Insert: {
          buffer_data: Json
          id: string
          updated_at?: string
        }
        Update: {
          buffer_data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      tick_data: {
        Row: {
          ask: number | null
          bid: number | null
          created_at: string
          exchange: string
          id: string
          price: number
          spread: number | null
          symbol: string
          timestamp: string
          volume: number
        }
        Insert: {
          ask?: number | null
          bid?: number | null
          created_at?: string
          exchange: string
          id?: string
          price: number
          spread?: number | null
          symbol: string
          timestamp: string
          volume: number
        }
        Update: {
          ask?: number | null
          bid?: number | null
          created_at?: string
          exchange?: string
          id?: string
          price?: number
          spread?: number | null
          symbol?: string
          timestamp?: string
          volume?: number
        }
        Relationships: []
      }
      training_jobs: {
        Row: {
          config: Json | null
          created_at: string
          data_points: number | null
          end_time: string | null
          error_message: string | null
          id: string
          metrics: Json | null
          start_time: string
          status: string
          symbols: string[] | null
          validation_results: Json | null
        }
        Insert: {
          config?: Json | null
          created_at?: string
          data_points?: number | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          metrics?: Json | null
          start_time: string
          status?: string
          symbols?: string[] | null
          validation_results?: Json | null
        }
        Update: {
          config?: Json | null
          created_at?: string
          data_points?: number | null
          end_time?: string | null
          error_message?: string | null
          id?: string
          metrics?: Json | null
          start_time?: string
          status?: string
          symbols?: string[] | null
          validation_results?: Json | null
        }
        Relationships: []
      }
      user_trades: {
        Row: {
          amount: number
          created_at: string
          executed_at: string | null
          id: string
          price: number
          status: string | null
          symbol: string
          trade_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          executed_at?: string | null
          id?: string
          price: number
          status?: string | null
          symbol: string
          trade_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          executed_at?: string | null
          id?: string
          price?: number
          status?: string | null
          symbol?: string
          trade_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      upsert_market_data: {
        Args: {
          p_symbol: string
          p_price: number
          p_change_amount: number
          p_change_percent: number
          p_volume: number
          p_market_cap: number
          p_data_source: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
