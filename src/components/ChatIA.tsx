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
          "¡Hola! Soy el asistente de Dental Boss. ¿En qué equipo o catálogo estás interesado?",
      },
    ],
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Función para transformar URLs en botones visuales
  const formatMessage = (content: string) => {
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
            className="flex items-center gap-3 my-2 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
          >
            {isPDF ? (
              <FileText size={18} className="text-red-500" />
            ) : (
              <ImageIcon size={18} className="text-blue-500" />
            )}
            <span className="flex-1 truncate text-[10px] font-black uppercase text-slate-600">
              {isPDF ? "Abrir Catálogo PDF" : "Ver Imagen Adjunta"}
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
        { role: "assistant", content: aiResponse || "" },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white w-[350px] md:w-96 h-[550px] rounded-[32px] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/30">
                <Bot size={20} />
              </div>
              <span className="font-black text-xs uppercase tracking-widest">
                Dental Boss AI
              </span>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium shadow-sm ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700"
                  }`}
                >
                  {formatMessage(m.content)}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest p-2">
                <Sparkles size={14} className="animate-pulse text-blue-500" />{" "}
                Consultando Archivos...
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="¿Qué manuales tienes?"
              className="flex-1 text-sm outline-none px-4 py-3 bg-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="p-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border-b-4 border-blue-600"
        >
          <MessageSquare size={24} />
          <span className="font-black text-xs uppercase tracking-widest">
            Asesor Dental IA
          </span>
        </button>
      )}
    </div>
  );
};
