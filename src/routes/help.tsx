import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help · Sketch2TikZ AI" }, { name: "description", content: "Guides, shortcuts, and FAQs." }] }),
  component: Help,
});

const faqs = [
  { q: "How do I generate a diagram from a prompt?", a: "Open Workspace, type a description like 'Draw a login flowchart', and press Generate." },
  { q: "Can I upload a hand-drawn sketch?", a: "Yes. Use the upload button in the composer. PNG and JPEG are supported." },
  { q: "How is compilation done?", a: "TikZ is compiled to PDF using a LaTeX engine on IBM Code Engine. Errors are auto-repaired." },
  { q: "Which IBM services are used?", a: "Granite (AI), Cloudant (metadata), Object Storage (assets), Code Engine (compile), IAM/App ID (auth)." },
];

function Help() {
  return (
    <PageShell>
      <PageHeader eyebrow="Support" title="Help & FAQ" description="Answers to common questions." />
      <div className="space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-border bg-card p-5">
            <summary className="cursor-pointer font-medium marker:hidden list-none flex items-center justify-between">
              {f.q}
              <span className="text-muted-foreground transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </PageShell>
  );
}
