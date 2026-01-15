import {
  Package,
  MessageSquare,
  LayoutDashboard,
  Truck,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: Package, label: "Inventario", path: "/inventario" },
    { icon: Truck, label: "Mayorista", path: "/pedidos" },
    { icon: MessageSquare, label: "Agente WhatsApp", path: "/chats" },
  ];

  return (
    <div className="w-72 h-screen bg-slate-900 text-white p-6 fixed flex flex-col shadow-2xl">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-blue-600 p-2 rounded-lg">
          <ShieldCheck size={24} className="text-white" />
        </div>
        <h1 className="text-xl font-bold tracking-wider">
          DENTAL<span className="text-blue-500">PRO</span>
        </h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-800 pt-6">
        <button className="flex items-center gap-3 p-3 text-slate-400 hover:text-white w-full">
          <Settings size={20} />
          <span>Configuración</span>
        </button>
      </div>
    </div>
  );
};
