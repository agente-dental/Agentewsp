import Groq from "groq-sdk";
import { supabase } from "./supabase";
import { AGENTE_PROMPTS } from "./prompt.ts";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const chatWithAgente = async (
  userMessage: string,
  agenteActivo: boolean = true,
) => {
  try {
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

    // Traemos Productos + Órdenes Activas en paralelo
    const [prodRes, ordenesRes] = await Promise.all([
      supabase.from("productos").select(`
        nombre, precio, stock, descripcion_tecnica, 
        catalogos_archivos (nombre_archivo, url, texto_extraido)
      `),
      supabase.from("ordenes_diarias").select("contenido").eq("activa", true),
    ]);

    const conocimiento: string =
      prodRes.data
        ?.map((p: any) => {
          const manuales = p.catalogos_archivos
            ?.map(
              (a: any) =>
                `### DOC: ${a.nombre_archivo} | TEXTO: ${a.texto_extraido || "No disponible"} | LINK: ${a.url}`,
            )
            .join("\n");
          return `EQUIPO: ${p.nombre}\nPRECIO: ${p.precio}\nSTOCK: ${p.stock}\nINFO: ${p.descripcion_tecnica}\n${manuales}`;
        })
        .join("\n\n") ?? "";

    const instruccionesActivas: string =
      ordenesRes.data?.map((o) => `• ${o.contenido}`).join("\n") ??
      "No hay órdenes activas.";

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
            ${AGENTE_PROMPTS.VENTAS_TECNICO(conocimiento)}
            
            🚨 ÓRDENES OPERATIVAS VIGENTES:
            ${instruccionesActivas}
          `,
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
