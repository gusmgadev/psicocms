import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  icono: string;
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
}

export function EmptyState({ icono, titulo, descripcion, accion }: EmptyStateProps) {
  return (
    <div className={styles.vacio}>
      <div className={styles.icono}>
        <i className={`fa ${icono}`} aria-hidden="true"></i>
      </div>
      <h3 className={styles.titulo}>{titulo}</h3>
      {descripcion && <p className={styles.descripcion}>{descripcion}</p>}
      {accion && <div className={styles.accion}>{accion}</div>}
    </div>
  );
}
