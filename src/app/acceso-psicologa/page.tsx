"use client";

import { useState, FormEvent } from "react";
import { loginAction } from "@/actions/auth";
import { useRouter } from "next/navigation";
import styles from "./acceso.module.css";

export default function AccesoPage() {
  const router = useRouter();
  const [showRecover, setShowRecover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoverMsg, setRecoverMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("remember", String(remember));

    const result = await loginAction(formData);

    if (result.ok) {
      router.push("/panel-psicologa");
      router.refresh();
    } else {
      setError(result.error || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  const handleRecover = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.ok) {
        setShowRecover(false);
        setRecoverMsg("Si el email existe, recibirás instrucciones para restablecer tu contraseña.");
      } else {
        setRecoverMsg(null);
        setError(data.error || "Error al enviar el enlace");
      }
    } catch {
      setError("Error de conexión");
    }
  };

  return (
    <div>
      {recoverMsg && !showRecover && (
        <div className="alerta alerta--exito" style={{ marginBottom: "1.6rem" }} role="status">
          {recoverMsg}
        </div>
      )}

      {!showRecover ? (
        <form onSubmit={handleSubmit} className={styles.formulario}>
          {error && (
            <div className="alerta alerta--error" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="campo-label">
              Email <span style={{ color: "var(--color-peligro)" }}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="campo-control"
            />
          </div>

          <div>
            <label htmlFor="phone" className="campo-label">
              Teléfono <span style={{ color: "var(--color-peligro)" }}>*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="600000000"
              className="campo-control"
            />
          </div>

          <div>
            <label htmlFor="password" className="campo-label">
              Contraseña <span style={{ color: "var(--color-peligro)" }}>*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={12}
              autoComplete="current-password"
              className="campo-control"
            />
            <span className="campo-hint">Mínimo 12 caracteres</span>
          </div>

          <label className="fila-check">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Mantener sesión iniciada
          </label>

          <button
            type="submit"
            disabled={loading}
            className="boton boton--primario boton--bloque"
          >
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>

          <p className={styles.enlaceCentro}>
            ¿Olvidaste tu contraseña?{" "}
            <button
              type="button"
              onClick={() => { setShowRecover(true); setError(null); setRecoverMsg(null); }}
              className={styles.enlaceBoton}
            >
              Recuperar
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRecover} className={styles.formulario}>
          <div>
            <h2 className={styles.recuperarTitulo}>Recuperar contraseña</h2>
            <p className={styles.recuperarTexto}>
              Introduce tu email y te enviaremos un enlace para restablecerla.
            </p>
          </div>

          <div>
            <label htmlFor="recoverEmail" className="campo-label">
              Email <span style={{ color: "var(--color-peligro)" }}>*</span>
            </label>
            <input
              id="recoverEmail"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="campo-control"
            />
          </div>

          <button type="submit" className="boton boton--primario boton--bloque">
            Enviar enlace
          </button>

          <p className={styles.enlaceCentro}>
            <button
              type="button"
              onClick={() => { setShowRecover(false); setError(null); }}
              className={styles.enlaceBoton}
            >
              Volver al login
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
