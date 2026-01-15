import { createClient } from "@supabase/supabase-js";

// Vite solo expone variables que empiezan con VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificación técnica en la consola del navegador
if (!supabaseUrl || !supabaseUrl.startsWith("http")) {
  console.error(
    "❌ Error Crítico: La URL de Supabase no se está leyendo del archivo .env"
  );
}

export const supabase = createClient(
  supabaseUrl || "https://error-de-configuracion.supabase.co",
  supabaseAnonKey || "sin-key"
);
