export default function InstalacionPage() {
  return (
    <div>
      <p className="text-[var(--color-texto-suave)] text-center mb-6">
        Asistente de instalación inicial. Configura tu cuenta y la web.
      </p>
      <div className="space-y-4">
        <button className="w-full py-3 px-4 bg-[var(--color-primario)] text-white rounded-[var(--radius-md)] hover:bg-[var(--color-primario-oscuro)] transition-colors">
          Comenzar instalación
        </button>
      </div>
    </div>
  );
}