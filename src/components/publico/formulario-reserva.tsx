// src/components/publico/formulario-reserva.tsx
// Formulario público de reserva: modalidad, calendario con huecos reales,
// datos del visitante, consentimiento y confirmación con enlace a Google Calendar.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatearFechaCadena } from "@/lib/fechas";
import { enlaceGoogleCalendar } from "@/lib/google-calendar";
import {
  crearReservaAction,
  obtenerHuecosAction,
  type ResultadoReservaAction,
} from "@/actions/reservas";
import styles from "./formulario-reserva.module.css";

type Modalidad = "online" | "inperson";

interface Hueco {
  fecha: string; // YYYY-MM-DD
  hora: string; // HH:MM
}

interface Props {
  textosModalityOnline: string;
  textosModalityInperson: string;
  timezone: string;
  consentVersion: string;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function claveDia(fecha: string): string {
  return fecha;
}

function diasDelMes(anio: number, mes: number): string[] {
  const dias: string[] = [];
  const primero = new Date(anio, mes, 1);
  const ultimo = new Date(anio, mes + 1, 0);
  const dowPrimero = (primero.getDay() + 6) % 7; // Lun=0
  for (let i = 0; i < dowPrimero; i++) dias.push("");
  for (let d = 1; d <= ultimo.getDate(); d++) {
    const mm = String(mes + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    dias.push(`${anio}-${mm}-${dd}`);
  }
  return dias;
}

export function FormularioReserva({
  textosModalityOnline,
  textosModalityInperson,
  timezone,
  consentVersion,
}: Props) {
  const [modality, setModality] = useState<Modalidad>("online");
  const [huecos, setHuecos] = useState<Hueco[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorDisp, setErrorDisp] = useState<string | null>(null);

  const hoy = useMemo(() => {
    const d = new Date();
    const p2 = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  }, []);
  const [mesActual, setMesActual] = useState(() => {
    const d = new Date();
    return { anio: d.getFullYear(), mes: d.getMonth() };
  });

  const [fechaSel, setFechaSel] = useState<string | null>(null);
  const [horaSel, setHoraSel] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [motivo, setMotivo] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [exito, setExito] = useState<ResultadoReservaAction["cita"] | null>(null);

  const cargarHuecos = useCallback(async (m: Modalidad) => {
    setCargando(true);
    setErrorDisp(null);
    try {
      const res = await obtenerHuecosAction(m);
      if (res.ok) {
        setHuecos(res.slots);
      } else {
        setHuecos([]);
        setErrorDisp(res.error ?? "No se pudo cargar la disponibilidad.");
      }
    } catch {
      setHuecos([]);
      setErrorDisp("No se pudo cargar la disponibilidad.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarHuecos(modality);
    setFechaSel(null);
    setHoraSel(null);
  }, [modality, cargarHuecos]);

  const fechasConHuecos = useMemo(() => {
    const set = new Set<string>();
    for (const h of huecos) set.add(claveDia(h.fecha));
    return set;
  }, [huecos]);

  const horasDeLaFecha = useMemo(() => {
    if (!fechaSel) return [];
    const horas = huecos
      .filter((h) => h.fecha === fechaSel)
      .map((h) => h.hora);
    return Array.from(new Set(horas)).sort();
  }, [huecos, fechaSel]);

  const dias = useMemo(
    () => diasDelMes(mesActual.anio, mesActual.mes),
    [mesActual]
  );

  const etiquetaModalidad =
    modality === "online" ? textosModalityOnline : textosModalityInperson;

  function cambiarMes(delta: number) {
    setMesActual((prev) => {
      let mes = prev.mes + delta;
      let anio = prev.anio;
      if (mes < 0) {
        mes = 11;
        anio -= 1;
      } else if (mes > 11) {
        mes = 0;
        anio += 1;
      }
      return { anio, mes };
    });
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setErrorForm(null);

    if (!fechaSel || !horaSel) {
      setErrorForm("Elige un día y una hora para tu cita.");
      return;
    }
    if (nombre.trim().length < 2) {
      setErrorForm("Escribe tu nombre completo.");
      return;
    }
    const digitos = telefono.replace(/[^0-9]/g, "");
    if (digitos.length < 6) {
      setErrorForm("El teléfono solo puede contener números.");
      return;
    }
    if (!acepta) {
      setErrorForm("Debes aceptar la política de privacidad.");
      return;
    }

    setEnviando(true);
    try {
      const fd = new FormData();
      fd.set("nombre", nombre.trim());
      fd.set("telefono", digitos);
      fd.set("email", email.trim());
      fd.set("motivo", motivo.trim());
      fd.set("modality", modality);
      fd.set("fecha", fechaSel);
      fd.set("hora", horaSel);
      fd.set("consent", "on");
      fd.set("consentVersion", consentVersion);
      fd.set("website", honeypot);

      const res = await crearReservaAction(fd);
      if (!res.ok || !res.cita) {
        setErrorForm(res.error ?? "Ha ocurrido un error. Inténtalo de nuevo más tarde.");
        // Si el hueco ya no está disponible, recargar huecos
        if (res.error?.toLowerCase().includes("disponible")) {
          void cargarHuecos(modality);
          setHoraSel(null);
        }
        return;
      }
      setExito(res.cita);
    } catch {
      setErrorForm("Ha ocurrido un error. Inténtalo de nuevo más tarde.");
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    const tituloCal = `Cita de ${etiquetaModalidad} con el/la psicólogo/a`;
    const detalles = `Cita reservada el ${formatearFechaCadena(exito.fecha)} a las ${exito.hora}.`;
    const gcal = enlaceGoogleCalendar({
      titulo: tituloCal,
      inicioIso: exito.inicioIso,
      finIso: exito.finIso,
      detalles,
      ubicacion: exito.ubicacion ?? undefined,
    });

    return (
      <div className={styles.exito} role="status" aria-live="polite">
        <div className={styles.exitoIcono} aria-hidden="true">
          <i className="fa-solid fa-circle-check"></i>
        </div>
        <h2 className={styles.exitoTitulo}>¡Cita reservada!</h2>
        <p className={styles.exitoTexto}>
          Tu cita de <strong>{etiquetaModalidad}</strong> el{" "}
          <strong>{formatearFechaCadena(exito.fecha)}</strong> a las{" "}
          <strong>{exito.hora}</strong> se ha reservado correctamente.
        </p>
        <p className={styles.exitoNota}>
          Si no recibes confirmación por email, revisa la carpeta de spam o contacta directamente.
        </p>
        <div className={styles.exitoAcciones}>
          <a
            href={gcal}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.boton} ${styles.botonPrimario}`}
          >
            <i className="fa-brands fa-google" aria-hidden="true"></i>
            Añadir a Google Calendar
          </a>
          <button
            type="button"
            className={`${styles.boton} ${styles.botonSecundario}`}
            onClick={() => setExito(null)}
          >
            Hacer otra reserva
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.formulario} onSubmit={enviar} noValidate>
      {/* Modalidad */}
      <fieldset className={styles.bloque}>
        <legend className={styles.leyenda}>Modalidad de la cita</legend>
        <div className={styles.modalidades} role="radiogroup" aria-label="Modalidad">
          <button
            type="button"
            role="radio"
            aria-checked={modality === "online"}
            className={`${styles.modalidad} ${modality === "online" ? styles.modalidadActiva : ""}`}
            onClick={() => setModality("online")}
          >
            <i className="fa-solid fa-video" aria-hidden="true"></i>
            <span>{textosModalityOnline}</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={modality === "inperson"}
            className={`${styles.modalidad} ${modality === "inperson" ? styles.modalidadActiva : ""}`}
            onClick={() => setModality("inperson")}
          >
            <i className="fa-solid fa-location-dot" aria-hidden="true"></i>
            <span>{textosModalityInperson}</span>
          </button>
        </div>
      </fieldset>

      {/* Calendario */}
      <fieldset className={styles.bloque}>
        <legend className={styles.leyenda}>Elige el día</legend>
        {cargando && <p className={styles.aviso}>Cargando disponibilidad…</p>}
        {errorDisp && !cargando && <p className={styles.errorLinea}>{errorDisp}</p>}
        {!cargando && !errorDisp && fechasConHuecos.size === 0 && (
          <p className={styles.aviso}>
            No hay huecos disponibles para esta modalidad en las próximas semanas. Prueba con otra
            modalidad o contacta directamente.
          </p>
        )}
        {!cargando && (
          <div className={styles.calendario}>
            <div className={styles.calendarioCabecera}>
              <button
                type="button"
                className={styles.navMes}
                onClick={() => cambiarMes(-1)}
                aria-label="Mes anterior"
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true"></i>
              </button>
              <span className={styles.mesTitulo}>
                {MESES[mesActual.mes]} {mesActual.anio}
              </span>
              <button
                type="button"
                className={styles.navMes}
                onClick={() => cambiarMes(1)}
                aria-label="Mes siguiente"
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true"></i>
              </button>
            </div>
            <div className={styles.rejillaDias} aria-hidden="true">
              {DIAS_CORTOS.map((d) => (
                <span key={d} className={styles.diaCabecera}>
                  {d}
                </span>
              ))}
            </div>
            <div className={styles.rejillaDias} role="grid">
              {dias.map((fecha, i) => {
                if (!fecha) {
                  return <span key={`v-${i}`} className={styles.diaVacio} />;
                }
                const disponible = fechasConHuecos.has(claveDia(fecha));
                const esPasado = fecha < hoy;
                const activo = fechaSel === fecha;
                const clases = [
                  styles.dia,
                  activo ? styles.diaActivo : "",
                  !disponible || esPasado ? styles.diaInactivo : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    key={fecha}
                    type="button"
                    className={clases}
                    disabled={!disponible || esPasado}
                    aria-label={formatearFechaCadena(fecha)}
                    aria-selected={activo}
                    onClick={() => {
                      setFechaSel(fecha);
                      setHoraSel(null);
                    }}
                  >
                    {Number(fecha.slice(8, 10))}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </fieldset>

      {/* Horas */}
      {fechaSel && (
        <fieldset className={styles.bloque}>
          <legend className={styles.leyenda}>
            Hora del {formatearFechaCadena(fechaSel)}
          </legend>
          {horasDeLaFecha.length === 0 ? (
            <p className={styles.aviso}>No quedan horas libres ese día.</p>
          ) : (
            <div className={styles.horas}>
              {horasDeLaFecha.map((hora) => (
                <button
                  key={hora}
                  type="button"
                  className={`${styles.hora} ${horaSel === hora ? styles.horaActiva : ""}`}
                  aria-pressed={horaSel === hora}
                  onClick={() => setHoraSel(hora)}
                >
                  {hora}
                </button>
              ))}
            </div>
          )}
          <p className={styles.zonaHoraria}>
            Las horas se muestran en la zona horaria de la consulta ({timezone}).
          </p>
        </fieldset>
      )}

      {/* Datos */}
      <fieldset className={styles.bloque}>
        <legend className={styles.leyenda}>Tus datos</legend>
        <div className={styles.campos}>
          <label className={styles.campo}>
            <span className={styles.etiqueta}>Nombre completo *</span>
            <input
              className={styles.input}
              type="text"
              name="nombre"
              autoComplete="name"
              required
              maxLength={100}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre y apellidos"
            />
          </label>
          <label className={styles.campo}>
            <span className={styles.etiqueta}>Teléfono *</span>
            <input
              className={styles.input}
              type="tel"
              name="telefono"
              autoComplete="tel"
              required
              inputMode="numeric"
              pattern="[0-9\s+]*"
              value={telefono}
              onChange={(e) => {
                const solo = e.target.value.replace(/[^0-9\s+]/g, "");
                setTelefono(solo);
              }}
              placeholder="600 000 000"
            />
          </label>
          <label className={styles.campo}>
            <span className={styles.etiqueta}>Email (opcional)</span>
            <input
              className={styles.input}
              type="email"
              name="email"
              autoComplete="email"
              maxLength={200}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </label>
          <label className={`${styles.campo} ${styles.campoAncho}`}>
            <span className={styles.etiqueta}>Motivo de la consulta (opcional)</span>
            <textarea
              className={styles.textarea}
              name="motivo"
              rows={3}
              maxLength={500}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Cuéntame brevemente qué te trae aquí…"
            />
          </label>
        </div>
      </fieldset>

      {/* Honeypot anti-bot */}
      <div className={styles.trampa} aria-hidden="true">
        <label>
          No rellenar
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      {/* Consentimiento */}
      <label className={styles.consentimiento}>
        <input
          type="checkbox"
          name="consent"
          checked={acepta}
          onChange={(e) => setAcepta(e.target.checked)}
          required
        />
        <span>
          He leído y acepto la{" "}
          <Link href="/politica-privacidad" target="_blank" rel="noopener noreferrer">
            política de privacidad
          </Link>{" "}
          *
        </span>
      </label>

      {errorForm && (
        <p className={styles.errorForm} role="alert">
          {errorForm}
        </p>
      )}

      <button
        type="submit"
        className={`${styles.boton} ${styles.botonPrimario} ${styles.botonEnviar}`}
        disabled={enviando}
      >
        {enviando ? (
          <>
            <i className="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
            Reservando…
          </>
        ) : (
          <>
            <i className="fa-solid fa-calendar-check" aria-hidden="true"></i>
            Reservar cita
          </>
        )}
      </button>
    </form>
  );
}
