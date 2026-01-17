import Groq from "groq-sdk";
import { supabase } from "./supabase";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const chatWithAgente = async (userMessage: string) => {
  try {
    // 1. Consulta el inventario incluyendo el texto extraído de los archivos
    const { data: productos, error } = await supabase.from("productos").select(`
        nombre, precio, stock, descripcion_tecnica, 
        catalogos_archivos (nombre_archivo, url, texto_extraido)
      `);

    if (error) throw error;

    // 2. Formateamos el conocimiento profundo para la IA
    const conocimientoTecnico = productos
      ?.map((p: any) => {
        const manuales = p.catalogos_archivos
          ?.map(
            (a: any) =>
              `   - DOCUMENTO: ${a.nombre_archivo}
              CONTENIDO TÉCNICO: ${a.texto_extraido?.substring(0, 1500) || "No hay texto extraído disponible."}
              URL: ${a.url}`,
          )
          .join("\n");

        return `PRODUCTO: ${p.nombre}\nINFO GENERAL: ${p.descripcion_tecnica}\nCONOCIMIENTO DE MANUALES:\n${manuales}`;
      })
      .join("\n\n---\n\n");

    // 3. System Prompt: Instrucción de "Lectura Experta"
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres el Asesor Técnico Principal de "Dental Boss".
          
          CAPACIDADES TÉCNICAS:
          1. Tienes acceso al "CONOCIMIENTO DE MANUALES" extraído directamente de los PDFs de los equipos.
          2. Si el usuario pregunta por especificaciones, mantenimiento, voltajes o uso, busca la respuesta en el texto extraído.
          3. IMPORTANTE: Cuando respondas usando un manual, di: "De acuerdo al manual técnico que tengo cargado...".
          4. Siempre proporciona el link del archivo correspondiente para que el usuario pueda verlo.

          BASE de CONOCIMIENTO ACTUALIZADA:
          ${conocimientoTecnico}`,
        },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error IA:", error);
    return "Lo siento, tuve un problema al procesar la información técnica de los manuales.";
  }
};
