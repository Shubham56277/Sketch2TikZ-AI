import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Activity, Cloud, HardDrive, Timer, Cpu } from "lucide-react";

export const Route = createFileRoute("/developer")({
  head: () => ({ meta: [{ title: "IBM Cloud Status · Sketch2TikZ AI" }, { name: "description", content: "Backend, model and infrastructure health." }] }),
  component: Developer,
});

const services = [
  { name: "IBM Granite (13B Instruct)", status: "Online", latency: "412ms" },
  { name: "Cloudant", status: "Online", latency: "38ms" },
  { name: "Object Storage", status: "Online", latency: "72ms" },
  { name: "Code Engine", status: "Idle", latency: "—" },
  { name: "App ID", status: "Not configured", latency: "—" },
];

function Developer() {
  return (
    <PageShell>
      <PageHeader eyebrow="Diagnostics" title="IBM Cloud Status" description="Live health for backend, model and storage." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "API", value: "200 OK", icon: Activity },
          { label: "Model latency", value: "412 ms", icon: Timer },
          { label: "Storage", value: "1.2 / 5 GB", icon: HardDrive },
          { label: "CPU", value: "12%", icon: Cpu },
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
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
            <tr><th className="p-4 font-medium">Service</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Latency</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {services.map((s) => (
              <tr key={s.name}>
                <td className="p-4">{s.name}</td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${s.status === "Online" ? "bg-emerald-400" : s.status === "Idle" ? "bg-amber-400" : "bg-muted-foreground"}`} />
                    {s.status}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-muted-foreground">{s.latency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-semibold mb-2">Recent logs</div>
        <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
{`[14:22:04] POST /generate → 200 (1.42s)
[14:22:03] POST /compile  → 200 (312ms)
[14:20:11] POST /autofix  → 200 (890ms)
[14:19:52] GET  /projects → 200 (44ms)`}
        </pre>
      </div>
    </PageShell>
  );
}
