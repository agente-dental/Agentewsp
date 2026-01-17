import { useState } from "react";
import { supabase } from "../lib/supabase";
import { LogIn, Loader2 } from "lucide-react";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert("Error: " + error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900">DENTAL BOSS</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
            Acceso Administrativo
          </p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            className="w-full p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <LogIn size={20} /> Entrar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
