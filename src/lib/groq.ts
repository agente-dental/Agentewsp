import Groq from "groq-sdk";
import { supabase } from "./supabase";

// Verificamos la API Key desde las variables de entorno de Vite
const apiKey = import.meta.env.VITE_GROQ_API_KEY;

// Inicializamos el cliente de Groq
const groq = new Groq({
  apiKey: apiKey || "",
  dangerouslyAllowBrowser: true, // Necesario para que funcione en el Dashboard
});

/**
 * Función principal para que el Agente IA procese consultas.
 * Utiliza el catálogo de Supabase como contexto y la personalidad del agent.md.
 */
export const chatWithAgente = async (userMessage: string) => {
  if (!apiKey) {
    console.error("Falta VITE_GROQ_API_KEY en el archivo .env");
    return "⚠️ Error: La API Key de Groq no está configurada.";
  }

  try {
    // 1. Obtener los productos reales de Supabase (Sillones, Scanners, Equipamiento)
    const { data: productos, error } = await supabase
      .from("productos")
      .select("*");

    if (error) throw error;

    // 2. Formatear el catálogo para el contexto de la IA
    const contextoCatalogo = productos
      ?.map(
        (p) =>
          `- ${p.nombre} (SKU: ${p.sku}): $${p.precio_venta}. ` +
          `Stock Local: ${p.stock_local}, Stock Mayorista: ${p.stock_mayorista}. ` +
          `Especificaciones: ${p.descripcion_tecnica}`
      )
      .join("\n");

    // 3. Prompt del Sistema (Basado en tu agent.md)
    const systemPrompt = `
      Eres el AGENTE IA EXPERTO de una distribuidora dental de alta gama.
      
      OBJETIVO:
      Asesorar a odontólogos sobre el catálogo y cerrar ventas o agendar demos.

      REGLAS DE ORO (AGENT.MD):
      1. PRIORIDAD DE STOCK: Si 'Stock Local' > 0, ofrece "Entrega inmediata". 
         Si es 0 pero 'Stock Mayorista' > 0, ofrece "Bajo pedido (48-72hs)".
      2. SENTIDO DE URGENCIA: Si el stock local es <= 5, menciona sutilmente que son las últimas unidades.
      3. PRECIOS: Si el precio es $0, NO lo menciones; solicita datos de contacto para un presupuesto formal.
      4. TONO: Ejecutivo, técnico y resolutivo. Evita respuestas excesivamente largas.
      5. PILARES: Conocimiento profundo en Sillones (ergonomía), Scanners (precisión) y Equipamiento.

      CATÁLOGO ACTUALIZADO EN TIEMPO REAL:
      ${contextoCatalogo}
    `;

    // 4. Llamada a la API de Groq
    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.3-70b-versatile", // Modelo optimizado para velocidad y precisión
      temperature: 0.5, // Balance entre creatividad y precisión técnica
    });

    return (
      response.choices[0].message.content ||
      "No tengo una respuesta clara para eso."
    );
  } catch (error: any) {
    console.error("Error en el Agente Groq:", error);
    return "Lo siento, el sistema de inteligencia de ventas está temporalmente fuera de línea. Revisa la consola.";
  }
};
