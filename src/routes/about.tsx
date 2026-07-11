import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/page-shell";
import { ArrowUpRight, Github, Globe2, Linkedin, Sparkles } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Sketch2TikZ AI" },
      {
        name: "description",
        content: "About Sketch2TikZ AI — IBM SkillsBuild AICTE 2026 Problem Statement 26.",
      },
    ],
  }),
  component: About,
});

const creatorLinks = [
  {
    label: "LinkedIn",
    detail: "Connect",
    href: "https://www.linkedin.com/in/shubhammankar7",
    icon: Linkedin,
  },
  {
    label: "GitHub",
    detail: "View projects",
    href: "https://github.com/Shubham56277",
    icon: Github,
  },
  {
    label: "Portfolio",
    detail: "Explore work",
    href: "https://shubhammankar.vercel.app/",
    icon: Globe2,
  },
];

function About() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="About"
        title="Sketch2TikZ AI"
        description="Convert natural language and hand-drawn sketches into professional LaTeX TikZ diagrams."
      />

      <div
        className="grid-bg rounded-3xl border border-border bg-card p-8"
        style={{ backgroundImage: "var(--gradient-hero)" }}
      >
        <div className="glass mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs">
          <Sparkles className="h-3 w-3" /> IBM SkillsBuild AICTE 2026 · Problem Statement 26
        </div>
        <p className="max-w-3xl text-lg leading-relaxed">
          Sketch2TikZ AI unifies prompt-based diagram generation, sketch understanding, and live
          LaTeX compilation in one modern workspace. Built to run on IBM Cloud Lite with Granite
          models, Cloudant, Object Storage and Code Engine.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { k: "Prompt → TikZ", v: "Natural language" },
            { k: "Sketch → TikZ", v: "Vision-powered" },
            { k: "Auto-fix", v: "Compile & repair" },
          ].map((card) => (
            <div key={card.k} className="rounded-xl border border-border bg-background p-4">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">
                {card.k}
              </div>
              <div className="mt-1 font-semibold">{card.v}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
        <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="relative flex min-h-64 items-end overflow-hidden border-b border-border p-8 lg:border-b-0 lg:border-r">
            <div className="grid-bg absolute inset-0 opacity-70" />
            <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/[0.07] blur-3xl" />
            <div className="relative">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white text-xl font-bold text-black">
                SM
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Creator
              </p>
              <h2 className="mt-2 text-3xl font-bold">Made by Shubham Mankar</h2>
            </div>
          </div>

          <div className="p-8">
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Designed and developed as an AI-powered workspace that turns ideas and sketches into
              clean, publication-ready TikZ diagrams.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {creatorLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-border bg-background p-4 transition-colors hover:border-white/20 hover:bg-accent"
                  aria-label={`${link.label} — opens in a new tab`}
                >
                  <div className="flex items-start justify-between">
                    <link.icon className="h-5 w-5" />
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-8 font-semibold">{link.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{link.detail}</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
