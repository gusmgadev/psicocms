"use client";

import { useState } from "react";
import Link from "next/link";
import { Campo, EmptyState, TablaPaginada, useToast, type ColumnaTabla } from "@/components/ui";
import { listarPacientesHistorialAction } from "@/actions/historias";
import type { PacienteHistorial, ResultadoHistoriales } from "@/services/historias";
import { formatearFecha } from "@/lib/fechas";
import styles from "./historias.module.css";

interface Props {
  inicial: ResultadoHistoriales;
  timezone: string;
}

export default function HistoriasPanel({ inicial, timezone }: Props) {
  const { mostrar } = useToast();
  const [resultado, setResultado] = useState<ResultadoHistoriales>(inicial);
  const [busqueda, setBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);

  const buscar = async (texto: string) => {
    setBuscando(true);
    const res = await listarPacientesHistorialAction(texto);
    setBuscando(false);
    setResultado(res);
  };

  const aplicarBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    buscar(busqueda);
  };

  const limpiar = () => {
    setBusqueda("");
    buscar("");
  };

  const columnas: ColumnaTabla<PacienteHistorial>[] = [
    {
      clave: "numero",
      titulo: "Ficha",
      render: (p) => (
        <Link href={`/panel-psicologa/historias/${p.id}`} className={styles.enlaceFicha}>
          {p.numero}
        </Link>
      ),
    },
    {
      clave: "nombre",
      titulo: "Nombre",
      render: (p) => (
        <Link href={`/panel-psicologa/historias/${p.id}`} className={styles.enlaceNombre}>
          {p.nombre}
        </Link>
      ),
    },
    {
      clave: "totalSesiones",
      titulo: "Sesiones",
      render: (p) => (
        <span className={styles.badgeSesiones}>
          <i className="fa fa-notes-medical" aria-hidden="true"></i>
          {p.totalSesiones}
        </span>
      ),
    },
    {
      clave: "ultimaSesion",
      titulo: "Última sesión",
      render: (p) => (p.ultimaSesion ? formatearFecha(p.ultimaSesion, timezone) : "—"),
    },
    {
      clave: "acciones",
      titulo: "",
      alinear: "derecha",
      render: (p) => (
        <Link
          href={`/panel-psicologa/historias/${p.id}`}
          className={styles.accionBoton}
          title="Ver historia clínica"
        >
          <i className="fa fa-book-medical" aria-hidden="true"></i>
          <span className="sr-only">Ver historia clínica de {p.nombre}</span>
        </Link>
      ),
    },
  ];

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Historias clínicas</h1>
          <p className={styles.subtitulo}>
            Elige un paciente para ver o añadir anotaciones de sus sesiones y adjuntar fotos o PDFs
            escaneados. Solo tú puedes acceder a estos datos.
          </p>
        </div>
      </div>

      <form className={styles.filtros} onSubmit={aplicarBusqueda}>
        <Campo id="his-busqueda" etiqueta="Buscar paciente">
          <input
            id="his-busqueda"
            type="search"
            className="campo-control"
            placeholder="Nombre o número de ficha"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </Campo>
        <div className={styles.filtrosAcciones}>
          <button type="submit" className="boton boton--primario" disabled={buscando}>
            {buscando ? "Buscando..." : "Buscar"}
          </button>
          <button type="button" className="boton boton--secundario" onClick={limpiar} disabled={buscando}>
            Limpiar
          </button>
        </div>
      </form>

      {resultado.total === 0 && !busqueda ? (
        <EmptyState
          icono="fa-notes-medical"
          titulo="Todavía no hay pacientes"
          descripcion="Primero crea o recibe pacientes (manualmente o desde la reserva de citas) y luego podrás escribir su historial aquí."
          accion={
            <Link href="/panel-psicologa/pacientes" className="boton boton--primario">
              <i className="fa fa-users" aria-hidden="true"></i>
              Ir a pacientes
            </Link>
          }
        />
      ) : resultado.pacientes.length === 0 ? (
        <p className={styles.vacio}>No hay pacientes que coincidan con la búsqueda.</p>
      ) : (
        <TablaPaginada
          columnas={columnas}
          datos={resultado.pacientes}
          claveFila={(p) => p.id}
          pagina={resultado.pagina}
          totalPaginas={resultado.totalPaginas}
          onCambioPagina={() => buscar(busqueda)}
          totalRegistros={resultado.total}
          etiquetaRegistros="pacientes"
        />
      )}
    </div>
  );
}
