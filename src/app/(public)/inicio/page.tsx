import styles from "../publico.module.css";

export default function Inicio() {
  return (
    <div className={styles.pagina}>
      <h1 className={styles.paginaTitulo}>Inicio</h1>
      <p className={styles.paginaTexto}>
        Bienvenida a PsicoCMS. Esta es la página de inicio pública.
      </p>
    </div>
  );
}
