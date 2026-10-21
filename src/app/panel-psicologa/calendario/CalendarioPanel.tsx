"use client";

import { useEffect, useRef, useState } from "react";
import { ConfirmarModal, useToast } from "@/components/ui";
import CitaModal from "@/components/panel/CitaModal";
import { editarCitaAction, eliminarCitaAction, listarCitasAction } from "@/actions/citas";
import type { CitaFila, PacienteSelector, ResultadoCitas } from "@/services/citas";
import type { ConfigSesiones } from "@/services/disponibilidad";
import { fechaLocalDePartes, partesDeFechaLocal, partesParaInputs, sumarDias } from "@/lib/fechas";
import { cargarCalendarJs, crearInstanciaCalendarJs, opcionesConEspañol } from "@/lib/calendarjs-loader";
import type { EventoCalendarJs, InstanciaCalendarJs, OpcionesCalendarJs } from "@/types/calendarjs";
import styles from "./calendario.module.css";

const COLOR_ONLINE = "#2563eb";
const COLOR_PRESENCIAL = "#059669";
const COLOR_NEUTRO = "#94a3b8";
const COLOR_COMPLETADA = "#64748b";

const RANGO_DIAS = 45;

interface Props {
  inicial: ResultadoCitas;
  pacientes: PacienteSelector[];
  timezone: string;
  config: ConfigSesiones;
}

function aEvento(cita: CitaFila, timezone: string): EventoCalendarJs {
  const inicio = partesParaInputs(cita.startsAt, timezone);
  const fin = partesParaInputs(cita.endsAt, timezone);
  const finalizada = cita.status === "cancelled" || cita.status === "no_show";
  const color =
    finalizada
      ? COLOR_NEUTRO
      : cita.status === "completed"
        ? COLOR_COMPLETADA
        : cita.modality === "online"
          ? COLOR_ONLINE
          : COLOR_PRESENCIAL;
  const modalidad = cita.modality === "online" ? "Online" : "Presencial";
  return {
    id: cita.id,
    title: cita.pacienteNombre || cita.pacienteNumero,
    from: fechaLocalDePartes(inicio.fecha, inicio.hora),
    to: fechaLocalDePartes(fin.fecha, fin.hora),
    description: `${cita.pacienteNumero} · ${modalidad}`,
    color,
  };
}

export default function CalendarioPanel({ inicial, pacientes, timezone, config }: Props) {
  const { mostrar } = useToast();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<CitaFila | null>(null);
  const [nuevaEn, setNuevaEn] = useState<{ fecha: string; hora: string } | null>(null);
  const [eliminando, setEliminando] = useState<CitaFila | null>(null);
  const [cargandoEliminar, setCargandoEliminar] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | undefined>(undefined);

  const contRef = useRef<HTMLDivElement | null>(null);
  const instanciaRef = useRef<InstanciaCalendarJs | null>(null);
  const citasMapaRef = useRef<Map<string, CitaFila>>(new Map());
  const timezoneRef = useRef(timezone);
  const inicialRef = useRef(inicial);
  const plantillaGestionadaRef = useRef<string | null>(null);
  const clicDerechoRef = useRef<{ hora: number; min: number } | null>(null);
  timezoneRef.current = timezone;
  inicialRef.current = inicial;

  const abrirNueva = (donde: { fecha: string; hora: string } | null) => {
    setEditando(null);
    setNuevaEn(donde);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setNuevaEn(null);
  };

  const sincronizar = (citas: CitaFila[]) => {
    const inst = instanciaRef.current;
    if (!inst) return;
    const tz = timezoneRef.current;
    const mapa = new Map<string, CitaFila>();
    const eventos = citas.map((c) => {
      mapa.set(c.id, c);
      return aEvento(c, tz);
    });
    citasMapaRef.current = mapa;
    inst.clearEvents(true, false);
    inst.addEvents(eventos, true, false);
  };

  const cargarRango = async (base?: Date) => {
    const ref = base ?? instanciaRef.current?.getCurrentDisplayDate() ?? new Date();
    const partes = partesDeFechaLocal(ref);
    const res = await listarCitasAction({
      desde: sumarDias(partes.fecha, -RANGO_DIAS),
      hasta: sumarDias(partes.fecha, RANGO_DIAS),
      porPagina: 500,
    });
    sincronizar(res.citas);
  };

  const revertir = (cita: CitaFila) => {
    const inst = instanciaRef.current;
    if (!inst) return;
    const tz = timezoneRef.current;
    const inicio = partesParaInputs(cita.startsAt, tz);
    const fin = partesParaInputs(cita.endsAt, tz);
    inst.updateEventDateTimes(
      cita.id,
      fechaLocalDePartes(inicio.fecha, inicio.hora),
      fechaLocalDePartes(fin.fecha, fin.hora),
      null,
      true,
      false,
    );
  };

  useEffect(() => {
    let destruido = false;

    const alClicarEvento = (evento: EventoCalendarJs) => {
      const cita = citasMapaRef.current.get(evento.id);
      if (cita) {
        setEditando(cita);
        setModalAbierto(true);
      }
    };

    const alEditarEvento = async (evento: EventoCalendarJs) => {
      const cita = citasMapaRef.current.get(evento.id);
      if (!cita) return;

      const inicio = partesParaInputs(cita.startsAt, timezoneRef.current);
      const nuevos = partesDeFechaLocal(evento.from);
      const duracionOriginal = Math.round((new Date(cita.endsAt).getTime() - new Date(cita.startsAt).getTime()) / 60000);
      const duracionNueva = Math.round((evento.to.getTime() - evento.from.getTime()) / 60000);

      if (duracionNueva !== duracionOriginal) {
        mostrar("La duración la fija la configuración de sesiones; solo puedes mover la cita.", "error");
        revertir(cita);
        return;
      }

      const cambioInicio = nuevos.fecha !== inicio.fecha || nuevos.hora !== inicio.hora;
      if (!cambioInicio) return;

      const res = await editarCitaAction(cita.id, {
        modality: cita.modality,
        fecha: nuevos.fecha,
        hora: nuevos.hora,
        status: cita.status,
        reason: cita.reason ?? undefined,
        patientId: cita.pacienteId,
      });

      if (!res.ok) {
        mostrar(res.error ?? "No se pudo mover la cita. Vuelve a su horario original.", "error");
        revertir(cita);
        return;
      }
      mostrar("Cita movida.");
      await cargarRango();
    };

    const solapaOcupada = (desde: Date, hasta: Date): boolean => {
      const inicio = desde.getTime();
      const fin = hasta.getTime();
      for (const cita of citasMapaRef.current.values()) {
        if (cita.status !== "scheduled" && cita.status !== "completed") continue;
        const cIni = new Date(cita.startsAt).getTime();
        const cFin = new Date(cita.endsAt).getTime();
        if (cIni < fin && cFin > inicio) return true;
      }
      return false;
    };

    const alContextMenu = (ev: MouseEvent) => {
      const destino = ev.target instanceof Element ? ev.target : null;
      const celdaSemana = destino?.closest('[id^="calendar-week-day-"]') ?? null;
      const areaDia = destino?.closest(".contents-events") ?? null;
      const medidor = celdaSemana instanceof HTMLElement ? celdaSemana : areaDia instanceof HTMLElement ? areaDia : null;
      if (!medidor) {
        clicDerechoRef.current = null;
        return;
      }
      const rect = medidor.getBoundingClientRect();
      if (rect.height <= 0) {
        clicDerechoRef.current = null;
        return;
      }
      const total = Math.round((ev.clientY - rect.top) / (rect.height / 1440));
      const limitado = Math.min(1439, Math.max(0, total));
      clicDerechoRef.current = { hora: Math.floor(limitado / 60), min: limitado % 60 };
    };

    const cont = contRef.current;
    cont?.addEventListener("contextmenu", alContextMenu, true);

    const baseOpciones: OpcionesCalendarJs = {
      manualEditingEnabled: true,
      dragAndDropForEventsEnabled: true,
      popUpNotificationsEnabled: false,
      exportEventsEnabled: false,
      importEventsEnabled: false,
      configurationDialogEnabled: false,
      searchEnabled: false,
      showHolidays: false,
      showTimesInMainCalendarEvents: true,
      startOfWeekDay: 0,
      events: {
        onEventClick: alClicarEvento,
        onEventUpdated: alEditarEvento,
        onEventAdded: (evento) => {
          if (citasMapaRef.current.has(evento.id)) return;
          const id = evento.id;
          const desde = new Date(evento.from);
          const hasta = new Date(evento.to);
          queueMicrotask(() => {
            const clic = clicDerechoRef.current;
            clicDerechoRef.current = null;
            if (plantillaGestionadaRef.current === id) {
              plantillaGestionadaRef.current = null;
              return;
            }
            instanciaRef.current?.removeEvent(id, true, false);
            let inicio = desde;
            let fin = hasta;
            if (clic) {
              const duracion = hasta.getTime() - desde.getTime();
              inicio = new Date(desde);
              inicio.setHours(clic.hora, clic.min, 0, 0);
              fin = new Date(inicio.getTime() + duracion);
            }
            if (solapaOcupada(inicio, fin)) {
              mostrar("No se puede pegar ahí: ese horario ya está ocupado. Elige otro hueco.", "error");
              return;
            }
            abrirNueva(partesDeFechaLocal(inicio));
          });
        },
        onBeforeEventAddEdit: (evento) => {
          if (evento && citasMapaRef.current.has(evento.id)) {
            alClicarEvento(evento);
            return;
          }
          if (evento) {
            instanciaRef.current?.removeEvent(evento.id, true, false);
            plantillaGestionadaRef.current = evento.id;
          }
          abrirNueva(evento ? partesDeFechaLocal(evento.from) : null);
        },
        onPreviousMonth: (fecha) => void cargarRango(fecha),
        onNextMonth: (fecha) => void cargarRango(fecha),
        onToday: () => void cargarRango(),
        onSetDate: (fecha) => void cargarRango(fecha),
      },
    };

    cargarCalendarJs()
      .then(() => {
        if (destruido || !contRef.current) return;
        const opciones = opcionesConEspañol(baseOpciones);
        instanciaRef.current = crearInstanciaCalendarJs(contRef.current, opciones);
        if (!instanciaRef.current) {
          setErrorCarga("No se pudo cargar el calendario. Recarga la página para intentarlo de nuevo.");
          return;
        }
        sincronizar(inicialRef.current.citas);
      })
      .catch(() => {
        setErrorCarga("No se pudo cargar el calendario. Recarga la página para intentarlo de nuevo.");
      });

    return () => {
      destruido = true;
      cont?.removeEventListener("contextmenu", alContextMenu, true);
      instanciaRef.current?.destroy();
      instanciaRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eliminar = async () => {
    if (!eliminando) return;
    setCargandoEliminar(true);
    const res = await eliminarCitaAction(eliminando.id);
    setCargandoEliminar(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo eliminar la cita.", "error");
      return;
    }
    setEliminando(null);
    mostrar("Cita eliminada.");
    await cargarRango();
  };

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Calendario</h1>
          <p className={styles.subtitulo}>
            Arrastra una cita para cambiar su hora. Haz clic en una cita para editarla y doble clic en un hueco libre
            para crear una nueva.
          </p>
        </div>
        <button
          type="button"
          className="boton boton--primario"
          onClick={() => abrirNueva(null)}
        >
          <i className="fa fa-plus" aria-hidden="true"></i> Nueva cita
        </button>
      </div>

      {errorCarga ? (
        <div className="alerta alerta--error" role="alert">
          {errorCarga}
        </div>
      ) : (
        <div className={`tarjeta ${styles.calendarioContenedor}`}>
          <div ref={contRef}></div>
        </div>
      )}

      <CitaModal
        abierto={modalAbierto}
        editando={editando}
        pacientes={pacientes}
        config={config}
        timezone={timezone}
        inicial={nuevaEn}
        onCerrar={cerrarModal}
        onGuardado={() => void cargarRango()}
        onEliminar={(cita) => setEliminando(cita)}
      />

      <ConfirmarModal
        abierto={eliminando !== null}
        titulo="Eliminar cita"
        mensaje={eliminando ? `Vas a eliminar la cita de ${eliminando.pacienteNombre}.` : ""}
        textoConfirmar="Eliminar"
        cargando={cargandoEliminar}
        onCancelar={() => setEliminando(null)}
        onConfirmar={eliminar}
      />
    </div>
  );
}
