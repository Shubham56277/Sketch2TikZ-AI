import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: "About · Sketch2TikZ AI" }, { name: "description", content: "About Sketch2TikZ AI — IBM SkillsBuild AICTE 2026 Problem Statement 26." }] }),
  component: About,
});

function About() {
  return (
    <PageShell>
      <PageHeader eyebrow="About" title="Sketch2TikZ AI" description="Convert natural language and hand-drawn sketches into professional LaTeX TikZ diagrams." />
      <div className="rounded-3xl border border-border bg-card p-8 grid-bg" style={{ backgroundImage: "var(--gradient-hero)" }}>
        <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs mb-4">
          <Sparkles className="h-3 w-3" /> IBM SkillsBuild AICTE 2026 · Problem Statement 26
        </div>
        <p className="text-lg max-w-3xl leading-relaxed">
          Sketch2TikZ AI unifies prompt-based diagram generation, sketch understanding,
          and live LaTeX compilation in one modern workspace. Built to run on IBM Cloud
          Lite with Granite models, Cloudant, Object Storage and Code Engine.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { k: "Prompt → TikZ", v: "Natural language" },
            { k: "Sketch → TikZ", v: "Vision-powered" },
            { k: "Auto-fix", v: "Compile & repair" },
          ].map((c) => (
            <div key={c.k} className="rounded-xl border border-border bg-background p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{c.k}</div>
              <div className="mt-1 font-semibold">{c.v}</div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
