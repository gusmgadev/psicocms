import styles from "../publico.module.css";

export default function SobreMi() {
  return (
    <div className={styles.pagina}>
      <h1 className={styles.paginaTitulo}>Sobre mí</h1>
      <p className={styles.paginaTexto}>Información sobre la psicóloga.</p>
    </div>
  );
}
