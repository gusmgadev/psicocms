"use client";

import { useState, type CSSProperties } from "react";
import { Modal, useToast } from "@/components/ui";
import { guardarPreferenciasAction } from "@/actions/preferencias";
import {
  COLORES_PANEL,
  type ModoPanel,
  type PreferenciasPanel,
} from "@/lib/panel-tema";
import styles from "./TemaPanelModal.module.css";

const MODOS: { valor: ModoPanel; nombre: string; icono: string; descripcion: string }[] = [
  {
    valor: "light",
    nombre: "Claro",
    icono: "fa-sun",
    descripcion: "Fondos claros, cómodo de día.",
  },
  {
    valor: "dark",
    nombre: "Oscuro",
    icono: "fa-moon",
    descripcion: "Fondos oscuros, más suave con poca luz.",
  },
];

interface TemaPanelModalProps {
  abierto: boolean;
  onCerrar: () => void;
  preferencias: PreferenciasPanel;
  onGuardado: (preferencias: PreferenciasPanel) => void;
}

export default function TemaPanelModal({
  abierto,
  onCerrar,
  preferencias,
  onGuardado,
}: TemaPanelModalProps) {
  const { mostrar } = useToast();
  const [modo, setModo] = useState<ModoPanel>(preferencias.modo);
  const [color, setColor] = useState(preferencias.colorPrimario);
  const [guardando, setGuardando] = useState(false);

  const hayCambios = modo !== preferencias.modo || color !== preferencias.colorPrimario;

  const guardar = async () => {
    setGuardando(true);
    const res = await guardarPreferenciasAction(modo, color);
    setGuardando(false);

    if (!res.ok || !res.preferencias) {
      mostrar(res.error ?? "No se pudo guardar el tema.", "error");
      return;
    }
    mostrar("Tema del panel actualizado.");
    onGuardado(res.preferencias);
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Tema del panel"
      pie={
        <>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={onCerrar}
            disabled={guardando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="boton boton--primario"
            onClick={() => void guardar()}
            disabled={guardando || !hayCambios}
          >
            <i className="fa fa-check" aria-hidden="true"></i>
            {guardando ? "Guardando…" : "Guardar tema"}
          </button>
        </>
      }
    >
      <div className={styles.bloque}>
        <p className={styles.tituloBloque}>Modo</p>
        <div className={styles.rejillaModos}>
          {MODOS.map((m) => {
            const seleccionado = m.valor === modo;
            return (
              <button
                key={m.valor}
                type="button"
                onClick={() => setModo(m.valor)}
                disabled={guardando}
                aria-pressed={seleccionado}
                className={`${styles.modoBoton} ${seleccionado ? styles.modoBotonActivo : ""}`}
              >
                <span className={styles.modoIcono} aria-hidden="true">
                  <i className={`fa ${m.icono}`}></i>
                </span>
                <span className={styles.modoTextos}>
                  <span className={styles.modoNombre}>{m.nombre}</span>
                  <span className={styles.modoDescripcion}>{m.descripcion}</span>
                </span>
                {seleccionado && (
                  <span className={styles.etiquetaActivo}>
                    <i className="fa fa-check" aria-hidden="true"></i> En uso
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.bloque}>
        <p className={styles.tituloBloque}>Color principal</p>
        <div className={styles.rejillaColores}>
          {COLORES_PANEL.map((c) => {
            const seleccionado = c.valor === color;
            return (
              <button
                key={c.valor}
                type="button"
                onClick={() => setColor(c.valor)}
                disabled={guardando}
                aria-pressed={seleccionado}
                className={`${styles.colorBoton} ${seleccionado ? styles.colorBotonActivo : ""}`}
              >
                <span
                  className={styles.colorMuestra}
                  style={{ backgroundColor: c.valor } as CSSProperties}
                  aria-hidden="true"
                >
                  {seleccionado && <i className="fa fa-check" aria-hidden="true"></i>}
                </span>
                <span className={styles.colorNombre}>{c.nombre}</span>
              </button>
            );
          })}
        </div>
        <p className={styles.nota}>
          El color se aplica a los botones, acentos y elementos destacados de todo el panel.
        </p>
      </div>
    </Modal>
  );
}
