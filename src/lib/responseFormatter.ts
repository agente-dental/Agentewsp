import { supabase } from "./supabase";

export class ResponseFormatter {
  static async format(text: string): Promise<string> {
    if (!text) return "";

    // 1. LIMPIEZA DE SÍMBOLOS
    let formatted = text.replace(/\*/g, "");

    // 2. VOSEO ARGENTINO
    formatted = formatted
      .replace(/\bpuedes\b/gi, "podés")
      .replace(/\btienes\b/gi, "tenés")
      .replace(/\bquieres\b/gi, "querés")
      .replace(/\bescríbeme\b/gi, "escribime");

    // 3. FORMATEO DE PRECIOS CON PROTECCIÓN TOTAL DE URLS
    // Esta regex identifica números largos pero verifica que NO sean parte de un link
    formatted = formatted.replace(
      /(\$?\s?)(\b\d{4,}\b)/g,
      (match, p1, p2, offset, string) => {
        // Miramos qué hay antes y después del número
        const contextoPrevio = string.slice(Math.max(0, offset - 25), offset);
        const contextoPosterior = string.slice(
          offset + p2.length,
          offset + p2.length + 10,
        );

        // Si el número es parte de una URL de Supabase o una ruta de archivo, lo ignoramos
        if (
          contextoPrevio.includes("supabase.co") ||
          contextoPrevio.includes("/") ||
          contextoPosterior.includes(".pdf") ||
          contextoPosterior.includes("/")
        ) {
          return match;
        }

        const num = parseInt(p2);
        // Evitamos tocar modelos (ej: 6500) si no tienen el signo $
        if (p2.length === 4 && !p1.includes("$")) {
          return match;
        }

        return `${p1}${new Intl.NumberFormat("es-AR").format(num)}`;
      },
    );

    // 4. LIMPIEZA DE MULETILLAS
    formatted = formatted.replace(
      /según el manual técnico,?|según el catálogo,?/gi,
      "",
    );

    // 5. VALIDACIÓN DE LINKS
    formatted = await this.validateLinks(formatted);

    return formatted.trim();
  }

  private static async validateLinks(text: string): Promise<string> {
    const urlRegex =
      /(https:\/\/tpqidiuikttammwmohgi\.supabase\.co\/storage\/v1\/object\/public\/[\w-/.]+)/g;
    const matches = text.match(urlRegex);
    if (!matches) return text;

    try {
      const { data: validos } = await supabase
        .from("catalogos_archivos")
        .select("url");
      const urlsExistentes = new Set(validos?.map((v) => v.url.trim()) || []);

      let validatedText = text;
      for (const url of matches) {
        // Si el link es de tu storage, lo dejamos pasar SÍ O SÍ.
        // Solo lo bloqueamos si NO pertenece a tu dominio de Supabase.
        if (!url.includes("tpqidiuikttammwmohgi.supabase.co")) {
          validatedText = validatedText.replace(
            url,
            "(Catálogo en actualización)",
          );
        }
      }
      return validatedText;
    } catch {
      return text;
    }
  }
}
