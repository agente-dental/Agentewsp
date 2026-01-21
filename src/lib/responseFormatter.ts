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

    // 3. FORMATEO DE PRECIOS INTELIGENTE (PROTEGE URLs)
    // Buscamos números de 4 o más dígitos
    formatted = formatted.replace(
      /(\$?\s?)(\b\d{4,}\b)/g,
      (match, p1, p2, offset, string) => {
        // REGLA ANTI-ROTURA DE LINKS:
        // Si el número es parte de una URL (contiene supabase o tiene una / antes), NO TOCAR.
        const contextoPrevio = string.slice(Math.max(0, offset - 20), offset);
        const charInmediato = string[offset - 1];

        if (
          contextoPrevio.includes("supabase.co") ||
          charInmediato === "/" ||
          charInmediato === "-" ||
          charInmediato === "."
        ) {
          return match;
        }

        const num = parseInt(p2);
        // Evitamos tocar modelos de 4 dígitos (ej: Fussen 6500) a menos que tengan el signo $
        if (p2.length === 4 && !p1.includes("$")) {
          return match;
        }

        // Formateamos con puntos de mil estilo argentino
        const numFormateado = new Intl.NumberFormat("es-AR").format(num);
        return `${p1}${numFormateado}`;
      },
    );

    // 4. LIMPIEZA DE MULETILLAS
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

    // 6. VALIDACIÓN DE LINKS (Flexible y decodificada)
    formatted = await this.validateLinks(formatted);

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  /**
   * Valida que los links generados por la IA existan en la base de datos o sean de confianza.
   */
  private static async validateLinks(text: string): Promise<string> {
    const urlRegex =
      /(https:\/\/[\w-]+\.supabase\.co\/storage\/v1\/object\/public\/[\w-/.]+)/g;
    const matches = text.match(urlRegex);
    if (!matches) return text;

    try {
      const { data: validos } = await supabase
        .from("catalogos_archivos")
        .select("url");

      if (!validos || validos.length === 0) return text;

      // Normalizamos las URLs existentes (minúsculas y decodificadas)
      const urlsExistentes = new Set(
        validos.map((v) => decodeURIComponent(v.url.trim().toLowerCase())),
      );

      let validatedText = text;

      for (const url of matches) {
        const decodedMatch = decodeURIComponent(url.trim().toLowerCase());

        // Si el link no coincide exactamente, pero es de nuestro dominio,
        // lo dejamos pasar para evitar que el formateo de números lo rompa de nuevo.
        if (!urlsExistentes.has(decodedMatch)) {
          // Solo bloqueamos si realmente no parece ser un link de nuestro storage
          if (!url.includes("supabase.co/storage/v1/object/public/catalogos")) {
            validatedText = validatedText.replace(
              url,
              "(Catálogo en actualización)",
            );
          }
        }
      }

      return validatedText;
    } catch (error) {
      console.error("Error en validación de links:", error);
      return text;
    }
  }
}
