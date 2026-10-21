"use client";

import { useState } from "react";
import { ConfirmarModal, EmptyState, Modal, useToast } from "@/components/ui";
import {
  alternarRedAction,
  crearRedAction,
  editarRedAction,
  eliminarRedAction,
  moverRedAction,
} from "@/actions/redes";
import { opcionRed, REDES_DISPONIBLES, type InputRed, type RedSocial } from "@/lib/redes";
import styles from "./redes.module.css";

interface RedesPanelProps {
  iniciales: RedSocial[];
}

interface EstadoModal {
  abierto: boolean;
  red: RedSocial | null;
}

export default function RedesPanel({ iniciales }: RedesPanelProps) {
  const { mostrar } = useToast();
  const [redes, setRedes] = useState<RedSocial[]>(iniciales);
  const [modal, setModal] = useState<EstadoModal>({ abierto: false, red: null });
  const [paraEliminar, setParaEliminar] = useState<RedSocial | null>(null);
  const [form, setForm] = useState<InputRed>({ platform: "instagram", url: "" });
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const abrirModal = (red: RedSocial | null) => {
    setForm(
      red
        ? { platform: red.platform, url: red.url, isActive: red.isActive }
        : { platform: "instagram", url: "", isActive: true }
    );
    setErrorForm(null);
    setModal({ abierto: true, red });
  };

  const cerrarModal = () => {
    if (enviando) return;
    setModal({ abierto: false, red: null });
  };

  const guardar = async () => {
    if (enviando) return;
    setEnviando(true);
    setErrorForm(null);

    const res = modal.red
      ? await editarRedAction(modal.red.id, form)
      : await crearRedAction(form);

    setEnviando(false);

    if (!res.ok) {
      setErrorForm(res.error ?? "No se pudo guardar la red social.");
      return;
    }
    if (res.red) {
      setRedes((prev) =>
        modal.red ? prev.map((r) => (r.id === res.red!.id ? res.red! : r)) : [...prev, res.red!]
      );
    }
    mostrar(modal.red ? "Red social actualizada." : "Red social añadida.");
    setModal({ abierto: false, red: null });
  };

  const alternar = async (red: RedSocial) => {
    if (ocupado) return;
    setOcupado(true);
    const res = await alternarRedAction(red.id);
    setOcupado(false);

    if (!res.ok || !res.red) {
      mostrar(res.error ?? "No se pudo cambiar el estado.", "error");
      return;
    }
    const estado = res.red;
    setRedes((prev) => prev.map((r) => (r.id === estado.id ? estado : r)));
    mostrar(estado.isActive ? "Red social visible en la web." : "Red social oculta en la web.");
  };

  const mover = async (red: RedSocial, direccion: "arriba" | "abajo") => {
    if (ocupado) return;
    setOcupado(true);
    const res = await moverRedAction(red.id, direccion);
    setOcupado(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo cambiar el orden.", "error");
      return;
    }
    const indice = redes.findIndex((r) => r.id === red.id);
    const destino = direccion === "arriba" ? indice - 1 : indice + 1;
    if (destino < 0 || destino >= redes.length) return;
    const siguiente = [...redes];
    [siguiente[indice], siguiente[destino]] = [siguiente[destino], siguiente[indice]];
    setRedes(siguiente);
  };

  const eliminar = async () => {
    if (!paraEliminar) return;
    setEnviando(true);
    const res = await eliminarRedAction(paraEliminar.id);
    setEnviando(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo eliminar la red social.", "error");
      return;
    }
    setRedes((prev) => prev.filter((r) => r.id !== paraEliminar.id));
    setParaEliminar(null);
    mostrar("Red social eliminada.");
  };

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Redes sociales</h1>
          <p className={styles.subtitulo}>
            Enlaza tus perfiles para que aparezcan en el pie de tu web. Solo se muestran las que
            estén activas.
          </p>
        </div>
        <button type="button" className="boton boton--primario" onClick={() => abrirModal(null)}>
          <i className="fa fa-plus" aria-hidden="true"></i> Añadir red
        </button>
      </header>

      <section className="tarjeta">
        {redes.length === 0 ? (
          <EmptyState
            icono="fa-share-nodes"
            titulo="Todavía no tienes redes sociales enlazadas"
            descripcion="Añade Instagram, WhatsApp o la que uses para conectar con tus pacientes."
            accion={
              <button type="button" className="boton boton--primario" onClick={() => abrirModal(null)}>
                Añadir red
              </button>
            }
          />
        ) : (
          <ul className={styles.lista}>
            {redes.map((red, indice) => {
              const opcion = opcionRed(red.platform);
              return (
                <li key={red.id} className={styles.fila}>
                  <span className={styles.filaIcono} aria-hidden="true">
                    <i className={`fa ${red.icon || opcion?.icon || "fa-link"}`}></i>
                  </span>
                  <span className={styles.filaTextos}>
                    <span className={styles.filaNombre}>{opcion?.nombre ?? red.platform}</span>
                    <a
                      className={styles.filaUrl}
                      href={red.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {red.url}
                    </a>
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={red.isActive}
                    aria-label={`Mostrar u ocultar ${opcion?.nombre ?? red.platform}`}
                    onClick={() => void alternar(red)}
                    disabled={ocupado}
                    className={`${styles.interruptor} ${red.isActive ? styles.interruptorActivo : ""}`}
                  >
                    <span className={styles.interruptorPunto} />
                  </button>

                  <span className={styles.filaAcciones}>
                    <button
                      type="button"
                      className={styles.iconoBoton}
                      onClick={() => void mover(red, "arriba")}
                      disabled={ocupado || indice === 0}
                      aria-label="Subir"
                      title="Subir"
                    >
                      <i className="fa fa-arrow-up" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      className={styles.iconoBoton}
                      onClick={() => void mover(red, "abajo")}
                      disabled={ocupado || indice === redes.length - 1}
                      aria-label="Bajar"
                      title="Bajar"
                    >
                      <i className="fa fa-arrow-down" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      className={styles.iconoBoton}
                      onClick={() => abrirModal(red)}
                      aria-label="Editar"
                      title="Editar"
                    >
                      <i className="fa fa-pen" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      className={`${styles.iconoBoton} ${styles.iconoBotonPeligro}`}
                      onClick={() => setParaEliminar(red)}
                      aria-label="Eliminar"
                      title="Eliminar"
                    >
                      <i className="fa fa-trash" aria-hidden="true"></i>
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Modal
        abierto={modal.abierto}
        onCerrar={cerrarModal}
        titulo={modal.red ? "Editar red social" : "Añadir red social"}
        ancho="estrecho"
        pie={
          <>
            <button type="button" className="boton boton--secundario" onClick={cerrarModal} disabled={enviando}>
              Cancelar
            </button>
            <button type="button" className="boton boton--primario" onClick={() => void guardar()} disabled={enviando}>
              {enviando ? "Guardando…" : "Guardar"}
            </button>
          </>
        }
      >
        <div className={styles.formulario}>
          {errorForm && (
            <div className="alerta alerta--error" role="alert">
              {errorForm}
            </div>
          )}

          <div>
            <label htmlFor="red-plataforma" className="campo-label">
              Red social <span aria-hidden="true" style={{ color: "var(--color-peligro)" }}>*</span>
            </label>
            <select
              id="red-plataforma"
              className="campo-control"
              value={form.platform}
              onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}
            >
              {REDES_DISPONIBLES.map((opcion) => (
                <option key={opcion.platform} value={opcion.platform}>
                  {opcion.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="red-url" className="campo-label">
              Enlace <span aria-hidden="true" style={{ color: "var(--color-peligro)" }}>*</span>
            </label>
            <input
              id="red-url"
              type="url"
              className="campo-control"
              placeholder="https://instagram.com/tu-usuario"
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              required
            />
            <span className="campo-hint">Pega el enlace completo de tu perfil.</span>
          </div>

          <label className="fila-check">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Mostrar en la web
          </label>
        </div>
      </Modal>

      <ConfirmarModal
        abierto={paraEliminar !== null}
        onCancelar={() => setParaEliminar(null)}
        onConfirmar={() => void eliminar()}
        titulo="Eliminar red social"
        mensaje={`Se dejará de mostrar «${paraEliminar ? (opcionRed(paraEliminar.platform)?.nombre ?? paraEliminar.platform) : ""}» en el pie de tu web.`}
        textoConfirmar="Eliminar"
        cargando={enviando}
      />
    </div>
  );
}
