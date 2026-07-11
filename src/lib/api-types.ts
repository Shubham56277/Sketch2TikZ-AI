/**
 * Shared request/response types for the Sketch2TikZ AI backend API.
 * These mirror the FastAPI/Pydantic models exactly (field names, casing,
 * shapes) — see backend/app/models/*.py. FastAPI emits snake_case JSON by
 * default (no camelCase alias generator is configured on the backend), so
 * these types intentionally use snake_case rather than the JS convention.
 */

export type DiagramType =
  | "flowchart"
  | "uml_class"
  | "er_diagram"
  | "circuit_tikz"
  | "pgfplots"
  | "mind_map"
  | "network"
  | "generic";

export type ExportFormat = "pdf" | "png" | "svg" | "tex";

export type CompileStatus = "success" | "failed" | "timeout";

export interface HealthResponse {
  status: string;
  watsonx_configured: boolean;
  cloudant_configured: boolean;
  object_storage_configured: boolean;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateRequest {
  prompt: string;
  diagram_type?: DiagramType;
  history?: ChatTurn[];
  project_id?: string;
  existing_code?: string;
}

export interface GenerateResponse {
  code: string;
  explanation: string;
  diagram_type: DiagramType;
  model_id: string;
  compile_status?: CompileStatus;
  compile_log?: string;
  pdf_url?: string;
}

export interface AutofixRequest {
  code: string;
  error_log: string;
  project_id?: string;
}

export interface AutofixResponse {
  code: string;
  explanation: string;
  fixed: boolean;
  attempts: number;
  compile_status?: CompileStatus;
  compile_log?: string;
  pdf_url?: string;
}

export interface CompileRequest {
  code: string;
  project_id?: string;
}

export interface CompileResponse {
  status: CompileStatus;
  log: string;
  pdf_url?: string;
  duration_ms?: number;
}

export interface ExportRequest {
  code: string;
  project_id?: string;
  format: ExportFormat;
}

export interface ExportResponse {
  format: ExportFormat;
  url: string;
  duration_ms?: number;
}

export interface UploadSketchResponse {
  code: string;
  explanation: string;
  diagram_type: DiagramType;
  model_id: string;
  sketch_url: string;
  project_id?: string;
}

export interface ProjectVersion {
  version_id: string;
  code: string;
  explanation?: string;
  pdf_url?: string;
  created_at: string;
  created_by: string;
}

export interface ProjectCreate {
  name: string;
  diagram_type?: DiagramType;
  code?: string;
  explanation?: string;
  is_favorite?: boolean;
}

export interface ProjectUpdate {
  name?: string;
  diagram_type?: DiagramType;
  code?: string;
  explanation?: string;
  is_favorite?: boolean;
  pdf_url?: string;
  save_as_new_version?: boolean;
}

export interface Project {
  id: string;
  name: string;
  diagram_type: DiagramType;
  code: string;
  explanation?: string;
  pdf_url?: string;
  is_favorite: boolean;
  owner_id: string;
  versions: ProjectVersion[];
  created_at: string;
  updated_at: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  diagram_type: DiagramType;
  pdf_url?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectListResponse {
  items: ProjectListItem[];
  total: number;
}
