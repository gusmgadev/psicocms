"use client";

import { useEffect, useState, type FormEvent } from "react";
import { loginAction } from "@/actions/auth";
import { verificarCodigoMfaAction } from "@/actions/mfa";
import { useRouter } from "next/navigation";
import styles from "./acceso.module.css";

type Paso = "login" | "mfa" | "recover";

export default function AccesoPage() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("login");
  const [showRecover, setShowRecover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoverMsg, setRecoverMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);
  const [codigo, setCodigo] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mfa") === "pendiente") {
      setPaso("mfa");
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("remember", String(remember));

      const result = await loginAction(formData);

      if (result.ok) {
        router.push("/panel-psicologa");
        router.refresh();
      } else if (result.mfaRequerido) {
        setCodigo("");
        setPaso("mfa");
        setLoading(false);
      } else {
        setError(result.error || "Error al iniciar sesión");
        setLoading(false);
      }
    } catch {
      setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  const handleMfa = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await verificarCodigoMfaAction(codigo);

      if (result.ok) {
        router.push("/panel-psicologa");
        router.refresh();
        return;
      }
      setError(result.error || "El código no es correcto");
      setCodigo("");
      setLoading(false);
    } catch {
      setError("No se pudo verificar el código. Inténtalo de nuevo.");
      setCodigo("");
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
      {recoverMsg && !showRecover && paso === "login" && (
        <div className="alerta alerta--exito" style={{ marginBottom: "1.6rem" }} role="status">
          {recoverMsg}
        </div>
      )}

      {paso === "mfa" ? (
        <form onSubmit={handleMfa} className={styles.formulario}>
          <div>
            <h2 className={styles.recuperarTitulo}>Verificación en dos pasos</h2>
            <p className={styles.recuperarTexto}>
              Introduce el código de 6 dígitos de tu aplicación de autenticación.
            </p>
          </div>

          {error && (
            <div className="alerta alerta--error" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="codigo" className="campo-label">
              Código de verificación <span style={{ color: "var(--color-peligro)" }}>*</span>
            </label>
            <input
              id="codigo"
              name="codigo"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              className="campo-control"
              style={{ textAlign: "center", letterSpacing: "0.4rem", fontSize: "2rem" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || codigo.length !== 6}
            className="boton boton--primario boton--bloque"
          >
            {loading ? "Verificando..." : "Verificar"}
          </button>

          <p className={styles.enlaceCentro}>
            <button
              type="button"
              onClick={() => {
                setPaso("login");
                setError(null);
                setCodigo("");
              }}
              className={styles.enlaceBoton}
            >
              Volver al inicio de sesión
            </button>
          </p>
        </form>
      ) : !showRecover ? (
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
