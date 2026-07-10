import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/history")({
  head: () => ({ meta: [{ title: "History · Sketch2TikZ AI" }, { name: "description", content: "Version history and past compilations." }] }),
  component: History,
});

const events = [
  { when: "Today, 14:22", what: "Compiled Neural Network — 3 layers", ok: true },
  { when: "Today, 14:20", what: "Edited TikZ code", ok: true },
  { when: "Yesterday, 09:11", what: "Auto-fixed missing brace", ok: true },
  { when: "Yesterday, 09:08", what: "Compilation failed", ok: false },
  { when: "2d ago", what: "Generated IEEE Figure 3", ok: true },
];

function History() {
  return (
    <PageShell>
      <PageHeader eyebrow="Activity" title="History" description="A timeline of your recent work." />
      <ol className="relative border-l border-border ml-3 space-y-6">
        {events.map((e, i) => (
          <li key={i} className="ml-6">
            <span className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full ${e.ok ? "bg-emerald-400" : "bg-destructive"}`} />
            <div className="text-sm font-medium">{e.what}</div>
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {e.when}</div>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
