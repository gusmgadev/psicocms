"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmarModal, useToast } from "@/components/ui";
import PacienteModal from "@/components/panel/PacienteModal";
import {
  editarPacienteAction,
  exportarPacienteAction,
  anonimizarPacienteAction,
  eliminarPacienteAction,
} from "@/actions/pacientes";
import type { CitaResumenPaciente, PacienteFila } from "@/services/pacientes";
import { formatearFecha, formatearHora, formatearFechaCadena } from "@/lib/fechas";
import styles from "../pacientes.module.css";

const ETIQUETAS_ESTADO: Record<string, string> = {
  scheduled: "Programada",
  completed: "Completada",
  cancelled: "Cancelada",
  no_show: "No presentó",
};

const ETIQUETAS_MODALIDAD: Record<string, string> = {
  online: "Online",
  inperson: "Presencial",
};

const CLASE_ESTADO: Record<string, string> = {
  scheduled: styles.badgeProgramada,
  completed: styles.badgeCompletada,
  cancelled: styles.badgeCancelada,
  no_show: styles.badgeNoPresento,
};

const GENEROS: Record<string, string> = {
  femenino: "Femenino",
  masculino: "Masculino",
  otro: "Otro",
  "no especificado": "Prefiero no decirlo",
};

interface Props {
  inicial: PacienteFila;
  citas: CitaResumenPaciente[];
  timezone: string;
}

export default function PacienteDetalle({ inicial, citas, timezone }: Props) {
  const { mostrar } = useToast();
  const router = useRouter();

  const [paciente, setPaciente] = useState<PacienteFila>(inicial);
  const [modalEdicion, setModalEdicion] = useState(false);
  const [anonimizando, setAnonimizando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [cargandoAccion, setCargandoAccion] = useState(false);

  const exportar = async () => {
    setCargandoAccion(true);
    const datos = await exportarPacienteAction(paciente.id);
    setCargandoAccion(false);

    if (!datos) {
      mostrar("No se pudo exportar los datos.", "error");
      return;
    }

    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `paciente-${paciente.numero}.json`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
    mostrar("Datos exportados.");
  };

  const anonimizar = async () => {
    setCargandoAccion(true);
    const res = await anonimizarPacienteAction(paciente.id);
    setCargandoAccion(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo anonimizar la ficha.", "error");
      return;
    }
    setAnonimizando(false);
    mostrar("Ficha anonimizada. Se han conservado las citas sin datos personales.");
    router.refresh();
  };

  const eliminar = async () => {
    setCargandoAccion(true);
    const res = await eliminarPacienteAction(paciente.id);
    setCargandoAccion(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo eliminar la ficha.", "error");
      setEliminando(false);
      return;
    }
    mostrar("Ficha eliminada.");
    router.push("/panel-psicologa/pacientes");
    router.refresh();
  };

  const onGuardado = (actualizado: PacienteFila, aviso?: string) => {
    setPaciente(actualizado);
    if (aviso) mostrar(aviso, "info");
    mostrar("Ficha actualizada.");
    router.refresh();
  };

  return (
    <div className={styles.pagina}>
      <Link href="/panel-psicologa/pacientes" className={styles.volver}>
        <i className="fa fa-arrow-left" aria-hidden="true"></i>
        Volver a pacientes
      </Link>

      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>
            {paciente.nombre}
            <span className={`${styles.badge} ${styles.badgeTitulo}`}>{paciente.numero}</span>
          </h1>
          <p className={styles.subtitulo}>
            Ficha creada el {formatearFechaCadena(paciente.createdAt.slice(0, 10))}. El teléfono es un dato de
            contacto, no un identificador.
          </p>
          {paciente.possibleDuplicate && (
            <p className={`alerta alerta--aviso ${styles.avisoDuplicado}`}>
              <i className="fa fa-clone" aria-hidden="true"></i> Marcada como posible duplicado: el teléfono coincide
              con otra ficha. Si es la misma persona, puedes unificar los datos a mano o desmarcarlo tras revisar.
            </p>
          )}
        </div>
      </div>

      <div className={styles.fichaRejilla}>
        <section className="tarjeta">
          <h2 className={styles.seccionTitulo}>Datos de la ficha</h2>
          <div className={styles.datosRejilla}>
            <div>
              <p className={styles.datoEtiqueta}>Nombre</p>
              <p className={styles.datoValor}>{paciente.nombre}</p>
            </div>
            <div>
              <p className={styles.datoEtiqueta}>Teléfono</p>
              <p className={styles.datoValor}>{paciente.telefono}</p>
            </div>
            <div>
              <p className={styles.datoEtiqueta}>Email</p>
              <p className={styles.datoValor}>{paciente.email ?? "—"}</p>
            </div>
            <div>
              <p className={styles.datoEtiqueta}>Fecha de nacimiento</p>
              <p className={styles.datoValor}>
                {paciente.birthDate ? formatearFechaCadena(paciente.birthDate) : "—"}
              </p>
            </div>
            <div>
              <p className={styles.datoEtiqueta}>Género</p>
              <p className={styles.datoValor}>
                {paciente.gender ? (GENEROS[paciente.gender] ?? paciente.gender) : "—"}
              </p>
            </div>
            <div>
              <p className={styles.datoEtiqueta}>Dirección</p>
              <p className={styles.datoValor}>{paciente.address ?? "—"}</p>
            </div>
            <div>
              <p className={styles.datoEtiqueta}>Consentimiento de privacidad</p>
              <p className={styles.datoValor}>
                {paciente.consentAt
                  ? `Aceptado el ${formatearFechaCadena(paciente.consentAt.slice(0, 10))} (v. ${paciente.consentVersion ?? "—"})`
                  : "Sin registro (alta manual)"}
              </p>
            </div>
            <div>
              <p className={styles.datoEtiqueta}>Notas</p>
              <p className={`${styles.datoValor} ${styles.datoValorNotas}`}>{paciente.notes ?? "—"}</p>
            </div>
          </div>
        </section>

        <aside className={styles.accionesLado}>
          <button type="button" className="boton boton--primario" onClick={() => setModalEdicion(true)}>
            <i className="fa fa-pen" aria-hidden="true"></i>
            Editar datos
          </button>
          <button type="button" className="boton boton--secundario" onClick={exportar} disabled={cargandoAccion}>
            <i className="fa fa-download" aria-hidden="true"></i>
            Exportar datos (JSON)
          </button>
          <Link href={`/panel-psicologa/historias/${paciente.id}`} className="boton boton--primario">
            <i className="fa fa-book-medical" aria-hidden="true"></i>
            Ver historia clínica
          </Link>
          <Link href="/panel-psicologa/citas" className="boton boton--secundario">
            <i className="fa fa-calendar-plus" aria-hidden="true"></i>
            Gestionar citas
          </Link>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={() => setAnonimizando(true)}
            disabled={cargandoAccion}
          >
            <i className="fa fa-user-secret" aria-hidden="true"></i>
            Anonimizar datos
          </button>
          <button
            type="button"
            className="boton boton--peligro"
            onClick={() => setEliminando(true)}
            disabled={cargandoAccion}
          >
            <i className="fa fa-trash" aria-hidden="true"></i>
            Eliminar ficha
          </button>
        </aside>
      </div>

      <section className="tarjeta">
        <h2 className={styles.seccionTitulo}>Citas de este paciente ({citas.length})</h2>
        {citas.length === 0 ? (
          <p className={styles.vacio}>Todavía no hay citas registradas para este paciente.</p>
        ) : (
          <ul className={styles.listaCitas}>
            {citas.map((cita) => (
              <li key={cita.id} className={styles.itemCita}>
                <span className={styles.itemCitaPrincipal}>
                  <span>
                    {formatearFecha(cita.startsAt, timezone)} · {formatearHora(cita.startsAt, timezone)} –{" "}
                    {formatearHora(cita.endsAt, timezone)}
                  </span>
                  <small>
                    {ETIQUETAS_MODALIDAD[cita.modality] ?? cita.modality}
                    {cita.reason ? ` · ${cita.reason}` : ""}
                  </small>
                </span>
                <span className={styles.badge}>
                  <i
                    className={`fa ${cita.modality === "online" ? "fa-video" : "fa-location-dot"}`}
                    aria-hidden="true"
                  ></i>
                  <span className={CLASE_ESTADO[cita.status] ?? ""}>{ETIQUETAS_ESTADO[cita.status] ?? cita.status}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <PacienteModal
        abierto={modalEdicion}
        editando={paciente}
        onCerrar={() => setModalEdicion(false)}
        onGuardado={onGuardado}
      />

      <ConfirmarModal
        abierto={anonimizando}
        onCancelar={() => setAnonimizando(false)}
        onConfirmar={anonimizar}
        titulo="Anonimizar datos personales"
        mensaje={`Se borrarán el nombre, el teléfono, el email, la dirección, la fecha de nacimiento y las notas de ${paciente.nombre} (${paciente.numero}). Las citas se conservan, pero sin datos personales. Esta acción no se puede deshacer.`}
        textoConfirmar="Anonimizar"
        cargando={cargandoAccion}
      />

      <ConfirmarModal
        abierto={eliminando}
        onCancelar={() => setEliminando(false)}
        onConfirmar={eliminar}
        titulo="Eliminar ficha"
        mensaje={`Se eliminará la ficha de ${paciente.nombre} (${paciente.numero}). Solo es posible si no tiene citas ni historias clínicas asociadas; si las tiene, usa la anonimización.`}
        textoConfirmar="Eliminar ficha"
        cargando={cargandoAccion}
      />
    </div>
  );
}
