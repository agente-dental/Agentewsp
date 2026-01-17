import Groq from "groq-sdk";
import { supabase } from "./supabase";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const chatWithAgente = async (userMessage: string) => {
  try {
    // 1. Consulta expandida para traer productos y sus múltiples archivos asociados
    const { data: productos, error } = await supabase.from("productos").select(`
        nombre, 
        precio, 
        stock, 
        descripcion_tecnica, 
        catalogos_archivos (nombre_archivo, url)
      `);

    if (error) throw error;

    // 2. Formateo del contexto para la IA
    const catalogoContexto = productos
      ?.map((p: any) => {
        const archivos =
          p.catalogos_archivos && p.catalogos_archivos.length > 0
            ? p.catalogos_archivos
                .map(
                  (a: any) =>
                    `   - ARCHIVO: ${a.nombre_archivo} | LINK: ${a.url}`,
                )
                .join("\n")
            : "   - No hay archivos adicionales para este equipo.";

        return `PRODUCTO: ${p.nombre}
PRECIO: $${p.precio}
STOCK: ${p.stock}
INFO TÉCNICA: ${p.descripcion_tecnica}
DOCUMENTOS Y LINKS DISPONIBLES:
${archivos}`;
      })
      .join("\n\n---\n\n");

    // 3. Llamada a Groq con instrucciones precisas de entrega
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres el Asesor Experto de "Dental Boss". 
          
          REGLAS DE ARCHIVOS:
          1. Tienes una lista de archivos reales por cada producto bajo "DOCUMENTOS Y LINKS DISPONIBLES".
          2. Si el usuario pide un catálogo, foto o manual, DEBES proporcionar el link exacto que aparece en la lista.
          3. No inventes URLs. Usa solo las proporcionadas.
          4. Si un equipo tiene varios archivos, menciónalos todos para que el usuario elija.

          INVENTARIO ACTUALIZADO:
          ${catalogoContexto}`,
        },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error en el Agente:", error);
    return "Lo siento, tuve un problema al consultar el catálogo de archivos.";
  }
};
