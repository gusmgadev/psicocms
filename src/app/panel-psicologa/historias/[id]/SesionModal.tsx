"use client";

import { useEffect, useRef, useState } from "react";
import { Campo, Modal, useToast } from "@/components/ui";
import EditorWysiwyg from "@/components/panel/EditorWysiwyg";
import {
  crearSesionHistoriaAction,
  editarSesionHistoriaAction,
  subirArchivoHistoriaAction,
  listarCitasParaNotaAction,
} from "@/actions/historias";
import type { CitaParaNota, SesionHistoria } from "@/services/historias";
import { hoyEnZona, partesParaInputs, formatearFecha, formatearHora } from "@/lib/fechas";
import styles from "./historia-paciente.module.css";

interface Props {
  abierto: boolean;
  editando: SesionHistoria | null;
  patientId: string;
  timezone: string;
  citaInicial?: string | null;
  onCerrar: () => void;
  onGuardado: (sesion: SesionHistoria, esNuevo: boolean) => void;
}

export default function SesionModal({
  abierto,
  editando,
  patientId,
  timezone,
  citaInicial,
  onCerrar,
  onGuardado,
}: Props) {
  const { mostrar } = useToast();
  const [fecha, setFecha] = useState("");
  const [contenido, setContenido] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [citaId, setCitaId] = useState("");
  const [citas, setCitas] = useState<CitaParaNota[]>([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);
  const inputFile = useRef<HTMLInputElement>(null);
  const citaInicialRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!abierto) return;
    if (editando) {
      setFecha(partesParaInputs(editando.fechaIso, timezone).fecha);
      setContenido(editando.contentHtml);
      setCitaId(editando.appointmentId ?? "");
      citaInicialRef.current = null;
    } else {
      setFecha(hoyEnZona(timezone));
      setContenido("");
      setCitaId(citaInicial ?? "");
      citaInicialRef.current = citaInicial ?? null;
    }
    setArchivos([]);
    setError(undefined);
    setCitas([]);
  }, [abierto, editando, timezone, citaInicial]);

  useEffect(() => {
    if (!abierto || !patientId) return;
    let cancelado = false;
    setCargandoCitas(true);
    listarCitasParaNotaAction(patientId)
      .then((lista) => {
        if (cancelado) return;
        setCitas(lista);
        const pre = citaInicialRef.current;
        if (pre) {
          const encontrada = lista.find((c) => c.id === pre);
          if (encontrada) {
            setFecha(partesParaInputs(encontrada.fechaIso, timezone).fecha);
          }
          citaInicialRef.current = null;
        }
      })
      .catch(() => {
        if (!cancelado) setCitas([]);
      })
      .finally(() => {
        if (!cancelado) setCargandoCitas(false);
      });
    return () => {
      cancelado = true;
    };
  }, [abierto, patientId, timezone]);

  const cambiarCita = (id: string) => {
    setCitaId(id);
    if (!id) return;
    const cita = citas.find((c) => c.id === id);
    if (cita) setFecha(partesParaInputs(cita.fechaIso, timezone).fecha);
  };

  const onArchivos = (lista: FileList | null) => {
    if (!lista) return;
    setArchivos((prev) => [...prev, ...Array.from(lista)]);
    if (inputFile.current) inputFile.current.value = "";
  };

  const quitarSeleccionado = (indice: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== indice));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setGuardando(true);

    let sesion: SesionHistoria | null = null;
    if (editando) {
      const res = await editarSesionHistoriaAction(editando.id, fecha, contenido, citaId || null);
      if (!res.ok || !res.sesion) {
        setGuardando(false);
        setError(res.error ?? "No se pudo guardar la nota.");
        return;
      }
      sesion = { ...res.sesion, archivos: editando.archivos };
    } else {
      const res = await crearSesionHistoriaAction(patientId, fecha, contenido, citaId || null);
      if (!res.ok || !res.sesion) {
        setGuardando(false);
        setError(res.error ?? "No se pudo crear la nota.");
        return;
      }
      sesion = res.sesion;
    }

    let fallos = 0;
    for (const archivo of archivos) {
      const fd = new FormData();
      fd.append("archivo", archivo);
      const res = await subirArchivoHistoriaAction(sesion.id, fd);
      if (res.ok && res.archivo) {
        sesion = { ...sesion, archivos: [...sesion.archivos, res.archivo] };
      } else {
        fallos += 1;
        mostrar(res.error ?? `No se pudo subir «${archivo.name}».`, "error");
      }
    }

    setGuardando(false);
      mostrar(editando ? "Nota actualizada." : "Nota añadida.");
    if (fallos > 0) {
      mostrar(`${fallos} archivo(s) no se pudieron subir; puedes adjuntarlos desde la nota.`, "info");
    }
    onGuardado(sesion, !editando);
    onCerrar();
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={editando ? "Editar nota" : "Nueva nota"}
      pie={
        <>
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-sesion" className="boton boton--primario" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </>
      }
    >
      <form id="form-sesion" className={styles.formulario} onSubmit={guardar}>
        <Campo
          id="ses-cita"
          etiqueta="Cita de origen (opcional)"
          pista="Si esta nota corresponde a una cita ya realizada, selecciónala para enlazarla. La fecha de la nota es propia y no cambia si luego mueves la cita."
        >
          <select
            id="ses-cita"
            className="campo-control"
            value={citaId}
            onChange={(e) => cambiarCita(e.target.value)}
            disabled={cargandoCitas}
          >
            <option value="">{cargandoCitas ? "Cargando citas..." : "Sin cita"}</option>
            {citas.map((c) => (
              <option key={c.id} value={c.id}>
                {formatearFecha(c.fechaIso, timezone)} · {formatearHora(c.fechaIso, timezone)}–
                {formatearHora(c.finIso, timezone)} · {c.modality === "online" ? "Online" : "Presencial"}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id="ses-fecha" etiqueta="Fecha de la nota" requerido>
          <input
            id="ses-fecha"
            type="date"
            className="campo-control"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </Campo>

        <Campo id="ses-contenido" etiqueta="Anotaciones de la sesión" requerido>
          <EditorWysiwyg
            valor={contenido}
            onChange={setContenido}
            altura={320}
            placeholder="Escribe las anotaciones de la nota…"
          />
        </Campo>

        <Campo
          id="ses-archivos"
          etiqueta="Adjuntar archivos (opcional)"
          pista="Fotos o PDFs escaneados de esta nota. Máximo 15 MB por archivo."
        >
          <input
            id="ses-archivos"
            ref={inputFile}
            type="file"
            className="campo-control"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => onArchivos(e.target.files)}
          />
        </Campo>

        {archivos.length > 0 && (
          <ul className={styles.listaSeleccion}>
            {archivos.map((a, i) => (
              <li key={`${a.name}-${i}`} className={styles.itemSeleccion}>
                <span className={styles.itemNombre}>{a.name}</span>
                <button
                  type="button"
                  className={styles.itemQuitar}
                  onClick={() => quitarSeleccionado(i)}
                  title="Quitar de la selección"
                >
                  <i className="fa fa-xmark" aria-hidden="true"></i>
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p className="alerta alerta--error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
