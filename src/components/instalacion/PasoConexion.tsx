"use client";

import { useState } from "react";

interface PasoConexionProps {
  onComplete: (installToken: string) => void;
}

export default function PasoConexion({ onComplete }: PasoConexionProps) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [installToken, setInstallToken] = useState("");

  const handleCheck = async () => {
    if (!installToken || installToken.length < 32) {
      setResult({ ok: false, error: "El INSTALL_TOKEN debe tener al menos 32 caracteres" });
      return;
    }
    setChecking(true);
    setResult(null);
    try {
      const res = await fetch("/api/instalacion/verificar-conexion", { method: "POST" });
      const data = await res.json();
      setResult(data);
      if (data.ok) {
        setTimeout(() => onComplete(installToken), 1000);
      }
    } catch {
      setResult({ ok: false, error: "Error de conexión con el servidor" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-texto)] mb-2">Paso 1: Conexión con Supabase</h2>
        <p className="text-[var(--color-texto-suave)]">
          Verificaremos que las credenciales en <code>.env.local</code> son correctas
          y que podemos conectar con tu proyecto de Supabase.
        </p>
      </div>

      <div className="bg-[var(--color-fondo-alt)] rounded-[var(--radius-md)] p-4 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <code className="px-2 py-1 bg-[var(--color-fondo)] rounded text-[var(--color-texto-suave)]">
            NEXT_PUBLIC_SUPABASE_URL
          </code>
          <span className="text-[var(--color-texto-suave)]">URL del proyecto</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <code className="px-2 py-1 bg-[var(--color-fondo)] rounded text-[var(--color-texto-suave)]">
            NEXT_PUBLIC_SUPABASE_ANON_KEY
          </code>
          <span className="text-[var(--color-texto-suave)]">Clave pública (anon)</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <code className="px-2 py-1 bg-[var(--color-fondo)] rounded text-[var(--color-texto-suave)]">
            SUPABASE_SERVICE_ROLE_KEY
          </code>
          <span className="text-[var(--color-texto-suave)]">Clave de servicio (solo servidor)</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <code className="px-2 py-1 bg-[var(--color-fondo)] rounded text-[var(--color-texto-suave)]">
            INSTALL_TOKEN
          </code>
          <span className="text-[var(--color-texto-suave)]">Token de instalación (mín. 32 caracteres)</span>
        </div>
      </div>

      <div>
        <label htmlFor="installToken" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
          INSTALL_TOKEN <span className="text-red-500">*</span>
        </label>
        <input
          id="installToken"
          type="password"
          value={installToken}
          onChange={(e) => setInstallToken(e.target.value)}
          placeholder="Ingresa tu token de instalación (mín. 32 caracteres)"
          className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
          required
        />
        <p className="text-xs text-[var(--color-texto-suave)] mt-1">
          Debe coincidir con la variable <code>INSTALL_TOKEN</code> en <code>.env.local</code> (solo servidor).
          Genera uno con: <code>openssl rand -hex 32</code>
        </p>
      </div>

      {result && (
        <div className={`p-4 rounded-[var(--radius-md)] ${result.ok ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
          <p className={result.ok ? "text-green-700" : "text-red-700"}>
            {result.ok ? "✓ Conexión exitosa" : `✗ Error: ${result.error}`}
          </p>
          {!result.ok && (
            <p className="text-sm text-[var(--color-texto-suave)] mt-2">
              Revisa que las variables en <code>.env.local</code> sean correctas.
              La URL debe ser <code>https://tu-proyecto.supabase.co</code>.
              La <code>service_role</code> key nunca debe tener prefijo <code>NEXT_PUBLIC_</code>.
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleCheck}
        disabled={checking}
        className="w-full py-3 px-4 bg-[var(--color-primario)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primario-oscuro)] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {checking ? "Comprobando..." : "Verificar conexión"}
      </button>
    </div>
  );
}