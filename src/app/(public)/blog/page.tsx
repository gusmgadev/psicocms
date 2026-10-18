import styles from "../publico.module.css";

export default function Blog() {
  return (
    <div className={styles.pagina}>
      <h1 className={styles.paginaTitulo}>Blog</h1>
      <p className={styles.paginaTexto}>Artículos del blog.</p>
    </div>
  );
}
