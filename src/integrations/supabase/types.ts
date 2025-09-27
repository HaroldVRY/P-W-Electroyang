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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged_by: string | null
          created_at: string | null
          id: string
          kind: string
          message: string
          plant_id: string
          severity: Database["public"]["Enums"]["alert_severity"]
          updated_at: string | null
        }
        Insert: {
          acknowledged_by?: string | null
          created_at?: string | null
          id?: string
          kind: string
          message: string
          plant_id: string
          severity: Database["public"]["Enums"]["alert_severity"]
          updated_at?: string | null
        }
        Update: {
          acknowledged_by?: string | null
          created_at?: string | null
          id?: string
          kind?: string
          message?: string
          plant_id?: string
          severity?: Database["public"]["Enums"]["alert_severity"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_logs: {
        Row: {
          answer: string
          created_at: string | null
          id: string
          question: string
          ts: string | null
          used_context: boolean | null
          user_id: string | null
        }
        Insert: {
          answer: string
          created_at?: string | null
          id?: string
          question: string
          ts?: string | null
          used_context?: boolean | null
          user_id?: string | null
        }
        Update: {
          answer?: string
          created_at?: string | null
          id?: string
          question?: string
          ts?: string | null
          used_context?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      excedentes: {
        Row: {
          consumption_wh: number | null
          created_at: string | null
          excedente_wh: number | null
          generation_wh: number | null
          generator_id: string
          id: string
          ts: string
        }
        Insert: {
          consumption_wh?: number | null
          created_at?: string | null
          excedente_wh?: number | null
          generation_wh?: number | null
          generator_id: string
          id?: string
          ts?: string
        }
        Update: {
          consumption_wh?: number | null
          created_at?: string | null
          excedente_wh?: number | null
          generation_wh?: number | null
          generator_id?: string
          id?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "excedentes_generator_id_fkey"
            columns: ["generator_id"]
            isOneToOne: false
            referencedRelation: "generators"
            referencedColumns: ["id"]
          },
        ]
      }
      faq: {
        Row: {
          a: string
          created_at: string | null
          id: string
          lang: string | null
          q: string
          updated_at: string | null
        }
        Insert: {
          a: string
          created_at?: string | null
          id?: string
          lang?: string | null
          q: string
          updated_at?: string | null
        }
        Update: {
          a?: string
          created_at?: string | null
          id?: string
          lang?: string | null
          q?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      forecasts: {
        Row: {
          created_at: string | null
          energy_pred_mwh: number | null
          horizon_h: number
          id: string
          inflow_pred_m3s: number | null
          plant_id: string
          ts: string
        }
        Insert: {
          created_at?: string | null
          energy_pred_mwh?: number | null
          horizon_h: number
          id?: string
          inflow_pred_m3s?: number | null
          plant_id: string
          ts?: string
        }
        Update: {
          created_at?: string | null
          energy_pred_mwh?: number | null
          horizon_h?: number
          id?: string
          inflow_pred_m3s?: number | null
          plant_id?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecasts_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      generators: {
        Row: {
          battery_eff: number | null
          battery_wh: number | null
          controller_eff: number | null
          created_at: string | null
          id: string
          name: string
          owner_user_id: string
          plant_id: string | null
          reserve_ratio: number | null
          updated_at: string | null
          wp_w: number | null
        }
        Insert: {
          battery_eff?: number | null
          battery_wh?: number | null
          controller_eff?: number | null
          created_at?: string | null
          id?: string
          name: string
          owner_user_id: string
          plant_id?: string | null
          reserve_ratio?: number | null
          updated_at?: string | null
          wp_w?: number | null
        }
        Update: {
          battery_eff?: number | null
          battery_wh?: number | null
          controller_eff?: number | null
          created_at?: string | null
          id?: string
          name?: string
          owner_user_id?: string
          plant_id?: string | null
          reserve_ratio?: number | null
          updated_at?: string | null
          wp_w?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "generators_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "generators_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      hydro_state: {
        Row: {
          created_at: string | null
          energy_mwh: number | null
          gates_pct: number | null
          id: string
          inflow_m3s: number | null
          outflow_m3s: number | null
          plant_id: string
          reservoir_level_m: number | null
          ts: string
          turbine_mw: number | null
        }
        Insert: {
          created_at?: string | null
          energy_mwh?: number | null
          gates_pct?: number | null
          id?: string
          inflow_m3s?: number | null
          outflow_m3s?: number | null
          plant_id: string
          reservoir_level_m?: number | null
          ts?: string
          turbine_mw?: number | null
        }
        Update: {
          created_at?: string | null
          energy_mwh?: number | null
          gates_pct?: number | null
          id?: string
          inflow_m3s?: number | null
          outflow_m3s?: number | null
          plant_id?: string
          reservoir_level_m?: number | null
          ts?: string
          turbine_mw?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hydro_state_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      kiosk_redemptions: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          kiosk_id: string
          ts: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits: number
          id?: string
          kiosk_id: string
          ts?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          kiosk_id?: string
          ts?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kiosk_redemptions_kiosk_id_fkey"
            columns: ["kiosk_id"]
            isOneToOne: false
            referencedRelation: "kiosks"
            referencedColumns: ["id"]
          },
        ]
      }
      kiosks: {
        Row: {
          created_at: string | null
          id: string
          inventory_powerbanks: number | null
          lat: number | null
          location_text: string
          lon: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_powerbanks?: number | null
          lat?: number | null
          location_text: string
          lon?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_powerbanks?: number | null
          lat?: number | null
          location_text?: string
          lon?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      plants: {
        Row: {
          created_at: string | null
          id: string
          lat: number | null
          location_text: string
          lon: number | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lat?: number | null
          location_text: string
          lon?: number | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lat?: number | null
          location_text?: string
          lon?: number | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sensors: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          kind: Database["public"]["Enums"]["sensor_kind"]
          plant_id: string
          unit: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          kind: Database["public"]["Enums"]["sensor_kind"]
          plant_id: string
          unit: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          kind?: Database["public"]["Enums"]["sensor_kind"]
          plant_id?: string
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensors_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry: {
        Row: {
          co2_ppm: number | null
          created_at: string | null
          humidity_pct: number | null
          id: string
          nox_ppm: number | null
          pm25_ug_m3: number | null
          sensor_id: string
          temp_c: number | null
          ts: string
        }
        Insert: {
          co2_ppm?: number | null
          created_at?: string | null
          humidity_pct?: number | null
          id?: string
          nox_ppm?: number | null
          pm25_ug_m3?: number | null
          sensor_id: string
          temp_c?: number | null
          ts?: string
        }
        Update: {
          co2_ppm?: number | null
          created_at?: string | null
          humidity_pct?: number | null
          id?: string
          nox_ppm?: number | null
          pm25_ug_m3?: number | null
          sensor_id?: string
          temp_c?: number | null
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_sensor_id_fkey"
            columns: ["sensor_id"]
            isOneToOne: false
            referencedRelation: "sensors"
            referencedColumns: ["id"]
          },
        ]
      }
      tips: {
        Row: {
          audience: string | null
          body: string
          created_at: string | null
          id: string
          tag: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          audience?: string | null
          body: string
          created_at?: string | null
          id?: string
          tag?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          audience?: string | null
          body?: string
          created_at?: string | null
          id?: string
          tag?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          client_tx_id: string
          created_at: string | null
          credits: number
          from_user: string | null
          id: string
          proof_hash: string | null
          source: string | null
          to_user: string | null
          ts: string | null
        }
        Insert: {
          client_tx_id: string
          created_at?: string | null
          credits: number
          from_user?: string | null
          id?: string
          proof_hash?: string | null
          source?: string | null
          to_user?: string | null
          ts?: string | null
        }
        Update: {
          client_tx_id?: string
          created_at?: string | null
          credits?: number
          from_user?: string | null
          id?: string
          proof_hash?: string | null
          source?: string | null
          to_user?: string | null
          ts?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance_credits: number | null
          created_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance_credits?: number | null
          created_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance_credits?: number | null
          created_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_wallet_balance: {
        Args: { p_credits: number; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_wallet_balance: {
        Args: { p_credits: number; p_user_id: string }
        Returns: boolean
      }
      is_admin_or_operator: {
        Args: { _user_id: string }
        Returns: boolean
      }
      process_credits_settlement: {
        Args: {
          p_consumption_wh: number
          p_credits_awarded: number
          p_excedente_wh: number
          p_generation_wh: number
          p_generator_id: string
          p_owner_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_severity: "info" | "warning" | "critical"
      app_role: "admin" | "operator" | "generator" | "consumer" | "kiosk"
      sensor_kind: "CO2" | "NOx" | "PM25" | "TEMP" | "HUM"
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
      alert_severity: ["info", "warning", "critical"],
      app_role: ["admin", "operator", "generator", "consumer", "kiosk"],
      sensor_kind: ["CO2", "NOx", "PM25", "TEMP", "HUM"],
    },
  },
} as const
