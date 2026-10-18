"use client";

import { useState } from "react";
import styles from "@/app/instalacion/instalacion.module.css";

interface PasoConexionProps {
  onVerified: (installToken: string) => void;
}

export default function PasoConexion({ onVerified }: PasoConexionProps) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [installToken, setInstallToken] = useState("");

  const handleCheck = async () => {
    const token = installToken.trim();
    if (!token || token.length < 32) {
      setResult({ ok: false, error: "El INSTALL_TOKEN debe tener al menos 32 caracteres" });
      return;
    }
    setChecking(true);
    setResult(null);
    try {
      const body = new FormData();
      body.append("installToken", token);
      const res = await fetch("/api/instalacion/verificar-conexion", {
        method: "POST",
        body,
      });
      const data = await res.json();
      setResult(data);
      if (data.ok) {
        setTimeout(() => onVerified(token), 1000);
      }
    } catch {
      setResult({ ok: false, error: "Error de conexión con el servidor" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div>
      <h2 className={styles.pasoTitulo}>Paso 1: Conexión con Supabase</h2>
      <p className={styles.pasoDescripcion}>
        Verificaremos que las credenciales en <code>.env.local</code> son correctas,
        que el token de instalación es válido y que podemos conectar con tu proyecto de Supabase.
      </p>

      <div className={styles.envLista}>
        <div className={styles.envFila}>
          <code className={styles.envCode}>NEXT_PUBLIC_SUPABASE_URL</code>
          <span>URL del proyecto</span>
        </div>
        <div className={styles.envFila}>
          <code className={styles.envCode}>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          <span>Clave pública (anon)</span>
        </div>
        <div className={styles.envFila}>
          <code className={styles.envCode}>SUPABASE_SERVICE_ROLE_KEY</code>
          <span>Clave de servicio (solo servidor)</span>
        </div>
        <div className={styles.envFila}>
          <code className={styles.envCode}>INSTALL_TOKEN</code>
          <span>Token de instalación (mín. 32 caracteres)</span>
        </div>
      </div>

      <div className={styles.pasoGrupo}>
        <div>
          <label htmlFor="installToken" className="campo-label">
            INSTALL_TOKEN <span style={{ color: "var(--color-peligro)" }}>*</span>
          </label>
          <input
            id="installToken"
            type="password"
            value={installToken}
            onChange={(e) => setInstallToken(e.target.value)}
            placeholder="Pega tu token de instalación (mín. 32 caracteres)"
            className={`campo-control ${result && !result.ok ? "campo-control--error" : ""}`}
            required
          />
          <span className="campo-hint">
            Debe coincidir con la variable <code>INSTALL_TOKEN</code> en <code>.env.local</code> (solo servidor).
            Genera uno con: <code>openssl rand -hex 32</code>
          </span>
        </div>
      </div>

      {result && (
        <div
          className={`${styles.resultado} ${result.ok ? styles.resultadoOk : styles.resultadoError}`}
          role="status"
        >
          <p style={{ margin: 0 }}>
            {result.ok ? "Conexión y token verificados correctamente" : `Error: ${result.error}`}
          </p>
          {!result.ok && (
            <p className={styles.resultadoAyuda}>
              Revisa que las variables en <code>.env.local</code> sean correctas.
              La URL debe ser <code>https://tu-proyecto.supabase.co</code>.
              La <code>service_role</code> key nunca debe tener prefijo <code>NEXT_PUBLIC_</code>.
              Reinicia el servidor de desarrollo si has editado <code>.env.local</code> recientemente.
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleCheck}
        disabled={checking}
        className="boton boton--primario boton--bloque"
      >
        {checking ? "Comprobando..." : "Verificar conexión y token"}
      </button>
    </div>
  );
}
