import styles from "./acceso.module.css";

export default function AccesoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.titulo}>Acceso psicólogo/a</h1>
        {children}
      </div>
    </div>
  );
}
