"use client";

import { useEffect } from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: React.ReactNode;
  pie?: React.ReactNode;
  ancho?: "normal" | "estrecho";
}

export function Modal({ abierto, onCerrar, titulo, children, pie, ancho = "normal" }: ModalProps) {
  useEffect(() => {
    if (!abierto) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div
        className={`${styles.modal} ${ancho === "estrecho" ? styles.modalEstrecho : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.cabecera}>
          <h2 className={styles.titulo}>{titulo}</h2>
          <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar">
            <i className="fa fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <div className={styles.cuerpo}>{children}</div>
        {pie && <div className={styles.pie}>{pie}</div>}
      </div>
    </div>
  );
}
