import Groq from "groq-sdk";
import { supabase } from "./supabase";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const chatWithAgente = async (userMessage: string) => {
  try {
    // 1. Extraemos los datos frescos de la base de datos (Usando tus nuevas columnas)
    const { data: productos, error: dbError } = await supabase
      .from("productos")
      .select(
        "nombre, precio, stock, categoria, descripcion_tecnica, imagen_url",
      );

    if (dbError) throw dbError;

    // 2. Creamos el contexto de inventario para la IA
    const inventarioContexto = productos
      ?.map(
        (p) =>
          `- ${p.nombre} (${p.categoria}): Precio $${p.precio}, Stock ${p.stock} unidades. Ficha: ${p.descripcion_tecnica}. Imagen: ${p.imagen_url || "No disponible"}`,
      )
      .join("\n");

    // 3. Llamada a Groq con el MODELO ACTUALIZADO
    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Eres el Asistente Experto de "Dental Boss". Tu objetivo es asesorar a odontólogos y vender equipos de alta gama.
          
          REGLAS DE ORO:
          1. Usa el siguiente inventario REAL para responder. Si no ves un producto aquí, di que no está disponible.
          2. Si el cliente pregunta por stock o precio, sé exacto según la lista.
          3. Si mencionas un producto que tiene imagen, puedes compartir el link.
          4. Tono: Profesional, tecnológico y servicial.

          INVENTARIO ACTUAL:
          ${inventarioContexto}`,
        },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.3-70b-versatile", // <--- MODELO ACTUALIZADO Y POTENTE
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error: any) {
    console.error("Error en el Agente:", error);

    // Si el modelo versátil falla por cuotas, intentamos con el instant (más rápido)
    if (error.status === 413 || error.status === 400) {
      return "Estoy actualizando mi base de datos de precios. Por favor, pregúntame de nuevo en un momento.";
    }

    return "Lo siento, tuve un problema al consultar el catálogo. ¿Podrías repetir la pregunta?";
  }
};
