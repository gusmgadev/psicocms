"use client";

import { useState } from "react";
import styles from "@/app/instalacion/instalacion.module.css";

interface PasoTemaProps {
  onData: (data: { theme: string; layoutMode: "landing" | "multipage" }) => void;
}

const themes = [
  { id: "base", name: "Base", description: "Tema original cálido y profesional", preview: "/images/stock/psicologa.jpg" },
  { id: "calma", name: "Calma", description: "Tonos azules suaves, transmiten tranquilidad", preview: "/images/stock/psicologa.jpg" },
  { id: "naturaleza", name: "Naturaleza", description: "Verdes y tierra, conexión con lo natural", preview: "/images/stock/psicologa.jpg" },
  { id: "moderno", name: "Moderno", description: "Limpio, minimalista, con acentos de color", preview: "/images/stock/psicologa.jpg" },
  { id: "elegancia", name: "Elegancia", description: "Oscuro y sofisticado, para consultas premium", preview: "/images/stock/psicologa.jpg" },
];

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
          {themes.map((theme) => (
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
                  <img src={theme.preview} alt="" aria-hidden="true" />
                  <span className={styles.temaMiniaturaNombre}>{theme.name}</span>
                </div>
                <p className={styles.opcionTitulo}>{theme.name}</p>
                <p className={styles.opcionTexto}>{theme.description}</p>
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
