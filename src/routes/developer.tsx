import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Activity, Cloud, HardDrive, Timer, Cpu } from "lucide-react";
import { useHealth } from "@/lib/queries";
import { ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/developer")({
  head: () => ({ meta: [{ title: "IBM Cloud Status · Sketch2TikZ AI" }, { name: "description", content: "Backend, model and infrastructure health." }] }),
  component: Developer,
});

function statusDotClass(status: string | undefined): string {
  if (status === "Online" || status === "ok") return "bg-emerald-400";
  if (status === "Idle" || status === "degraded") return "bg-amber-400";
  return "bg-muted-foreground";
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function Developer() {
  const { data: health, isLoading, isError, error, isFetched } = useHealth();

  const services = Object.entries(health?.services ?? {}).map(([name, status]) => ({ name, status }));

  return (
    <PageShell>
      <PageHeader eyebrow="Diagnostics" title="IBM Cloud Status" description="Live health for backend, model and storage." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "API", value: isLoading ? "Checking…" : isError ? "Unreachable" : `${health?.status ?? "unknown"}`, icon: Activity },
          { label: "Model latency", value: health?.latencyMs !== undefined ? `${health.latencyMs} ms` : "—", icon: Timer },
          { label: "Storage", value: "—", icon: HardDrive },
          { label: "CPU", value: "—", icon: Cpu },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
              <span>{s.label}</span><s.icon className="h-4 w-4" />
            </div>
            <div className="mt-3 text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Cloud className="h-4 w-4" /><span className="text-sm font-semibold">Services</span>
        </div>

        {isError && (
          <div className="p-6 text-sm text-muted-foreground">
            Couldn't reach the backend's /health endpoint: {errorMessage(error, "unknown error")}
          </div>
        )}

        {!isError && isFetched && services.length === 0 && (
          <div className="p-6 text-sm text-muted-foreground">
            Backend responded but reported no individual service statuses.
          </div>
        )}

        {!isError && services.length > 0 && (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
              <tr><th className="p-4 font-medium">Service</th><th className="p-4 font-medium">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {services.map((s) => (
                <tr key={s.name}>
                  <td className="p-4">{s.name}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(s.status)}`} />
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
