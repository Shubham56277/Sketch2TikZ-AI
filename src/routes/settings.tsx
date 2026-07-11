import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHeader } from "@/components/page-shell";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useHealth } from "@/lib/queries";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · Sketch2TikZ AI" }, { name: "description", content: "Manage preferences, compiler, IBM Cloud and Granite model." }] }),
  component: SettingsPage,
});

const STORAGE_KEY = "sketch2tikz.settings.v1";

interface LocalSettings {
  theme: string;
  language: string;
  reducedMotion: boolean;
  autoSave: boolean;
  keyboardShortcuts: string;
  notifications: boolean;
  compilerEngine: string;
  exportQuality: string;
  autoErrorRepair: boolean;
  graniteModel: string;
  developerMode: boolean;
  verboseLogs: boolean;
}

const DEFAULT_SETTINGS: LocalSettings = {
  theme: "dark",
  language: "en",
  reducedMotion: false,
  autoSave: true,
  keyboardShortcuts: "default",
  notifications: true,
  compilerEngine: "pdflatex",
  exportQuality: "high",
  autoErrorRepair: true,
  graniteModel: "granite-13b",
  developerMode: false,
  verboseLogs: false,
};

function loadSettings(): LocalSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<LocalSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

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

function statusColor(status: string | undefined): string {
  if (status === "Online" || status === "ok") return "bg-emerald-400";
  if (status === "Idle" || status === "degraded") return "bg-amber-400";
  return "bg-muted-foreground";
}

function SettingsPage() {
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT_SETTINGS);
  const { data: health, isLoading: healthLoading } = useHealth();

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = <K extends keyof LocalSettings>(key: K, value: LocalSettings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const save = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success("Settings saved");
  };

  const graniteStatus = health === undefined ? undefined : health.watsonx_configured ? "ok" : "degraded";
  const cloudantStatus = health === undefined ? undefined : health.cloudant_configured ? "ok" : "degraded";
  const cosStatus = health === undefined ? undefined : health.object_storage_configured ? "ok" : "degraded";

  return (
    <PageShell>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Tune the editor, compiler and IBM Cloud integration."
        actions={<Button onClick={save}>Save changes</Button>}
      />

      <Section title="Appearance" description="Theme and typography.">
        <Row label="Theme" hint="Dark by default">
          <Select value={settings.theme} onValueChange={(v) => update("theme", v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="dark">Dark</SelectItem><SelectItem value="light">Light</SelectItem><SelectItem value="system">System</SelectItem></SelectContent>
          </Select>
        </Row>
        <Row label="Language">
          <Select value={settings.language} onValueChange={(v) => update("language", v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="hi">Hindi</SelectItem><SelectItem value="es">Spanish</SelectItem></SelectContent>
          </Select>
        </Row>
        <Row label="Reduced motion">
          <Switch checked={settings.reducedMotion} onCheckedChange={(v) => update("reducedMotion", v)} />
        </Row>
      </Section>

      <Section title="Editor" description="Autosave and behavior.">
        <Row label="Auto save">
          <Switch checked={settings.autoSave} onCheckedChange={(v) => update("autoSave", v)} />
        </Row>
        <Row label="Keyboard shortcuts">
          <Select value={settings.keyboardShortcuts} onValueChange={(v) => update("keyboardShortcuts", v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="default">Default</SelectItem><SelectItem value="vim">Vim</SelectItem></SelectContent>
          </Select>
        </Row>
        <Row label="Notifications">
          <Switch checked={settings.notifications} onCheckedChange={(v) => update("notifications", v)} />
        </Row>
      </Section>

      <Section title="Compiler" description="LaTeX compilation options.">
        <Row label="Engine">
          <Select value={settings.compilerEngine} onValueChange={(v) => update("compilerEngine", v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="pdflatex">pdflatex</SelectItem><SelectItem value="xelatex">xelatex</SelectItem><SelectItem value="lualatex">lualatex</SelectItem></SelectContent>
          </Select>
        </Row>
        <Row label="Export quality">
          <Select value={settings.exportQuality} onValueChange={(v) => update("exportQuality", v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
          </Select>
        </Row>
        <Row label="Auto error repair" hint="AI fixes compilation errors automatically">
          <Switch checked={settings.autoErrorRepair} onCheckedChange={(v) => update("autoErrorRepair", v)} />
        </Row>
      </Section>

      <Section title="IBM Cloud" description="Granite model and services (live status from the backend's /health endpoint).">
        <Row label="Granite Model">
          <Select value={settings.graniteModel} onValueChange={(v) => update("graniteModel", v)}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="granite-13b">granite-13b-instruct</SelectItem><SelectItem value="granite-20b">granite-20b-code</SelectItem><SelectItem value="granite-vision">granite-vision</SelectItem></SelectContent>
          </Select>
        </Row>
        <Row label="Granite status">
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${statusColor(graniteStatus)}`} />
            {healthLoading ? "Checking…" : graniteStatus ?? "Unknown"}
          </span>
        </Row>
        <Row label="Cloudant status">
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${statusColor(cloudantStatus)}`} />
            {healthLoading ? "Checking…" : cloudantStatus ?? "Unknown"}
          </span>
        </Row>
        <Row label="Object Storage status">
          <span className="inline-flex items-center gap-1.5 text-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${statusColor(cosStatus)}`} />
            {healthLoading ? "Checking…" : cosStatus ?? "Unknown"}
          </span>
        </Row>
      </Section>

      <Section title="Developer" description="Advanced tooling.">
        <Row label="Developer mode">
          <Switch checked={settings.developerMode} onCheckedChange={(v) => update("developerMode", v)} />
        </Row>
        <Row label="Verbose logs">
          <Switch checked={settings.verboseLogs} onCheckedChange={(v) => update("verboseLogs", v)} />
        </Row>
      </Section>
    </PageShell>
  );
}
