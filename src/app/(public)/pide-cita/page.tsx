import styles from "../publico.module.css";

export default function PideCita() {
  return (
    <div className={styles.pagina}>
      <h1 className={styles.paginaTitulo}>Pide cita</h1>
      <p className={styles.paginaTexto}>Formulario de reserva de citas.</p>
    </div>
  );
}
