"use client";

import { useState } from "react";
import { useToast } from "@/components/ui";
import { guardarSeccionesAction } from "@/actions/secciones";
import { SECCIONES_WEB, seccionActiva, type SeccionesWeb } from "@/lib/panel-tema";
import styles from "./secciones.module.css";

interface SeccionesPanelProps {
  inicial: SeccionesWeb;
}

export default function SeccionesPanel({ inicial }: SeccionesPanelProps) {
  const { mostrar } = useToast();
  const [secciones, setSecciones] = useState<SeccionesWeb>(inicial);
  const [guardando, setGuardando] = useState<string | null>(null);

  const alternar = async (clave: string) => {
    if (guardando) return;

    const activa = seccionActiva(secciones, clave);
    const siguientes: SeccionesWeb = { ...secciones, [clave]: !activa };

    setGuardando(clave);
    const res = await guardarSeccionesAction(siguientes);
    setGuardando(null);

    if (!res.ok || !res.secciones) {
      mostrar(res.error ?? "No se pudieron guardar las secciones.", "error");
      return;
    }

    setSecciones(res.secciones);
    const nombre = SECCIONES_WEB.find((s) => s.clave === clave)?.nombre ?? "Sección";
    mostrar(activa ? `${nombre} oculta en tu web.` : `${nombre} visible en tu web.`);
  };

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Secciones de la web</h1>
          <p className={styles.subtitulo}>
            Activa o desactiva las partes que quieres mostrar a tus visitantes. Los cambios se
            aplican de inmediato a la web pública.
          </p>
        </div>
      </div>

      <section className="tarjeta">
        <ul className={styles.lista}>
          {SECCIONES_WEB.map((seccion) => {
            const activa = seccionActiva(secciones, seccion.clave);
            const enCurso = guardando === seccion.clave;
            return (
              <li key={seccion.clave} className={styles.fila}>
                <span className={styles.filaIcono} aria-hidden="true">
                  <i className={`fa ${seccion.icono}`}></i>
                </span>
                <span className={styles.filaTextos}>
                  <span className={styles.filaNombre}>{seccion.nombre}</span>
                  <span className={styles.filaDescripcion}>{seccion.descripcion}</span>
                </span>
                <span className={styles.filaEstado} aria-hidden="true">
                  {enCurso ? "Guardando…" : activa ? "Visible" : "Oculta"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={activa}
                  aria-label={`Mostrar u ocultar ${seccion.nombre}`}
                  onClick={() => void alternar(seccion.clave)}
                  disabled={guardando !== null}
                  className={`${styles.interruptor} ${activa ? styles.interruptorActivo : ""}`}
                >
                  <span className={styles.interruptorPunto} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
