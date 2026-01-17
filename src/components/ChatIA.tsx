import { useState, useEffect, useRef } from "react";
import { chatWithAgente } from "../lib/groq";
import {
  MessageSquare,
  Send,
  X,
  Bot,
  Sparkles,
  ExternalLink,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

export const ChatIA = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [
      {
        role: "assistant",
        content:
          "¡Hola! Soy el asistente de Dental Boss. ¿En qué equipo estás interesado hoy?",
      },
    ],
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Función para detectar y renderizar enlaces de Supabase/Storage
  const renderMessageContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        const isPDF = part.toLowerCase().includes(".pdf");
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 my-2 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
          >
            {isPDF ? (
              <FileText size={18} className="text-red-500" />
            ) : (
              <ImageIcon size={18} className="text-blue-500" />
            )}
            <span className="flex-1 truncate text-xs font-bold text-slate-600">
              {isPDF ? "Ver Catálogo PDF" : "Ver Imagen del Equipo"}
            </span>
            <ExternalLink
              size={14}
              className="text-slate-400 group-hover:text-blue-500"
            />
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const aiResponse = await chatWithAgente(userMsg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiResponse || "No pude procesar tu solicitud.",
        },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen ? (
        <div className="bg-white w-[350px] md:w-[400px] h-[600px] rounded-[32px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          {/* Header Mejorado */}
          <div className="bg-slate-900 p-5 text-white flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/40">
                  <Bot size={22} className="text-white" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-slate-900 rounded-full"></span>
              </div>
              <div>
                <span className="font-black text-sm block tracking-tight">
                  DENTAL BOSS AI
                </span>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                  Asesor Experto
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/10 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Chat Body con visualización de enlaces */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-50/50"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-[24px] text-sm leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none font-medium"
                      : "bg-white border border-slate-200 text-slate-700 rounded-tl-none font-medium"
                  }`}
                >
                  {renderMessageContent(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-3 p-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Consultando Catálogo...
                </span>
              </div>
            )}
          </div>

          {/* Input Área */}
          <div className="p-4 bg-white border-t border-slate-100">
            <div className="flex gap-2 items-center bg-slate-100 p-2 rounded-2xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Pregunta por stock o catálogos..."
                className="flex-1 text-sm bg-transparent outline-none px-3 py-2 text-slate-700 placeholder:text-slate-400"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className={`p-3 rounded-xl transition-all ${
                  loading || !input.trim()
                    ? "text-slate-300"
                    : "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                }`}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Botón Flotante con Badge de Activo */
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white p-5 rounded-[24px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group border-b-4 border-blue-600"
        >
          <div className="relative">
            <MessageSquare
              size={26}
              className="group-hover:rotate-12 transition-transform"
            />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></span>
          </div>
          <span className="font-black text-xs uppercase tracking-[0.1em]">
            Consultar al Experto
          </span>
        </button>
      )}
    </div>
  );
};
