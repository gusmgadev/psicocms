import Link from "next/link";
import { exigirSesion } from "@/lib/auth-guard";
import { buscarEnPanel } from "@/services/busqueda";
import { EmptyState } from "@/components/ui/EmptyState";
import styles from "./buscar.module.css";

export default async function PaginaBuscar({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await exigirSesion();

  const { q = "" } = await searchParams;
  const resultado = await buscarEnPanel(q);

  return (
    <div className={styles.pagina}>
      <div>
        <h1 className={styles.titulo}>Buscar en el panel</h1>
        {q ? (
          <p className={styles.subtitulo} style={{ marginTop: "0.6rem" }}>
            {resultado.total} {resultado.total === 1 ? "resultado" : "resultados"} para «
            {resultado.texto}»
          </p>
        ) : (
          <p className={styles.subtitulo} style={{ marginTop: "0.6rem" }}>
            Escribe algo en el buscador de la cabecera para encontrar pacientes, citas, notas de
            sesión, artículos o preguntas frecuentes.
          </p>
        )}
      </div>

      {q && resultado.total === 0 && (
        <div className="tarjeta">
          <EmptyState
            icono="fa-magnifying-glass"
            titulo="Sin resultados"
            descripcion="Prueba con otro término: por ejemplo un nombre, un teléfono, el número de ficha o una palabra del texto."
          />
        </div>
      )}

      {resultado.grupos.map((grupo) => (
        <section key={grupo.clave} className="tarjeta">
          <h2 className={styles.grupoTitulo}>
            <i className={`fa ${grupo.icono}`} aria-hidden="true"></i>
            {grupo.titulo}
            <span className={styles.grupoContador}>{grupo.items.length}</span>
          </h2>
          <ul className={styles.lista}>
            {grupo.items.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className={styles.item}>
                  <span className={styles.itemTitulo}>{item.titulo}</span>
                  {item.detalle && <span className={styles.itemDetalle}>{item.detalle}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
