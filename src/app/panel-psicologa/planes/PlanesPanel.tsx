"use client";

import { useState } from "react";
import { ConfirmarModal, EmptyState, useToast } from "@/components/ui";
import { listarPlanesAction, eliminarPlanAction, moverPlanAction } from "@/actions/catalogo-web";
import type { Plan } from "@/services/catalogo-web";
import PlanModal from "./PlanModal";
import lista from "@/components/panel/catalogo.module.css";
import styles from "./planes.module.css";

interface Props {
  inicial: Plan[];
}

const formatearPrecio = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export default function PlanesPanel({ inicial }: Props) {
  const { mostrar } = useToast();

  const [planes, setPlanes] = useState<Plan[]>(inicial);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Plan | null>(null);
  const [eliminando, setEliminando] = useState<Plan | null>(null);
  const [cargandoEliminar, setCargandoEliminar] = useState(false);
  const [cargandoOrden, setCargandoOrden] = useState(false);

  const recargar = async () => {
    setPlanes(await listarPlanesAction());
  };

  const abrirNuevo = () => {
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (plan: Plan) => {
    setEditando(plan);
    setModalAbierto(true);
  };

  const mover = async (plan: Plan, direccion: "arriba" | "abajo") => {
    setCargandoOrden(true);
    const res = await moverPlanAction(plan.id, direccion);
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
    const res = await eliminarPlanAction(eliminando.id);
    setCargandoEliminar(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo eliminar el plan.", "error");
      return;
    }
    mostrar("Plan eliminado.");
    setEliminando(null);
    await recargar();
  };

  const textoPrecios = (plan: Plan): string | null => {
    const partes: string[] = [];
    if (plan.precioOnline !== null) partes.push(`Online ${formatearPrecio.format(plan.precioOnline)}`);
    if (plan.precioInperson !== null) partes.push(`Presencial ${formatearPrecio.format(plan.precioInperson)}`);
    return partes.length ? partes.join(" · ") : null;
  };

  return (
    <div className={lista.pagina}>
      <div className={lista.cabecera}>
        <div>
          <h1 className={lista.titulo}>Planes y precios</h1>
          <p className={lista.subtitulo}>
            Configura los planes de sesión online y presencial que se muestran en tu web. El orden de la lista
            es el que se muestra en la web.
          </p>
        </div>
        <button type="button" className="boton boton--primario" onClick={abrirNuevo}>
          <i className="fa fa-plus" aria-hidden="true"></i>
          Nuevo plan
        </button>
      </div>

      {planes.length === 0 ? (
        <div className="tarjeta">
          <EmptyState
            icono="fa-tags"
            titulo="Todavía no hay planes"
            descripcion="Crea el primer plan con sus precios online y presencial para que tus pacientes conozcan tus tarifas."
            accion={
              <button type="button" className="boton boton--primario" onClick={abrirNuevo}>
                <i className="fa fa-plus" aria-hidden="true"></i>
                Nuevo plan
              </button>
            }
          />
        </div>
      ) : (
        <div className="tarjeta">
          <ul className={lista.lista}>
            {planes.map((plan, i) => (
              <li key={plan.id} className={lista.item}>
                <span className={lista.orden}>{i + 1}</span>
                <div className={lista.info}>
                  <span className={lista.nombre}>{plan.nombre}</span>
                  {plan.descripcion ? <span className={lista.descripcion}>{plan.descripcion}</span> : null}
                  <span className={lista.meta}>
                    {textoPrecios(plan) ? <span className={lista.precio}>{textoPrecios(plan)}</span> : null}
                    <span
                      className={`${lista.badge} ${plan.activo ? lista.badgeActivo : lista.badgeOculto}`}
                    >
                      <i className={`fa ${plan.activo ? "fa-eye" : "fa-eye-slash"}`} aria-hidden="true"></i>
                      {plan.activo ? "Visible" : "Oculto"}
                    </span>
                  </span>
                  {plan.caracteristicas.length > 0 ? (
                    <ul className={styles.caracteristicas}>
                      {plan.caracteristicas.map((c, idx) => (
                        <li key={idx}>
                          <i className="fa fa-check" aria-hidden="true"></i> {c}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className={lista.acciones}>
                  <button
                    type="button"
                    className={lista.accionBoton}
                    onClick={() => mover(plan, "arriba")}
                    disabled={cargandoOrden || i === 0}
                    aria-label={`Subir "${plan.nombre}"`}
                    title="Subir"
                  >
                    <i className="fa fa-arrow-up" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className={lista.accionBoton}
                    onClick={() => mover(plan, "abajo")}
                    disabled={cargandoOrden || i === planes.length - 1}
                    aria-label={`Bajar "${plan.nombre}"`}
                    title="Bajar"
                  >
                    <i className="fa fa-arrow-down" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className={lista.accionBoton}
                    onClick={() => abrirEdicion(plan)}
                    aria-label={`Editar "${plan.nombre}"`}
                    title="Editar"
                  >
                    <i className="fa fa-pen" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    className={`${lista.accionBoton} ${lista.accionPeligro}`}
                    onClick={() => setEliminando(plan)}
                    aria-label={`Eliminar "${plan.nombre}"`}
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

      <PlanModal
        abierto={modalAbierto}
        editando={editando}
        onCerrar={() => setModalAbierto(false)}
        onGuardado={recargar}
      />

      <ConfirmarModal
        abierto={eliminando !== null}
        titulo="Eliminar plan"
        mensaje={
          eliminando ? `Vas a eliminar el plan "${eliminando.nombre}". Esta acción no se puede deshacer.` : ""
        }
        textoConfirmar="Eliminar"
        cargando={cargandoEliminar}
        onCancelar={() => setEliminando(null)}
        onConfirmar={eliminar}
      />
    </div>
  );
}
