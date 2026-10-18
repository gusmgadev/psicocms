import { notFound } from "next/navigation";
import { exigirSesion } from "@/lib/auth-guard";
import { listarCategorias, obtenerArticulo } from "@/services/blog";
import ArticuloForm from "../ArticuloForm";
import styles from "../articulo.module.css";

export default async function PaginaEditarArticulo({ params }: { params: Promise<{ id: string }> }) {
  await exigirSesion();
  const { id } = await params;

  const [articulo, categorias] = await Promise.all([obtenerArticulo(id), listarCategorias(true)]);
  if (!articulo) notFound();

  return (
    <div className={styles.pagina}>
      <div>
        <h1 className={styles.titulo}>Editar artículo</h1>
        <p className={styles.subtitulo}>Actualiza el contenido o la publicación de tu artículo.</p>
      </div>
      <ArticuloForm categorias={categorias} articulo={articulo} />
    </div>
  );
}
