"use client";

import { useState } from "react";

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-texto)] mb-2">Paso 2: Datos de acceso</h2>
        <p className="text-[var(--color-texto-suave)]">
          Estos datos se usarán para crear tu usuario único en Supabase Auth.
          El teléfono actúa como tercer factor de verificación al iniciar sesión.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent ${errors.email ? "border-red-500" : "border-[var(--color-borde)]"}`}
          />
          {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
            Teléfono
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="600000000"
            className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent ${errors.phone ? "border-red-500" : "border-[var(--color-borde)]"}`}
          />
          {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={12}
              className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent pr-12 ${errors.password ? "border-red-500" : "border-[var(--color-borde)]"}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-texto-suave)] hover:text-[var(--color-texto)]"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? "👁️‍🗨️" : "👁️"}
            </button>
          </div>
          {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
          <p className="text-xs text-[var(--color-texto-suave)] mt-1">Mínimo 12 caracteres</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
            Confirmar contraseña
          </label>
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={`w-full px-4 py-3 border rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent ${errors.confirmPassword ? "border-red-500" : "border-[var(--color-borde)]"}`}
          />
          {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 px-4 bg-[var(--color-primario)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primario-oscuro)] transition-colors font-medium"
      >
        Continuar
      </button>
    </form>
  );
}