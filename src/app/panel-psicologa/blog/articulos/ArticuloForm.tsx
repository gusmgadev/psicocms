"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Campo, useToast } from "@/components/ui";
import EditorWysiwyg from "@/components/panel/EditorWysiwyg";
import { crearArticuloAction, editarArticuloAction, subirImagenAction, borrarImagenAction } from "@/actions/blog";
import { sanitizarHtml } from "@/lib/sanitizar";
import type { ArticuloFila, CategoriaFila, EstadoArticulo } from "@/services/blog";
import styles from "./articulo.module.css";

interface Props {
  categorias: CategoriaFila[];
  articulo?: ArticuloFila | null;
}

export default function ArticuloForm({ categorias, articulo }: Props) {
  const { mostrar } = useToast();
  const router = useRouter();

  const [titulo, setTitulo] = useState(articulo?.titulo ?? "");
  const [slug, setSlug] = useState(articulo?.slug ?? "");
  const [slugTocado, setSlugTocado] = useState(Boolean(articulo));
  const [categoryId, setCategoryId] = useState(articulo?.categoryId ?? "");
  const [excerpt, setExcerpt] = useState(articulo?.excerpt ?? "");
  const [contentHtml, setContentHtml] = useState(articulo?.contentHtml ?? "");
  const [status, setStatus] = useState<EstadoArticulo>(articulo?.status ?? "draft");
  const [imagenPath, setImagenPath] = useState<string | null>(articulo?.featuredImagePath ?? null);
  const [imagenUrl, setImagenUrl] = useState<string | null>(articulo?.featuredImageUrl ?? null);

  const [guardando, setGuardando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [pestana, setPestana] = useState<"editar" | "preview">("editar");

  const slugAutomatico = () =>
    titulo
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const cambiarTitulo = (valor: string) => {
    setTitulo(valor);
    if (!slugTocado) setSlug(slugAutomatico() || "");
  };

  const subirImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    const tiposValidos = ["image/jpeg", "image/png", "image/webp"];
    if (!tiposValidos.includes(archivo.type)) {
      mostrar("Formato no válido. Usa JPG, PNG o WebP.", "error");
      return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
      mostrar("La imagen supera los 5 MB.", "error");
      return;
    }

    setSubiendoImagen(true);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      const res = await subirImagenAction(formData);

      if (!res.ok || !res.path) {
        mostrar(res.error ?? "No se pudo subir la imagen.", "error");
        return;
      }

      if (imagenPath) await borrarImagenAction(imagenPath);
      setImagenPath(res.path);
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      setImagenUrl(`${base}/storage/v1/object/public/public-images/${res.path}`);
      mostrar("Imagen subida.");
    } catch {
      mostrar("No se pudo subir la imagen. Revisa el tamaño (máx. 5 MB) e inténtalo de nuevo.", "error");
    } finally {
      setSubiendoImagen(false);
    }
  };

  const quitarImagen = async () => {
    try {
      if (imagenPath) await borrarImagenAction(imagenPath);
      setImagenPath(null);
      setImagenUrl(null);
      mostrar("Imagen eliminada del artículo.");
    } catch {
      mostrar("No se pudo eliminar la imagen.", "error");
    }
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    const input = {
      titulo,
      slug,
      excerpt,
      contentHtml,
      categoryId: categoryId || null,
      status,
      featuredImagePath: imagenPath,
    };

    const res = articulo
      ? await editarArticuloAction(articulo.id, input)
      : await crearArticuloAction(input);
    setGuardando(false);

    if (!res.ok || !res.articulo) {
      mostrar(res.error ?? "No se pudo guardar el artículo.", "error");
      return;
    }
    mostrar(articulo ? "Artículo actualizado." : "Artículo creado.");
    router.push("/panel-psicologa/blog");
  };

  return (
    <form className={styles.formulario} onSubmit={guardar}>
      <div className={styles.principal}>
        <Campo id="art-titulo" etiqueta="Título" requerido>
          <input
            id="art-titulo"
            className="campo-control"
            value={titulo}
            onChange={(e) => cambiarTitulo(e.target.value)}
            maxLength={200}
            required
          />
        </Campo>

        <Campo id="art-slug" etiqueta="Enlace (slug)" pista="Se genera automáticamente a partir del título.">
          <input
            id="art-slug"
            className="campo-control"
            value={slug}
            onChange={(e) => {
              setSlugTocado(true);
              setSlug(e.target.value.toLowerCase());
            }}
            maxLength={200}
          />
        </Campo>

        <Campo id="art-excerpt" etiqueta="Resumen" pista="Breve descripción que aparecerá en el listado del blog (opcional).">
          <textarea
            id="art-excerpt"
            className="campo-control"
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            maxLength={300}
          />
        </Campo>

        <div className={styles.pestanas} role="tablist" aria-label="Contenido del artículo">
          <button
            type="button"
            role="tab"
            aria-selected={pestana === "editar"}
            className={`${styles.pestana} ${pestana === "editar" ? styles.pestanaActiva : ""}`}
            onClick={() => setPestana("editar")}
          >
            <i className="fa fa-pen" aria-hidden="true"></i> Editar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pestana === "preview"}
            className={`${styles.pestana} ${pestana === "preview" ? styles.pestanaActiva : ""}`}
            onClick={() => setPestana("preview")}
          >
            <i className="fa fa-eye" aria-hidden="true"></i> Vista previa
          </button>
        </div>

        {pestana === "editar" ? (
          <EditorWysiwyg valor={contentHtml} onChange={setContentHtml} />
        ) : (
          <div className={styles.preview}>
            {contentHtml.trim() ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizarHtml(contentHtml) }} />
            ) : (
              <p className="campo-hint">Todavía no hay contenido que previsualizar.</p>
            )}
          </div>
        )}
      </div>

      <aside className={styles.lateral}>
        <div className="tarjeta">
          <h2 className={styles.tituloLateral}>Publicación</h2>
          <Campo id="art-estado" etiqueta="Estado">
            <select
              id="art-estado"
              className="campo-control"
              value={status}
              onChange={(e) => setStatus(e.target.value as EstadoArticulo)}
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </Campo>
          <Campo id="art-categoria" etiqueta="Categoría">
            <select
              id="art-categoria"
              className="campo-control"
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <div className="tarjeta">
          <h2 className={styles.tituloLateral}>Imagen destacada</h2>
          <p className="campo-hint">JPG, PNG o WebP, hasta 5 MB.</p>
          {imagenUrl ? (
            <div className={styles.imagenPreview}>
              <img src={imagenUrl} alt="Imagen destacada del artículo" />
              <button type="button" className="boton boton--secundario" onClick={quitarImagen}>
                <i className="fa fa-trash" aria-hidden="true"></i> Quitar imagen
              </button>
            </div>
          ) : (
            <label className={styles.inputArchivo}>
              <i className="fa fa-image" aria-hidden="true"></i>
              <span>{subiendoImagen ? "Subiendo…" : "Elegir imagen"}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={subirImagen} disabled={subiendoImagen} />
            </label>
          )}
        </div>

        <div className={styles.accionesLateral}>
          <button type="submit" className="boton boton--primario boton--bloque" disabled={guardando}>
            {guardando ? "Guardando…" : articulo ? "Guardar cambios" : "Crear artículo"}
          </button>
          <button type="button" className="boton boton--secundario boton--bloque" onClick={() => router.push("/panel-psicologa/blog")}>
            Volver
          </button>
        </div>
      </aside>
    </form>
  );
}
