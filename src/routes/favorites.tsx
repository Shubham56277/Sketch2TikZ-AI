import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Star, FileCode2 } from "lucide-react";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "Favorites · Sketch2TikZ AI" }, { name: "description", content: "Your starred diagrams." }] }),
  component: Favorites,
});

const items = [
  "Neural Network — 3 layers",
  "IEEE Paper Figure 3",
  "Bookstore ER Diagram",
];

function Favorites() {
  return (
    <PageShell>
      <PageHeader eyebrow="Library" title="Favorites" description="Diagrams you've starred for quick access." />
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {items.map((n) => (
          <li key={n} className="flex items-center gap-4 p-4 hover:bg-accent/40">
            <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center"><FileCode2 className="h-4 w-4" /></div>
            <div className="flex-1 text-sm font-medium truncate">{n}</div>
            <Star className="h-4 w-4 fill-foreground" />
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
