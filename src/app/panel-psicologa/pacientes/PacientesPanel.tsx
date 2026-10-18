"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Campo, ConfirmarModal, EmptyState, TablaPaginada, useToast, type ColumnaTabla } from "@/components/ui";
import PacienteModal from "@/components/panel/PacienteModal";
import { listarPacientesAction, eliminarPacienteAction } from "@/actions/pacientes";
import type { FiltroPacientes, PacienteFila, ResultadoPacientes } from "@/services/pacientes";
import styles from "./pacientes.module.css";

interface Props {
  inicial: ResultadoPacientes;
}

const FILTROS_VACIOS = { busqueda: "", soloDuplicados: false };

export default function PacientesPanel({ inicial }: Props) {
  const { mostrar } = useToast();
  const router = useRouter();
  const [resultado, setResultado] = useState<ResultadoPacientes>(inicial);
  const [filtros, setFiltros] = useState<FiltroPacientes>(FILTROS_VACIOS);
  const [buscando, setBuscando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<PacienteFila | null>(null);
  const [eliminando, setEliminando] = useState<PacienteFila | null>(null);
  const [cargandoEliminar, setCargandoEliminar] = useState(false);

  const buscar = async (pagina: number, f: FiltroPacientes) => {
    setBuscando(true);
    const res = await listarPacientesAction({ ...f, pagina });
    setBuscando(false);
    setResultado(res);
  };

  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    buscar(1, filtros);
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_VACIOS);
    buscar(1, FILTROS_VACIOS);
  };

  const abrirNuevo = () => {
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (paciente: PacienteFila) => {
    setEditando(paciente);
    setModalAbierto(true);
  };

  const onGuardado = (paciente: PacienteFila, aviso?: string) => {
    if (aviso) mostrar(aviso, "info");
    mostrar(editando ? "Ficha actualizada." : "Paciente creado.");
    if (!editando) {
      router.push(`/panel-psicologa/pacientes/${paciente.id}`);
    } else {
      buscar(resultado.pagina, filtros);
    }
  };

  const eliminar = async () => {
    if (!eliminando) return;
    setCargandoEliminar(true);
    const res = await eliminarPacienteAction(eliminando.id);
    setCargandoEliminar(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo eliminar la ficha.", "error");
      return;
    }
    setEliminando(null);
    mostrar("Ficha eliminada.");
    buscar(resultado.pagina, filtros);
  };

  const columnas: ColumnaTabla<PacienteFila>[] = [
    {
      clave: "numero",
      titulo: "Ficha",
      render: (f) => (
        <span className={styles.celdaFicha}>
          <Link href={`/panel-psicologa/pacientes/${f.id}`} className={styles.enlaceFicha}>
            {f.numero}
          </Link>
          {f.possibleDuplicate && (
            <span className={styles.badgeDuplicado} title="Revisar: el teléfono coincide con otra ficha">
              <i className="fa fa-clone" aria-hidden="true"></i>
              Revisar
            </span>
          )}
        </span>
      ),
    },
    {
      clave: "nombre",
      titulo: "Nombre",
      render: (f) => (
        <Link href={`/panel-psicologa/pacientes/${f.id}`} className={styles.enlaceNombre}>
          {f.nombre}
        </Link>
      ),
    },
    { clave: "telefono", titulo: "Teléfono", render: (f) => f.telefono },
    { clave: "email", titulo: "Email", render: (f) => f.email ?? "—" },
    {
      clave: "acciones",
      titulo: "",
      alinear: "derecha",
      render: (f) => (
        <span className={styles.acciones}>
          <Link
            href={`/panel-psicologa/pacientes/${f.id}`}
            className={styles.accionBoton}
            title="Ver ficha"
          >
            <i className="fa fa-eye" aria-hidden="true"></i>
            <span className="sr-only">Ver ficha de {f.nombre}</span>
          </Link>
          <button
            type="button"
            className={styles.accionBoton}
            title="Editar"
            onClick={() => abrirEditar(f)}
          >
            <i className="fa fa-pen" aria-hidden="true"></i>
            <span className="sr-only">Editar {f.nombre}</span>
          </button>
          <button
            type="button"
            className={`${styles.accionBoton} ${styles.accionPeligro}`}
            title="Eliminar"
            onClick={() => setEliminando(f)}
          >
            <i className="fa fa-trash" aria-hidden="true"></i>
            <span className="sr-only">Eliminar {f.nombre}</span>
          </button>
        </span>
      ),
    },
  ];

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Pacientes</h1>
          <p className={styles.subtitulo}>
            Directorio con los datos de contacto de tus pacientes. Cada ficha tiene un número propio (P-0001) y un
            identificador interno; el teléfono no es único.
          </p>
        </div>
        <button type="button" className="boton boton--primario" onClick={abrirNuevo}>
          <i className="fa fa-user-plus" aria-hidden="true"></i>
          Nuevo paciente
        </button>
      </div>

      <form className={styles.filtros} onSubmit={aplicarFiltros}>
        <Campo id="pac-busqueda" etiqueta="Buscar">
          <input
            id="pac-busqueda"
            type="search"
            className="campo-control"
            placeholder="Nombre, teléfono o número de ficha"
            value={filtros.busqueda ?? ""}
            onChange={(e) => setFiltros((f) => ({ ...f, busqueda: e.target.value }))}
          />
        </Campo>
        <label className={`fila-check ${styles.filtroCheck}`}>
          <input
            type="checkbox"
            checked={filtros.soloDuplicados ?? false}
            onChange={(e) => setFiltros((f) => ({ ...f, soloDuplicados: e.target.checked }))}
          />
          Solo posibles duplicados
        </label>
        <div className={styles.filtrosAcciones}>
          <button type="submit" className="boton boton--primario" disabled={buscando}>
            {buscando ? "Buscando..." : "Buscar"}
          </button>
          <button type="button" className="boton boton--secundario" onClick={limpiarFiltros} disabled={buscando}>
            Limpiar
          </button>
        </div>
      </form>

      {resultado.total === 0 && !filtros.busqueda && !filtros.soloDuplicados ? (
        <EmptyState
          icono="fa-users"
          titulo="Todavía no tienes pacientes"
          descripcion="Crea el primero manualmente o aparecerán solos cuando alguien reserve cita en la web."
          accion={
            <button type="button" className="boton boton--primario" onClick={abrirNuevo}>
              <i className="fa fa-user-plus" aria-hidden="true"></i>
              Nuevo paciente
            </button>
          }
        />
      ) : (
        <TablaPaginada
          columnas={columnas}
          datos={resultado.pacientes}
          claveFila={(f) => f.id}
          pagina={resultado.pagina}
          totalPaginas={resultado.totalPaginas}
          onCambioPagina={(p) => buscar(p, filtros)}
          totalRegistros={resultado.total}
          etiquetaRegistros="pacientes"
        />
      )}

      <PacienteModal
        abierto={modalAbierto}
        editando={editando}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={onGuardado}
      />

      <ConfirmarModal
        abierto={eliminando !== null}
        onCancelar={() => setEliminando(null)}
        onConfirmar={eliminar}
        titulo="Eliminar ficha"
        mensaje={
          eliminando
            ? `Se eliminará la ficha de ${eliminando.nombre} (${eliminando.numero}). Si tiene citas o historias clínicas asociadas, no se podrá borrar: en ese caso usa la anonimización desde su ficha.`
            : ""
        }
        textoConfirmar="Eliminar ficha"
        cargando={cargandoEliminar}
      />
    </div>
  );
}
