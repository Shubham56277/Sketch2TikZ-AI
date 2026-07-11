import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/page-shell";
import {
  ArrowUpRight,
  BadgeCheck,
  Bot,
  Cloud,
  Eye,
  FileDown,
  FolderKanban,
  Github,
  Globe2,
  ImageUp,
  Linkedin,
  MessageSquareText,
  Sparkles,
  Wrench,
} from "lucide-react";

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

const objectives = [
  {
    title: "Natural Language to TikZ",
    description: "Turn plain-English requests into accurate, compilable TikZ source.",
    icon: MessageSquareText,
  },
  {
    title: "Sketch to Diagram",
    description:
      "Analyze uploaded hand-drawn sketches and recreate their structure with AI vision.",
    icon: ImageUp,
  },
  {
    title: "Agentic Orchestration",
    description:
      "Use IBM watsonx Orchestrate to coordinate generation, validation, compilation, repair and delivery.",
    icon: Bot,
  },
  {
    title: "AI-Powered Auto Fix",
    description: "Detect LaTeX errors, explain failures and repair invalid TikZ automatically.",
    icon: Wrench,
  },
  {
    title: "Real-Time Preview",
    description: "Compile generated code into PDF and return immediate visual feedback.",
    icon: Eye,
  },
  {
    title: "Multi-Format Export",
    description: "Export finished diagrams as PDF, PNG, SVG and editable TEX files.",
    icon: FileDown,
  },
  {
    title: "Project Management",
    description: "Save, organize, refine and revisit diagram projects with version history.",
    icon: FolderKanban,
  },
  {
    title: "Cloud Storage",
    description: "Securely store projects and generated assets with IBM Cloud services.",
    icon: Cloud,
  },
  {
    title: "Publication-Ready Output",
    description: "Produce polished diagrams for papers, presentations and technical documentation.",
    icon: BadgeCheck,
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="rounded-3xl border border-border bg-card p-8">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            The Challenge
          </div>
          <h2 className="mt-3 text-2xl font-bold">
            Technical diagrams should not require expert code.
          </h2>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            Creating professional LaTeX diagrams with TikZ is complex and time-consuming. Students,
            researchers, educators and technical writers must learn difficult syntax, debug
            compilation failures and repeatedly refine layouts before an idea becomes
            publication-ready.
          </p>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Conventional diagram tools often produce outputs that do not integrate cleanly with
            LaTeX. Sketch2TikZ AI closes that gap with an accessible, agent-driven workflow built
            for academic and technical communication.
          </p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                The Objective
              </div>
              <h2 className="mt-1 text-2xl font-bold">
                One orchestrated path from idea to output.
              </h2>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-muted-foreground">
            Build an AI-powered Sketch2TikZ Agent using IBM Granite models, with IBM watsonx
            Orchestrate coordinating the tools required to generate, validate, compile, repair and
            deliver professional diagrams.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs">
            {["Describe", "Generate", "Validate", "Compile", "Repair", "Export"].map(
              (stage, index) => (
                <div key={stage} className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-background px-3 py-1.5">
                    {stage}
                  </span>
                  {index < 5 && <ArrowUpRight className="h-3 w-3 text-muted-foreground" />}
                </div>
              ),
            )}
          </div>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-border bg-card p-8">
        <div className="mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Core Capabilities
          </div>
          <h2 className="mt-2 text-2xl font-bold">Built for the complete diagram lifecycle.</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {objectives.map((objective) => (
            <div
              key={objective.title}
              className="rounded-2xl border border-border bg-background p-5 transition-colors hover:bg-accent"
            >
              <objective.icon className="h-5 w-5" />
              <h3 className="mt-5 font-semibold">{objective.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {objective.description}
              </p>
            </div>
          ))}
        </div>
      </section>

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
