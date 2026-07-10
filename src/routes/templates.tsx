import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { motion } from "framer-motion";
import {
  Network, Boxes, Database, GitBranch, Cpu, Workflow, TreePine, Waypoints, Zap, Clock, LayoutList, Users2,
} from "lucide-react";

export const Route = createFileRoute("/templates")({
  head: () => ({ meta: [{ title: "Templates · Sketch2TikZ AI" }, { name: "description", content: "Start from IEEE, ACM, and research-ready TikZ templates." }] }),
  component: Templates,
});

const groups = [
  {
    title: "Diagrams",
    items: [
      { name: "Flowchart", icon: Workflow, desc: "Decision flows and process maps" },
      { name: "UML Class", icon: Boxes, desc: "Object-oriented class relations" },
      { name: "ER Diagram", icon: Database, desc: "Entities & relationships" },
      { name: "Sequence", icon: GitBranch, desc: "Actor interactions" },
      { name: "State Machine", icon: Waypoints, desc: "States and transitions" },
      { name: "Neural Network", icon: Network, desc: "Layers and connections" },
      { name: "Architecture", icon: Cpu, desc: "System components" },
      { name: "Decision Tree", icon: TreePine, desc: "Branching decisions" },
      { name: "Timeline", icon: Clock, desc: "Chronological events" },
      { name: "Org Chart", icon: Users2, desc: "Hierarchies" },
      { name: "Mind Map", icon: LayoutList, desc: "Ideas and branches" },
      { name: "Circuit", icon: Zap, desc: "Electrical circuits" },
    ],
  },
  {
    title: "Publication styles",
    items: [
      { name: "IEEE", icon: Boxes, desc: "IEEE two-column figures" },
      { name: "ACM", icon: Boxes, desc: "ACM SIG format" },
      { name: "Springer", icon: Boxes, desc: "LNCS style" },
      { name: "Report", icon: Boxes, desc: "Clean report figures" },
      { name: "Poster", icon: Boxes, desc: "Conference posters" },
      { name: "Presentation", icon: Boxes, desc: "Beamer-ready" },
    ],
  },
];

function Templates() {
  return (
    <PageShell>
      <PageHeader eyebrow="Library" title="Templates" description="Kickstart with production-ready TikZ templates." />
      {groups.map((g) => (
        <section key={g.title} className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4">{g.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {g.items.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 * i }}
              >
                <Link
                  to="/workspace"
                  className="block rounded-2xl border border-border bg-card p-5 hover:border-foreground/30 hover:-translate-y-0.5 transition-all"
                >
                  <div className="h-24 rounded-xl bg-muted grid place-items-center mb-4 grid-bg">
                    <t.icon className="h-8 w-8" />
                  </div>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{t.desc}</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      ))}
    </PageShell>
  );
}
