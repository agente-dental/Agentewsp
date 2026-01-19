import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { AgentSettingsService } from "./agentSettings";

interface AgentContextType {
  agenteActivo: boolean;
  toggleAgentStatus: () => Promise<void>;
  loading: boolean;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error("useAgent must be used within an AgentProvider");
  }
  return context;
};

export const AgentProvider = ({ children }: { children: ReactNode }) => {
  const [agenteActivo, setAgenteActivo] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadAgentStatus = async () => {
    try {
      const savedStatus = await AgentSettingsService.get("agente_activo");
      if (savedStatus) {
        setAgenteActivo(JSON.parse(savedStatus));
      }
    } catch (error) {
      console.error("Error al cargar estado del agente:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveAgentStatus = async (status: boolean) => {
    try {
      await AgentSettingsService.set("agente_activo", JSON.stringify(status));
      console.log(
        `✅ Estado del agente guardado: ${status ? "Online" : "Offline"}`,
      );
    } catch (error) {
      console.error("Error al guardar estado del agente:", error);
    }
  };

  const toggleAgentStatus = async () => {
    const newStatus = !agenteActivo;
    setAgenteActivo(newStatus);
    await saveAgentStatus(newStatus);
  };

  useEffect(() => {
    loadAgentStatus();
  }, []);

  return (
    <AgentContext.Provider value={{ agenteActivo, toggleAgentStatus, loading }}>
      {children}
    </AgentContext.Provider>
  );
};
