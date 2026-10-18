"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmarModal, EmptyState, useToast } from "@/components/ui";
import SesionModal from "./SesionModal";
import {
  borrarSesionHistoriaAction,
  borrarArchivoHistoriaAction,
  subirArchivoHistoriaAction,
  urlFirmadaArchivoAction,
} from "@/actions/historias";
import type { ArchivoHistoria, HistoriaPaciente as HistoriaDatos, SesionHistoria } from "@/services/historias";
import { sanitizarHtml } from "@/lib/sanitizar";
import { formatearFecha, formatearHora } from "@/lib/fechas";
import styles from "./historia-paciente.module.css";

function formatearTamano(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

interface Props {
  inicial: HistoriaDatos;
  timezone: string;
  citaPreseleccionada?: string | null;
}

export default function HistoriaPaciente({ inicial, timezone, citaPreseleccionada }: Props) {
  const { mostrar } = useToast();
  const router = useRouter();

  const [sesiones, setSesiones] = useState<SesionHistoria[]>(inicial.sesiones);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<SesionHistoria | null>(null);
  const [borrando, setBorrando] = useState<SesionHistoria | null>(null);
  const [quitando, setQuitando] = useState<{ sesionId: string; archivo: ArchivoHistoria } | null>(null);
  const [cargando, setCargando] = useState(false);
  const [subiendoEn, setSubiendoEn] = useState<string | null>(null);

  useEffect(() => {
    if (citaPreseleccionada) {
      setEditando(null);
      setModalAbierto(true);
    }
  }, [citaPreseleccionada]);

  const onGuardado = (sesion: SesionHistoria, esNuevo: boolean) => {
    setSesiones((prev) => {
      if (esNuevo) return [sesion, ...prev];
      return prev.map((s) => (s.id === sesion.id ? sesion : s));
    });
    router.refresh();
  };

  const confirmarBorrado = async () => {
    if (!borrando) return;
    setCargando(true);
    const res = await borrarSesionHistoriaAction(borrando.id);
    setCargando(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo eliminar la sesión.", "error");
      return;
    }
    setSesiones((prev) => prev.filter((s) => s.id !== borrando.id));
    setBorrando(null);
    mostrar("Sesión eliminada.");
    router.refresh();
  };

  const confirmarQuitarArchivo = async () => {
    if (!quitando) return;
    setCargando(true);
    const res = await borrarArchivoHistoriaAction(quitando.archivo.id);
    setCargando(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo quitar el archivo.", "error");
      return;
    }
    setSesiones((prev) =>
      prev.map((s) =>
        s.id === quitando.sesionId
          ? { ...s, archivos: s.archivos.filter((a) => a.id !== quitando.archivo.id) }
          : s
      )
    );
    setQuitando(null);
    mostrar("Archivo eliminado.");
    router.refresh();
  };

  const abrirArchivo = async (fileId: string) => {
    const res = await urlFirmadaArchivoAction(fileId);
    if (!res.ok || !res.url) {
      mostrar(res.error ?? "No se pudo abrir el archivo.", "error");
      return;
    }
    window.open(res.url, "_blank", "noopener,noreferrer");
  };

  const adjuntarArchivos = async (sesionId: string, lista: FileList | null) => {
    if (!lista || lista.length === 0) return;
    setSubiendoEn(sesionId);

    let adjuntos: ArchivoHistoria[] = [];
    for (const archivo of Array.from(lista)) {
      const fd = new FormData();
      fd.append("archivo", archivo);
      const res = await subirArchivoHistoriaAction(sesionId, fd);
      if (res.ok && res.archivo) {
        adjuntos = [...adjuntos, res.archivo];
      } else {
        mostrar(res.error ?? `No se pudo subir «${archivo.name}».`, "error");
      }
    }

    if (adjuntos.length > 0) {
      setSesiones((prev) =>
        prev.map((s) => (s.id === sesionId ? { ...s, archivos: [...s.archivos, ...adjuntos] } : s))
      );
      mostrar(adjuntos.length === 1 ? "Archivo adjuntado." : `${adjuntos.length} archivos adjuntados.`);
      router.refresh();
    }
    setSubiendoEn(null);
  };

  return (
    <div className={styles.pagina}>
      <Link href="/panel-psicologa/historias" className={styles.volver}>
        <i className="fa fa-arrow-left" aria-hidden="true"></i>
        Volver a historias
      </Link>

      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>
            Historia clínica
            <span className={styles.badgeTitulo}>{inicial.paciente.numero}</span>
          </h1>
          <p className={styles.subtitulo}>
            {inicial.paciente.nombre} · {sesiones.length} sesión(es) registrada(s). Estos datos solo son
            accesibles desde el panel con tu sesión iniciada.
          </p>
        </div>
        <div className={styles.cabeceraAcciones}>
          <Link href={`/panel-psicologa/pacientes/${inicial.paciente.id}`} className="boton boton--secundario">
            <i className="fa fa-id-card" aria-hidden="true"></i>
            Ver ficha del paciente
          </Link>
          <button
            type="button"
            className="boton boton--primario"
            onClick={() => {
              setEditando(null);
              setModalAbierto(true);
            }}
          >
            <i className="fa fa-plus" aria-hidden="true"></i>
            Nueva sesión
          </button>
        </div>
      </div>

      {sesiones.length === 0 ? (
        <EmptyState
          icono="fa-book-medical"
          titulo="Todavía no hay sesiones"
          descripcion="Añade la primera sesión para empezar el seguimiento de este paciente. Puedes escribir notas y adjuntar fotos o PDFs."
          accion={
            <button
              type="button"
              className="boton boton--primario"
              onClick={() => {
                setEditando(null);
                setModalAbierto(true);
              }}
            >
              <i className="fa fa-plus" aria-hidden="true"></i>
              Nueva sesión
            </button>
          }
        />
      ) : (
        <ol className={styles.lineaTiempo}>
          {sesiones.map((sesion) => (
            <li key={sesion.id} className={styles.tarjetaSesion}>
              <div className={styles.sesionCabecera}>
                <span className={styles.sesionFecha}>
                  <i className="fa fa-calendar-day" aria-hidden="true"></i>
                  {formatearFecha(sesion.fechaIso, timezone)}
                </span>
                {sesion.citaOrigen && (
                  <span className={styles.sesionCita} title="Cita de origen enlazada a esta nota">
                    <i className="fa fa-calendar-check" aria-hidden="true"></i>
                    Cita: {formatearFecha(sesion.citaOrigen.fechaIso, timezone)} ·{" "}
                    {formatearHora(sesion.citaOrigen.fechaIso, timezone)}–
                    {formatearHora(sesion.citaOrigen.finIso, timezone)} ·{" "}
                    {sesion.citaOrigen.modality === "online" ? "Online" : "Presencial"}
                  </span>
                )}
                <span className={styles.sesionAcciones}>
                  <label className={styles.adjuntarBoton} title="Adjuntar archivos a esta sesión">
                    <i className={`fa ${subiendoEn === sesion.id ? "fa-spinner fa-spin" : "fa-paperclip"}`} aria-hidden="true"></i>
                    <span className="sr-only">Adjuntar archivos</span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className={styles.inputOculto}
                      disabled={subiendoEn === sesion.id}
                      onChange={(e) => {
                        adjuntarArchivos(sesion.id, e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.accionBoton}
                    title="Editar sesión"
                    onClick={() => {
                      setEditando(sesion);
                      setModalAbierto(true);
                    }}
                  >
                    <i className="fa fa-pen" aria-hidden="true"></i>
                    <span className="sr-only">Editar sesión del {formatearFecha(sesion.fechaIso, timezone)}</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.accionBoton} ${styles.accionPeligro}`}
                    title="Eliminar sesión"
                    onClick={() => setBorrando(sesion)}
                  >
                    <i className="fa fa-trash" aria-hidden="true"></i>
                    <span className="sr-only">Eliminar sesión del {formatearFecha(sesion.fechaIso, timezone)}</span>
                  </button>
                </span>
              </div>

              <div
                className={styles.contenidoHtml}
                dangerouslySetInnerHTML={{ __html: sanitizarHtml(sesion.contentHtml) }}
              />

              {sesion.archivos.length > 0 && (
                <ul className={styles.listaArchivos}>
                  {sesion.archivos.map((archivo) => (
                    <li key={archivo.id} className={styles.itemArchivo}>
                      <span className={styles.itemArchivoIcono} aria-hidden="true">
                        <i className={`fa ${archivo.mimeType === "application/pdf" ? "fa-file-pdf" : "fa-file-image"}`}></i>
                      </span>
                      <span className={styles.itemArchivoInfo}>
                        <span className={styles.itemArchivoNombre}>{archivo.nombre}</span>
                        <small className={styles.itemArchivoMeta}>
                          {archivo.mimeType === "application/pdf" ? "PDF" : "Imagen"} ·{" "}
                          {formatearTamano(archivo.tamano)}
                        </small>
                      </span>
                      <span className={styles.itemArchivoAcciones}>
                        <button
                          type="button"
                          className={styles.accionBoton}
                          title="Abrir en una pestaña nueva"
                          onClick={() => abrirArchivo(archivo.id)}
                        >
                          <i className="fa fa-arrow-up-right-from-square" aria-hidden="true"></i>
                          <span className="sr-only">Abrir {archivo.nombre}</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.accionBoton} ${styles.accionPeligro}`}
                          title="Quitar archivo"
                          onClick={() => setQuitando({ sesionId: sesion.id, archivo })}
                        >
                          <i className="fa fa-trash" aria-hidden="true"></i>
                          <span className="sr-only">Quitar {archivo.nombre}</span>
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}

      <SesionModal
        abierto={modalAbierto}
        editando={editando}
        patientId={inicial.paciente.id}
        timezone={timezone}
        citaInicial={citaPreseleccionada}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={onGuardado}
      />

      <ConfirmarModal
        abierto={borrando !== null}
        onCancelar={() => setBorrando(null)}
        onConfirmar={confirmarBorrado}
        titulo="Eliminar sesión"
        mensaje={
          borrando
            ? `Se eliminará la sesión del ${formatearFecha(borrando.fechaIso, timezone)} y sus ${borrando.archivos.length} archivo(s) adjunto(s). Esta acción no se puede deshacer.`
            : ""
        }
        textoConfirmar="Eliminar sesión"
        cargando={cargando}
      />

      <ConfirmarModal
        abierto={quitando !== null}
        onCancelar={() => setQuitando(null)}
        onConfirmar={confirmarQuitarArchivo}
        titulo="Quitar archivo"
        mensaje={quitando ? `Se eliminará «${quitando.archivo.nombre}» de esta sesión. Esta acción no se puede deshacer.` : ""}
        textoConfirmar="Quitar archivo"
        cargando={cargando}
      />
    </div>
  );
}
