import styles from "./Campo.module.css";

interface CampoProps {
  id: string;
  etiqueta: string;
  children: React.ReactNode;
  error?: string;
  pista?: string;
  requerido?: boolean;
}

export function Campo({ id, etiqueta, children, error, pista, requerido }: CampoProps) {
  return (
    <div className={styles.campo}>
      <label htmlFor={id} className="campo-label">
        {etiqueta}
        {requerido && <span className={styles.requerido} aria-hidden="true"> *</span>}
      </label>
      {children}
      {error ? (
        <span id={`${id}-error`} className="campo-error">
          {error}
        </span>
      ) : pista ? (
        <span id={`${id}-pista`} className="campo-hint">
          {pista}
        </span>
      ) : null}
    </div>
  );
}
