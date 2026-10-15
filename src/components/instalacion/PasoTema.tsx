"use client";

import { useState } from "react";

interface PasoTemaProps {
  onComplete: (data: { theme: string; layoutMode: "landing" | "multipage" }) => void;
}

const themes = [
  { id: "base", name: "Base", description: "Tema original cálido y profesional", preview: "/images/stock/psicologa.jpg" },
  { id: "calma", name: "Calma", description: "Tonos azules suaves, transmiten tranquilidad", preview: "/images/stock/psicologa.jpg" },
  { id: "naturaleza", name: "Naturaleza", description: "Verdes y tierra, conexión con lo natural", preview: "/images/stock/psicologa.jpg" },
  { id: "moderno", name: "Moderno", description: "Limpio, minimalista, con acentos de color", preview: "/images/stock/psicologa.jpg" },
  { id: "elegancia", name: "Elegancia", description: "Oscuro y sofisticado, para consultas premium", preview: "/images/stock/psicologa.jpg" },
];

export default function PasoTema({ onComplete }: PasoTemaProps) {
  const [selectedTheme, setSelectedTheme] = useState("base");
  const [layoutMode, setLayoutMode] = useState<"landing" | "multipage">("multipage");

  const handleSubmit = () => {
    onComplete({ theme: selectedTheme, layoutMode });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-texto)] mb-2">Paso 5: Tema visual</h2>
        <p className="text-[var(--color-texto-suave)]">
          Elige la apariencia de tu web. Podrás cambiarla después en el panel.
          El tema "Base" es idéntico al diseño original.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-medium text-[var(--color-texto)] mb-3">Modo de layout</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className={`relative cursor-pointer ${layoutMode === "multipage" ? "ring-2 ring-[var(--color-primario)]" : ""}`}>
            <input
              type="radio"
              name="layoutMode"
              value="multipage"
              checked={layoutMode === "multipage"}
              onChange={() => setLayoutMode("multipage")}
              className="sr-only"
            />
            <div className="p-4 border rounded-[var(--radius-lg)] text-center hover:bg-[var(--color-fondo-alt)] transition-colors">
              <div className="text-3xl mb-2">📄</div>
              <p className="font-medium text-[var(--color-texto)]">Multipágina</p>
              <p className="text-sm text-[var(--color-texto-suave)] mt-1">Secciones en URLs separadas</p>
            </div>
          </label>
          <label className={`relative cursor-pointer ${layoutMode === "landing" ? "ring-2 ring-[var(--color-primario)]" : ""}`}>
            <input
              type="radio"
              name="layoutMode"
              value="landing"
              checked={layoutMode === "landing"}
              onChange={() => setLayoutMode("landing")}
              className="sr-only"
            />
            <div className="p-4 border rounded-[var(--radius-lg)] text-center hover:bg-[var(--color-fondo-alt)] transition-colors">
              <div className="text-3xl mb-2">📜</div>
              <p className="font-medium text-[var(--color-texto)]">Landing (una página)</p>
              <p className="text-sm text-[var(--color-texto-suave)] mt-1">Scroll suave, todo en una URL</p>
            </div>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-[var(--color-texto)] mb-3">Tema visual</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes.map((theme) => (
            <label
              key={theme.id}
              className={`relative cursor-pointer ${selectedTheme === theme.id ? "ring-2 ring-[var(--color-primario)]" : ""}`}
            >
              <input
                type="radio"
                name="theme"
                value={theme.id}
                checked={selectedTheme === theme.id}
                onChange={() => setSelectedTheme(theme.id)}
                className="sr-only"
              />
              <div className="p-4 border rounded-[var(--radius-lg)] hover:bg-[var(--color-fondo-alt)] transition-colors h-full">
                <div className="aspect-video bg-[var(--color-fondo-alt)] rounded-[var(--radius-md)] mb-3 relative overflow-hidden">
                  <img
                    src={theme.preview}
                    alt={theme.name}
                    className="w-full h-full object-cover opacity-30"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                    <span className="text-white text-sm font-medium">{theme.name}</span>
                  </div>
                </div>
                <p className="font-medium text-[var(--color-texto)]">{theme.name}</p>
                <p className="text-sm text-[var(--color-texto-suave)] mt-1">{theme.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-[var(--color-primario)]/5 border border-[var(--color-primario)]/20 rounded-[var(--radius-md)] p-4">
        <p className="text-sm text-[var(--color-primario)]">
          <strong>¿Quieres un diseño personalizado?</strong>{" "}
          <a href="https://victorroblesweb.es/contacto" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-primario-oscuro)]">
            Pídelo aquí
          </a>
        </p>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-3 px-4 bg-[var(--color-primario)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primario-oscuro)] transition-colors font-medium"
      >
        Finalizar instalación
      </button>
    </div>
  );
}