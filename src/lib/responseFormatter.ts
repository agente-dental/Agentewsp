import { supabase } from "./supabase";

export class ResponseFormatter {
  /**
   * Procesa la respuesta de la IA para hacerla humana, argentina y segura.
   */
  static async format(text: string): Promise<string> {
    if (!text) return "";

    // 1. ELIMINACIÓN DE ASTERISCOS (Formato no humano)
    let formatted = text.replace(/\*/g, "");

    // 2. VOSEO ARGENTINO (Corrección de neutralismos)
    formatted = formatted
      .replace(/\bpuedes\b/gi, "podés")
      .replace(/\btienes\b/gi, "tenés")
      .replace(/\bquieres\b/gi, "querés")
      .replace(/\bescríbeme\b/gi, "escribime")
      .replace(/\bsabías\b/gi, "sabías")
      .replace(/\bconoce\b/gi, "conocé");

    // 3. ELIMINACIÓN DE MULETILLAS (Seguridad técnica)
    const muletillas = [
      /según el manual técnico,?/gi,
      /según el catálogo,?/gi,
      /de acuerdo al manual,?/gi,
      /como indica el catálogo,?/gi,
      /en el manual se menciona que/gi,
    ];
    muletillas.forEach((regex) => {
      formatted = formatted.replace(regex, "");
    });

    // 4. LIMPIEZA DE ESPACIOS Y SALTOS
    formatted = formatted.trim().replace(/\n{3,}/g, "\n\n");

    // 5. VALIDACIÓN DE LINKS (Previene el Error 404 de memoria pasada)
    formatted = await this.validateLinks(formatted);

    // 6. CIERRE NATURAL (Solo si la respuesta es breve)
    if (formatted.length < 100 && !formatted.includes("?")) {
      const cierres = [
        " ¿Te gustaría que coordinemos una muestra?",
        " Cualquier duda técnica que tengas, avisame.",
        " ¿Querés que te pase más detalles de este equipo?",
      ];
      formatted += cierres[Math.floor(Math.random() * cierres.length)];
    }

    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  /**
   * Verifica que los links existan realmente en la tabla catalogos_archivos.
   * Si un link no está en la base de datos, lo elimina para limpiar la "memoria" de la IA.
   */
  private static async validateLinks(text: string): Promise<string> {
    const urlRegex =
      /(https:\/\/[\w-]+\.supabase\.co\/storage\/v1\/object\/public\/[\w-/.]+)/g;
    const matches = text.match(urlRegex);

    if (!matches) return text;

    let validatedText = text;

    // Consultamos los links que existen REALMENTE en la base de datos ahora
    const { data: validos } = await supabase
      .from("catalogos_archivos")
      .select("url");

    const urlsExistentes = validos?.map((v) => v.url) || [];

    for (const url of matches) {
      if (!urlsExistentes.includes(url)) {
        // Log interno para depuración en tu consola de Linux Mint
        console.warn(`Detectado link obsoleto en memoria: ${url}`);

        // Reemplazamos el link roto por una aclaración elegante
        validatedText = validatedText.replace(
          url,
          "(El catálogo se está actualizando, consultame en unos minutos)",
        );
      }
    }

    return validatedText;
  }

  /**
   * Limita el tamaño de la respuesta para evitar textos infinitos en el móvil.
   */
  static limitResponse(text: string, maxWords: number = 200): string {
    const words = text.split(/\s+/);
    if (words.length > maxWords) {
      return (
        words.slice(0, maxWords).join(" ") +
        "... (Podés ver más detalles en el catálogo)"
      );
    }
    return text;
  }
}
