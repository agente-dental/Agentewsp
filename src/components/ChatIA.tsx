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
  Power,
  Activity,
  Flame,
  UserCheck,
  ShieldAlert,
} from "lucide-react";

export const ChatIA = () => {
  const [agenteActivo, setAgenteActivo] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [
      {
        role: "assistant",
        content:
          "¡Hola! Sistema operativo. ¿En qué equipo dental puedo ayudarte hoy?",
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

  // --- FUNCIÓN CRÍTICA: FORMATEADOR DE HIPERVÍNCULOS ---
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
            className="flex items-center gap-2 my-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 hover:bg-blue-100 transition-all w-fit group"
          >
            {isPDF ? <FileText size={18} /> : <ImageIcon size={18} />}
            <span className="text-xs font-black uppercase tracking-tighter">
              {isPDF ? "Abrir Catálogo PDF" : "Ver Imagen Técnica"}
            </span>
            <ExternalLink
              size={14}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </a>
        );
      }
      return (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const aiResponse = await chatWithAgente(userMsg, agenteActivo);
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
    // Se añade h-full y flex para que no se "pegue" o desborde del layout de la App
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* HEADER DEL DASHBOARD */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 italic uppercase tracking-tighter">
            Dashboard Agente
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">
            Estado: {agenteActivo ? "IA Activada" : "IA Desactivada"}
          </p>
        </div>
        <button
          onClick={() => setAgenteActivo(!agenteActivo)}
          className={`flex items-center gap-4 px-8 py-4 rounded-2xl font-black uppercase text-sm transition-all shadow-xl ${
            agenteActivo
              ? "bg-green-500 text-white"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          <Power size={20} />
          {agenteActivo ? "ONLINE" : "OFFLINE"}
        </button>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
          <Flame className="text-orange-500 mb-2" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Intención Venta
          </p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter italic">
            78%
          </p>
        </div>
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
          <Activity className="text-blue-500 mb-2" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Consultas
          </p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter italic">
            124
          </p>
        </div>
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
          <ShieldAlert className="text-red-500 mb-2" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Ruido/Spam
          </p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter italic">
            12
          </p>
        </div>
        <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm">
          <UserCheck className="text-green-500 mb-2" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Filtrados
          </p>
          <p className="text-3xl font-black text-slate-800 tracking-tighter italic">
            45
          </p>
        </div>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <div className="bg-slate-900 p-8 rounded-[32px] text-white overflow-hidden">
        <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2">
          <Bot className="text-blue-400" /> Monitor en Tiempo Real
        </h3>
        <div className="space-y-4">
          <p className="text-sm border-l-2 border-blue-500 pl-4 py-1 opacity-80 italic">
            <span className="font-black text-blue-400">INFO:</span> IA
            respondiendo con manuales de Scanner Pro.
          </p>
          <p className="text-sm border-l-2 border-red-500 pl-4 py-1 opacity-80 italic">
            <span className="font-black text-red-500">FILTRO:</span> Mensaje
            personal descartado por protocolo.
          </p>
        </div>
      </div>

      {/* CHAT FLOTANTE */}
      <div className="fixed bottom-6 right-6 z-50">
        {isOpen ? (
          <div className="w-96 h-[550px] bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Bot size={20} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Simulador Dental Boss
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
                    className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm"
                    }`}
                  >
                    {/* APLICAMOS EL FORMATEADOR AQUÍ */}
                    {formatMessage(m.content)}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-[10px] font-black text-slate-400 animate-pulse p-2 uppercase">
                  Leyendo manuales...
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Escribe aquí..."
                className="flex-1 text-sm outline-none px-4 py-3 bg-slate-100 rounded-xl"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="p-3 bg-blue-600 text-white rounded-xl"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-slate-900 text-white p-5 rounded-3xl shadow-2xl flex items-center gap-3 hover:scale-105 transition-transform"
          >
            <MessageSquare size={24} />
            <span className="font-black uppercase text-xs tracking-widest">
              Abrir Simulación
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
