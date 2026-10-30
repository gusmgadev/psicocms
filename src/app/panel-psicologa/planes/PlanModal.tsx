"use client";

import { useEffect, useState } from "react";
import { Modal, useToast } from "@/components/ui";
import { crearPlanAction, editarPlanAction } from "@/actions/catalogo-web";
import type { Plan, InputPlan } from "@/services/catalogo-web";
import styles from "./planes.module.css";

interface Props {
  abierto: boolean;
  editando: Plan | null;
  onCerrar: () => void;
  onGuardado: () => Promise<void> | void;
}

function aTextoPrecio(valor: number | null): string {
  return valor === null ? "" : String(valor);
}

function aNumeroPrecio(valor: string): number | null {
  const limpio = valor.trim().replace(",", ".");
  if (!limpio) return null;
  const numero = Number(limpio);
  return Number.isFinite(numero) ? numero : null;
}

export default function PlanModal({ abierto, editando, onCerrar, onGuardado }: Props) {
  const { mostrar } = useToast();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precioOnline, setPrecioOnline] = useState("");
  const [precioInperson, setPrecioInperson] = useState("");
  const [caracteristicas, setCaracteristicas] = useState("");
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setNombre(editando?.nombre ?? "");
    setDescripcion(editando?.descripcion ?? "");
    setPrecioOnline(aTextoPrecio(editando?.precioOnline ?? null));
    setPrecioInperson(aTextoPrecio(editando?.precioInperson ?? null));
    setCaracteristicas((editando?.caracteristicas ?? []).join("\n"));
    setActivo(editando?.activo ?? true);
  }, [abierto, editando]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    const input: InputPlan = {
      nombre,
      descripcion,
      precioOnline: aNumeroPrecio(precioOnline),
      precioInperson: aNumeroPrecio(precioInperson),
      caracteristicas: caracteristicas.split("\n"),
      activo,
    };
    const res = editando ? await editarPlanAction(editando.id, input) : await crearPlanAction(input);
    setGuardando(false);

    if (!res.ok || !res.plan) {
      mostrar(res.error ?? "No se pudo guardar el plan.", "error");
      return;
    }
    mostrar(editando ? "Cambios guardados." : "Plan creado.");
    await onGuardado();
    onCerrar();
  };

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={editando ? "Editar plan" : "Nuevo plan"}>
      <form className={styles.form} onSubmit={guardar}>
        <div>
          <label htmlFor="plan-nombre" className="campo-label">
            Nombre *
          </label>
          <input
            id="plan-nombre"
            className="campo-control"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div>
          <label htmlFor="plan-descripcion" className="campo-label">
            Descripción
          </label>
          <textarea
            id="plan-descripcion"
            className="campo-control"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            maxLength={600}
            rows={3}
            placeholder="Breve explicación del plan…"
          />
        </div>

        <div className={styles.precios}>
          <div>
            <label htmlFor="plan-precio-online" className="campo-label">
              Precio online ($)
            </label>
            <input
              id="plan-precio-online"
              className="campo-control"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              value={precioOnline}
              onChange={(e) => setPrecioOnline(e.target.value)}
              placeholder="Ej.: 20000"
            />
          </div>
          <div>
            <label htmlFor="plan-precio-presencial" className="campo-label">
              Precio presencial ($)
            </label>
            <input
              id="plan-precio-presencial"
              className="campo-control"
              type="number"
              min="0"
              max="1000000"
              step="0.01"
              value={precioInperson}
              onChange={(e) => setPrecioInperson(e.target.value)}
              placeholder="Ej.: 25000"
            />
          </div>
        </div>

        <div>
          <label htmlFor="plan-caracteristicas" className="campo-label">
            Características
          </label>
          <textarea
            id="plan-caracteristicas"
            className="campo-control"
            value={caracteristicas}
            onChange={(e) => setCaracteristicas(e.target.value)}
            rows={5}
            placeholder={"Una característica por línea, por ejemplo:\n50 minutos de duración\nInforme final incluido"}
          />
          <p className="campo-hint">Escribe una característica por línea. Se mostrarán como lista en la web.</p>
        </div>

        <label className="fila-check">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Visible en la web
        </label>

        <div className={styles.formAcciones}>
          <button type="submit" className="boton boton--primario" disabled={guardando}>
            {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear plan"}
          </button>
          <button type="button" className="boton boton--secundario" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </form>
    </Modal>
  );
}
