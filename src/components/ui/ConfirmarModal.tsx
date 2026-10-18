"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import styles from "./ConfirmarModal.module.css";

interface ConfirmarModalProps {
  abierto: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  cargando?: boolean;
}

export function ConfirmarModal({
  abierto,
  onCancelar,
  onConfirmar,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  cargando = false,
}: ConfirmarModalProps) {
  const [paso, setPaso] = useState<"primera" | "segunda">("primera");

  const cerrar = () => {
    if (cargando) return;
    setPaso("primera");
    onCancelar();
  };

  const confirmar = () => {
    if (paso === "primera") {
      setPaso("segunda");
      return;
    }
    onConfirmar();
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      titulo={titulo}
      ancho="estrecho"
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={cerrar} disabled={cargando}>
            Cancelar
          </button>
          <button
            type="button"
            className={`boton ${paso === "segunda" ? "boton--peligro" : "boton--primario"}`}
            onClick={confirmar}
            disabled={cargando}
          >
            {cargando ? "Procesando..." : paso === "primera" ? textoConfirmar : "Sí, estoy segura"}
          </button>
        </>
      }
    >
      <p className={`alerta alerta--aviso`}>{mensaje}</p>
      {paso === "segunda" && (
        <p className={styles.aviso}>Esta acción no se puede deshacer. Pulsa de nuevo para confirmar.</p>
      )}
    </Modal>
  );
}
