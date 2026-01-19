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
      // Intentar con múltiples modelos en orden de preferencia
      const models = [
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
        "llama-3.1-8b-instant",
      ];

      for (const modelName of models) {
        try {
          const responseOff = await groq.chat.completions.create({
            messages: [
              { role: "system", content: AGENTE_PROMPTS.MODO_OFF },
              { role: "user", content: userMessage },
            ],
            model: modelName,
          });
          return responseOff.choices[0].message.content;
        } catch (modelError) {
          console.warn(
            `Modelo ${modelName} falló, intentando siguiente:`,
            modelError,
          );

          // Si es rate limit, esperar y reintentar una vez
          if (
            modelError instanceof Error &&
            modelError.message.includes("rate limit")
          ) {
            try {
              await new Promise((resolve) => setTimeout(resolve, 2000)); // Esperar 2s
              const retryResponse = await groq.chat.completions.create({
                messages: [
                  { role: "system", content: AGENTE_PROMPTS.MODO_OFF },
                  { role: "user", content: userMessage },
                ],
                model: modelName,
              });
              return retryResponse.choices[0].message.content;
            } catch (retryError) {
              console.warn(`Retry falló para ${modelName}:`, retryError);
            }
          }

          continue;
        }
      }
      throw new Error("Todos los modelos fallaron");
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

    // Intentar con múltiples modelos en orden de preferencia
    const models = [
      "llama-3.3-70b-versatile",
      "llama-3.1-70b-versatile",
      "llama-3.1-8b-instant",
    ];

    for (const modelName of models) {
      try {
        // Reducir contexto para modelos más pequeños
        let conocimientoReducido = conocimiento;
        if (
          modelName === "llama-3.1-8b-instant" &&
          conocimiento.length > 3000
        ) {
          conocimientoReducido = conocimiento.substring(0, 3000) + "...";
        }

        const response = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `
                ${AGENTE_PROMPTS.VENTAS_TECNICO(conocimientoReducido)}
                
                🚨 ÓRDENES OPERATIVAS VIGENTES:
                ${instruccionesActivas}
              `,
            },
            { role: "user", content: userMessage },
          ],
          model: modelName,
          temperature: 0.2,
        });
        return response.choices[0].message.content;
      } catch (modelError) {
        console.warn(
          `Modelo ${modelName} falló, intentando siguiente:`,
          modelError,
        );
        continue;
      }
    }
    throw new Error("Todos los modelos fallaron");
  } catch (error) {
    console.error("Error en Agente:", error);

    // Mejor manejo de errores
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return "Error de configuración de la API. Contacte al administrador.";
      } else if (error.message.includes("rate limit")) {
        return "Límite de consultas alcanzado. Espere unos segundos e intente nuevamente.";
      } else if (error.message.includes("Todos los modelos fallaron")) {
        return "Todos los modelos de IA están temporalmente no disponibles. Intente en unos minutos.";
      } else if (error.message.includes("network")) {
        return "Error de conexión. Verifique su internet.";
      }
    }

    return "El servicio de IA está temporalmente indisponible. Intente nuevamente en unos momentos.";
  }
};
