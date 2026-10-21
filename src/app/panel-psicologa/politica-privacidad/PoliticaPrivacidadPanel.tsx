"use client";

import { useState } from "react";
import { useToast } from "@/components/ui";
import EditorWysiwyg from "@/components/panel/EditorWysiwyg";
import { guardarPoliticaPrivacidadAction } from "@/actions/politica-privacidad";
import { sanitizarHtml } from "@/lib/sanitizar";
import { formatearFechaCadena } from "@/lib/fechas";
import type { PoliticaPrivacidad } from "@/services/politica-privacidad";
import styles from "./politica.module.css";

interface Props {
  politica: PoliticaPrivacidad;
}

export default function PoliticaPrivacidadPanel({ politica }: Props) {
  const { mostrar } = useToast();

  const [contentHtml, setContentHtml] = useState(politica.contentHtml);
  const [guardando, setGuardando] = useState(false);
  const [pestana, setPestana] = useState<"editar" | "preview">("editar");
  const [version, setVersion] = useState(politica.version);
  const [actualizadoEn, setActualizadoEn] = useState(politica.updatedAt);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    const res = await guardarPoliticaPrivacidadAction(contentHtml);
    setGuardando(false);

    if (!res.ok || !res.politica) {
      mostrar(res.error ?? "No se pudo guardar la política.", "error");
      return;
    }
    setVersion(res.politica.version);
    setActualizadoEn(res.politica.updatedAt);
    mostrar("Política de privacidad guardada.");
  };

  return (
    <form className={styles.pagina} onSubmit={(e) => void guardar(e)}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Política de privacidad</h1>
          <p className={styles.subtitulo}>
            Texto que verán las visitas en <strong>/politica-privacidad</strong> y que enlazará el
            formulario de reserva cuando una paciente pida cita.
          </p>
        </div>
      </div>

      <div className={styles.rejilla}>
        <div className={styles.principal}>
          <div className={styles.pestanas} role="tablist" aria-label="Contenido de la política">
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
              valor={contentHtml}
              onChange={setContentHtml}
              placeholder="Escribe aquí la política de privacidad…"
            />
          ) : (
            <div className={styles.preview}>
              {contentHtml.trim() ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizarHtml(contentHtml) }} />
              ) : (
                <p className="campo-hint">Todavía no hay contenido que previsualizar.</p>
              )}
            </div>
          )}
        </div>

        <aside className={styles.lateral}>
          <div className="tarjeta">
            <h2 className={styles.tituloLateral}>Versión actual</h2>
            <p className={styles.datoLateral}>
              <strong>v. {version}</strong>
              {actualizadoEn
                ? ` · ${formatearFechaCadena(actualizadoEn.slice(0, 10))}`
                : " · sin guardar aún"}
            </p>
            <p className="campo-hint">
              Cada guardado crea una versión nueva y actualiza la página pública.
            </p>
          </div>

          <div className="tarjeta">
            <h2 className={styles.tituloLateral}>Aviso importante</h2>
            <p className="campo-hint">
              Los textos legales debe revisarlos tú o un profesional del derecho: el sistema solo los
              muestra y gestiona, no sustituye el asesoramiento legal.
            </p>
          </div>

          <div className={styles.accionesLateral}>
            <button type="submit" className="boton boton--primario boton--bloque" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar política"}
            </button>
            <a
              href="/politica-privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="boton boton--secundario boton--bloque"
            >
              <i className="fa fa-arrow-up-right-from-square" aria-hidden="true"></i>
              Ver página pública
            </a>
          </div>
        </aside>
      </div>
    </form>
  );
}
