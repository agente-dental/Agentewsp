import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Inventory } from "./pages/Inventory";
import { ChatIA } from "./components/ChatIA";

function App() {
  return (
    <Router>
      <div className="flex w-full min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />

        <main className="flex-1 ml-72 p-8 lg:p-12">
          <header className="max-w-[1600px] mx-auto mb-10">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  Inventario Global
                </h2>
                <p className="text-slate-500 mt-2 text-lg">
                  Control de stock de alta gama y gestión de Agente IA.
                </p>
              </div>

              <div className="flex gap-4">
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200">
                  <span className="text-xs font-black text-blue-600 uppercase tracking-widest">
                    Conexión Wasapi
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                    <span className="font-bold text-slate-700 text-sm">
                      ACTIVO
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="max-w-[1600px] mx-auto">
            <Routes>
              <Route path="/" element={<Inventory />} />
              <Route path="/inventario" element={<Inventory />} />
              <Route
                path="/chats"
                element={
                  <div className="bg-white p-20 rounded-3xl shadow-sm text-center text-slate-400 border-2 border-dashed border-slate-100">
                    Aquí se mostrarán las métricas de conversaciones de Wasapi
                  </div>
                }
              />
            </Routes>
          </div>
        </main>

        <ChatIA />
      </div>
    </Router>
  );
}

export default App;
