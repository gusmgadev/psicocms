export default function PanelHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-texto)]">Dashboard</h1>
        <p className="text-[var(--color-texto-suave)] mt-1">Resumen de tu actividad</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Citas esta semana" value="12" icon="fa-calendar-check" />
        <StatCard label="Pacientes activos" value="45" icon="fa-users" />
        <StatCard label="Próximas citas" value="3" icon="fa-clock" iconColor="text-amber-600" />
        <StatCard label="Nuevos pacientes" value="2" icon="fa-user-plus" iconColor="text-green-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Próximas citas">
          <p className="text-[var(--color-texto-suave)]">Aquí se mostrarán las próximas citas.</p>
        </Card>
        <Card title="Pacientes recientes">
          <p className="text-[var(--color-texto-suave)]">Aquí se mostrarán los pacientes recientes.</p>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, iconColor = "text-[var(--color-primario)]" }: { label: string; value: string; icon: string; iconColor?: string }) {
  return (
    <div className="bg-[var(--color-fondo)] rounded-[var(--radius-lg)] border border-[var(--color-borde)] p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-texto-suave)]">{label}</p>
          <p className="text-3xl font-bold text-[var(--color-texto)] mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-[var(--radius-md)] bg-[var(--color-primario)]/10 ${iconColor}`}>
          <i className={`fa ${icon} text-2xl`} aria-hidden="true"></i>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-fondo)] rounded-[var(--radius-lg)] border border-[var(--color-borde)] p-6 shadow-[var(--shadow-sm)]">
      <h2 className="text-lg font-semibold text-[var(--color-texto)] mb-4">{title}</h2>
      {children}
    </div>
  );
}