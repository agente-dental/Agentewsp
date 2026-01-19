-- Crear tabla agent_settings en Supabase
CREATE TABLE IF NOT EXISTS agent_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar valores iniciales
INSERT INTO agent_settings (setting_key, setting_value) VALUES 
  ('core_prompt', 'Eres el Asesor Técnico Principal de "evolucion dental". Tu objetivo es cerrar ventas y resolver dudas técnicas.') 
ON CONFLICT (setting_key) DO NOTHING;
