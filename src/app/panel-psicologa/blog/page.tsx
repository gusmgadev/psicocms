import { exigirSesion } from "@/lib/auth-guard";
import { listarArticulos, listarCategorias } from "@/services/blog";
import BlogPanel from "./BlogPanel";

export default async function PaginaBlog() {
  await exigirSesion();

  const [articulos, categorias] = await Promise.all([
    listarArticulos({ pagina: 1 }),
    listarCategorias(true),
  ]);

  return <BlogPanel inicial={articulos} categorias={categorias} />;
}
