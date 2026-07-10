import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, FileCode2 } from "lucide-react";
import { useMemo } from "react";
import { useProjects } from "@/lib/queries";
import { ApiError } from "@/lib/api-client";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "Favorites · Sketch2TikZ AI" }, { name: "description", content: "Your starred diagrams." }] }),
  component: Favorites,
});

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function Favorites() {
  const { data: projects, isLoading, isError, error } = useProjects();
  const starred = useMemo(() => (projects ?? []).filter((p) => p.starred), [projects]);

  return (
    <PageShell>
      <PageHeader eyebrow="Library" title="Favorites" description="Diagrams you've starred for quick access." />

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <div className="font-medium">Couldn't load favorites</div>
          <div className="text-sm text-muted-foreground mt-1">{errorMessage(error, "The backend may be unreachable.")}</div>
        </div>
      )}

      {!isLoading && !isError && starred.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <Star className="h-10 w-10 mx-auto text-muted-foreground" />
          <div className="mt-3 font-medium">No favorites yet</div>
          <div className="text-sm text-muted-foreground mt-1">Star a project from the Projects page to see it here.</div>
        </div>
      )}

      {!isLoading && !isError && starred.length > 0 && (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {starred.map((p) => (
            <li key={p.id} className="flex items-center gap-4 p-4 hover:bg-accent/40">
              <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center"><FileCode2 className="h-4 w-4" /></div>
              <Link to="/workspace" className="flex-1 text-sm font-medium truncate">{p.name}</Link>
              <Star className="h-4 w-4 fill-foreground" />
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
