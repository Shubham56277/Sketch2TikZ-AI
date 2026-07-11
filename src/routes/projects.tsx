import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FileCode2, Search, MoreHorizontal, Plus, Star, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-client";
import { useDeleteProject, useProjects, useUpdateProject } from "@/lib/queries";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects · Sketch2TikZ AI" }, { name: "description", content: "All your TikZ projects." }] }),
  component: Projects,
});

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

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function Projects() {
  const [query, setQuery] = useState("");
  const { data: projectList, isLoading, isError, error } = useProjects();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const projects = projectList?.items ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  const toggleStar = (id: string, isFavorite: boolean) => {
    updateProject.mutate(
      { id, payload: { is_favorite: !isFavorite } },
      { onError: (err) => toast.error("Couldn't update project", { description: errorMessage(err, "Please try again.") }) },
    );
  };

  const removeProject = (id: string, name: string) => {
    deleteProject.mutate(id, {
      onSuccess: () => toast.success(`Deleted "${name}"`),
      onError: (err) => toast.error("Couldn't delete project", { description: errorMessage(err, "Please try again.") }),
    });
  };

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
        <Input
          placeholder="Search projects…"
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <div className="font-medium">Couldn't load projects</div>
          <div className="text-sm text-muted-foreground mt-1">{errorMessage(error, "The backend may be unreachable.")}</div>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-16 text-center">
          <FileCode2 className="h-10 w-10 mx-auto text-muted-foreground" />
          <div className="mt-3 font-medium">{query ? "No matching projects" : "No projects yet"}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {query ? "Try a different search term." : "Create your first diagram from the workspace."}
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
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
                  <button onClick={() => toggleStar(p.id, !!p.is_favorite)} aria-label={p.is_favorite ? "Unstar" : "Star"}>
                    <Star className={`h-4 w-4 ${p.is_favorite ? "fill-foreground" : "opacity-0 group-hover:opacity-60"}`} />
                  </button>
                  <button
                    onClick={() => removeProject(p.id, p.name)}
                    aria-label="Delete"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition"><MoreHorizontal className="h-4 w-4" /></button>
                </div>
              </div>
              <Link to="/workspace" className="block mt-4">
                <div className="font-medium truncate">{p.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{p.diagram_type ?? "Diagram"} · {relativeTime(p.updated_at)}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
