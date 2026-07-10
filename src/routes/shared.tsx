import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Users } from "lucide-react";

export const Route = createFileRoute("/shared")({
  head: () => ({ meta: [{ title: "Shared · Sketch2TikZ AI" }, { name: "description", content: "Diagrams shared with you." }] }),
  component: Shared,
});

function Shared() {
  return (
    <PageShell>
      <PageHeader eyebrow="Collaboration" title="Shared with you" description="Diagrams shared by teammates will appear here." />
      <div className="rounded-2xl border border-dashed border-border p-16 text-center">
        <Users className="h-10 w-10 mx-auto text-muted-foreground" />
        <div className="mt-3 font-medium">No shared projects yet</div>
        <div className="text-sm text-muted-foreground mt-1">Invite collaborators from a project's share menu.</div>
      </div>
    </PageShell>
  );
}
