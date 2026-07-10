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
  CreateProjectRequest,
  GenerateRequest,
  GenerateResponse,
  HealthResponse,
  Project,
  UpdateProjectRequest,
  UploadSketchResponse,
} from "@/lib/api-types";

export const endpoints = {
  health: () => api.get<HealthResponse>("/health"),

  generate: (payload: GenerateRequest) => api.post<GenerateResponse>("/generate", payload),

  compile: (payload: CompileRequest) => api.post<CompileResponse>("/compile", payload),

  uploadSketch: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<UploadSketchResponse>("/upload-sketch", form, { isFormData: true });
  },

  autofix: (payload: AutofixRequest) => api.post<AutofixResponse>("/autofix", payload),

  listProjects: () => api.get<Project[]>("/projects"),

  createProject: (payload: CreateProjectRequest) => api.post<Project>("/projects", payload),

  updateProject: (id: string, payload: UpdateProjectRequest) =>
    api.put<Project>(`/projects/${encodeURIComponent(id)}`, payload),

  deleteProject: (id: string) => api.delete<void>(`/projects/${encodeURIComponent(id)}`),

  exportPdf: (projectId: string) => api.post<{ url: string }>("/export/pdf", { projectId }),

  exportPng: (projectId: string) => api.post<{ url: string }>("/export/png", { projectId }),

  exportSvg: (projectId: string) => api.post<{ url: string }>("/export/svg", { projectId }),
};
