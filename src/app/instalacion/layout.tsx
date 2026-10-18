import styles from "./instalacion.module.css";

export default function InstalacionLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.page}>{children}</div>;
}
