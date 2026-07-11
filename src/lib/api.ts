/**
 * REST endpoint functions for the Sketch2TikZ AI backend.
 * One function per backend route; kept thin so hooks/components stay simple to test.
 */

import { api } from "@/lib/api-client";
import type {
  AutofixRequest,
  AutofixResponse,
  CompileRequest,
  CompileResponse,
  DiagramType,
  ExportFormat,
  ExportResponse,
  GenerateRequest,
  GenerateResponse,
  HealthResponse,
  Project,
  ProjectCreate,
  ProjectListResponse,
  ProjectUpdate,
  UploadSketchResponse,
} from "@/lib/api-types";

export const endpoints = {
  health: () => api.get<HealthResponse>("/health"),

  generate: (payload: GenerateRequest) => api.post<GenerateResponse>("/generate", payload),

  compile: (payload: CompileRequest) => api.post<CompileResponse>("/compile", payload),

  uploadSketch: (file: File, diagramType?: DiagramType, projectId?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (diagramType) form.append("diagram_type", diagramType);
    if (projectId) form.append("project_id", projectId);
    return api.post<UploadSketchResponse>("/upload-sketch", form, { isFormData: true });
  },

  autofix: (payload: AutofixRequest) => api.post<AutofixResponse>("/autofix", payload),

  listProjects: (limit = 50, skip = 0) =>
    api.get<ProjectListResponse>(`/projects?limit=${limit}&skip=${skip}`),

  getProject: (id: string) => api.get<Project>(`/projects/${encodeURIComponent(id)}`),

  createProject: (payload: ProjectCreate) => api.post<Project>("/projects", payload),

  updateProject: (id: string, payload: ProjectUpdate) =>
    api.put<Project>(`/projects/${encodeURIComponent(id)}`, payload),

  deleteProject: (id: string) => api.delete<void>(`/projects/${encodeURIComponent(id)}`),

  export: (format: ExportFormat, code: string, projectId?: string) =>
    api.post<ExportResponse>(`/export/${format}`, { code, project_id: projectId, format }),
};
