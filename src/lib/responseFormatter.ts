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

    // 3. FORMATEO DE PRECIOS CON EXCLUSIÓN TOTAL DE URLS
    // Buscamos números de 4 o más dígitos
    formatted = formatted.replace(
      /(\$?\s?)(\b\d{4,}\b)/g,
      (match, p1, p2, offset, string) => {
        // Capturamos el contexto anterior para verificar si es una URL
        const contextoPrevio = string.slice(Math.max(0, offset - 50), offset);

        // SI EL NÚMERO ES PARTE DE TU STORAGE, NO LO TOCAMOS BAJO NINGÚN CONCEPTO
        if (
          contextoPrevio.includes("supabase.co") ||
          contextoPrevio.includes("public/catalogos") ||
          contextoPrevio.includes("/")
        ) {
          return match;
        }

        const num = parseInt(p2);
        // Ignorar modelos de 4 dígitos sin signo $
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

    // 5. VALIDACIÓN DE LINKS (Liberación total para tu dominio)
    formatted = await this.validateLinks(formatted);

    return formatted.trim();
  }

  private static async validateLinks(text: string): Promise<string> {
    // Regex específica para tu proyecto
    const urlRegex =
      /(https:\/\/tpqidiuikttammwmohgi\.supabase\.co\/storage\/v1\/object\/public\/[\w-/.]+)/g;
    const matches = text.match(urlRegex);
    if (!matches) return text;

    let validatedText = text;
    for (const url of matches) {
      // Si el link pertenece a tu proyecto, se entrega TAL CUAL, sin filtros adicionales
      // Esto evita que cualquier lógica de validación lo rompa por error de string
      if (url.includes("tpqidiuikttammwmohgi.supabase.co")) {
        continue;
      } else {
        // Solo para links externos sospechosos
        validatedText = validatedText.replace(url, "(Link en revisión)");
      }
    }
    return validatedText;
  }
}
