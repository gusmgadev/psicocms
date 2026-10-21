"use client";

import { useState } from "react";
import { TEMAS } from "@/themes";
import styles from "@/app/instalacion/instalacion.module.css";

interface PasoTemaProps {
  onData: (data: { theme: string; layoutMode: "landing" | "multipage" }) => void;
}

export default function PasoTema({ onData }: PasoTemaProps) {
  const [selectedTheme, setSelectedTheme] = useState("base");
  const [layoutMode, setLayoutMode] = useState<"landing" | "multipage">("multipage");

  const selectLayout = (mode: "landing" | "multipage") => {
    setLayoutMode(mode);
    onData({ theme: selectedTheme, layoutMode: mode });
  };

  const selectTheme = (id: string) => {
    setSelectedTheme(id);
    onData({ theme: id, layoutMode });
  };

  return (
    <div>
      <h2 className={styles.pasoTitulo}>Paso 5: Tema visual</h2>
      <p className={styles.pasoDescripcion}>
        Elige la apariencia de tu web. Podrás cambiarla después en el panel.
        El tema &quot;Base&quot; es idéntico al diseño original.
      </p>

      <div className={styles.pasoGrupo}>
        <h3 className={styles.seccionTitulo}>Modo de layout</h3>
        <div className={styles.rejilla2}>
          <label className={styles.opcionRadio}>
            <input
              type="radio"
              name="layoutMode"
              value="multipage"
              checked={layoutMode === "multipage"}
              onChange={() => selectLayout("multipage")}
            />
            <div className={styles.opcionCuerpo}>
              <div className={styles.opcionIcono}>
                <i className="fa fa-copy" aria-hidden="true"></i>
              </div>
              <p className={styles.opcionTitulo}>Multipágina</p>
              <p className={styles.opcionTexto}>Secciones en URLs separadas</p>
            </div>
          </label>
          <label className={styles.opcionRadio}>
            <input
              type="radio"
              name="layoutMode"
              value="landing"
              checked={layoutMode === "landing"}
              onChange={() => selectLayout("landing")}
            />
            <div className={styles.opcionCuerpo}>
              <div className={styles.opcionIcono}>
                <i className="fa fa-file-lines" aria-hidden="true"></i>
              </div>
              <p className={styles.opcionTitulo}>Landing (una página)</p>
              <p className={styles.opcionTexto}>Scroll suave, todo en una URL</p>
            </div>
          </label>
        </div>
      </div>

      <div className={styles.pasoGrupo}>
        <h3 className={styles.seccionTitulo}>Tema visual</h3>
        <div className={styles.rejilla3}>
          {TEMAS.map((theme) => (
            <label key={theme.id} className={styles.opcionRadio}>
              <input
                type="radio"
                name="theme"
                value={theme.id}
                checked={selectedTheme === theme.id}
                onChange={() => selectTheme(theme.id)}
              />
              <div className={styles.opcionCuerpo}>
                <div className={styles.temaMiniatura}>
                  <img src="/images/stock/psicologa.jpg" alt="" aria-hidden="true" />
                  <span className={styles.temaMiniaturaNombre}>{theme.nombre}</span>
                </div>
                <p className={styles.opcionTitulo}>{theme.nombre}</p>
                <p className={styles.opcionTexto}>{theme.descripcion}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className={styles.avisosCaja}>
        <strong>¿Quieres un diseño personalizado?</strong>{" "}
        <a href="https://victorroblesweb.es/contacto" target="_blank" rel="noopener noreferrer">
          Pídelo aquí
        </a>
      </div>
    </div>
  );
}
