import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
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

const SAMPLE_TIKZ = `\\begin{tikzpicture}[node distance=1.6cm, every node/.style={font=\\sffamily}]
  \\tikzstyle{block} = [rectangle, rounded corners, draw, minimum width=3cm, minimum height=1cm, align=center]
  \\tikzstyle{decision} = [diamond, draw, aspect=2, align=center]

  \\node[block] (start) {User visits /login};
  \\node[block, below of=start] (form) {Submit credentials};
  \\node[decision, below of=form, yshift=-0.4cm] (check) {Valid?};
  \\node[block, below of=check, yshift=-0.4cm] (ok) {Issue JWT};
  \\node[block, right of=check, xshift=3cm] (fail) {Show error};

  \\draw[->] (start) -- (form);
  \\draw[->] (form) -- (check);
  \\draw[->] (check) -- node[left]{yes} (ok);
  \\draw[->] (check) -- node[above]{no} (fail);
\\end{tikzpicture}`;

function Workspace() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Describe a diagram or upload a sketch to get started." },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [code, setCode] = useState(SAMPLE_TIKZ);

  const send = (text?: string) => {
    const value = (text ?? input).trim();
    if (!value) return;
    setMessages((m) => [...m, { role: "user", content: value }]);
    setInput("");
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Generated a TikZ diagram based on your prompt. Preview updated on the right." },
      ]);
      setCode(SAMPLE_TIKZ);
      setThinking(false);
      toast.success("Diagram generated", { description: "TikZ compiled successfully." });
    }, 1400);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">Untitled Diagram</div>
            <div className="text-[10px] text-muted-foreground">Autosaved · just now</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon"><Undo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon"><Redo2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon"><History className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon"><Share2 className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => toast.info("Compiling…")}><Play className="h-4 w-4" /> Compile</Button>
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
                    <Button variant="ghost" size="icon" onClick={() => toast.info("Sketch upload — coming soon")}><Upload className="h-4 w-4" /></Button>
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
                  <div className="absolute inset-0 grid-bg opacity-30" />
                  <div className="relative text-center px-6">
                    <FileText className="h-10 w-10 mx-auto mb-3 text-neutral-400" />
                    <div className="font-display font-semibold">Live PDF preview</div>
                    <div className="text-sm text-neutral-500 mt-1">Compiled TikZ output renders here.</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="code" className="flex-1 m-0 overflow-hidden">
                <div className="h-full flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                    <div className="text-xs text-muted-foreground font-mono">diagram.tex</div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(code); toast.success("Copied TikZ"); }}>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toast.info("Auto-fix ran")}>
                        <Wand2 className="h-3.5 w-3.5" /> Auto Fix
                      </Button>
                    </div>
                  </div>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="flex-1 w-full bg-background font-mono text-xs p-4 outline-none resize-none scrollbar-thin"
                    spellCheck={false}
                  />
                </div>
              </TabsContent>

              <TabsContent value="logs" className="flex-1 m-0 p-4 overflow-auto">
                <pre className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
{`> pdflatex diagram.tex
This is pdfTeX, Version 3.141592653
(./diagram.tex LaTeX2e
Output written on diagram.pdf (1 page).
Compilation succeeded in 1.42s`}
                </pre>
              </TabsContent>

              <TabsContent value="explain" className="flex-1 m-0 p-6 overflow-auto">
                <div className="prose prose-invert max-w-none text-sm">
                  <h3>How this diagram works</h3>
                  <p className="text-muted-foreground">
                    A vertical flowchart with rounded blocks and a diamond decision node.
                    Arrows use TikZ's positioning library for consistent spacing.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {/* Bottom toolbar */}
            <div className="border-t border-border p-3 flex flex-wrap items-center gap-1.5">
              {[
                { label: "PDF", icon: Download },
                { label: "PNG", icon: Download },
                { label: "SVG", icon: Download },
                { label: "TEX", icon: Download },
              ].map((b) => (
                <Button key={b.label} variant="outline" size="sm" onClick={() => toast.success(`Exporting ${b.label}`)}>
                  <b.icon className="h-3.5 w-3.5" /> {b.label}
                </Button>
              ))}
              <div className="ml-auto text-xs text-muted-foreground">Compiled in 1.42s · IBM Granite</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
