"use client";

import { useState } from "react";
import { useToast } from "@/components/ui";
import { guardarConfigTemaAction } from "@/actions/temas";
import { MODOS_LAYOUT, TEMAS, type ModoLayout } from "@/themes";
import type { ConfigTema } from "@/services/temas";
import styles from "./temas.module.css";

interface Props {
  inicial: ConfigTema;
}

export default function TemasPanel({ inicial }: Props) {
  const { mostrar } = useToast();
  const [temaActivo, setTemaActivo] = useState(inicial.temaActivo);
  const [modoLayout, setModoLayout] = useState<ModoLayout>(inicial.modoLayout);
  const [guardando, setGuardando] = useState(false);

  const guardar = async (tema: string, modo: ModoLayout) => {
    setGuardando(true);
    const res = await guardarConfigTemaAction(tema, modo);
    setGuardando(false);

    if (!res.ok || !res.config) {
      mostrar(res.error ?? "No se pudo guardar el tema.", "error");
      return;
    }
    setTemaActivo(res.config.temaActivo);
    setModoLayout(res.config.modoLayout);
    const nombreTema = TEMAS.find((t) => t.id === res.config?.temaActivo)?.nombre ?? "tema";
    mostrar(`Tema «${nombreTema}» activado en tu web.`);
  };

  const seleccionarTema = (id: string) => {
    if (guardando || id === temaActivo) return;
    void guardar(id, modoLayout);
  };

  const seleccionarModo = (modo: ModoLayout) => {
    if (guardando || modo === modoLayout) return;
    void guardar(temaActivo, modo);
  };

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Temas visuales</h1>
          <p className={styles.subtitulo}>
            Elige la plantilla de tu web y si quieres una sola página (landing) o varias páginas.
            Los cambios se aplican automáticamente.
          </p>
        </div>
      </div>

      <section className="tarjeta">
        <h2 className={styles.tituloTarjeta}>Tema visual</h2>
        <p className={styles.descripcionTarjeta}>
          Cada tema cambia los colores y el estilo de toda tu web. Puedes previsualizarlo con tus
          datos antes de elegirlo.
        </p>
        <div className={styles.rejillaTemas}>
          {TEMAS.map((tema) => {
            const seleccionado = tema.id === temaActivo;
            return (
              <div
                key={tema.id}
                className={`${styles.tarjetaTema} ${seleccionado ? styles.tarjetaTemaActiva : ""}`}
              >
                <button
                  type="button"
                  onClick={() => seleccionarTema(tema.id)}
                  disabled={guardando}
                  className={styles.botonTema}
                  aria-pressed={seleccionado}
                >
                  <span className={styles.muestras} aria-hidden="true">
                    <span
                      className={styles.muestra}
                      style={{ backgroundColor: tema.colores.primario }}
                    />
                    <span
                      className={styles.muestra}
                      style={{ backgroundColor: tema.colores.fondo }}
                    />
                    <span
                      className={styles.muestra}
                      style={{ backgroundColor: tema.colores.acento }}
                    />
                    <span
                      className={styles.muestra}
                      style={{ backgroundColor: tema.colores.texto }}
                    />
                  </span>
                  <span className={styles.nombreTema}>{tema.nombre}</span>
                  <span className={styles.descripcionTema}>{tema.descripcion}</span>
                  {seleccionado && (
                    <span className={styles.etiquetaActivo}>
                      <i className="fa fa-check" aria-hidden="true"></i> En uso
                    </span>
                  )}
                </button>
                <a
                  href={`/preview-tema/${tema.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.enlacePreview}
                >
                  <i className="fa fa-up-right-from-square" aria-hidden="true"></i>
                  Previsualizar
                </a>
              </div>
            );
          })}
        </div>
      </section>

      <section className="tarjeta">
        <h2 className={styles.tituloTarjeta}>Formato de la web</h2>
        <p className={styles.descripcionTarjeta}>
          Decide cómo navegan tus visitantes por tu web. Puedes cambiarlo cuando quieras.
        </p>
        <div className={styles.rejillaModos}>
          {MODOS_LAYOUT.map((modo) => {
            const seleccionado = modo.id === modoLayout;
            return (
              <button
                key={modo.id}
                type="button"
                onClick={() => seleccionarModo(modo.id)}
                disabled={guardando}
                className={`${styles.tarjetaModo} ${seleccionado ? styles.tarjetaModoActiva : ""}`}
                aria-pressed={seleccionado}
              >
                <span className={styles.modoIcono} aria-hidden="true">
                  <i className={`fa ${modo.icono}`}></i>
                </span>
                <span className={styles.modoTextos}>
                  <span className={styles.modoNombre}>{modo.nombre}</span>
                  <span className={styles.modoDescripcion}>{modo.descripcion}</span>
                </span>
                {seleccionado && (
                  <span className={styles.etiquetaActivo}>
                    <i className="fa fa-check" aria-hidden="true"></i> En uso
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className={styles.aviso}>
        <span className={styles.avisoIcono} aria-hidden="true">
          <i className="fa fa-palette"></i>
        </span>
        <p className={styles.avisoTexto}>
          <strong>¿Quieres un diseño personalizado?</strong>{" "}
          <a
            href="https://victorroblesweb.es/contacto"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.avisoEnlace}
          >
            Pídelo aquí
          </a>{" "}
          y lo adaptamos a tu consulta.
        </p>
      </div>
    </div>
  );
}
