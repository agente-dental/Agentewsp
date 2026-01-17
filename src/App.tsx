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
    // 1. Verificación inmediata
    const getInitialSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();
      setSession(currentSession);
      setLoading(false);
    };

    getInitialSession();

    // 2. Suscripción a cambios
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ESTO ES LO QUE EVITA EL PARPADEO:
  // Mientras loading sea true, no mostramos NADA del Dashboard
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Si después de cargar no hay sesión, mostramos el Login
  if (!session) {
    return <Login />;
  }

  // Solo si hay sesión llegamos aquí
  return (
    <Router>
      <div className="flex w-full min-h-screen bg-slate-50 text-slate-900">
        <Sidebar />
        <main className="flex-1 lg:ml-72 p-4 md:p-8 lg:p-12 pt-20 lg:pt-12">
          {/* ... resto de tu contenido del Dashboard ... */}
          <Routes>
            <Route path="/" element={<Inventory />} />
            <Route path="/inventario" element={<Inventory />} />
            <Route path="/chats" element={<div>Métricas pronto</div>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <ChatIA />
      </div>
    </Router>
  );
}

export default App;
