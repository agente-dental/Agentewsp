import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { chatWithAgente } from "../lib/groq";
import {
  MessageSquare,
  Send,
  X,
  Zap,
  Plus,
  Trash2,
  Power,
  Activity,
  Flame,
  ToggleLeft,
  ToggleRight,
  Clock,
} from "lucide-react";

export const ChatIA = () => {
  // --- ESTADOS DE CONTROL ---
  const [agenteActivo, setAgenteActivo] = useState(true);
  const [nuevaOrden, setNuevaOrden] = useState("");
  const [ordenes, setOrdenes] = useState<any[]>([]);

  // --- ESTADOS DEL CHAT SIMULADOR ---
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [
      {
        role: "assistant",
        content:
          "¡Hola! Soy el asistente de Dental Boss. ¿Qué equipo deseas probar hoy?",
      },
    ],
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al recibir mensajes
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Cargar órdenes al iniciar
  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    const { data } = await supabase
      .from("ordenes_diarias")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setOrdenes(data);
  };

  const agregarOrden = async () => {
    if (!nuevaOrden.trim()) return;
    const { error } = await supabase
      .from("ordenes_diarias")
      .insert([{ contenido: nuevaOrden }]);
    if (!error) {
      setNuevaOrden("");
      fetchOrdenes();
    }
  };

  const toggleOrden = async (id: string, estadoActual: boolean) => {
    await supabase
      .from("ordenes_diarias")
      .update({ activa: !estadoActual })
      .eq("id", id);
    fetchOrdenes();
  };

  const eliminarOrden = async (id: string) => {
    if (!confirm("¿Eliminar esta orden?")) return;
    await supabase.from("ordenes_diarias").delete().eq("id", id);
    fetchOrdenes();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      // Enviamos el mensaje y el estado del botón ON/OFF
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
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* HEADER: CONTROL ON/OFF */}
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">
            Panel Agente
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 italic">
            Status: {agenteActivo ? "IA Operativa" : "IA en Pausa"}
          </p>
        </div>
        <button
          onClick={() => setAgenteActivo(!agenteActivo)}
          className={`flex items-center gap-4 px-10 py-5 rounded-2xl font-black uppercase text-sm transition-all shadow-xl ${
            agenteActivo
              ? "bg-green-500 text-white ring-8 ring-green-50 shadow-green-100"
              : "bg-slate-200 text-slate-500 shadow-none"
          }`}
        >
          <Power size={20} className={agenteActivo ? "animate-pulse" : ""} />
          {agenteActivo ? "Agente ONLINE" : "Agente OFFLINE"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA GESTIÓN DE ÓRDENES */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[32px] border-2 border-blue-50 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl text-white">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-black uppercase italic text-slate-800 tracking-tighter">
                Órdenes Operativas
              </h3>
            </div>

            <div className="flex gap-2">
              <input
                placeholder="Ej: 'Bono de $500 de regalo en Fussen 6500'..."
                className="flex-1 p-4 bg-slate-50 rounded-xl border-none font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500"
                value={nuevaOrden}
                onChange={(e) => setNuevaOrden(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && agregarOrden()}
              />
              <button
                onClick={agregarOrden}
                className="bg-blue-600 text-white p-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all"
              >
                <Plus size={24} />
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {ordenes.map((orden) => (
                <div
                  key={orden.id}
                  className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
                    orden.activa
                      ? "bg-white border-blue-100 shadow-sm"
                      : "bg-slate-50 border-transparent opacity-60"
                  }`}
                >
                  <div className="flex gap-4 items-center flex-1">
                    <button
                      onClick={() => toggleOrden(orden.id, orden.activa)}
                      className={
                        orden.activa ? "text-blue-600" : "text-slate-300"
                      }
                    >
                      {orden.activa ? (
                        <ToggleRight size={32} />
                      ) : (
                        <ToggleLeft size={32} />
                      )}
                    </button>
                    <div>
                      <p
                        className={`text-sm font-bold ${orden.activa ? "text-slate-700" : "text-slate-400 line-through"}`}
                      >
                        {orden.contenido}
                      </p>
                      <span className="text-[9px] font-black text-slate-300 uppercase flex items-center gap-1 mt-1">
                        <Clock size={10} />{" "}
                        {new Date(orden.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => eliminarOrden(orden.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors ml-4"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA MÉTRICAS */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[32px] text-white">
            <Flame className="text-orange-500 mb-4" size={32} />
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              Cierre Estimado
            </p>
            <p className="text-4xl font-black italic tracking-tighter">82%</p>
          </div>
          <div className="bg-blue-600 p-8 rounded-[32px] text-white">
            <Activity className="text-blue-100 mb-4" size={32} />
            <p className="text-[10px] font-black uppercase text-blue-300 tracking-widest">
              Consultas Totales
            </p>
            <p className="text-4xl font-black italic tracking-tighter">147</p>
          </div>
        </div>
      </div>

      {/* --- VENTANA DE CHAT FLOTANTE RECUPERADA --- */}
      <div className="fixed bottom-6 right-6 z-50">
        {isOpen ? (
          <div className="w-96 h-[550px] bg-white rounded-[32px] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in duration-300">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3 h-3 rounded-full ${agenteActivo ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                ></div>
                <span className="text-[10px] font-black uppercase italic tracking-widest">
                  Simulador Agente
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
                    className={`max-w-[85%] p-4 rounded-2xl text-xs font-bold shadow-sm ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="text-[10px] font-black text-slate-400 p-2 animate-pulse uppercase italic">
                  Analizando órdenes...
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
                placeholder="Pregunta por el Fussen 6500..."
                className="flex-1 text-sm outline-none px-4 py-3 bg-slate-100 rounded-xl"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading}
                className="p-3 bg-blue-600 text-white rounded-xl shadow-lg"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsOpen(true)}
            className="bg-slate-900 text-white p-5 rounded-3xl shadow-2xl flex items-center gap-3 hover:scale-105 transition-all border-b-4 border-blue-600 font-black uppercase text-xs tracking-widest italic"
          >
            <MessageSquare size={24} />
            Probar Agente
          </button>
        )}
      </div>
    </div>
  );
};
