import styles from "../publico.module.css";

export default function Faq() {
  return (
    <div className={styles.pagina}>
      <h1 className={styles.paginaTitulo}>Preguntas frecuentes</h1>
      <p className={styles.paginaTexto}>Preguntas frecuentes de los pacientes.</p>
    </div>
  );
}
