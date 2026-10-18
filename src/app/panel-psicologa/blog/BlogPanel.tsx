"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Campo, ConfirmarModal, EmptyState, Modal, TablaPaginada, useToast, type ColumnaTabla } from "@/components/ui";
import { listarArticulosAction, eliminarArticuloAction } from "@/actions/blog";
import type { ArticuloFila, CategoriaFila, FiltroArticulos, ResultadoArticulos, EstadoArticulo } from "@/services/blog";
import CategoriasModal from "./CategoriasModal";
import styles from "./blog.module.css";

const ETIQUETAS_ESTADO: Record<EstadoArticulo, string> = {
  draft: "Borrador",
  published: "Publicado",
};

const FILTROS_VACIOS = { busqueda: "", estado: "", categoriaId: "" };

interface Props {
  inicial: ResultadoArticulos;
  categorias: CategoriaFila[];
}

export default function BlogPanel({ inicial, categorias: categoriasIniciales }: Props) {
  const { mostrar } = useToast();
  const router = useRouter();
  const [resultado, setResultado] = useState<ResultadoArticulos>(inicial);
  const [categorias, setCategorias] = useState<CategoriaFila[]>(categoriasIniciales);
  const [filtros, setFiltros] = useState<FiltroArticulos>(FILTROS_VACIOS);
  const [buscando, setBuscando] = useState(false);
  const [modalCategoriasAbierto, setModalCategoriasAbierto] = useState(false);
  const [eliminando, setEliminando] = useState<ArticuloFila | null>(null);
  const [cargandoEliminar, setCargandoEliminar] = useState(false);

  const buscar = async (pagina: number, f: FiltroArticulos) => {
    setBuscando(true);
    const res = await listarArticulosAction({ ...f, pagina });
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

  const eliminar = async () => {
    if (!eliminando) return;
    setCargandoEliminar(true);
    const res = await eliminarArticuloAction(eliminando.id);
    setCargandoEliminar(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo eliminar el artículo.", "error");
      return;
    }
    setEliminando(null);
    mostrar("Artículo eliminado.");
    buscar(resultado.pagina, filtros);
  };

  const abrirArticulo = (articulo: ArticuloFila) => {
    router.push(`/panel-psicologa/blog/articulos/${articulo.id}`);
  };

  const columnas: ColumnaTabla<ArticuloFila>[] = [
    {
      clave: "titulo",
      titulo: "Artículo",
      render: (f) => (
        <span className={styles.celdaDoble}>
          <span>{f.titulo}</span>
          <small>/{f.slug}</small>
        </span>
      ),
    },
    {
      clave: "categoria",
      titulo: "Categoría",
      render: (f) => f.categoriaNombre ?? "Sin categoría",
    },
    {
      clave: "estado",
      titulo: "Estado",
      render: (f) => (
        <span className={`${styles.badge} ${f.status === "published" ? styles.badgePublicado : styles.badgeBorrador}`}>
          <i className={`fa ${f.status === "published" ? "fa-circle-check" : "fa-pen"}`} aria-hidden="true"></i>
          {ETIQUETAS_ESTADO[f.status]}
        </span>
      ),
    },
    {
      clave: "fecha",
      titulo: "Actualizado",
      render: (f) => new Date(f.updatedAt).toLocaleDateString("es-ES"),
    },
    {
      clave: "acciones",
      titulo: "",
      alinear: "derecha",
      render: (f) => (
        <span className={styles.acciones}>
          <button
            type="button"
            className={styles.accionBoton}
            onClick={() => abrirArticulo(f)}
            aria-label={`Editar ${f.titulo}`}
          >
            <i className="fa fa-pen" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            className={`${styles.accionBoton} ${styles.accionPeligro}`}
            onClick={() => setEliminando(f)}
            aria-label={`Eliminar ${f.titulo}`}
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
          <h1 className={styles.titulo}>Blog</h1>
          <p className={styles.subtitulo}>Escribe y publica artículos para tu web.</p>
        </div>
        <div className={styles.cabeceraAcciones}>
          <button type="button" className="boton boton--secundario" onClick={() => setModalCategoriasAbierto(true)}>
            <i className="fa fa-folder-open" aria-hidden="true"></i> Categorías
          </button>
          <Link href="/panel-psicologa/blog/articulos/nuevo" className="boton boton--primario">
            <i className="fa fa-plus" aria-hidden="true"></i> Nuevo artículo
          </Link>
        </div>
      </div>

      <form className={`tarjeta ${styles.filtros}`} onSubmit={aplicarFiltros}>
        <Campo id="filtro-busqueda" etiqueta="Buscar">
          <input
            id="filtro-busqueda"
            type="search"
            className="campo-control"
            placeholder="Título o enlace"
            value={filtros.busqueda ?? ""}
            onChange={(e) => setFiltros((prev) => ({ ...prev, busqueda: e.target.value }))}
          />
        </Campo>

        <Campo id="filtro-estado" etiqueta="Estado">
          <select
            id="filtro-estado"
            className="campo-control"
            value={filtros.estado ?? ""}
            onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))}
          >
            <option value="">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
          </select>
        </Campo>

        <Campo id="filtro-categoria" etiqueta="Categoría">
          <select
            id="filtro-categoria"
            className="campo-control"
            value={filtros.categoriaId ?? ""}
            onChange={(e) => setFiltros((prev) => ({ ...prev, categoriaId: e.target.value }))}
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
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

      {resultado.articulos.length === 0 && !buscando ? (
        <div className="tarjeta">
          <EmptyState
            icono="fa-pen-nib"
            titulo="Todavía no hay artículos"
            descripcion="Crea tu primer artículo para empezar a publicar contenido en tu web."
          />
        </div>
      ) : (
        <TablaPaginada
          columnas={columnas}
          datos={resultado.articulos}
          claveFila={(f) => f.id}
          pagina={resultado.pagina}
          totalPaginas={resultado.totalPaginas}
          onCambioPagina={(p) => buscar(p, filtros)}
          totalRegistros={resultado.total}
          etiquetaRegistros="artículos"
        />
      )}

      <Modal
        abierto={modalCategoriasAbierto}
        onCerrar={() => setModalCategoriasAbierto(false)}
        titulo="Categorías del blog"
      >
        <CategoriasModal categorias={categorias} onCambio={setCategorias} />
      </Modal>

      <ConfirmarModal
        abierto={eliminando !== null}
        titulo="Eliminar artículo"
        mensaje={eliminando ? `Vas a eliminar el artículo "${eliminando.titulo}". Esta acción no se puede deshacer.` : ""}
        textoConfirmar="Eliminar"
        cargando={cargandoEliminar}
        onCancelar={() => setEliminando(null)}
        onConfirmar={eliminar}
      />
    </div>
  );
}
