import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { supabase } from "./lib/supabase";
import { Sidebar } from "./components/Sidebar";
import { Inventory } from "./pages/Inventory";
import { ChatIA } from "./components/ChatIA";
import { Login } from "./pages/Login";

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoading(false);
    };
    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <Router>
      <div className="flex w-full min-h-screen bg-slate-50 text-slate-900">
        {/* El Sidebar se mantiene fijo a la izquierda */}
        <Sidebar />

        {/* Contenedor principal con scroll independiente y margen para el Sidebar */}
        <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto">
          <div className="p-4 md:p-8 lg:p-12 pt-20 lg:pt-12">
            <Routes>
              {/* Ruta Raíz: Redirige a Inventario por defecto */}
              <Route path="/" element={<Navigate to="/inventario" replace />} />

              {/* Sección de Inventario: Solo muestra la tabla de productos */}
              <Route path="/inventario" element={<Inventory />} />

              {/* Sección Chat IA: Aquí y SOLO AQUÍ vive el Dashboard del Agente */}
              <Route path="/chat" element={<ChatIA />} />

              {/* Redirección por si el usuario entra a una ruta inexistente */}
              <Route path="*" element={<Navigate to="/inventario" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
