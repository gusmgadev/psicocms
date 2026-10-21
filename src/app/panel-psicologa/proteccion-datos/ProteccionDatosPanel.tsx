"use client";

import { useState } from "react";
import { Campo, useToast } from "@/components/ui";
import EditorWysiwyg from "@/components/panel/EditorWysiwyg";
import { guardarPlantillaProteccionAction } from "@/actions/proteccion-datos";
import { sanitizarHtml } from "@/lib/sanitizar";
import { PLANTILLA_DEFECTO } from "@/lib/plantilla-proteccion";
import type { DatosResponsable, PlantillaProteccion } from "@/services/proteccion-datos";
import { formatearFechaCadena } from "@/lib/fechas";
import styles from "./proteccion.module.css";

interface Props {
  plantilla: PlantillaProteccion;
  responsable: DatosResponsable | null;
}

export default function ProteccionDatosPanel({ plantilla, responsable }: Props) {
  const { mostrar } = useToast();

  const inicial = plantilla.contentHtml.trim() || PLANTILLA_DEFECTO;
  const [contentHtml, setContentHtml] = useState(inicial);
  const [guardando, setGuardando] = useState(false);
  const [pestana, setPestana] = useState<"editar" | "preview">("editar");
  const [version, setVersion] = useState(plantilla.version);
  const [actualizadoEn, setActualizadoEn] = useState(plantilla.updatedAt);

  const usarModelo = () => {
    setContentHtml(PLANTILLA_DEFECTO);
    setPestana("editar");
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const res = await guardarPlantillaProteccionAction(contentHtml);
    setGuardando(false);

    if (!res.ok || !res.plantilla) {
      mostrar(res.error ?? "No se pudo guardar la plantilla.", "error");
      return;
    }
    setVersion(res.plantilla.version);
    setActualizadoEn(res.plantilla.updatedAt);
    mostrar("Plantilla guardada.");
  };

  const descargarVacia = () => {
    window.open("/panel-psicologa/proteccion-datos/imprimir", "_blank", "noopener");
  };

  return (
    <form className={styles.pagina} onSubmit={guardar}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Protección de datos</h1>
          <p className={styles.subtitulo}>
            Edita la política de privacidad que se usa como base de los documentos de consentimiento y de la
            protección de datos de cada paciente.
          </p>
        </div>
      </div>

      <div className={styles.rejilla}>
        <div className={styles.principal}>
          <div className={styles.pestanas} role="tablist" aria-label="Contenido de la plantilla">
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
              placeholder="Escribe aquí la política de protección de datos…"
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
              {actualizadoEn ? ` · ${formatearFechaCadena(actualizadoEn.slice(0, 10))}` : " · sin guardar aún"}
            </p>
            <p className="campo-hint">
              Cada guardado crea una versión nueva, para que puedas recuperar un contenido anterior si hace falta.
            </p>
          </div>

          <div className="tarjeta">
            <h2 className={styles.tituloLateral}>Descargar en PDF</h2>
            <p className="campo-hint">
              Descarga la plantilla vacía (con huecos en blanco para rellenar a mano con los datos del paciente).
            </p>
            <button type="button" className="boton boton--secundario boton--bloque" onClick={descargarVacia}>
              <i className="fa fa-file-pdf" aria-hidden="true"></i>
              Descargar plantilla vacía (PDF)
            </button>
          </div>

          <div className="tarjeta">
            <h2 className={styles.tituloLateral}>Responsable del tratamiento</h2>
            {responsable ? (
              <ul className={styles.listaResponsable}>
                <li>
                  <strong>{responsable.fullName}</strong>
                </li>
                {responsable.licenseNumber && <li>Colgiado: {responsable.licenseNumber}</li>}
                {responsable.address && <li>{responsable.address}</li>}
                {responsable.phonePublic && <li>Tel: {responsable.phonePublic}</li>}
                {responsable.emailPublic && <li>{responsable.emailPublic}</li>}
              </ul>
            ) : (
              <p className="campo-hint">Completa tu perfil para que estos datos aparezcan en el PDF.</p>
            )}
            <p className="campo-hint">
              Los textos legales deben revisarlos tú o un profesional del derecho: el sistema solo los muestra y
              gestiona.
            </p>
          </div>

          <div className={styles.accionesLateral}>
            <button type="submit" className="boton boton--primario boton--bloque" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar plantilla"}
            </button>
            {!plantilla.contentHtml.trim() && (
              <button type="button" className="boton boton--secundario boton--bloque" onClick={usarModelo}>
                <i className="fa fa-rotate-left" aria-hidden="true"></i>
                Restaurar modelo inicial
              </button>
            )}
          </div>
        </aside>
      </div>
    </form>
  );
}
