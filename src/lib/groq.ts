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
    // 1. OBTENER LINKS QUE EXISTEN REALMENTE
    const { data: archivos } = await supabase
      .from("catalogos_archivos")
      .select("url, producto_id");
    const urlsValidas = new Set(archivos?.map((a) => a.url) || []);

    // 2. OBTENER PRODUCTOS Y ÓRDENES
    const [prodRes, ordenesRes] = await Promise.all([
      supabase
        .from("productos")
        .select("nombre, precio, stock, descripcion_tecnica"),
      supabase.from("ordenes_diarias").select("contenido").eq("activa", true),
    ]);

    // 3. CONSTRUCCIÓN DE CONOCIMIENTO ULTRA-PRECISO
    const conocimiento =
      prodRes.data
        ?.map((p) => {
          // Buscamos el link solo si coincide con este producto y existe en storage
          const linkProducto = archivos?.find(
            (a) => a.producto_id === (p as any).id && urlsValidas.has(a.url),
          )?.url;

          return `
PRODUCTO: ${p.nombre}
PRECIO: ${p.precio || "Consultar"}
INFO: ${p.descripcion_tecnica}
LINK: ${linkProducto || "SIN_CATALOGO_DISPONIBLE"}
-------------------`;
        })
        .join("\n") || "";

    const instruccionesDia =
      ordenesRes.data?.map((o) => `- ${o.contenido}`).join("\n") || "";

    if (!agenteActivo) return AGENTE_PROMPTS.MODO_OFF;

    // 4. PROMPT CON REGLAS ANTI-ALUCINACIÓN
    const systemPrompt = `
${AGENTE_PROMPTS.VENTAS_TECNICO(conocimiento)}

REGLAS ESTRICTAS:
- Si el usuario pregunta precio, fijate en la lista. Si dice "Consultar", pedile el contacto.
- Si un producto dice "SIN_CATALOGO_DISPONIBLE", no pongas ningún link.
- NO menciones el Fussen si te preguntan por Resina, sé específico.
- Tu nombre es Asesor de Evolución Dental (NUNCA Dental Boss).

ÓRDENES DEL DÍA:
${instruccionesDia}
    `.trim();

    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.1, // Mínima creatividad para evitar inventos
    });

    const rawContent = response.choices[0].message.content || "";
    return await ResponseFormatter.format(rawContent);
  } catch (error) {
    console.error("Error:", error);
    return "Che, se me complicó la conexión. ¿Me preguntás de nuevo?";
  }
};
