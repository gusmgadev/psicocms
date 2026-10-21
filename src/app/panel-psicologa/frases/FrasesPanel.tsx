"use client";

import { useMemo, useState } from "react";
import { EmptyState, useToast } from "@/components/ui";
import { guardarFrasesAction } from "@/actions/frases";
import type { Frase, GrupoFrases } from "@/services/frases";
import styles from "./frases.module.css";

interface FrasesPanelProps {
  grupos: GrupoFrases[];
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function FrasesPanel({ grupos }: FrasesPanelProps) {
  const { mostrar } = useToast();
  const [valores, setValores] = useState<Record<string, string>>(() => {
    const mapa: Record<string, string> = {};
    for (const grupo of grupos) {
      for (const frase of grupo.frases) mapa[frase.key] = frase.value;
    }
    return mapa;
  });
  const [originales, setOriginales] = useState<Record<string, string>>(() => ({
    ...valores,
  }));
  const [busqueda, setBusqueda] = useState("");
  const [guardando, setGuardando] = useState(false);

  const gruposFiltrados = useMemo(() => {
    const texto = normalizar(busqueda.trim());
    if (!texto) return grupos;
    return grupos
      .map((grupo) => ({
        ...grupo,
        frases: grupo.frases.filter(
          (frase) =>
            normalizar(frase.key).includes(texto) ||
            normalizar(frase.description ?? "").includes(texto) ||
            normalizar(valores[frase.key] ?? "").includes(texto)
        ),
      }))
      .filter((grupo) => grupo.frases.length > 0);
  }, [grupos, busqueda, valores]);

  const modificadas = useMemo(
    () =>
      Object.keys(valores).filter((key) => valores[key] !== originales[key]),
    [valores, originales]
  );

  const cambiarValor = (key: string, valor: string) => {
    setValores((prev) => ({ ...prev, [key]: valor }));
  };

  const guardar = async () => {
    if (guardando || modificadas.length === 0) return;
    const cambios = modificadas.map((key) => ({ key, value: valores[key] }));

    setGuardando(true);
    const res = await guardarFrasesAction(cambios);
    setGuardando(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudieron guardar las frases.", "error");
      return;
    }

    setOriginales((prev) => {
      const siguiente = { ...prev };
      for (const cambio of cambios) siguiente[cambio.key] = cambio.value;
      return siguiente;
    });
    mostrar(
      modificadas.length === 1
        ? "Frase guardada."
        : `${modificadas.length} frases guardadas.`
    );
  };

  if (grupos.length === 0) {
    return (
      <div className={styles.pagina}>
        <header className={styles.cabecera}>
          <h1 className={styles.titulo}>Frases públicas</h1>
          <p className={styles.subtitulo}>
            Personaliza los textos y frases que aparecen en tu web y en los temas visuales.
          </p>
        </header>
        <section className="tarjeta">
          <EmptyState
            icono="fa-quote-left"
            titulo="Todavía no hay frases"
            descripcion="Ejecuta la migración de datos iniciales para cargar las frases por defecto."
          />
        </section>
      </div>
    );
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.cabecera}>
        <div className={styles.cabeceraTextos}>
          <h1 className={styles.titulo}>Frases públicas</h1>
          <p className={styles.subtitulo}>
            Personaliza los textos y frases que aparecen en tu web y en los temas visuales. Los
            cambios se aplican de inmediato a la web pública.
          </p>
        </div>
        <div className={styles.cabeceraAcciones}>
          <div className={styles.buscador}>
            <i className="fa fa-magnifying-glass" aria-hidden="true"></i>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar frase…"
              aria-label="Buscar frase"
              className={styles.buscadorInput}
            />
          </div>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={guardando || modificadas.length === 0}
            className="boton boton--primario"
          >
            {guardando
              ? "Guardando…"
              : modificadas.length > 0
                ? `Guardar (${modificadas.length})`
                : "Guardar cambios"}
          </button>
        </div>
      </header>

      {gruposFiltrados.length === 0 ? (
        <section className="tarjeta">
          <EmptyState
            icono="fa-magnifying-glass"
            titulo="Sin resultados"
            descripcion={`No hay frases que coincidan con «${busqueda.trim()}».`}
          />
        </section>
      ) : (
        <div className={styles.grupos}>
          {gruposFiltrados.map((grupo) => (
            <section key={grupo.titulo} className="tarjeta">
              <h2 className={styles.grupoTitulo}>{grupo.titulo}</h2>
              <ul className={styles.lista}>
                {grupo.frases.map((frase: Frase) => {
                  const valor = valores[frase.key] ?? "";
                  const cambiada = valor !== originales[frase.key];
                  const largo = valor.length > 80;
                  return (
                    <li
                      key={frase.key}
                      className={`${styles.fila} ${cambiada ? styles.filaModificada : ""}`}
                    >
                      <span className={styles.filaTextos}>
                        <span className={styles.filaEtiqueta}>
                          {frase.description || frase.key}
                        </span>
                        <code className={styles.filaClave}>{frase.key}</code>
                      </span>
                      {largo ? (
                        <textarea
                          value={valor}
                          onChange={(e) => cambiarValor(frase.key, e.target.value)}
                          rows={3}
                          maxLength={1000}
                          aria-label={frase.description || frase.key}
                          className={styles.filaArea}
                        />
                      ) : (
                        <input
                          type="text"
                          value={valor}
                          onChange={(e) => cambiarValor(frase.key, e.target.value)}
                          maxLength={1000}
                          aria-label={frase.description || frase.key}
                          className={styles.filaInput}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
