"use client";

import { Fragment, useState } from "react";
import { Campo, ConfirmarModal, EmptyState, useToast } from "@/components/ui";
import {
  guardarConfigAction,
  guardarHuecosAction,
  setModoVacacionesAction,
  crearPeriodoAction,
  borrarPeriodoAction,
} from "@/actions/disponibilidad";
import type {
  ConfigSesiones,
  EstadoDisponibilidad,
  Modalidad,
  PeriodoVacaciones,
} from "@/services/disponibilidad";
import {
  DIAS_SEMANA,
  minutosATexto,
  textoAMinutos,
  formatearFechaCadena,
} from "@/lib/fechas";
import styles from "./disponibilidad.module.css";

interface Props {
  inicial: EstadoDisponibilidad;
}

const clavesMarcas = (dia: number, minutos: number) => `${dia}-${minutos}`;

function rangoInicial(estado: EstadoDisponibilidad): { entrada: string; salida: string } {
  let minM = 9 * 60;
  let maxM = 20 * 60;
  for (const s of estado.slots) {
    const m = textoAMinutos(s.startTime);
    minM = Math.min(minM, m);
    const esOnline = s.modality === "online";
    const duracion = esOnline ? estado.config.durationOnline : estado.config.durationInperson;
    const descanso = esOnline
      ? estado.config.breakEnabledOnline
        ? estado.config.breakOnline
        : 0
      : estado.config.breakEnabledInperson
        ? estado.config.breakInperson
        : 0;
    maxM = Math.max(maxM, m + duracion + descanso);
  }
  return {
    entrada: minutosATexto(minM),
    salida: minutosATexto(Math.min(maxM, 23 * 60 + 59)),
  };
}

function marcasIniciales(estado: EstadoDisponibilidad): Record<Modalidad, string[]> {
  const resultado: Record<Modalidad, string[]> = { online: [], inperson: [] };
  for (const s of estado.slots) {
    resultado[s.modality].push(clavesMarcas(s.dayOfWeek, textoAMinutos(s.startTime)));
  }
  return resultado;
}

export default function DisponibilidadPanel({ inicial }: Props) {
  const { mostrar } = useToast();

  const rango = rangoInicial(inicial);

  const [config, setConfig] = useState<ConfigSesiones>(inicial.config);
  const [modality, setModality] = useState<Modalidad>("online");
  const [entrada, setEntrada] = useState(rango.entrada);
  const [salida, setSalida] = useState(rango.salida);
  const [marcas, setMarcas] = useState<Record<Modalidad, string[]>>(marcasIniciales(inicial));
  const [vacationMode, setVacationMode] = useState(inicial.vacationMode);
  const [periodos, setPeriodos] = useState<PeriodoVacaciones[]>(inicial.periodos);
  const [avisosCambio, setAvisosCambio] = useState<string[]>([]);

  const [guardandoConfig, setGuardandoConfig] = useState(false);
  const [guardandoHorario, setGuardandoHorario] = useState(false);
  const [guardandoPeriodo, setGuardandoPeriodo] = useState(false);
  const [borrandoPeriodo, setBorrandoPeriodo] = useState(false);
  const [periodoABorrar, setPeriodoABorrar] = useState<PeriodoVacaciones | null>(null);

  const [periodoDesde, setPeriodoDesde] = useState("");
  const [periodoHasta, setPeriodoHasta] = useState("");
  const [periodoNota, setPeriodoNota] = useState("");
  const [errorPeriodo, setErrorPeriodo] = useState<string | undefined>(undefined);

  const cfg = modality === "online"
    ? { duracion: config.durationOnline, descanso: config.breakOnline, activo: config.breakEnabledOnline }
    : { duracion: config.durationInperson, descanso: config.breakInperson, activo: config.breakEnabledInperson };
  const paso = cfg.duracion + (cfg.activo ? cfg.descanso : 0);
  const minutosEntrada = textoAMinutos(entrada);
  const minutosSalida = textoAMinutos(salida);
  const rangoValido = minutosSalida > minutosEntrada;

  const filas: number[] = [];
  if (rangoValido && cfg.duracion >= 1 && paso >= 1) {
    for (let t = minutosEntrada; t + cfg.duracion <= minutosSalida; t += paso) {
      filas.push(t);
    }
  }

  const marcasActuales = marcas[modality];
  const esMarcada = (dia: number, minutos: number) => marcasActuales.includes(clavesMarcas(dia, minutos));

  const alternar = (dia: number, minutos: number) => {
    const clave = clavesMarcas(dia, minutos);
    setMarcas((prev) => {
      const lista = prev[modality];
      const siguiente = lista.includes(clave) ? lista.filter((k) => k !== clave) : [...lista, clave];
      return { ...prev, [modality]: siguiente };
    });
  };

  const guardarConfig = async () => {
    setGuardandoConfig(true);
    const res = await guardarConfigAction(config);
    setGuardandoConfig(false);
    if (!res.ok) {
      mostrar(res.error ?? "No se pudo guardar la configuración.", "error");
      return;
    }
    setAvisosCambio(res.avisos ?? []);
    if (res.avisos?.length) {
      mostrar("Configuración guardada. Revisa tus huecos de disponibilidad.", "info");
    } else {
      mostrar("Configuración guardada.");
    }
  };

  const guardarHorario = async () => {
    const validas = new Set(filas);
    const aGuardar = marcasActuales
      .map((k) => {
        const [dia, minutos] = k.split("-").map(Number);
        return { dia, minutos };
      })
      .filter((m) => validas.has(m.minutos))
      .map((m) => ({ dayOfWeek: m.dia, startTime: `${minutosATexto(m.minutos)}:00` }));

    setGuardandoHorario(true);
    const res = await guardarHuecosAction(modality, aGuardar);
    setGuardandoHorario(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo guardar el horario.", "error");
      return;
    }
    setAvisosCambio([]);
    mostrar("Horario guardado.");
  };

  const cambiarModoVacaciones = async (activo: boolean) => {
    const anterior = vacationMode;
    setVacationMode(activo);
    const res = await setModoVacacionesAction(activo);
    if (!res.ok) {
      setVacationMode(anterior);
      mostrar(res.error ?? "No se pudo cambiar el modo vacaciones.", "error");
      return;
    }
    mostrar(activo ? "Modo vacaciones activado: las reservas quedan pausadas." : "Modo vacaciones desactivado: las reservas vuelven a estar abiertas.");
  };

  const anadirPeriodo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPeriodo(undefined);

    if (!periodoDesde || !periodoHasta) {
      setErrorPeriodo("Indica la fecha de inicio y la de fin.");
      return;
    }
    if (periodoHasta < periodoDesde) {
      setErrorPeriodo("La fecha de fin debe ser igual o posterior a la de inicio.");
      return;
    }

    setGuardandoPeriodo(true);
    const res = await crearPeriodoAction({
      startDate: periodoDesde,
      endDate: periodoHasta,
      note: periodoNota.trim() || undefined,
    });
    setGuardandoPeriodo(false);

    if (!res.ok || !res.periodo) {
      setErrorPeriodo(res.error ?? "No se pudo añadir el periodo.");
      return;
    }

    setPeriodos((prev) => [...prev, res.periodo!].sort((a, b) => a.startDate.localeCompare(b.startDate)));
    setPeriodoDesde("");
    setPeriodoHasta("");
    setPeriodoNota("");
    mostrar("Periodo de vacaciones añadido.");
  };

  const confirmarBorrado = async () => {
    if (!periodoABorrar) return;
    setBorrandoPeriodo(true);
    const res = await borrarPeriodoAction(periodoABorrar.id);
    setBorrandoPeriodo(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo borrar el periodo.", "error");
      return;
    }
    setPeriodos((prev) => prev.filter((p) => p.id !== periodoABorrar.id));
    setPeriodoABorrar(null);
    mostrar("Periodo eliminado.");
  };

  return (
    <div className={styles.pagina}>
      <div>
        <h1 className={styles.titulo}>Disponibilidad</h1>
        <p className={styles.subtitulo}>
          Configura la duración de tus sesiones, tu horario semanal y las vacaciones.
        </p>
      </div>

      {avisosCambio.map((aviso) => (
        <p key={aviso} className="alerta alerta--aviso" role="status">
          <i className="fa fa-triangle-exclamation" aria-hidden="true"></i> {aviso}
        </p>
      ))}

      <section className="tarjeta">
        <h2 className={styles.seccionTitulo}>Duración de las sesiones</h2>
        <p className={styles.seccionTexto}>
          La duración define cuánto dura cada cita; el descanso añade tiempo libre entre cita y cita.
        </p>

          <div className={styles.configRejilla}>
            {(["online", "inperson"] as Modalidad[]).map((m) => {
              const esOnline = m === "online";
              const duracion = esOnline ? config.durationOnline : config.durationInperson;
              const descanso = esOnline ? config.breakOnline : config.breakInperson;
              const activo = esOnline ? config.breakEnabledOnline : config.breakEnabledInperson;
              const id = `cfg-${m}`;

              const cambiarDuracion = (valor: number) =>
                setConfig((prev) => (esOnline ? { ...prev, durationOnline: valor } : { ...prev, durationInperson: valor }));
              const cambiarDescanso = (valor: number) =>
                setConfig((prev) => (esOnline ? { ...prev, breakOnline: valor } : { ...prev, breakInperson: valor }));
              const cambiarActivo = (valor: boolean) =>
                setConfig((prev) =>
                  esOnline ? { ...prev, breakEnabledOnline: valor } : { ...prev, breakEnabledInperson: valor },
                );

              return (
                <div key={m} className={styles.configTarjeta}>
                  <h3 className={styles.configTitulo}>
                    <i className={`fa ${esOnline ? "fa-video" : "fa-location-dot"}`} aria-hidden="true"></i>
                    {esOnline ? "Sesiones online" : "Sesiones presenciales"}
                  </h3>

                  <Campo id={`${id}-duracion`} etiqueta="Duración de la sesión (minutos)" requerido>
                    <input
                      id={`${id}-duracion`}
                      type="number"
                      className="campo-control"
                      min={5}
                      max={240}
                      value={duracion}
                      onChange={(e) => cambiarDuracion(Number(e.target.value))}
                    />
                  </Campo>

                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => cambiarActivo(e.target.checked)}
                    />
                    <span className={styles.switchPista} aria-hidden="true"></span>
                    <span>Descanso entre sesiones</span>
                  </label>

                  <Campo
                    id={`${id}-descanso`}
                    etiqueta="Tiempo de descanso (minutos)"
                    pista={activo ? `Los huecos pasarán a durar ${duracion + descanso} minutos.` : "El descanso está desactivado."}
                  >
                    <input
                      id={`${id}-descanso`}
                      type="number"
                      className="campo-control"
                      min={0}
                      max={120}
                      value={descanso}
                      disabled={!activo}
                      onChange={(e) => cambiarDescanso(Number(e.target.value))}
                    />
                  </Campo>
                </div>
              );
            })}
          </div>

        <div className={styles.pieSeccion}>
          <button type="button" className="boton boton--primario" onClick={guardarConfig} disabled={guardandoConfig}>
            {guardandoConfig ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      </section>

      <section className="tarjeta">
        <div className={styles.horarioCabecera}>
          <div>
            <h2 className={styles.seccionTitulo}>Horario semanal</h2>
            <p className={styles.seccionTexto}>
              Marca con clic las horas en las que quieres atender. Cada hueco dura{" "}
              <strong>{paso} min</strong>
              {cfg.activo && cfg.descanso > 0 ? ` (${cfg.duracion} de sesión + ${cfg.descanso} de descanso)` : " de sesión"}.
            </p>
          </div>

          <div className={styles.tabs} role="tablist" aria-label="Modalidad">
            {(["online", "inperson"] as Modalidad[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={modality === m}
                className={`${styles.tab} ${modality === m ? styles.tabActivo : ""}`}
                onClick={() => setModality(m)}
              >
                {m === "online" ? "Online" : "Presencial"}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.rangoFila}>
          <Campo id="horario-entrada" etiqueta="Hora de entrada">
            <input
              id="horario-entrada"
              type="time"
              className="campo-control"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
            />
          </Campo>
          <Campo
            id="horario-salida"
            etiqueta="Hora de salida (máxima)"
            error={rangoValido ? undefined : "La hora de salida debe ser posterior a la de entrada."}
          >
            <input
              id="horario-salida"
              type="time"
              className="campo-control"
              value={salida}
              onChange={(e) => setSalida(e.target.value)}
            />
          </Campo>
        </div>

        {rangoValido && filas.length === 0 ? (
          <EmptyState
            icono="fa-calendar-xmark"
            titulo="No cabe ningún hueco en ese rango"
            descripcion="Amplía la hora de salida o reduce la duración de la sesión."
          />
        ) : (
          <div className={styles.rejillaEnvoltorio}>
            <div
              className={styles.rejilla}
              style={{ gridTemplateColumns: `6.4rem repeat(${DIAS_SEMANA.length}, minmax(0, 1fr))` }}
            >
              <div className={styles.rejillaEsquina} aria-hidden="true"></div>
              {DIAS_SEMANA.map((d) => (
                <div key={d.valor} className={styles.rejillaCabecera}>
                  {d.corto}
                </div>
              ))}

              {filas.map((t) => (
                <Fragment key={t}>
                  <div className={styles.rejillaHora}>{minutosATexto(t)}</div>
                  {DIAS_SEMANA.map((d) => {
                    const marcada = esMarcada(d.valor, t);
                    return (
                      <button
                        key={`${d.valor}-${t}`}
                        type="button"
                        className={`${styles.celda} ${marcada ? styles.celdaMarcada : ""}`}
                        aria-pressed={marcada}
                        aria-label={`${d.largo} a las ${minutosATexto(t)}`}
                        onClick={() => alternar(d.valor, t)}
                      >
                        {marcada && <i className="fa fa-check" aria-hidden="true"></i>}
                      </button>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        )}

        <div className={styles.pieSeccion}>
          <button
            type="button"
            className="boton boton--primario"
            onClick={guardarHorario}
            disabled={guardandoHorario || !rangoValido}
          >
            {guardandoHorario ? "Guardando..." : "Guardar horario"}
          </button>
        </div>
      </section>

      <div className={styles.vacacionesRejilla}>
        <section className="tarjeta">
          <h2 className={styles.seccionTitulo}>Modo vacaciones</h2>
          <p className={styles.seccionTexto}>
            Actívalo para pausar todas las reservas nuevas mientras estás de vacaciones. Las citas ya
            programadas no se cancelan.
          </p>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={vacationMode}
              onChange={(e) => cambiarModoVacaciones(e.target.checked)}
            />
            <span className={styles.switchPista} aria-hidden="true"></span>
            <span>{vacationMode ? "Reservas pausadas" : "Reservas abiertas"}</span>
          </label>
        </section>

        <section className="tarjeta">
          <h2 className={styles.seccionTitulo}>Periodos de vacaciones</h2>
          <p className={styles.seccionTexto}>
            Los días de estos periodos quedan bloqueados para reservar, sin tocar el modo vacaciones.
          </p>

          <form className={styles.periodoForm} onSubmit={anadirPeriodo}>
            <Campo id="periodo-desde" etiqueta="Desde" requerido>
              <input
                id="periodo-desde"
                type="date"
                className="campo-control"
                value={periodoDesde}
                onChange={(e) => setPeriodoDesde(e.target.value)}
              />
            </Campo>
            <Campo id="periodo-hasta" etiqueta="Hasta" requerido>
              <input
                id="periodo-hasta"
                type="date"
                className="campo-control"
                value={periodoHasta}
                onChange={(e) => setPeriodoHasta(e.target.value)}
              />
            </Campo>
            <Campo id="periodo-nota" etiqueta="Nota (opcional)">
              <input
                id="periodo-nota"
                type="text"
                className="campo-control"
                maxLength={200}
                placeholder="Por ejemplo: Navidad"
                value={periodoNota}
                onChange={(e) => setPeriodoNota(e.target.value)}
              />
            </Campo>
            <div className={styles.periodoAccion}>
              <button type="submit" className="boton boton--secundario" disabled={guardandoPeriodo}>
                {guardandoPeriodo ? "Añadiendo..." : "Añadir periodo"}
              </button>
            </div>
            {errorPeriodo && (
              <p className="campo-error" role="alert">
                {errorPeriodo}
              </p>
            )}
          </form>

          {periodos.length === 0 ? (
            <EmptyState
              icono="fa-umbrella-beach"
              titulo="No hay periodos de vacaciones"
              descripcion="Cuando añadas uno, esos días no se podrán reservar."
            />
          ) : (
            <ul className={styles.periodoLista}>
              {periodos.map((p) => (
                <li key={p.id} className={styles.periodoItem}>
                  <div>
                    <p className={styles.periodoRango}>
                      <i className="fa fa-calendar-day" aria-hidden="true"></i>{" "}
                      {formatearFechaCadena(p.startDate)} – {formatearFechaCadena(p.endDate)}
                    </p>
                    {p.note && <p className={styles.periodoNota}>{p.note}</p>}
                  </div>
                  <button
                    type="button"
                    className={styles.periodoBorrar}
                    onClick={() => setPeriodoABorrar(p)}
                    aria-label={`Eliminar periodo del ${formatearFechaCadena(p.startDate)}`}
                  >
                    <i className="fa fa-trash" aria-hidden="true"></i>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmarModal
        abierto={periodoABorrar !== null}
        titulo="Eliminar periodo de vacaciones"
        mensaje={
          periodoABorrar
            ? `Vas a eliminar el periodo del ${formatearFechaCadena(periodoABorrar.startDate)} al ${formatearFechaCadena(periodoABorrar.endDate)}. Esos días volverán a estar disponibles.`
            : ""
        }
        textoConfirmar="Eliminar"
        cargando={borrandoPeriodo}
        onCancelar={() => setPeriodoABorrar(null)}
        onConfirmar={confirmarBorrado}
      />
    </div>
  );
}
