import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Sketch2TikZ AI" }, { name: "description", content: "Manage preferences, compiler, IBM Cloud and Granite model." }] }),
  component: SettingsPage,
});

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 mb-6">
      <div className="mb-4">
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <Label className="text-sm">{label}</Label>
        {hint && <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingsPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Tune the editor, compiler and IBM Cloud integration."
        actions={<Button onClick={() => toast.success("Settings saved")}>Save changes</Button>}
      />

      <Section title="Appearance" description="Theme and typography.">
        <Row label="Theme" hint="Dark by default"><Select defaultValue="dark"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="dark">Dark</SelectItem><SelectItem value="light">Light</SelectItem><SelectItem value="system">System</SelectItem></SelectContent></Select></Row>
        <Row label="Language"><Select defaultValue="en"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="hi">Hindi</SelectItem><SelectItem value="es">Spanish</SelectItem></SelectContent></Select></Row>
        <Row label="Reduced motion"><Switch /></Row>
      </Section>

      <Section title="Editor" description="Autosave and behavior.">
        <Row label="Auto save"><Switch defaultChecked /></Row>
        <Row label="Keyboard shortcuts"><Select defaultValue="default"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="default">Default</SelectItem><SelectItem value="vim">Vim</SelectItem></SelectContent></Select></Row>
        <Row label="Notifications"><Switch defaultChecked /></Row>
      </Section>

      <Section title="Compiler" description="LaTeX compilation options.">
        <Row label="Engine"><Select defaultValue="pdflatex"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pdflatex">pdflatex</SelectItem><SelectItem value="xelatex">xelatex</SelectItem><SelectItem value="lualatex">lualatex</SelectItem></SelectContent></Select></Row>
        <Row label="Export quality"><Select defaultValue="high"><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></Row>
        <Row label="Auto error repair" hint="AI fixes compilation errors automatically"><Switch defaultChecked /></Row>
      </Section>

      <Section title="IBM Cloud" description="Granite model and services (env-driven).">
        <Row label="Granite Model"><Select defaultValue="granite-13b"><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="granite-13b">granite-13b-instruct</SelectItem><SelectItem value="granite-20b">granite-20b-code</SelectItem><SelectItem value="granite-vision">granite-vision</SelectItem></SelectContent></Select></Row>
        <Row label="Cloudant URL"><Input className="w-72" placeholder="https://…cloudantnosqldb.appdomain.cloud" /></Row>
        <Row label="Object Storage bucket"><Input className="w-72" placeholder="sketch2tikz-bucket" /></Row>
        <Row label="Code Engine project"><Input className="w-72" placeholder="sketch2tikz-prod" /></Row>
      </Section>

      <Section title="Developer" description="Advanced tooling.">
        <Row label="Developer mode"><Switch /></Row>
        <Row label="Verbose logs"><Switch /></Row>
      </Section>
    </PageShell>
  );
}
