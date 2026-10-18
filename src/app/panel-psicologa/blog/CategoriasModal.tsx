"use client";

import { useState } from "react";
import { ConfirmarModal, useToast } from "@/components/ui";
import {
  crearCategoriaAction,
  editarCategoriaAction,
  eliminarCategoriaAction,
  listarCategoriasAction,
} from "@/actions/blog";
import type { CategoriaFila, InputCategoria } from "@/services/blog";
import styles from "./blog.module.css";

interface Props {
  categorias: CategoriaFila[];
  onCambio: (categorias: CategoriaFila[]) => void;
}

const VACIO: InputCategoria = { name: "", description: "", orderIndex: 0, isActive: true };

export default function CategoriasModal({ categorias, onCambio }: Props) {
  const { mostrar } = useToast();
  const [form, setForm] = useState<InputCategoria>(VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<CategoriaFila | null>(null);
  const [cargandoEliminar, setCargandoEliminar] = useState(false);

  const recargar = async () => {
    onCambio(await listarCategoriasAction(true));
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const res = editandoId
      ? await editarCategoriaAction(editandoId, form)
      : await crearCategoriaAction(form);
    setGuardando(false);

    if (!res.ok || !res.categoria) {
      mostrar(res.error ?? "No se pudo guardar la categoría.", "error");
      return;
    }
    mostrar(editandoId ? "Categoría actualizada." : "Categoría creada.");
    setForm(VACIO);
    setEditandoId(null);
    await recargar();
  };

  const editar = (c: CategoriaFila) => {
    setEditandoId(c.id);
    setForm({ name: c.name, description: c.description ?? "", orderIndex: c.orderIndex, isActive: c.isActive });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setForm(VACIO);
  };

  const eliminar = async () => {
    if (!eliminando) return;
    setCargandoEliminar(true);
    const res = await eliminarCategoriaAction(eliminando.id);
    setCargandoEliminar(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo eliminar la categoría.", "error");
      return;
    }
    mostrar("Categoría eliminada.");
    if (editandoId === eliminando.id) cancelarEdicion();
    setEliminando(null);
    await recargar();
  };

  return (
    <>
      <form className={styles.categoriaForm} onSubmit={guardar}>
        <div className={styles.categoriaFormCampos}>
          <div className={styles.campoNombre}>
            <label htmlFor="cat-nombre" className="campo-label">
              Nombre *
            </label>
            <input
              id="cat-nombre"
              className="campo-control"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              maxLength={80}
              required
            />
          </div>
          <div className={styles.campoDescripcion}>
            <label htmlFor="cat-descripcion" className="campo-label">
              Descripción
            </label>
            <input
              id="cat-descripcion"
              className="campo-control"
              value={form.description ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              maxLength={300}
            />
          </div>
          <div className={styles.campoOrden}>
            <label htmlFor="cat-orden" className="campo-label">
              Orden
            </label>
            <input
              id="cat-orden"
              type="number"
              className="campo-control"
              value={form.orderIndex ?? 0}
              onChange={(e) => setForm((prev) => ({ ...prev, orderIndex: Number(e.target.value) || 0 }))}
            />
          </div>
          <label className="fila-check">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Activa
          </label>
        </div>
        <div className={styles.categoriaFormAcciones}>
          <button type="submit" className="boton boton--primario" disabled={guardando}>
            {guardando ? "Guardando…" : editandoId ? "Guardar cambios" : "Añadir categoría"}
          </button>
          {editandoId && (
            <button type="button" className="boton boton--secundario" onClick={cancelarEdicion}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {categorias.length === 0 ? (
        <p className="campo-hint">Todavía no hay categorías. Crea la primera con el formulario de arriba.</p>
      ) : (
        <ul className={styles.categoriaLista}>
          {categorias.map((c) => (
            <li key={c.id} className={styles.categoriaItem}>
              <div className={styles.categoriaInfo}>
                <span className={styles.categoriaNombre}>
                  {c.name}
                  {!c.isActive && <span className={styles.categoriaInactiva}> (inactiva)</span>}
                </span>
                {c.description && <small>{c.description}</small>}
              </div>
              <div className={styles.categoriaAcciones}>
                <button
                  type="button"
                  className={styles.accionBoton}
                  onClick={() => editar(c)}
                  aria-label={`Editar ${c.name}`}
                >
                  <i className="fa fa-pen" aria-hidden="true"></i>
                </button>
                <button
                  type="button"
                  className={`${styles.accionBoton} ${styles.accionPeligro}`}
                  onClick={() => setEliminando(c)}
                  aria-label={`Eliminar ${c.name}`}
                >
                  <i className="fa fa-trash" aria-hidden="true"></i>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmarModal
        abierto={eliminando !== null}
        titulo="Eliminar categoría"
        mensaje={
          eliminando
            ? `Vas a eliminar la categoría "${eliminando.name}". Los artículos que la usen quedarán sin categoría.`
            : ""
        }
        textoConfirmar="Eliminar"
        cargando={cargandoEliminar}
        onCancelar={() => setEliminando(null)}
        onConfirmar={eliminar}
      />
    </>
  );
}
