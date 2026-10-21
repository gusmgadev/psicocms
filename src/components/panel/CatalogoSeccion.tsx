"use client";

import { useState } from "react";
import { ConfirmarModal, EmptyState, useToast } from "@/components/ui";
import { listarCatalogoAction, eliminarItemAction, moverItemAction } from "@/actions/catalogo-web";
import type { TipoCatalogo, ItemCatalogo } from "@/services/catalogo-web";
import CatalogoModal from "./CatalogoModal";
import styles from "./catalogo.module.css";

interface Props {
  tipo: TipoCatalogo;
  titulo: string;
  subtitulo: string;
  iconoVacio: string;
  textoVacio: string;
  inicial: ItemCatalogo[];
}

export default function CatalogoSeccion({ tipo, titulo, subtitulo, iconoVacio, textoVacio, inicial }: Props) {
  const { mostrar } = useToast();
  const esServicio = tipo === "servicios";
  const etiqueta = esServicio ? "servicio" : "especialidad";

  const [items, setItems] = useState<ItemCatalogo[]>(inicial);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<ItemCatalogo | null>(null);
  const [eliminando, setEliminando] = useState<ItemCatalogo | null>(null);
  const [cargandoEliminar, setCargandoEliminar] = useState(false);
  const [cargandoOrden, setCargandoOrden] = useState(false);

  const recargar = async () => {
    setItems(await listarCatalogoAction(tipo));
  };

  const abrirNuevo = () => {
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (item: ItemCatalogo) => {
    setEditando(item);
    setModalAbierto(true);
  };

  const mover = async (item: ItemCatalogo, direccion: "arriba" | "abajo") => {
    setCargandoOrden(true);
    const res = await moverItemAction(tipo, item.id, direccion);
    setCargandoOrden(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo cambiar el orden.", "error");
      return;
    }
    await recargar();
  };

  const eliminar = async () => {
    if (!eliminando) return;
    setCargandoEliminar(true);
    const res = await eliminarItemAction(tipo, eliminando.id);
    setCargandoEliminar(false);

    if (!res.ok) {
      mostrar(res.error ?? `No se pudo eliminar el ${etiqueta}.`, "error");
      return;
    }
    mostrar(`${etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)} eliminado.`);
    setEliminando(null);
    await recargar();
  };

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>{titulo}</h1>
          <p className={styles.subtitulo}>{subtitulo}</p>
        </div>
        <button type="button" className="boton boton--primario" onClick={abrirNuevo}>
          <i className="fa fa-plus" aria-hidden="true"></i>
          Nuevo {etiqueta}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="tarjeta">
          <EmptyState
            icono={iconoVacio}
            titulo={`Todavía no hay ${tipo === "servicios" ? "servicios" : "especialidades"}`}
            descripcion={textoVacio}
            accion={
              <button type="button" className="boton boton--primario" onClick={abrirNuevo}>
                <i className="fa fa-plus" aria-hidden="true"></i>
                Nuevo {etiqueta}
              </button>
            }
          />
        </div>
      ) : (
        <div className="tarjeta">
          <ul className={styles.lista}>
            {items.map((item, i) => (
              <li key={item.id} className={styles.item}>
                <span className={styles.orden}>{i + 1}</span>
                {esServicio && item.icono ? (
                  <span className={styles.iconoCaja}>
                    <i className={`fa ${item.icono}`} aria-hidden="true"></i>
                  </span>
                ) : null}
                <div className={styles.info}>
                  <span className={styles.nombre}>{item.nombre}</span>
                  {item.descripcion ? <span className={styles.descripcion}>{item.descripcion}</span> : null}
                  <span className={styles.meta}>
                    <span className={`${styles.badge} ${item.activo ? styles.badgeActivo : styles.badgeOculto}`}>
                      <i
                        className={`fa ${item.activo ? "fa-eye" : "fa-eye-slash"}`}
                        aria-hidden="true"
                      ></i>
                      {item.activo ? "Visible" : "Oculto"}
                    </span>
                  </span>
                </div>
                <div className={styles.acciones}>
                  <button
                    type="button"
                    className={styles.accionBoton}
                    onClick={() => mover(item, "arriba")}
                    disabled={cargandoOrden || i === 0}
                    aria-label={`Subir "${item.nombre}"`}
                    title="Subir"
                  >
                    <i className="fa fa-arrow-up" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className={styles.accionBoton}
                    onClick={() => mover(item, "abajo")}
                    disabled={cargandoOrden || i === items.length - 1}
                    aria-label={`Bajar "${item.nombre}"`}
                    title="Bajar"
                  >
                    <i className="fa fa-arrow-down" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className={styles.accionBoton}
                    onClick={() => abrirEdicion(item)}
                    aria-label={`Editar "${item.nombre}"`}
                    title="Editar"
                  >
                    <i className="fa fa-pen" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className={`${styles.accionBoton} ${styles.accionPeligro}`}
                    onClick={() => setEliminando(item)}
                    aria-label={`Eliminar "${item.nombre}"`}
                    title="Eliminar"
                  >
                    <i className="fa fa-trash" aria-hidden="true"></i>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <CatalogoModal
        tipo={tipo}
        abierto={modalAbierto}
        editando={editando}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={recargar}
      />

      <ConfirmarModal
        abierto={eliminando !== null}
        titulo={`Eliminar ${etiqueta}`}
        mensaje={
          eliminando
            ? `Vas a eliminar "${eliminando.nombre}". Esta acción no se puede deshacer.`
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
