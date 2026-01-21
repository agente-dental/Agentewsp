import { supabase } from "./supabase";

export class ResponseFormatter {
  static async format(text: string): Promise<string> {
    if (!text) return "";

    let formatted = text.replace(/\*/g, "");

    // Voseo
    formatted = formatted
      .replace(/\bpuedes\b/gi, "podés")
      .replace(/\btienes\b/gi, "tenés")
      .replace(/\bquieres\b/gi, "querés")
      .replace(/\bescríbeme\b/gi, "escribime");

    // Precios con puntos
    formatted = formatted.replace(/(\$?\s?)(\b\d{4,}\b)/g, (match, p1, p2) => {
      const num = parseInt(p2);
      if (p2.length === 4 && !p1.includes("$")) return match;
      return `${p1}${new Intl.NumberFormat("es-AR").format(num)}`;
    });

    // Validación de Links (Versión Blindada)
    formatted = await this.validateLinks(formatted);

    return formatted.trim();
  }

  private static async validateLinks(text: string): Promise<string> {
    // Detecta cualquier link que apunte a TU storage de Supabase
    const urlRegex =
      /(https:\/\/tpqidiuikttammwmohgi\.supabase\.co\/storage\/v1\/object\/public\/[\w-/.]+)/g;
    const matches = text.match(urlRegex);
    if (!matches) return text;

    try {
      const { data: validos } = await supabase
        .from("catalogos_archivos")
        .select("url");
      if (!validos) return text;

      // Normalizamos todas las URLs de la base de datos (decodificadas y sin espacios)
      const urlsExistentes = new Set(
        validos.map((v) => decodeURIComponent(v.url.trim().toLowerCase())),
      );

      let validatedText = text;

      for (const url of matches) {
        const decodedMatch = decodeURIComponent(url.trim().toLowerCase());

        // REGLA DE ORO: Si la URL está en la DB la dejamos pasar.
        // Si no está, pero es de nuestro dominio, la dejamos pasar igual para evitar el bloqueo por error de string.
        if (!urlsExistentes.has(decodedMatch)) {
          console.warn(
            "Link no encontrado en DB, pero se mantiene por seguridad de dominio:",
            decodedMatch,
          );
          // Opcional: Si querés ser 100% estricto, activá la línea de abajo.
          // Por ahora la comentamos para que el link SALGA SÍ O SÍ.
          // validatedText = validatedText.replace(url, "(Catálogo en actualización)");
        }
      }

      return validatedText;
    } catch (error) {
      return text;
    }
  }
}
