"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ConfirmarModal, useToast } from "@/components/ui";
import {
  listarImagenesSitioAction,
  subirImagenSitioAction,
  quitarImagenSitioAction,
} from "@/actions/imagenes";
import type { ImagenSitio } from "@/services/imagenes";
import styles from "./imagenes.module.css";

const TIPOS_ACEPTADOS = "image/jpeg,image/png,image/webp";
const LIMITE_MB = 5;

interface Props {
  inicial: ImagenSitio[];
}

export default function ImagenesPanel({ inicial }: Props) {
  const { mostrar } = useToast();

  const [imagenes, setImagenes] = useState<ImagenSitio[]>(inicial);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [quitando, setQuitando] = useState<ImagenSitio | null>(null);
  const [cargandoQuitar, setCargandoQuitar] = useState(false);
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  const recargar = async () => {
    setImagenes(await listarImagenesSitioAction());
  };

  const seleccionar = (placeholder: string) => {
    inputsRef.current[placeholder]?.click();
  };

  const subir = async (hueco: ImagenSitio, archivo: File | undefined) => {
    if (!archivo) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.type)) {
      mostrar("Solo se permiten imágenes JPG, PNG o WebP.", "error");
      return;
    }
    if (archivo.size > LIMITE_MB * 1024 * 1024) {
      mostrar(`La imagen no debe superar ${LIMITE_MB} MB.`, "error");
      return;
    }

    setSubiendo(hueco.id);
    const formData = new FormData();
    formData.set("placeholder", hueco.id);
    formData.set("archivo", archivo);
    const res = await subirImagenSitioAction(formData);
    setSubiendo(null);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo subir la imagen.", "error");
      return;
    }
    mostrar("Imagen actualizada. Ya se muestra en la web.");
    await recargar();
  };

  const quitar = async () => {
    if (!quitando) return;
    setCargandoQuitar(true);
    const res = await quitarImagenSitioAction(quitando.id);
    setCargandoQuitar(false);

    if (!res.ok) {
      mostrar(res.error ?? "No se pudo quitar la imagen.", "error");
      return;
    }
    mostrar("Se vuelve a usar la imagen de stock.");
    setQuitando(null);
    await recargar();
  };

  return (
    <div className={styles.pagina}>
      <div className={styles.cabecera}>
        <div>
          <h1 className={styles.titulo}>Imágenes</h1>
          <p className={styles.subtitulo}>
            Cambia las imágenes de tu web. Cada hueco muestra la imagen que se está usando ahora: la que has
            subido o, si no hay, la de ejemplo incluida en el tema.
          </p>
        </div>
      </div>

      <div className={styles.rejilla}>
        {imagenes.map((hueco) => (
          <article key={hueco.id} className={`tarjeta ${styles.tarjeta}`}>
            <div className={styles.preview}>
              <Image
                src={hueco.url}
                alt={hueco.alt}
                fill
                sizes="(max-width: 640px) 100vw, 28rem"
                className={styles.previewImg}
              />
              <span
                className={`${styles.badge} ${hueco.personalizada ? styles.badgePropia : styles.badgeStock}`}
              >
                <i
                  className={`fa ${hueco.personalizada ? "fa-image" : "fa-palette"}`}
                  aria-hidden="true"
                ></i>
                {hueco.personalizada ? "Tu imagen" : "De ejemplo"}
              </span>
            </div>

            <div className={styles.cuerpo}>
              <h2 className={styles.nombre}>{hueco.nombre}</h2>
              <p className={styles.descripcion}>{hueco.descripcion}</p>

              <input
                ref={(el) => {
                  inputsRef.current[hueco.id] = el;
                }}
                type="file"
                accept={TIPOS_ACEPTADOS}
                className={styles.inputOculto}
                onChange={(e) => {
                  void subir(hueco, e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              <div className={styles.acciones}>
                <button
                  type="button"
                  className="boton boton--primario"
                  onClick={() => seleccionar(hueco.id)}
                  disabled={subiendo !== null}
                >
                  <i className="fa fa-upload" aria-hidden="true"></i>
                  {subiendo === hueco.id
                    ? "Subiendo…"
                    : hueco.personalizada
                      ? "Cambiar imagen"
                      : "Subir imagen"}
                </button>
                {hueco.personalizada ? (
                  <button
                    type="button"
                    className="boton boton--secundario"
                    onClick={() => setQuitando(hueco)}
                    disabled={subiendo !== null}
                  >
                    <i className="fa fa-rotate-left" aria-hidden="true"></i>
                    Usar la de ejemplo
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      <ConfirmarModal
        abierto={quitando !== null}
        titulo="Usar la imagen de ejemplo"
        mensaje={
          quitando
            ? `Vas a eliminar la imagen personalizada de "${quitando.nombre}" y volver a la imagen de ejemplo del tema.`
            : ""
        }
        textoConfirmar="Usar la de ejemplo"
        cargando={cargandoQuitar}
        onCancelar={() => setQuitando(null)}
        onConfirmar={quitar}
      />
    </div>
  );
}
