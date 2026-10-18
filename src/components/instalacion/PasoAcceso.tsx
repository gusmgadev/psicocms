"use client";

import { useState } from "react";
import styles from "@/app/instalacion/instalacion.module.css";

interface PasoAccesoProps {
  onComplete: (data: { email: string; phone: string; password: string }) => void;
}

export default function PasoAcceso({ onComplete }: PasoAccesoProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email || !email.includes("@")) newErrors.email = "Email inválido";
    if (!phone || !/^\d{9,15}$/.test(phone.replace(/\D/g, ""))) newErrors.phone = "Teléfono inválido (solo números, 9-15 dígitos)";
    if (password.length < 12) newErrors.password = "Mínimo 12 caracteres";
    if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const cleanPhone = phone.replace(/\D/g, "");
      onComplete({ email, phone: cleanPhone, password });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className={styles.pasoTitulo}>Paso 2: Datos de acceso</h2>
      <p className={styles.pasoDescripcion}>
        Estos datos se usarán para crear tu usuario único en Supabase Auth.
        El teléfono actúa como tercer dato de verificación al iniciar sesión.
      </p>

      <div className={styles.pasoGrupo}>
        <div>
          <label htmlFor="email" className="campo-label">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`campo-control ${errors.email ? "campo-control--error" : ""}`}
          />
          {errors.email && <span className="campo-error">{errors.email}</span>}
        </div>

        <div>
          <label htmlFor="phone" className="campo-label">Teléfono</label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="600000000"
            className={`campo-control ${errors.phone ? "campo-control--error" : ""}`}
          />
          {errors.phone && <span className="campo-error">{errors.phone}</span>}
        </div>

        <div>
          <label htmlFor="password" className="campo-label">Contraseña</label>
          <div style={{ position: "relative" }}>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={12}
              className={`campo-control ${errors.password ? "campo-control--error" : ""}`}
              style={{ paddingRight: "4.4rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "var(--color-texto-suave)",
                cursor: "pointer",
                fontSize: "1.6rem",
                padding: "0.4rem",
              }}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true"></i>
            </button>
          </div>
          {errors.password && <span className="campo-error">{errors.password}</span>}
          <span className="campo-hint">Mínimo 12 caracteres</span>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="campo-label">Confirmar contraseña</label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={`campo-control ${errors.confirmPassword ? "campo-control--error" : ""}`}
          />
          {errors.confirmPassword && <span className="campo-error">{errors.confirmPassword}</span>}
        </div>
      </div>

      <button type="submit" className="boton boton--primario boton--bloque">
        Continuar
      </button>
    </form>
  );
}
