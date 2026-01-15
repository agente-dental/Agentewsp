import { useState } from "react";
import { chatWithAgente } from "../lib/groq";
import { MessageSquare, Send, X, Bot } from "lucide-react";

export const ChatIA = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    const aiResponse = await chatWithAgente(input);
    setMessages([
      ...newMessages,
      { role: "assistant", content: aiResponse || "" },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white w-96 h-[500px] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-blue-400" />
              <span className="font-bold text-sm">Auditoría de Agente IA</span>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Pregunta al agente sobre el stock..."
              className="flex-1 text-sm outline-none"
            />
            <button
              onClick={handleSend}
              className="p-2 bg-blue-600 text-white rounded-xl"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform flex items-center gap-2"
        >
          <MessageSquare />
          <span className="font-bold text-sm px-1">Hablar con Agente</span>
        </button>
      )}
    </div>
  );
};
