import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Plus,
  ArrowUpRight,
  FileCode2,
  Cloud,
  HardDrive,
  Activity,
  Zap,
  Clock,
  Sparkles,
  LayoutTemplate,
  Wand2,
  Upload,
} from "lucide-react";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Sketch2TikZ AI" },
      { name: "description", content: "Your Sketch2TikZ AI workspace: recent projects, IBM Cloud status, and quick actions." },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Projects", value: "24", icon: FileCode2, delta: "+3 this week" },
  { label: "Diagrams Generated", value: "182", icon: Sparkles, delta: "+41 this week" },
  { label: "Storage Used", value: "1.2 GB", icon: HardDrive, delta: "of 5 GB" },
  { label: "Avg Compile", value: "1.4s", icon: Activity, delta: "-120ms" },
];

const recent = [
  { name: "Neural Network — 3 layers", type: "Diagram", updated: "2h ago" },
  { name: "Login Auth Flowchart", type: "Flowchart", updated: "Yesterday" },
  { name: "IEEE Paper Figure 3", type: "Research", updated: "2d ago" },
  { name: "Kubernetes Architecture", type: "Architecture", updated: "3d ago" },
  { name: "ER Diagram — Bookstore", type: "ER", updated: "5d ago" },
];

const quickActions = [
  { to: "/workspace", label: "New from prompt", icon: Wand2 },
  { to: "/workspace", label: "Upload sketch", icon: Upload },
  { to: "/templates", label: "Browse templates", icon: LayoutTemplate },
];

function Dashboard() {
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
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> IBM Granite · Ready
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
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
            <div className="mt-1 text-xs text-muted-foreground">{s.delta}</div>
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
          <ul className="divide-y divide-border">
            {recent.map((r) => (
              <li key={r.name} className="flex items-center gap-4 p-4 hover:bg-accent/40 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center shrink-0">
                  <FileCode2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.type}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="h-3 w-3" /> {r.updated}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Cloud className="h-4 w-4" /> IBM Cloud
            </div>
            <div className="text-xs text-muted-foreground">Lite services status</div>
          </div>
          {[
            { name: "Granite Model", status: "Online" },
            { name: "Cloudant", status: "Online" },
            { name: "Object Storage", status: "Online" },
            { name: "Code Engine", status: "Idle" },
            { name: "App ID", status: "Not configured" },
          ].map((svc) => (
            <div key={svc.name} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{svc.name}</span>
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${svc.status === "Online" ? "bg-emerald-400" : svc.status === "Idle" ? "bg-amber-400" : "bg-muted-foreground"}`} />
                <span className="text-xs">{svc.status}</span>
              </span>
            </div>
          ))}
          <Button asChild variant="outline" className="w-full">
            <Link to="/developer"><Zap className="h-4 w-4" /> View diagnostics</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
