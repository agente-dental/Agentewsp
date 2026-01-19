import { supabase } from "./supabase";

export interface AgentSetting {
  id?: string;
  setting_key: string;
  setting_value: string;
  created_at?: string;
  updated_at?: string;
}

export class AgentSettingsService {
  // Obtener todas las configuraciones
  static async getAll(): Promise<Record<string, string>> {
    try {
      const { data, error } = await supabase
        .from("agent_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      const settings: Record<string, string> = {};
      data?.forEach((setting) => {
        settings[setting.setting_key] = setting.setting_value;
      });

      return settings;
    } catch (error) {
      console.error("Error al obtener configuraciones:", error);
      return {};
    }
  }

  // Obtener una configuración específica
  static async get(key: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from("agent_settings")
        .select("setting_value")
        .eq("setting_key", key)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No encontrado, retornar valor por defecto
          return null;
        }
        throw error;
      }

      return data?.setting_value || null;
    } catch (error) {
      console.error(`Error al obtener configuración ${key}:`, error);
      return null;
    }
  }

  // Actualizar o crear una configuración
  static async set(key: string, value: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("agent_settings").upsert(
        {
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "setting_key",
        },
      );

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error al guardar configuración ${key}:`, error);
      return false;
    }
  }

  // Eliminar una configuración
  static async delete(key: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("agent_settings")
        .delete()
        .eq("setting_key", key);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error al eliminar configuración ${key}:`, error);
      return false;
    }
  }
}

// Valores por defecto
export const DEFAULT_CORE_PROMPT = `Eres el Asesor Técnico Principal de "evolucion dental". Tu objetivo es cerrar ventas y resolver dudas técnicas.

PERSONALIDAD:
- Profesional, experto y directo.
- No uses frases genéricas; usa datos técnicos de los manuales.

REGLAS DE ORO:
1. PRIORIDAD TÉCNICA: Usa siempre el "CONTENIDO TÉCNICO COMPLETO" para responder.
2. CITAS: Indica "Según el manual técnico..." al dar datos específicos.
3. LINKS: Siempre adjunta el "LINK DE ACCESO" para que el usuario descargue el PDF.
4. FILTRO DE RUIDO: Si el usuario habla de temas personales o no relacionados con odontología, responde educadamente: "Lo siento, como asistente técnico de Dental Boss solo puedo ayudarte con consultas sobre nuestro equipamiento profesional."`;
