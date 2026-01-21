import { supabase } from "./supabase";

export class ResponseFormatter {
  /**
   * Procesa la respuesta de la IA para hacerla humana, argentina y profesional.
   */
  static async format(text: string): Promise<string> {
    if (!text) return "";

    // 1. ELIMINACIÓN DE ASTERISCOS
    let formatted = text.replace(/\*/g, "");

    // 2. VOSEO ARGENTINO
    formatted = formatted
      .replace(/\bpuedes\b/gi, "podés")
      .replace(/\btienes\b/gi, "tenés")
      .replace(/\bquieres\b/gi, "querés")
      .replace(/\bescríbeme\b/gi, "escribime")
      .replace(/\bsabías\b/gi, "sabías")
      .replace(/\bconoce\b/gi, "conocé");

    // 3. FORMATEO DE PRECIOS INTELIGENTE (Puntos de mil)
    formatted = formatted.replace(/(\$?\s?)(\b\d{4,}\b)/g, (match, p1, p2) => {
      const num = parseInt(p2);
      // Evitamos tocar modelos de 4 dígitos (como 6500) a menos que tengan el signo $
      if (p2.length === 4 && !p1.includes("$")) {
        return match;
      }
      return `${p1}${new Intl.NumberFormat("es-AR").format(num)}`;
    });

    // 4. LIMPIEZA DE MULETILLAS ROBÓTICAS
    const muletillas = [
      /según el manual técnico,?/gi,
      /según el catálogo,?/gi,
      /de acuerdo al manual,?/gi,
      /en el manual se menciona que/gi,
    ];
    muletillas.forEach((regex) => {
      formatted = formatted.replace(regex, "");
    });

    // 5. LIMPIEZA DE ESPACIOS
    formatted = formatted.trim().replace(/\n{3,}/g, "\n\n");

    // 6. VALIDACIÓN DE LINKS (Decodificada para evitar falsos bloqueos)
    formatted = await this.validateLinks(formatted);

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  /**
   * Valida que los links generados por la IA existan en la base de datos.
   */
  private static async validateLinks(text: string): Promise<string> {
    const urlRegex =
      /(https:\/\/[\w-]+\.supabase\.co\/storage\/v1\/object\/public\/[\w-/.]+)/g;
    const matches = text.match(urlRegex);
    if (!matches) return text;

    try {
      // Obtenemos los links válidos de la DB
      const { data: validos } = await supabase
        .from("catalogos_archivos")
        .select("url");

      if (!validos || validos.length === 0) return text;

      // Creamos un Set de URLs decodificadas para una comparación precisa
      const urlsExistentes = new Set(
        validos.map((v) => decodeURIComponent(v.url.trim())),
      );

      let validatedText = text;

      for (const url of matches) {
        const decodedMatch = decodeURIComponent(url.trim());

        // Si el link no está en nuestra lista de "existentes", aplicamos la red de seguridad
        if (!urlsExistentes.has(decodedMatch)) {
          validatedText = validatedText.replace(
            url,
            "(Catálogo en actualización)",
          );
        }
      }

      return validatedText;
    } catch (error) {
      console.error("Error validando links:", error);
      return text;
    }
  }
}
