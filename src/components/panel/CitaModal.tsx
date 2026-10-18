"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Campo, Modal, useToast } from "@/components/ui";
import { crearCitaAction, editarCitaAction } from "@/actions/citas";
import type { CitaFila, EstadoCita, InputCita, PacienteSelector } from "@/services/citas";
import type { ConfigSesiones, Modalidad } from "@/services/disponibilidad";
import { hoyEnZona, instanteDesdeLocal, partesParaInputs } from "@/lib/fechas";
import styles from "./CitaModal.module.css";

function sinAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export const ETIQUETAS_ESTADO: Record<EstadoCita, string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No presentó",
};

export const ETIQUETAS_MODALIDAD: Record<Modalidad, string> = {
  online: "Online",
  inperson: "Presencial",
};

interface Props {
  abierto: boolean;
  editando: CitaFila | null;
  pacientes: PacienteSelector[];
  config: ConfigSesiones;
  timezone: string;
  inicial?: { fecha: string; hora: string } | null;
  onCerrar: () => void;
  onGuardado: () => void;
  onEliminar?: (cita: CitaFila) => void;
}

export default function CitaModal({ abierto, editando, pacientes, config, timezone, inicial, onCerrar, onGuardado, onEliminar }: Props) {
  const { mostrar } = useToast();

  const [pacienteId, setPacienteId] = useState("");
  const [nuevo, setNuevo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [desplegado, setDesplegado] = useState(false);
  const [modality, setModality] = useState<Modalidad>("online");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [status, setStatus] = useState<EstadoCita>("scheduled");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [guardando, setGuardando] = useState(false);
  const buscadorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    if (editando) {
      const partes = partesParaInputs(editando.startsAt, timezone);
      setPacienteId(editando.pacienteId);
      setNuevo(false);
      setNombre("");
      setTelefono("");
      setBusqueda("");
      setDesplegado(false);
      setModality(editando.modality);
      setFecha(partes.fecha);
      setHora(partes.hora);
      setStatus(editando.status);
      setMotivo(editando.reason ?? "");
    } else {
      setPacienteId("");
      setNuevo(false);
      setNombre("");
      setTelefono("");
      setBusqueda("");
      setDesplegado(false);
      setModality("online");
      setFecha(inicial?.fecha ?? hoyEnZona(timezone));
      setHora(inicial?.hora ?? "");
      setStatus("scheduled");
      setMotivo("");
    }
    setError(undefined);
  }, [abierto, editando, timezone, inicial]);

  useEffect(() => {
    if (!desplegado) return;
    const alPulsarFuera = (e: MouseEvent) => {
      if (buscadorRef.current && !buscadorRef.current.contains(e.target as Node)) {
        setDesplegado(false);
      }
    };
    document.addEventListener("mousedown", alPulsarFuera);
    return () => document.removeEventListener("mousedown", alPulsarFuera);
  }, [desplegado]);

  const pacienteSeleccionado = useMemo(
    () => pacientes.find((p) => p.id === pacienteId) ?? null,
    [pacientes, pacienteId],
  );

  const resultados = useMemo(() => {
    const q = sinAcentos(busqueda.trim());
    if (!q) return [];
    const digitos = q.replace(/\D/g, "");
    return pacientes
      .filter((p) => {
        const coincideNombre = sinAcentos(p.nombre).includes(q);
        const coincideNumero = p.numero.toLowerCase().includes(q);
        const coincideTelefono = digitos.length >= 2 && p.telefono.includes(digitos);
        return coincideNombre || coincideNumero || coincideTelefono;
      })
      .slice(0, 8);
  }, [pacientes, busqueda]);

  const seleccionarPaciente = (p: PacienteSelector) => {
    setNuevo(false);
    setPacienteId(p.id);
    setBusqueda("");
    setNombre("");
    setTelefono("");
    setDesplegado(false);
    setError(undefined);
  };

  const elegirNuevo = (nombrePrefill?: string) => {
    setNuevo(true);
    setPacienteId("");
    setBusqueda("");
    if (nombrePrefill) setNombre(nombrePrefill);
    setDesplegado(false);
  };

  const limpiarPaciente = () => {
    setPacienteId("");
    setNuevo(false);
    setNombre("");
    setTelefono("");
    setBusqueda("");
  };

  const duracion = modality === "online" ? config.durationOnline : config.durationInperson;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(undefined);

    if (!fecha || !hora) {
      setError("Indica la fecha y la hora de la cita.");
      return;
    }
    if (nuevo) {
      if (nombre.trim().length < 2 || nombre.trim().length > 100) {
        setError("El nombre del paciente debe tener entre 2 y 100 caracteres.");
        return;
      }
      if (!/^\d{6,15}$/.test(telefono.replace(/\D/g, ""))) {
        setError("El teléfono debe contener solo números (entre 6 y 15 dígitos).");
        return;
      }
    } else if (!pacienteId) {
      setError("Selecciona un paciente o crea uno nuevo.");
      return;
    }
    if (motivo.length > 500) {
      setError("El motivo es demasiado largo (máximo 500 caracteres).");
      return;
    }
    if (status === "scheduled" && instanteDesdeLocal(fecha, hora, timezone).getTime() < Date.now()) {
      setError(
        "No se pueden programar citas en el pasado. Si quieres registrar una sesión pasada, cambia el estado a Completada, No presentó o Cancelada.",
      );
      return;
    }

    const input: InputCita = {
      modality,
      fecha,
      hora,
      status,
      reason: motivo.trim() || undefined,
      ...(nuevo ? { nuevoPaciente: { nombre: nombre.trim(), telefono } } : { patientId: pacienteId }),
    };

    setGuardando(true);
    const res = editando ? await editarCitaAction(editando.id, input) : await crearCitaAction(input);
    setGuardando(false);

    if (!res.ok) {
      setError(res.error ?? "No se pudo guardar la cita.");
      return;
    }

    if (res.aviso) mostrar(res.aviso, "info");
    mostrar(editando ? "Cita actualizada." : "Cita creada.");
    onGuardado();
    onCerrar();
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={editando ? "Editar cita" : "Nueva cita"}
      pie={
        <>
          {onEliminar && editando && (
            <button
              type="button"
              className="boton boton--peligro"
              onClick={() => onEliminar(editando)}
              disabled={guardando}
            >
              Eliminar
            </button>
          )}
          <button type="button" className="boton boton--secundario" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </button>
          <button type="submit" form="form-cita" className="boton boton--primario" disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar cita"}
          </button>
        </>
      }
    >
      <form id="form-cita" className={styles.formulario} onSubmit={guardar}>
        <Campo
          id="cita-paciente"
          etiqueta="Paciente"
          requerido
          pista="Busca por nombre, teléfono o número de ficha. Si no existe, créalo en el momento."
        >
          <div className={styles.buscador} ref={buscadorRef}>
            {pacienteSeleccionado && !nuevo ? (
              <div className={styles.pacienteSeleccionado}>
                <span className={styles.pacienteSeleccionadoTexto}>
                  <strong>{pacienteSeleccionado.numero}</strong> · {pacienteSeleccionado.nombre} ·{" "}
                  {pacienteSeleccionado.telefono}
                </span>
                <button
                  type="button"
                  className={styles.pacienteQuitar}
                  onClick={limpiarPaciente}
                  title="Quitar paciente"
                >
                  <i className="fa fa-xmark" aria-hidden="true"></i>
                  <span className="sr-only">Quitar paciente seleccionado</span>
                </button>
              </div>
            ) : (
              <input
                id="cita-paciente"
                type="text"
                className="campo-control"
                role="combobox"
                aria-expanded={desplegado}
                aria-controls="cita-paciente-lista"
                autoComplete="off"
                placeholder={nuevo ? "Nuevo paciente: rellena nombre y teléfono abajo" : "Buscar nombre, teléfono o ficha..."}
                value={nuevo ? nombre : busqueda}
                disabled={nuevo}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setDesplegado(true);
                }}
                onFocus={() => setDesplegado(true)}
              />
            )}

            {desplegado && !nuevo && !pacienteSeleccionado && (
              <ul className={styles.listaResultados} id="cita-paciente-lista" role="listbox">
                {resultados.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={styles.resultado}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        seleccionarPaciente(p);
                      }}
                    >
                      <span className={styles.resultadoPrincipal}>
                        <strong>{p.nombre}</strong>
                        <small>
                          {p.numero} · {p.telefono}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    type="button"
                    className={`${styles.resultado} ${styles.resultadoNuevo}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      elegirNuevo(busqueda.trim() || undefined);
                    }}
                  >
                    <i className="fa fa-user-plus" aria-hidden="true"></i>
                    {busqueda.trim() ? `Crear «${busqueda.trim()}» como nuevo paciente` : "+ Nuevo paciente"}
                  </button>
                </li>
              </ul>
            )}
          </div>
        </Campo>

        {nuevo && (
          <div className={styles.dosColumnas}>
            <Campo id="cita-nombre" etiqueta="Nombre del paciente" requerido>
              <input
                id="cita-nombre"
                type="text"
                className="campo-control"
                maxLength={100}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </Campo>
            <Campo id="cita-telefono" etiqueta="Teléfono" requerido>
              <input
                id="cita-telefono"
                type="tel"
                className="campo-control"
                inputMode="numeric"
                placeholder="Solo números"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </Campo>
            <button type="button" className={`boton boton--secundario ${styles.cancelarNuevo}`} onClick={limpiarPaciente}>
              <i className="fa fa-arrow-left" aria-hidden="true"></i>
              Buscar paciente existente
            </button>
          </div>
        )}

        <fieldset className={styles.modalidadGrupo}>
          <legend>Modalidad</legend>
          {(["online", "inperson"] as Modalidad[]).map((m) => (
            <label key={m} className={styles.modalidadOpcion}>
              <input
                type="radio"
                name="modalidad"
                value={m}
                checked={modality === m}
                onChange={() => setModality(m)}
              />
              <i className={`fa ${m === "online" ? "fa-video" : "fa-location-dot"}`} aria-hidden="true"></i>
              {ETIQUETAS_MODALIDAD[m]}
            </label>
          ))}
        </fieldset>

        <div className={styles.dosColumnas}>
          <Campo id="cita-fecha" etiqueta="Fecha" requerido>
            <input
              id="cita-fecha"
              type="date"
              className="campo-control"
              value={fecha}
              min={!editando && status === "scheduled" ? hoyEnZona(timezone) : undefined}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Campo>
          <Campo id="cita-hora" etiqueta="Hora de inicio" requerido pista={`La cita durará ${duracion} min.`}>
            <input
              id="cita-hora"
              type="time"
              className="campo-control"
              step={300}
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </Campo>
        </div>

        <Campo id="cita-estado" etiqueta="Estado">
          <select
            id="cita-estado"
            className="campo-control"
            value={status}
            onChange={(e) => setStatus(e.target.value as EstadoCita)}
          >
            {(Object.keys(ETIQUETAS_ESTADO) as EstadoCita[]).map((s) => (
              <option key={s} value={s}>
                {ETIQUETAS_ESTADO[s]}
              </option>
            ))}
          </select>
        </Campo>

        {editando && (editando.notaId || status === "completed") && (
          <div className={styles.notaCita}>
            <i className="fa fa-notes-medical" aria-hidden="true"></i>
            {editando.notaId ? (
              <Link href={`/panel-psicologa/historias/${editando.pacienteId}`}>Ver nota en la historia</Link>
            ) : (
              <Link href={`/panel-psicologa/historias/${editando.pacienteId}?cita=${editando.id}`}>
                Escribir nota de sesión
              </Link>
            )}
          </div>
        )}

        <Campo id="cita-motivo" etiqueta="Motivo (opcional)">
          <textarea
            id="cita-motivo"
            className="campo-control"
            rows={3}
            maxLength={500}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </Campo>

        {error && (
          <p className="alerta alerta--error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
