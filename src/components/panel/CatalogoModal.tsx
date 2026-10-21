"use client";

import { useEffect, useState } from "react";
import { Modal, useToast } from "@/components/ui";
import { crearItemAction, editarItemAction } from "@/actions/catalogo-web";
import type { TipoCatalogo, ItemCatalogo, InputItemCatalogo } from "@/services/catalogo-web";
import styles from "./catalogo.module.css";

interface Props {
  tipo: TipoCatalogo;
  abierto: boolean;
  editando: ItemCatalogo | null;
  onCerrar: () => void;
  onGuardado: () => Promise<void> | void;
}

export default function CatalogoModal({ tipo, abierto, editando, onCerrar, onGuardado }: Props) {
  const { mostrar } = useToast();
  const esServicio = tipo === "servicios";
  const etiqueta = esServicio ? "servicio" : "especialidad";

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [icono, setIcono] = useState("");
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setNombre(editando?.nombre ?? "");
    setDescripcion(editando?.descripcion ?? "");
    setIcono(editando?.icono ?? "");
    setActivo(editando?.activo ?? true);
  }, [abierto, editando]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const input: InputItemCatalogo = { nombre, descripcion, icono, activo };
    const res = editando
      ? await editarItemAction(tipo, editando.id, input)
      : await crearItemAction(tipo, input);
    setGuardando(false);

    if (!res.ok || !res.item) {
      mostrar(res.error ?? `No se pudo guardar el ${etiqueta}.`, "error");
      return;
    }
    mostrar(editando ? "Cambios guardados." : `${etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1)} creado.`);
    await onGuardado();
    onCerrar();
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={editando ? `Editar ${etiqueta}` : `Nuevo ${etiqueta}`}
    >
      <form className={styles.form} onSubmit={guardar}>
        <div>
          <label htmlFor="catalogo-nombre" className="campo-label">
            Nombre *
          </label>
          <input
            id="catalogo-nombre"
            className="campo-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div>
          <label htmlFor="catalogo-descripcion" className="campo-label">
            Descripción
          </label>
          <textarea
            id="catalogo-descripcion"
            className="campo-control"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Breve explicación que se mostrará en la web…"
          />
        </div>

        {esServicio && (
          <div>
            <label htmlFor="catalogo-icono" className="campo-label">
              Icono
            </label>
            <input
              id="catalogo-icono"
              className="campo-control"
              value={icono}
              onChange={(e) => setIcono(e.target.value)}
              maxLength={80}
              placeholder="Ej.: fa-heart o fa-solid fa-heart"
            />
            <p className="campo-hint">
              Clase de icono de Font Awesome. Déjalo vacío si no quieres icono.
            </p>
          </div>
        )}

        <label className="fila-check">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Visible en la web
        </label>

        <div className={styles.formAcciones}>
          <button type="submit" className="boton boton--primario" disabled={guardando}>
            {guardando ? "Guardando…" : editando ? "Guardar cambios" : `Crear ${etiqueta}`}
          </button>
          <button type="button" className="boton boton--secundario" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}
