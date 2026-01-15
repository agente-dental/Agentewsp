import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Menu,
  X,
  Bot,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard", path: "/" },
    { icon: <Package size={20} />, label: "Inventario", path: "/inventario" },
    { icon: <MessageSquare size={20} />, label: "Chats IA", path: "/chats" },
  ];

  return (
    <>
      {/* Botón Hamburguesa - Solo visible en móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] bg-slate-900 text-white p-2.5 rounded-xl shadow-lg border border-slate-700"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para cerrar el menú en móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Principal */}
      <aside
        className={`
        fixed top-0 left-0 h-full bg-slate-900 text-white z-50 transition-transform duration-300 ease-in-out
        ${
          isOpen
            ? "w-72 translate-x-0"
            : "w-72 -translate-x-full lg:translate-x-0"
        }
      `}
      >
        <div className="p-8">
          <div className="flex items-center gap-2">
            <Bot className="text-blue-400" size={28} />
            <h1 className="text-2xl font-black tracking-tighter">
              DENTAL BOSS
            </h1>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Gestión de Alta Gama
          </p>
        </div>

        <nav className="mt-4 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all ${
                location.pathname === item.path
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};
