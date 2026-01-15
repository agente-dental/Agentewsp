import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Inventory } from "./pages/Inventory";
import { ChatIA } from "./components/ChatIA";

function App() {
  return (
    <Router>
      <div className="flex w-full min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />

        {/* ml-0 en móvil, ml-72 en PC. pt-20 en móvil para el botón de menú */}
        <main className="flex-1 lg:ml-72 p-4 md:p-8 lg:p-12 pt-20 lg:pt-12">
          <header className="max-w-[1600px] mx-auto mb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Inventario Global
                </h2>
                <p className="text-slate-500 mt-2 text-base md:text-lg">
                  Control de stock y gestión de Agente IA.
                </p>
              </div>

              <div className="w-full md:w-auto bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  Estado del Agente
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="font-bold text-slate-700 text-sm">
                    WASAPI ACTIVO
                  </span>
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
                  <div className="bg-white p-12 md:p-20 rounded-3xl shadow-sm text-center text-slate-400 border-2 border-dashed border-slate-100">
                    Métricas de Wasapi disponibles pronto
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
