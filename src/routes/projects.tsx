import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileCode2, Search, MoreHorizontal, Plus, Star } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects · Sketch2TikZ AI" }, { name: "description", content: "All your TikZ projects." }] }),
  component: Projects,
});

const projects = [
  { name: "Neural Network — 3 layers", type: "Diagram", updated: "2h ago", starred: true },
  { name: "Login Auth Flowchart", type: "Flowchart", updated: "Yesterday" },
  { name: "IEEE Paper Figure 3", type: "Research", updated: "2d ago", starred: true },
  { name: "Kubernetes Architecture", type: "Architecture", updated: "3d ago" },
  { name: "ER Diagram — Bookstore", type: "ER", updated: "5d ago" },
  { name: "State Machine — TCP", type: "State", updated: "1w ago" },
  { name: "Decision Tree — Fraud", type: "Tree", updated: "1w ago" },
  { name: "Circuit — RLC filter", type: "Circuit", updated: "2w ago" },
  { name: "Mind Map — Thesis", type: "Mindmap", updated: "3w ago" },
];

function Projects() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Library"
        title="Projects"
        description="Browse, search and manage your TikZ diagrams."
        actions={
          <Button asChild><Link to="/workspace"><Plus className="h-4 w-4" /> New</Link></Button>
        }
      />
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search projects…" className="pl-9" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * i }}
            className="group rounded-2xl border border-border bg-card p-5 hover:border-foreground/30 hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-muted grid place-items-center">
                <FileCode2 className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1">
                {p.starred && <Star className="h-4 w-4 fill-foreground" />}
                <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition"><MoreHorizontal className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-4 font-medium truncate">{p.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{p.type} · {p.updated}</div>
          </motion.div>
        ))}
      </div>
    </PageShell>
  );
}
