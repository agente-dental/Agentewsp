import Groq from "groq-sdk";
import { supabase } from "./supabase";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const chatWithAgente = async (userMessage: string) => {
  try {
    // 1. Obtención de datos técnicos completos de la base de datos
    const { data: productos, error } = await supabase.from("productos").select(`
        nombre, precio, stock, descripcion_tecnica, 
        catalogos_archivos (nombre_archivo, url, texto_extraido)
      `);

    if (error) throw error;

    // 2. Construcción de la Base de Conocimiento enriquecida
    const conocimientoTecnico = productos
      ?.map((p: any) => {
        const manuales = p.catalogos_archivos
          ?.map(
            (a: any) =>
              `### DOCUMENTO: ${a.nombre_archivo}
               CONTENIDO TÉCNICO COMPLETO: ${a.texto_extraido || "Contenido no disponible para lectura directa."}
               LINK DE ACCESO: ${a.url}`,
          )
          .join("\n\n");

        return `---
PRODUCTO: ${p.nombre}
DESCRIPCIÓN COMERCIAL: ${p.descripcion_tecnica}
DETALLES TÉCNICOS EXTRAÍDOS (HASTA 40 PÁGINAS):
${manuales || "No hay manuales adjuntos para este equipo."}`;
      })
      .join("\n\n");

    // 3. Configuración del Agente con prioridad en datos extraídos
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres el Asesor Técnico Principal de "Dental Boss". Tu función es resolver dudas complejas sobre equipos odontológicos basándote en sus manuales oficiales.
          
          REGLAS DE RESPUESTA:
          1. PRIORIDAD: Ante dudas sobre especificaciones, mantenimiento o uso, DEBES buscar la respuesta en los "DETALLES TÉCNICOS EXTRAÍDOS".
          2. CITAS: Si la información proviene de un manual, indícalo claramente: "Según la ficha técnica del equipo...".
          3. ACCESO: Proporciona siempre el "LINK DE ACCESO" del documento para que el usuario pueda validarlo.
          4. HONESTIDAD: Si un dato técnico no figura en el texto extraído, no lo inventes; sugiere al usuario revisar el manual completo mediante el link.

          BASE DE CONOCIMIENTO TÉCNICA:
          ${conocimientoTecnico}`,
        },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2, // Temperatura baja para máxima precisión técnica
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error en Agente Dental:", error);
    return "Tuve un problema al procesar los catálogos técnicos. Intenta de nuevo en unos instantes.";
  }
};
