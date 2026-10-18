"use client";

import { useState } from "react";
import Link from "next/link";
import { Campo, ConfirmarModal, EmptyState, TablaPaginada, useToast, type ColumnaTabla } from "@/components/ui";
import CitaModal, { ETIQUETAS_ESTADO, ETIQUETAS_MODALIDAD } from "@/components/panel/CitaModal";
import { listarCitasAction, eliminarCitaAction } from "@/actions/citas";
import type { CitaFila, EstadoCita, FiltroCitas, PacienteSelector, ResultadoCitas } from "@/services/citas";
import type { ConfigSesiones } from "@/services/disponibilidad";
import { formatearFecha, formatearHora, hoyEnZona, partesParaInputs, formatearFechaCadena } from "@/lib/fechas";
import styles from "./citas.module.css";

const CLASE_ESTADO: Record<EstadoCita, string> = {
  scheduled: styles.badgeProgramada,
  completed: styles.badgeCompletada,
  cancelled: styles.badgeCancelada,
  no_show: styles.badgeNoPresento,
};

interface Props {
  inicial: ResultadoCitas;
  pacientes: PacienteSelector[];
  timezone: string;
  config: ConfigSesiones;
}

const FILTROS_VACIOS = { estado: "", modality: "", desde: "", hasta: "", busqueda: "" };

export default function CitasPanel({ inicial, pacientes, timezone, config }: Props) {
  const { mostrar } = useToast();
  const [resultado, setResultado] = useState<ResultadoCitas>(inicial);
  const [filtros, setFiltros] = useState<FiltroCitas>({
    ...FILTROS_VACIOS,
    desde: hoyEnZona(timezone),
  });
  const [buscando, setBuscando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<CitaFila | null>(null);
  const [eliminando, setEliminando] = useState<CitaFila | null>(null);
  const [cargandoEliminar, setCargandoEliminar] = useState(false);

  const buscar = async (pagina: number, f: FiltroCitas) => {
    setBuscando(true);
    const res = await listarCitasAction({ ...f, pagina });
    setBuscando(false);
    setResultado(res);
  };

  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    buscar(1, filtros);
  };

  const limpiarFiltros = () => {
    const vacios = { ...FILTROS_VACIOS };
    setFiltros(vacios);
    buscar(1, vacios);
  };

  const abrirNuevo = () => {
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (cita: CitaFila) => {
    setEditando(cita);
    setModalAbierto(true);
  };

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
    buscar(resultado.pagina, filtros);
  };

  const columnas: ColumnaTabla<CitaFila>[] = [
    {
      clave: "paciente",
      titulo: "Paciente",
      render: (f) => (
        <span className={styles.celdaDoble}>
          <span>{f.pacienteNombre}</span>
          <small>{f.pacienteNumero}</small>
        </span>
      ),
    },
    { clave: "telefono", titulo: "Teléfono", render: (f) => f.pacienteTelefono },
    {
      clave: "fecha",
      titulo: "Fecha y hora",
      render: (f) => (
        <span className={styles.celdaDoble}>
          <span>{formatearFecha(f.startsAt, timezone)}</span>
          <small>
            {formatearHora(f.startsAt, timezone)} – {formatearHora(f.endsAt, timezone)}
          </small>
        </span>
      ),
    },
    {
      clave: "modalidad",
      titulo: "Modalidad",
      render: (f) => (
        <span className={styles.badge}>
          <i className={`fa ${f.modality === "online" ? "fa-video" : "fa-location-dot"}`} aria-hidden="true"></i>
          {ETIQUETAS_MODALIDAD[f.modality]}
        </span>
      ),
    },
    {
      clave: "estado",
      titulo: "Estado",
      render: (f) => <span className={`${styles.badge} ${CLASE_ESTADO[f.status]}`}>{ETIQUETAS_ESTADO[f.status]}</span>,
    },
    {
      clave: "origen",
      titulo: "Origen",
      render: (f) => (
        <span className={styles.origen} title={f.origin === "web" ? "Reservada desde la web" : "Añadida manualmente"}>
          <i className={`fa ${f.origin === "web" ? "fa-globe" : "fa-pen"}`} aria-hidden="true"></i>
          {f.origin === "web" ? "Web" : "Manual"}
        </span>
      ),
    },
    {
      clave: "acciones",
      titulo: "",
      alinear: "derecha",
      render: (f) => (
        <span className={styles.acciones}>
          {f.notaId ? (
            <Link
              href={`/panel-psicologa/historias/${f.pacienteId}`}
              className={styles.accionBoton}
              aria-label={`Ver nota de sesión de ${f.pacienteNombre}`}
              title="Ver nota en la historia"
            >
              <i className="fa fa-notes-medical" aria-hidden="true"></i>
            </Link>
          ) : (
            f.status === "completed" && (
              <Link
                href={`/panel-psicologa/historias/${f.pacienteId}?cita=${f.id}`}
                className={styles.accionBoton}
                aria-label={`Escribir nota de sesión de ${f.pacienteNombre}`}
                title="Escribir nota de sesión"
              >
                <i className="fa fa-file-circle-plus" aria-hidden="true"></i>
              </Link>
            )
          )}
          <button
            type="button"
            className={styles.accionBoton}
            onClick={() => abrirEditar(f)}
            aria-label={`Editar cita de ${f.pacienteNombre}`}
          >
            <i className="fa fa-pen" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            className={`${styles.accionBoton} ${styles.accionPeligro}`}
            onClick={() => setEliminando(f)}
            aria-label={`Eliminar cita de ${f.pacienteNombre}`}
          >
            <i className="fa fa-trash" aria-hidden="true"></i>
          </button>
        </span>
      ),
    },
  ];

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Citas</h1>
          <p className={styles.subtitulo}>Consulta, añade, edita y elimina tus citas.</p>
        </div>
        <button type="button" className="boton boton--primario" onClick={abrirNuevo}>
          <i className="fa fa-plus" aria-hidden="true"></i> Nueva cita
        </button>
      </div>

      <form className={`tarjeta ${styles.filtros}`} onSubmit={aplicarFiltros}>
        <Campo id="filtro-estado" etiqueta="Estado">
          <select
            id="filtro-estado"
            className="campo-control"
            value={filtros.estado ?? ""}
            onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))}
          >
            <option value="">Todos</option>
            {(Object.keys(ETIQUETAS_ESTADO) as EstadoCita[]).map((s) => (
              <option key={s} value={s}>
                {ETIQUETAS_ESTADO[s]}
              </option>
            ))}
          </select>
        </Campo>

        <Campo id="filtro-modalidad" etiqueta="Modalidad">
          <select
            id="filtro-modalidad"
            className="campo-control"
            value={filtros.modality ?? ""}
            onChange={(e) => setFiltros((prev) => ({ ...prev, modality: e.target.value }))}
          >
            <option value="">Todas</option>
            <option value="online">Online</option>
            <option value="inperson">Presencial</option>
          </select>
        </Campo>

        <Campo id="filtro-desde" etiqueta="Desde">
          <input
            id="filtro-desde"
            type="date"
            className="campo-control"
            value={filtros.desde ?? ""}
            onChange={(e) => setFiltros((prev) => ({ ...prev, desde: e.target.value }))}
          />
        </Campo>

        <Campo id="filtro-hasta" etiqueta="Hasta">
          <input
            id="filtro-hasta"
            type="date"
            className="campo-control"
            value={filtros.hasta ?? ""}
            onChange={(e) => setFiltros((prev) => ({ ...prev, hasta: e.target.value }))}
          />
        </Campo>

        <Campo id="filtro-busqueda" etiqueta="Buscar paciente">
          <input
            id="filtro-busqueda"
            type="search"
            className="campo-control"
            placeholder="Nombre, teléfono o nº de ficha"
            value={filtros.busqueda ?? ""}
            onChange={(e) => setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))}
          />
        </Campo>

        <div className={styles.filtrosAcciones}>
          <button type="submit" className="boton boton--primario" disabled={buscando}>
            {buscando ? "Buscando..." : "Aplicar"}
          </button>
          <button type="button" className="boton boton--secundario" onClick={limpiarFiltros} disabled={buscando}>
            Limpiar
          </button>
        </div>
      </form>

      {resultado.citas.length === 0 && !buscando ? (
        <div className="tarjeta">
          <EmptyState
            icono="fa-calendar-check"
            titulo="No hay citas"
            descripcion="No se encontraron citas con los filtros actuales. Puedes cambiar los filtros o crear una cita nueva."
          />
        </div>
      ) : (
        <TablaPaginada
          columnas={columnas}
          datos={resultado.citas}
          claveFila={(f) => f.id}
          pagina={resultado.pagina}
          totalPaginas={resultado.totalPaginas}
          onCambioPagina={(p) => buscar(p, filtros)}
          totalRegistros={resultado.total}
          etiquetaRegistros="citas"
        />
      )}

      <CitaModal
        abierto={modalAbierto}
        editando={editando}
        pacientes={pacientes}
        config={config}
        timezone={timezone}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={() => buscar(resultado.pagina, filtros)}
      />

      <ConfirmarModal
        abierto={eliminando !== null}
        titulo="Eliminar cita"
        mensaje={
          eliminando
            ? `Vas a eliminar la cita de ${eliminando.pacienteNombre} del ${formatearFechaCadena(partesParaInputs(eliminando.startsAt, timezone).fecha)}.`
            : ""
        }
        textoConfirmar="Eliminar"
        cargando={cargandoEliminar}
        onCancelar={() => setEliminando(null)}
        onConfirmar={eliminar}
      />
    </div>
  );
}
