"use client";

import { useState } from "react";
import { ConfirmarModal, EmptyState, useToast } from "@/components/ui";
import { listarFaqsAction, eliminarFaqAction, moverFaqAction } from "@/actions/faqs";
import type { FaqFila } from "@/services/faqs";
import FaqModal from "./FaqModal";
import styles from "./faqs.module.css";

interface Props {
  inicial: FaqFila[];
}

export default function FaqsPanel({ inicial }: Props) {
  const { mostrar } = useToast();

  const [faqs, setFaqs] = useState<FaqFila[]>(inicial);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<FaqFila | null>(null);
  const [eliminando, setEliminando] = useState<FaqFila | null>(null);
  const [cargandoEliminar, setCargandoEliminar] = useState(false);
  const [cargandoOrden, setCargandoOrden] = useState(false);

  const recargar = async () => {
    setFaqs(await listarFaqsAction());
  };

  const abrirNueva = () => {
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (faq: FaqFila) => {
    setEditando(faq);
    setModalAbierto(true);
  };

  const mover = async (faq: FaqFila, direccion: "arriba" | "abajo") => {
    setCargandoOrden(true);
    const res = await moverFaqAction(faq.id, direccion);
    setCargandoOrden(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo cambiar el orden.", "error");
      return;
    }
    await recargar();
  };

  const eliminar = async () => {
    if (!eliminando) return;
    setCargandoEliminar(true);
    const res = await eliminarFaqAction(eliminando.id);
    setCargandoEliminar(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo eliminar la pregunta.", "error");
      return;
    }
    mostrar("Pregunta eliminada.");
    setEliminando(null);
    await recargar();
  };

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Preguntas frecuentes</h1>
          <p className={styles.subtitulo}>
            Gestiona las dudas que tus pacientes tienen con más frecuencia. El orden de la lista es el que se
            muestra en la web.
          </p>
        </div>
        <button type="button" className="boton boton--primario" onClick={abrirNueva}>
          <i className="fa fa-plus" aria-hidden="true"></i>
          Nueva pregunta
        </button>
      </div>

      {faqs.length === 0 ? (
        <div className="tarjeta">
          <EmptyState
            icono="fa-circle-question"
            titulo="Todavía no hay preguntas frecuentes"
            descripcion="Crea la primera pregunta para que tus pacientes encuentren respuestas rápidas a sus dudas habituales."
            accion={
              <button type="button" className="boton boton--primario" onClick={abrirNueva}>
                <i className="fa fa-plus" aria-hidden="true"></i>
                Nueva pregunta
              </button>
            }
          />
        </div>
      ) : (
        <div className="tarjeta">
          <ul className={styles.lista}>
            {faqs.map((faq, i) => (
              <li key={faq.id} className={styles.item}>
                <span className={styles.orden}>{i + 1}</span>
                <div className={styles.info}>
                  <span className={styles.pregunta}>{faq.question}</span>
                  <span className={styles.meta}>
                    {faq.category ? <span className={styles.categoria}>{faq.category}</span> : null}
                    <span className={`${styles.badge} ${faq.isActive ? styles.badgeActiva : styles.badgeOculta}`}>
                      <i
                        className={`fa ${faq.isActive ? "fa-eye" : "fa-eye-slash"}`}
                        aria-hidden="true"
                      ></i>
                      {faq.isActive ? "Visible" : "Oculta"}
                    </span>
                  </span>
                </div>
                <div className={styles.acciones}>
                  <button
                    type="button"
                    className={styles.accionBoton}
                    onClick={() => mover(faq, "arriba")}
                    disabled={cargandoOrden || i === 0}
                    aria-label={`Subir "${faq.question}"`}
                    title="Subir"
                  >
                    <i className="fa fa-arrow-up" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className={styles.accionBoton}
                    onClick={() => mover(faq, "abajo")}
                    disabled={cargandoOrden || i === faqs.length - 1}
                    aria-label={`Bajar "${faq.question}"`}
                    title="Bajar"
                  >
                    <i className="fa fa-arrow-down" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className={styles.accionBoton}
                    onClick={() => abrirEdicion(faq)}
                    aria-label={`Editar "${faq.question}"`}
                    title="Editar"
                  >
                    <i className="fa fa-pen" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className={`${styles.accionBoton} ${styles.accionPeligro}`}
                    onClick={() => setEliminando(faq)}
                    aria-label={`Eliminar "${faq.question}"`}
                    title="Eliminar"
                  >
                    <i className="fa fa-trash" aria-hidden="true"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <FaqModal
        abierto={modalAbierto}
        editando={editando}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={recargar}
      />

      <ConfirmarModal
        abierto={eliminando !== null}
        titulo="Eliminar pregunta"
        mensaje={
          eliminando ? `Vas a eliminar la pregunta "${eliminando.question}". Esta acción no se puede deshacer.` : ""
        }
        textoConfirmar="Eliminar"
        cargando={cargandoEliminar}
        onCancelar={() => setEliminando(null)}
        onConfirmar={eliminar}
      />
    </div>
  );
}
