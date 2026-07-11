import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import {
  Send,
  Upload,
  Mic,
  Sparkles,
  Play,
  Copy,
  Download,
  Wand2,
  Undo2,
  Redo2,
  Share2,
  History,
  FileText,
  Image as ImageIcon,
  Code2,
  Terminal,
  BookOpen,
  Loader2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ApiError, API_BASE_URL } from "@/lib/api-client";
import {
  useAutofixDiagram,
  useCompileDiagram,
  useCreateProject,
  useExportDiagram,
  useGenerateDiagram,
  useUpdateProject,
  useUploadSketch,
} from "@/lib/queries";

export const Route = createFileRoute("/workspace")({
  head: () => ({
    meta: [
      { title: "Workspace · Sketch2TikZ AI" },
      { name: "description", content: "Prompt, sketch and edit TikZ diagrams with live PDF preview." },
    ],
  }),
  component: Workspace,
});

type Msg = { role: "user" | "assistant"; content: string };

const examples = [
  "Draw a login authentication flowchart",
  "Create a UML class diagram for an e-commerce app",
  "Generate a 3-layer neural network",
  "Draw an ER diagram for a bookstore",
  "AWS-style architecture with VPC, RDS, and Lambda",
];

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function Workspace() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Describe a diagram or upload a sketch to get started." },
  ]);
  const [input, setInput] = useState("");
  const [code, setCode] = useState("");
  const [explanation, setExplanation] = useState<string>(
    "Generate a diagram to see how it works here.",
  );
  const [logs, setLogs] = useState<string>("No compilation yet.");
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(undefined);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [compiledMs, setCompiledMs] = useState<number | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateMutation = useGenerateDiagram();
  const compileMutation = useCompileDiagram();
  const autofixMutation = useAutofixDiagram();
  const uploadSketchMutation = useUploadSketch();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const exportMutation = useExportDiagram();

  const thinking = generateMutation.isPending || uploadSketchMutation.isPending;
  const compiling = compileMutation.isPending;

  /** Persist the current TikZ code as a project — creates on first save, updates after. */
  const persistProject = async (code: string, name = "Untitled Diagram") => {
    try {
      if (!projectId) {
        const project = await createProjectMutation.mutateAsync({ name, code });
        setProjectId(project.id);
        return project.id;
      }
      await updateProjectMutation.mutateAsync({ id: projectId, payload: { code } });
      return projectId;
    } catch (error) {
      toast.error("Couldn't save project", { description: errorMessage(error, "Please try again.") });
      return projectId;
    }
  };

  const toAbsoluteAssetUrl = (url: string) => (url.startsWith("http") ? url : `${API_BASE_URL}${url}`);

  const runCompile = async (code: string) => {
    try {
      const result = await compileMutation.mutateAsync({ code, project_id: projectId });
      setLogs(result.log ?? (result.status === "success" ? "Compilation succeeded." : "Compilation failed."));
      setCompiledMs(result.duration_ms);
      if (result.status === "success" && result.pdf_url) {
        setPdfUrl(toAbsoluteAssetUrl(result.pdf_url));
        toast.success("Diagram compiled", { description: "PDF preview updated." });
      } else {
        toast.error("Compilation failed", { description: "Check the Logs tab for details." });
      }
      return result;
    } catch (error) {
      const description = errorMessage(error, "Could not reach the compiler service.");
      setLogs(description);
      toast.error("Compilation failed", { description });
      return undefined;
    }
  };

  const send = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || thinking) return;
    setMessages((m) => [...m, { role: "user", content: value }]);
    setInput("");

    try {
      const result = await generateMutation.mutateAsync({
        prompt: value,
        project_id: projectId,
        existing_code: code || undefined,
      });
      setCode(result.code);
      setExplanation(result.explanation || "Diagram generated from your prompt.");
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Generated a TikZ diagram based on your prompt. Compiling now…" },
      ]);
      await persistProject(result.code, value.slice(0, 60));
      await runCompile(result.code);
    } catch (error) {
      const description = errorMessage(error, "Could not reach the generation service.");
      setMessages((m) => [...m, { role: "assistant", content: `Sorry, generation failed: ${description}` }]);
      toast.error("Generation failed", { description });
    }
  };

  const handleCompileClick = async () => {
    if (!code.trim()) {
      toast.error("Nothing to compile", { description: "Generate or write some TikZ code first." });
      return;
    }
    await runCompile(code);
  };

  const handleAutoFix = async () => {
    if (!code.trim()) {
      toast.error("Nothing to fix", { description: "Generate or write some TikZ code first." });
      return;
    }
    try {
      const result = await autofixMutation.mutateAsync({ code, error_log: logs, project_id: projectId });
      setCode(result.code);
      if (result.explanation) setExplanation(result.explanation);
      if (result.fixed) {
        toast.success("Auto-fix applied", { description: "Recompiling…" });
        if (result.pdf_url) setPdfUrl(toAbsoluteAssetUrl(result.pdf_url));
        await runCompile(result.code);
      } else {
        toast.info("Auto-fix ran", { description: "No changes were necessary." });
      }
    } catch (error) {
      toast.error("Auto-fix failed", { description: errorMessage(error, "Please try again.") });
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleSketchSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setMessages((m) => [...m, { role: "user", content: `Uploaded sketch: ${file.name}` }]);
    try {
      const result = await uploadSketchMutation.mutateAsync({ file, projectId });
      if (result.code) {
        setCode(result.code);
        setExplanation(result.explanation || "Diagram generated from your sketch.");
        setMessages((m) => [...m, { role: "assistant", content: "Converted your sketch into TikZ. Compiling now…" }]);
        await persistProject(result.code, file.name.replace(/\.[^.]+$/, ""));
        await runCompile(result.code);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "Sketch uploaded. Describe what to draw from it." }]);
      }
    } catch (error) {
      const description = errorMessage(error, "Could not reach the upload service.");
      setMessages((m) => [...m, { role: "assistant", content: `Sorry, sketch upload failed: ${description}` }]);
      toast.error("Sketch upload failed", { description });
    }
  };

  const handleExport = async (format: "pdf" | "png" | "svg" | "tex") => {
    if (format === "tex") {
      if (!code.trim()) {
        toast.error("Nothing to export", { description: "Generate a diagram first." });
        return;
      }
      const blob = new Blob([code], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diagram.tex";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported diagram.tex");
      return;
    }

    if (!code.trim()) {
      toast.error("Nothing to export", { description: "Generate or write some TikZ code first." });
      return;
    }

    try {
      const result = await exportMutation.mutateAsync({ format, code, projectId });
      const absoluteUrl = result.url.startsWith("http") ? result.url : `${API_BASE_URL}${result.url}`;
      window.open(absoluteUrl, "_blank", "noopener,noreferrer");
      toast.success(`Exported ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Export failed`, { description: errorMessage(error, "Please try again.") });
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSketchSelected}
      />

      {/* Top bar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">Untitled Diagram</div>
            <div className="text-[10px] text-muted-foreground">
              {projectId ? "Autosaved · just now" : "Not saved yet"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon"><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon"><Redo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon"><History className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
          <Button size="sm" onClick={handleCompileClick} disabled={compiling}>
            {compiling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Compile
          </Button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Chat pane */}
        <div className="w-full sm:w-[42%] min-w-[320px] max-w-xl flex flex-col shrink-0 border-r border-border">
          <div className="h-full flex flex-col">
          <div className="h-full flex flex-col border-r border-border">
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-5">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`h-8 w-8 rounded-lg grid place-items-center shrink-0 ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm max-w-[80%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              <AnimatePresence>
                {thinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-3"
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted grid place-items-center">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-card border border-border inline-flex items-center gap-2 text-sm">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span className="text-muted-foreground">Planning · generating TikZ · compiling…</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {messages.length === 1 && (
                <div className="pt-2">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Try</div>
                  <div className="flex flex-wrap gap-2">
                    {examples.map((e) => (
                      <button
                        key={e}
                        onClick={() => send(e)}
                        className="text-xs rounded-full border border-border px-3 py-1.5 hover:bg-accent transition-colors"
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <div className="rounded-2xl border border-border bg-card focus-within:border-foreground/30 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                  }}
                  rows={2}
                  placeholder="Describe the diagram, or paste a sketch…"
                  className="w-full bg-transparent resize-none outline-none px-4 pt-3 text-sm placeholder:text-muted-foreground"
                />
                <div className="flex items-center justify-between px-2 pb-2">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={handleUploadClick} disabled={uploadSketchMutation.isPending}>
                      {uploadSketchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toast.info("Voice input — coming soon")}><Mic className="h-4 w-4" /></Button>
                  </div>
                  <Button size="sm" onClick={() => send()} disabled={!input.trim() || thinking}>
                    {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Generate
                  </Button>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Preview pane */}
        <div className="flex-1 min-w-0">
          <div className="h-full flex flex-col">
            <Tabs defaultValue="preview" className="flex-1 flex flex-col">
              <div className="border-b border-border px-4 pt-3">
                <TabsList>
                  <TabsTrigger value="preview"><ImageIcon className="h-3.5 w-3.5" /> Preview</TabsTrigger>
                  <TabsTrigger value="code"><Code2 className="h-3.5 w-3.5" /> TikZ Code</TabsTrigger>
                  <TabsTrigger value="logs"><Terminal className="h-3.5 w-3.5" /> Logs</TabsTrigger>
                  <TabsTrigger value="explain"><BookOpen className="h-3.5 w-3.5" /> Explanation</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="preview" className="flex-1 m-0 p-6 overflow-auto scrollbar-thin">
                <div className="mx-auto max-w-3xl aspect-[4/3] rounded-2xl border border-border bg-white text-black grid place-items-center relative overflow-hidden">
                  {pdfUrl ? (
                    <iframe title="Compiled PDF preview" src={pdfUrl} className="absolute inset-0 h-full w-full border-0" />
                  ) : (
                    <>
                      <div className="absolute inset-0 grid-bg opacity-30" />
                      <div className="relative text-center px-6">
                        <FileText className="h-10 w-10 mx-auto mb-3 text-neutral-400" />
                        <div className="font-display font-semibold">Live PDF preview</div>
                        <div className="text-sm text-neutral-500 mt-1">Compiled TikZ output renders here.</div>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                    <div className="text-xs text-muted-foreground font-mono">diagram.tex</div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(code);
                          toast.success("Copied TikZ");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleAutoFix} disabled={autofixMutation.isPending}>
                        {autofixMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Auto Fix
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Generated TikZ/LaTeX code will appear here — or write your own."
                    className="flex-1 w-full bg-background font-mono text-xs p-4 outline-none resize-none scrollbar-thin"
                    spellCheck={false}
                  />
                </div>
              </TabsContent>

              <TabsContent value="logs" className="flex-1 m-0 p-4 overflow-auto">
                <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">{logs}</pre>
              </TabsContent>

              <TabsContent value="explain" className="flex-1 m-0 p-6 overflow-auto">
                <div className="prose prose-invert max-w-none text-sm">
                  <h3>How this diagram works</h3>
                  <p className="text-muted-foreground">{explanation}</p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Bottom toolbar */}
            <div className="border-t border-border p-3 flex flex-wrap items-center gap-1.5">
              {([
                { label: "PDF", format: "pdf" as const },
                { label: "PNG", format: "png" as const },
                { label: "SVG", format: "svg" as const },
                { label: "TEX", format: "tex" as const },
              ]).map((b) => (
                <Button
                  key={b.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(b.format)}
                  disabled={exportMutation.isPending}
                >
                  <Download className="h-3.5 w-3.5" /> {b.label}
                </Button>
              ))}
              <div className="ml-auto text-xs text-muted-foreground">
                {compiledMs !== undefined ? `Compiled in ${(compiledMs / 1000).toFixed(2)}s · IBM Granite` : "IBM Granite"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
