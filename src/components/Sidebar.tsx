import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
} from "lucide-react";
import { useState } from "react";

export const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error al cerrar sesión:", error.message);
  };

  const menuItems = [
    // Cambiamos el icono a Activity para que represente mejor el nuevo Dashboard del Agente
    { icon: Package, label: "Inventario", path: "/inventario" },
    { icon: Activity, label: "Panel Agente", path: "/chat" }, // RUTA CORREGIDA A /chat
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-2xl shadow-lg border border-slate-100 text-slate-600"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen bg-white border-r border-slate-100 transition-transform w-64 sm:w-72
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Activity className="text-white" size={24} />
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-xl tracking-tight leading-none uppercase italic">
                Dental Boss
              </h1>
              <p className="text-[10px] font-bold text-blue-600 tracking-[0.2em] uppercase">
                Manager Pro
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`
                flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all
                ${
                  location.pathname === item.path
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-100" // Estilo activo más prominente
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }
              `}
            >
              <item.icon size={22} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-50">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-red-400 hover:bg-red-50 transition-colors"
          >
            <LogOut size={22} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};
