import { Link, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase"; // Importante para el logout
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Settings,
  LogOut, // Icono para salir
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Función para cerrar sesión
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Error al cerrar sesión:", error.message);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Package, label: "Inventario", path: "/inventario" },
    { icon: MessageSquare, label: "Chats IA", path: "/chats" },
  ];

  return (
    <>
      {/* Botón Hamburguesa para Móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-2xl shadow-lg border border-slate-100 text-slate-600"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Principal */}
      <aside
        className={`
        fixed top-0 left-0 h-full bg-white border-r border-slate-100 z-40
        transition-all duration-300 ease-in-out
        w-72 flex flex-col
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Logo */}
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-black text-xl">D</span>
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-xl tracking-tight leading-none">
                DENTAL
              </h1>
              <p className="text-[10px] font-bold text-blue-600 tracking-[0.2em] uppercase">
                Manager Pro
              </p>
            </div>
          </div>
        </div>

        {/* Navegación */}
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
                    ? "bg-blue-50 text-blue-600 shadow-sm shadow-blue-50"
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                }
              `}
            >
              <item.icon size={22} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Botón de Cerrar Sesión (Al final) */}
        <div className="p-4 border-t border-slate-50">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={22} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
};
