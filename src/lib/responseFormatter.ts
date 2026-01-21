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

    // 3. FORMATEO DE PRECIOS INTELIGENTE
    // Regla A: Números de 5 o más dígitos (evita modelos de 4 dígitos como 6500)
    // Regla B: Números precedidos por $ (formatea aunque sean pocos dígitos)
    // Regla C: Ignora si es parte de una URL o extensión de archivo
    formatted = formatted.replace(/(\$?\s?)(\b\d{4,}\b)/g, (match, p1, p2) => {
      const num = parseInt(p2);

      // Si tiene 4 dígitos y NO tiene el signo $, asumimos que es un modelo (ej: 6500) y no tocamos
      if (p2.length === 4 && !p1.includes("$")) {
        return match;
      }

      // Formateamos con puntos de mil
      const numFormateado = new Intl.NumberFormat("es-AR").format(num);
      return `${p1}${numFormateado}`;
    });

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

    // 6. VALIDACIÓN DE LINKS
    formatted = await this.validateLinks(formatted);

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  private static async validateLinks(text: string): Promise<string> {
    const urlRegex =
      /(https:\/\/[\w-]+\.supabase\.co\/storage\/v1\/object\/public\/[\w-/.]+)/g;
    const matches = text.match(urlRegex);
    if (!matches) return text;

    let validatedText = text;
    const { data: validos } = await supabase
      .from("catalogos_archivos")
      .select("url");
    const urlsExistentes = validos?.map((v) => v.url) || [];

    for (const url of matches) {
      if (!urlsExistentes.includes(url)) {
        validatedText = validatedText.replace(
          url,
          "(Catálogo en actualización)",
        );
      }
    }
    return validatedText;
  }
}
