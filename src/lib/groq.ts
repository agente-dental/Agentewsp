import Groq from "groq-sdk";
import { supabase } from "./supabase";
import { AGENTE_PROMPTS } from "./prompt";
import { ResponseFormatter } from "./responseFormatter";

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const chatWithAgente = async (
  userMessage: string,
  agenteActivo: boolean = true,
) => {
  try {
    // 1. OBTENER LINKS QUE EXISTEN REALMENTE EN LA TABLA DE ARCHIVOS
    const { data: archivos } = await supabase
      .from("catalogos_archivos")
      .select("url, producto_id");

    const urlsValidas = new Set(archivos?.map((a) => a.url) || []);

    // 2. OBTENER PRODUCTOS (CORREGIDO: Incluimos 'id' para poder vincular con archivos)
    const [prodRes, ordenesRes] = await Promise.all([
      supabase
        .from("productos")
        .select("id, nombre, precio, stock, descripcion_tecnica"), // <--- ID AGREGADO AQUÍ
      supabase.from("ordenes_diarias").select("contenido").eq("activa", true),
    ]);

    // 3. CONSTRUCCIÓN DE CONOCIMIENTO PARA LA IA
    const conocimiento =
      prodRes.data
        ?.map((p) => {
          // Buscamos el link comparando el ID del producto con el producto_id del archivo
          const archivoEncontrado = archivos?.find(
            (a) => a.producto_id === p.id && urlsValidas.has(a.url),
          );

          const linkProducto = archivoEncontrado?.url;

          // Formateamos el precio para que la IA ya lo tenga listo
          const precioFormateado = p.precio
            ? new Intl.NumberFormat("es-AR").format(p.precio)
            : "Consultar";

          return `
PRODUCTO: ${p.nombre}
PRECIO: $${precioFormateado}
INFO: ${p.descripcion_tecnica}
LINK: ${linkProducto || "SIN_CATALOGO_DISPONIBLE"}
-------------------`;
        })
        .join("\n") || "";

    const instruccionesDia =
      ordenesRes.data?.map((o) => `- ${o.contenido}`).join("\n") || "";

    if (!agenteActivo) return AGENTE_PROMPTS.MODO_OFF;

    // 4. CONFIGURACIÓN DEL SISTEMA CON LAS REGLAS DE EVOLUCIÓN DENTAL
    const systemPrompt = `
${AGENTE_PROMPTS.VENTAS_TECNICO(conocimiento)}

REGLAS ESTRICTAS:
- Si el usuario pregunta precio, fijate en la lista. Si dice "Consultar", pedile el contacto de forma amable.
- Si un producto dice "SIN_CATALOGO_DISPONIBLE", explicá que el catálogo se está actualizando.
- NO menciones marcas de la competencia, solo Fussen y Ultradent.
- Tu nombre es Asesor de Evolución Dental.

ÓRDENES DEL DÍA:
${instruccionesDia}
    `.trim();

    // 5. LLAMADA A LA IA
    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2, // Un poco de creatividad pero manteniendo precisión técnica
    });

    // 6. FORMATEO FINAL (Puntos de mil, voseo, limpieza de asteriscos y validación de links)
    return await ResponseFormatter.format(
      response.choices[0].message.content || "",
    );
  } catch (error) {
    console.error("Error en el motor del agente:", error);
    return "Disculpame, tuve un problemita técnico al procesar tu consulta. ¿Podrás repetirme la pregunta?";
  }
};
