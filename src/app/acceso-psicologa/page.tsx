"use client";

import { useState, FormEvent } from "react";
import { loginAction } from "@/actions/auth";
import { useRouter } from "next/navigation";

export default function AccesoPage() {
  const router = useRouter();
  const [showRecover, setShowRecover] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set('remember', String(remember));

    const result = await loginAction(formData);

    if (result.ok) {
      router.push('/panel-psicologa');
      router.refresh();
    } else {
      setError(result.error || 'Error al iniciar sesión');
      setLoading(false);
    }
  };

  const handleRecover = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/recover', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (data.ok) {
      setShowRecover(false);
      alert('Si el email existe, recibirás instrucciones para restablecer tu contraseña.');
    }
  };

  return (
    <div className="space-y-6">
      {!showRecover ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-[var(--radius-md)] text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
              Teléfono <span className="text-red-500">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="600000000"
              className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
              Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={12}
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
            />
            <p className="text-xs text-[var(--color-texto-suave)] mt-1">Mínimo 12 caracteres</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="remember"
              name="remember"
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
            disabled={loading}
            className="w-full py-3 px-4 bg-[var(--color-primario)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primario-oscuro)] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>

          <p className="text-center text-sm text-[var(--color-texto-suave)]">
            ¿Olvidaste tu contraseña?{' '}
            <button
              type="button"
              onClick={() => setShowRecover(true)}
              className="text-[var(--color-primario)] hover:underline"
            >
              Recuperar
            </button>
          </p>
        </form>
      ) : (
        <form onSubmit={handleRecover} className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium text-[var(--color-texto)]">Recuperar contraseña</h3>
            <p className="text-[var(--color-texto-suave)] text-sm mt-1">
              Introduce tu email y te enviaremos un enlace para restablecerla.
            </p>
          </div>

          <div>
            <label htmlFor="recoverEmail" className="block text-sm font-medium text-[var(--color-texto)] mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="recoverEmail"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-[var(--color-borde)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primario)] focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-[var(--color-primario)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primario-oscuro)] transition-colors font-medium"
          >
            Enviar enlace
          </button>

          <p className="text-center text-sm text-[var(--color-texto-suave)]">
            <button
              type="button"
              onClick={() => setShowRecover(false)}
              className="text-[var(--color-primario)] hover:underline"
            >
              Volver al login
            </button>
          </p>
        </form>
      )}
    </div>
  );
}