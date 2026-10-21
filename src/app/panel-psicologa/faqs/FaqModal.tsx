"use client";

import { useEffect, useState } from "react";
import { Modal, useToast } from "@/components/ui";
import EditorWysiwyg from "@/components/panel/EditorWysiwyg";
import { crearFaqAction, editarFaqAction } from "@/actions/faqs";
import { sanitizarHtml } from "@/lib/sanitizar";
import type { FaqFila, InputFaq } from "@/services/faqs";
import styles from "./faqs.module.css";

interface Props {
  abierto: boolean;
  editando: FaqFila | null;
  onCerrar: () => void;
  onGuardado: () => Promise<void> | void;
}

const VACIO: InputFaq = { question: "", answerHtml: "", category: "", isActive: true };

export default function FaqModal({ abierto, editando, onCerrar, onGuardado }: Props) {
  const { mostrar } = useToast();

  const [question, setQuestion] = useState(VACIO.question);
  const [answerHtml, setAnswerHtml] = useState(VACIO.answerHtml);
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [pestana, setPestana] = useState<"editar" | "preview">("editar");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setQuestion(editando?.question ?? VACIO.question);
    setAnswerHtml(editando?.answerHtml ?? VACIO.answerHtml);
    setCategory(editando?.category ?? "");
    setIsActive(editando?.isActive ?? true);
    setPestana("editar");
  }, [abierto, editando]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const input: InputFaq = { question, answerHtml, category, isActive };
    const res = editando ? await editarFaqAction(editando.id, input) : await crearFaqAction(input);
    setGuardando(false);

    if (!res.ok || !res.faq) {
      mostrar(res.error ?? "No se pudo guardar la pregunta.", "error");
      return;
    }
    mostrar(editando ? "Pregunta actualizada." : "Pregunta creada.");
    await onGuardado();
    onCerrar();
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={editando ? "Editar pregunta" : "Nueva pregunta"}
    >
      <form className={styles.form} onSubmit={guardar}>
        <div>
          <label htmlFor="faq-pregunta" className="campo-label">
            Pregunta *
          </label>
          <input
            id="faq-pregunta"
            className="campo-control"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={300}
            required
          />
        </div>

        <div>
          <label htmlFor="faq-categoria" className="campo-label">
            Categoría
          </label>
          <input
            id="faq-categoria"
            className="campo-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={80}
            placeholder="Ej.: Citas, Terapia, Pagos…"
          />
          <p className="campo-hint">Opcional. Ayuda a agrupar las preguntas en la web.</p>
        </div>

        <div className={styles.pestanas} role="tablist" aria-label="Contenido de la respuesta">
          <button
            type="button"
            role="tab"
            aria-selected={pestana === "editar"}
            className={`${styles.pestana} ${pestana === "editar" ? styles.pestanaActiva : ""}`}
            onClick={() => setPestana("editar")}
          >
            <i className="fa fa-pen" aria-hidden="true"></i> Editar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pestana === "preview"}
            className={`${styles.pestana} ${pestana === "preview" ? styles.pestanaActiva : ""}`}
            onClick={() => setPestana("preview")}
          >
            <i className="fa fa-eye" aria-hidden="true"></i> Vista previa
          </button>
        </div>

        {pestana === "editar" ? (
          <EditorWysiwyg
            valor={answerHtml}
            onChange={setAnswerHtml}
            altura={260}
            placeholder="Escribe aquí la respuesta…"
          />
        ) : (
          <div className={styles.preview}>
            {answerHtml.trim() ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizarHtml(answerHtml) }} />
            ) : (
              <p className="campo-hint">Todavía no hay respuesta que previsualizar.</p>
            )}
          </div>
        )}

        <label className="fila-check">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Visible en la web
        </label>

        <div className={styles.formAcciones}>
          <button type="submit" className="boton boton--primario" disabled={guardando}>
            {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear pregunta"}
          </button>
          <button type="button" className="boton boton--secundario" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}
