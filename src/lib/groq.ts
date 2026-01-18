import Groq from "groq-sdk";
import { supabase } from "./supabase";
import { AGENTE_PROMPTS } from "./prompt.ts"; // Importamos la personalidad

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Añadimos el parámetro agenteActivo para controlar el botón ON/OFF
export const chatWithAgente = async (
  userMessage: string,
  agenteActivo: boolean = true,
) => {
  try {
    // 1. Si el agente está apagado, devolvemos el mensaje de MODO_OFF sin gastar tokens de conocimiento
    if (!agenteActivo) {
      const responseOff = await groq.chat.completions.create({
        messages: [
          { role: "system", content: AGENTE_PROMPTS.MODO_OFF },
          { role: "user", content: userMessage },
        ],
        model: "llama-3.3-70b-versatile",
      });
      return responseOff.choices[0].message.content;
    }

    // 2. Obtención de datos técnicos de Supabase (Core estable)
    const { data: productos, error } = await supabase.from("productos").select(`
        nombre, precio, stock, descripcion_tecnica, 
        catalogos_archivos (nombre_archivo, url, texto_extraido)
      `);

    if (error) throw error;

    const conocimientoTecnico = productos
      ?.map((p: any) => {
        const manuales = p.catalogos_archivos
          ?.map(
            (a: any) =>
              `### DOC: ${a.nombre_archivo} | TEXTO: ${a.texto_extraido || "No disponible"} | LINK: ${a.url}`,
          )
          .join("\n");
        return `EQUIPO: ${p.nombre}\nINFO: ${p.descripcion_tecnica}\n${manuales}`;
      })
      .join("\n\n");

    // 3. Llamada a Groq usando la personalidad de prompts.ts
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: AGENTE_PROMPTS.VENTAS_TECNICO(conocimientoTecnico),
        },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error en Agente:", error);
    return "Error técnico en el servicio de IA.";
  }
};
