import { AppShell } from "@/components/AppShell";
import { LiveDashboard } from "@/components/LiveDashboard";
import { PageHeader } from "@/components/PageHeader";

export default function LivePage() {
  return (
    <AppShell active="live">
      <PageHeader
        eyebrow="Live Tracking"
        title={
          <>
            Partidos del Mundial{" "}
            <span className="text-red-400">en directo</span>
          </>
        }
        description="Seguimiento en tiempo real del FIFA World Cup 2026: marcador, estadísticas, cuotas y detección de valor."
      />

      <LiveDashboard />
    </AppShell>
  );
}
