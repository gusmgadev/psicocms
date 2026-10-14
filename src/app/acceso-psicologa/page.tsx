"use client";

import { useState } from "react";

export default function AccesoPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email, phone, password, remember });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
        />
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
          className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={12}
          className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="remember"
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="w-4 h-4 text-[var(--color-primario)] border-[var(--color-borde)] rounded focus:ring-[var(--color-primario)]"
        />
        <label htmlFor="remember" className="text-sm text-[var(--color-texto-suave)]">
          Mantener sesión iniciada
        </label>
      </div>
      <button
        type="submit"
        className="w-full py-3 px-4 bg-[var(--color-primario)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primario-oscuro)] transition-colors font-medium"
      >
        Iniciar sesión
      </button>
      <p className="text-center text-sm text-[var(--color-texto-suave)]">
        ¿Olvidaste tu contraseña? <a href="#" className="text-[var(--color-primario)] hover:underline">Recuperar</a>
      </p>
    </form>
  );
}