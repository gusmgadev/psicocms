export default function AccesoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-fondo-alt)] px-4">
      <div className="w-full max-w-md bg-[var(--color-fondo)] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] p-8">
        <h1 className="text-2xl font-bold text-[var(--color-texto)] mb-6 text-center">Acceso psicóloga</h1>
        {children}
      </div>
    </div>
  );
}