/**
 * Shared request/response types for the Sketch2TikZ AI backend API.
 * Mirrors the FastAPI contract: /health, /generate, /compile, /upload-sketch,
 * /autofix, /projects (CRUD), /export/{pdf,png,svg}.
 */

export type DiagramType =
  | "flowchart"
  | "uml"
  | "er"
  | "circuit"
  | "pgfplots"
  | "mindmap"
  | "network"
  | "sequence"
  | "state"
  | "other";

export interface Project {
  id: string;
  name: string;
  tikzCode: string;
  diagramType?: DiagramType;
  starred?: boolean;
  createdAt: string;
  updatedAt: string;
  pdfUrl?: string;
  pngUrl?: string;
  svgUrl?: string;
  sketchUrl?: string;
}

export interface GenerateRequest {
  prompt: string;
  diagramType?: DiagramType;
  projectId?: string;
}

export interface GenerateResponse {
  tikzCode: string;
  explanation?: string;
}

export interface CompileRequest {
  tikzCode: string;
  engine?: "pdflatex" | "xelatex" | "lualatex";
}

export interface CompileResponse {
  success: boolean;
  pdfUrl?: string;
  logs?: string;
  error?: string;
  durationMs?: number;
}

export interface AutofixRequest {
  tikzCode: string;
  errorLog?: string;
}

export interface AutofixResponse {
  tikzCode: string;
  explanation?: string;
  fixed: boolean;
}

export interface UploadSketchResponse {
  sketchUrl: string;
  tikzCode?: string;
  explanation?: string;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "down" | string;
  services?: Record<string, string>;
  latencyMs?: number;
}

export interface CreateProjectRequest {
  name: string;
  tikzCode?: string;
  diagramType?: DiagramType;
}

export interface UpdateProjectRequest {
  name?: string;
  tikzCode?: string;
  starred?: boolean;
  diagramType?: DiagramType;
}
