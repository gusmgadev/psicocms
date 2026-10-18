"use client";

import { createContext, useCallback, useContext, useState } from "react";
import styles from "./Toast.module.css";

type TipoToast = "exito" | "error" | "info";

interface Toast {
  id: number;
  mensaje: string;
  tipo: TipoToast;
}

interface ToastContextValue {
  mostrar: (mensaje: string, tipo?: TipoToast) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrar = useCallback((mensaje: string, tipo: TipoToast = "exito") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const cerrar = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const iconoDe = (tipo: TipoToast) => {
    if (tipo === "exito") return "fa-circle-check";
    if (tipo === "error") return "fa-circle-exclamation";
    return "fa-circle-info";
  };

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div className={styles.contenedor} aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`${styles.toast} ${styles[t.tipo]}`} role="status">
            <i className={`fa ${iconoDe(t.tipo)} ${styles.icono}`} aria-hidden="true"></i>
            <span className={styles.mensaje}>{t.mensaje}</span>
            <button type="button" onClick={() => cerrar(t.id)} className={styles.cerrar} aria-label="Cerrar aviso">
              <i className="fa fa-xmark" aria-hidden="true"></i>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
