// src/lib/groq.ts
import Groq from "groq-sdk";
import { supabase } from "./supabase";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const chatWithAgente = async (userMessage: string) => {
  try {
    // 1. Obtenemos los productos con sus links de fotos/PDFs
    const { data: productos } = await supabase
      .from("productos")
      .select("nombre, precio, stock, descripcion_tecnica, imagen_url");

    // 2. Formateamos el catálogo para la IA
    const catalogoVisual = productos
      ?.map((p) => {
        const tipoArchivo = p.imagen_url?.toLowerCase().endsWith(".pdf")
          ? "PDF (Manual/Catálogo)"
          : "Imagen/Foto";
        return `- PRODUCTO: ${p.nombre}
        PRECIO: $${p.precio}
        STOCK: ${p.stock}
        INFO: ${p.descripcion_tecnica}
        ARCHIVO (${tipoArchivo}): ${p.imagen_url || "No disponible"}`;
      })
      .join("\n\n");

    // 3. System Prompt: Instrucciones de entrega de archivos
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres el Agente Comercial de "Dental Boss". Tienes acceso directo al inventario y a los archivos del servidor (Bucket).
          
          REGLAS DE INTERACCIÓN:
          1. Si el usuario pregunta por un equipo, descríbelo y OFRECE el link de la foto o PDF.
          2. Si el usuario dice "pásame la foto", "quiero ver el catálogo" o similares, DEBES responder con el link exacto que aparece en el inventario.
          3. IMPORTANTE: Presenta los links de forma limpia, por ejemplo: "Puedes ver la imagen aquí: [URL]".
          4. Si el archivo es un PDF, aclara que es el manual técnico o catálogo detallado.

          CATÁLOGO DISPONIBLE:
          ${catalogoVisual}`,
        },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5, // Menor temperatura para que sea más preciso con los links
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error:", error);
    return "Tuve un problema al conectar con el servidor de archivos.";
  }
};
