import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Plus,
  ArrowUpRight,
  FileCode2,
  Cloud,
  Clock,
  Sparkles,
  LayoutTemplate,
  Wand2,
  Upload,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHealth, useProjects } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Sketch2TikZ AI" },
      { name: "description", content: "Your Sketch2TikZ AI workspace: recent projects, IBM Cloud status, and quick actions." },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  { to: "/workspace", label: "New from prompt", icon: Wand2 },
  { to: "/workspace", label: "Upload sketch", icon: Upload },
  { to: "/templates", label: "Browse templates", icon: LayoutTemplate },
];

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
}

function statusDotClass(status: string | undefined): string {
  if (status === "Online" || status === "ok") return "bg-emerald-400";
  if (status === "Idle" || status === "degraded") return "bg-amber-400";
  return "bg-muted-foreground";
}

function boolToStatus(configured: boolean | undefined, loading: boolean): string | undefined {
  if (loading || configured === undefined) return undefined;
  return configured ? "ok" : "degraded";
}

function Dashboard() {
  const { data: projectList, isLoading: projectsLoading } = useProjects();
  const { data: health, isLoading: healthLoading } = useHealth();

  const projects = projectList?.items ?? [];
  const recent = projects
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const cloudServices = [
    { name: "Granite Model", status: boolToStatus(health?.watsonx_configured, healthLoading) },
    { name: "Cloudant", status: boolToStatus(health?.cloudant_configured, healthLoading) },
    { name: "Object Storage", status: boolToStatus(health?.object_storage_configured, healthLoading) },
  ];

  const stats = [
    { label: "Projects", value: projectsLoading ? "…" : String(projectList?.total ?? 0), icon: FileCode2 },
    { label: "Backend", value: healthLoading ? "Checking…" : health?.status ?? "Unreachable", icon: Sparkles },
  ];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Workspace"
        title="Good to see you."
        description="Create diagrams from prompts or sketches, compile to PDF, and manage your TikZ projects — all in one place."
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/templates"><LayoutTemplate className="h-4 w-4" /> Templates</Link>
            </Button>
            <Button asChild>
              <Link to="/workspace"><Plus className="h-4 w-4" /> New Project</Link>
            </Button>
          </>
        }
      />

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-border grid-bg mb-10"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="relative p-8 sm:p-12">
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs">
            <span className={`h-1.5 w-1.5 rounded-full ${healthLoading ? "bg-muted-foreground" : statusDotClass(health?.watsonx_configured ? "ok" : "degraded")}`} />
            IBM Granite · {healthLoading ? "Checking…" : health?.watsonx_configured ? "Ready" : "Unavailable"}
          </div>
          <h2 className="mt-4 text-3xl sm:text-5xl font-bold max-w-2xl leading-tight">
            From prompt to publication-ready <span className="text-muted-foreground">TikZ</span>.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Describe it, sketch it, or upload it. We compile clean LaTeX with live preview and
            auto-repair.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {quickActions.map((a) => (
              <Button key={a.label} asChild variant="secondary" className="rounded-full">
                <Link to={a.to}><a.icon className="h-4 w-4" /> {a.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="rounded-2xl border border-border bg-card p-5 hover:border-foreground/20 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 text-3xl font-bold">{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent + Cloud */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <div className="text-sm font-semibold">Recent projects</div>
              <div className="text-xs text-muted-foreground">Latest activity across your workspace</div>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/projects">View all <ArrowUpRight className="h-3 w-3" /></Link>
            </Button>
          </div>

          {projectsLoading && (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
            </div>
          )}

          {!projectsLoading && recent.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No projects yet — start one from the workspace.
            </div>
          )}

          {!projectsLoading && recent.length > 0 && (
            <ul className="divide-y divide-border">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center gap-4 p-4 hover:bg-accent/40 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center shrink-0">
                    <FileCode2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.diagram_type ?? "Diagram"}</div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3" /> {relativeTime(r.updated_at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Cloud className="h-4 w-4" /> IBM Cloud
            </div>
            <div className="text-xs text-muted-foreground">Live service status</div>
          </div>
          {cloudServices.map((svc) => (
            <div key={svc.name} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{svc.name}</span>
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${healthLoading ? "bg-muted-foreground" : statusDotClass(svc.status)}`} />
                <span className="text-xs">{healthLoading ? "Checking…" : svc.status ?? "Unknown"}</span>
              </span>
            </div>
          ))}
          <Button asChild variant="outline" className="w-full">
            <Link to="/developer"><ArrowUpRight className="h-4 w-4" /> View diagnostics</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
