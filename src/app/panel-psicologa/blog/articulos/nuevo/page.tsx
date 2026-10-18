import { exigirSesion } from "@/lib/auth-guard";
import { listarCategorias } from "@/services/blog";
import ArticuloForm from "../ArticuloForm";
import styles from "../articulo.module.css";

export default async function PaginaNuevoArticulo() {
  await exigirSesion();
  const categorias = await listarCategorias(true);

  return (
    <div className={styles.pagina}>
      <div>
        <h1 className={styles.titulo}>Nuevo artículo</h1>
        <p className={styles.subtitulo}>Escribe el contenido y publícalo cuando quieras.</p>
      </div>
      <ArticuloForm categorias={categorias} />
    </div>
  );
}
