/**
 * TanStack Query hooks wrapping the Sketch2TikZ AI backend endpoints.
 * Components should use these hooks instead of calling `endpoints`/`api` directly.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import type {
  AutofixRequest,
  CompileRequest,
  DiagramType,
  ExportFormat,
  GenerateRequest,
  ProjectCreate,
  ProjectUpdate,
} from "@/lib/api-types";

export const queryKeys = {
  health: ["health"] as const,
  projects: ["projects"] as const,
  project: (id: string) => ["projects", id] as const,
};

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: endpoints.health,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => endpoints.listProjects(),
    staleTime: 10_000,
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.project(id ?? ""),
    queryFn: () => endpoints.getProject(id as string),
    enabled: !!id,
  });
}

export function useGenerateDiagram() {
  return useMutation({
    mutationFn: (payload: GenerateRequest) => endpoints.generate(payload),
  });
}

export function useCompileDiagram() {
  return useMutation({
    mutationFn: (payload: CompileRequest) => endpoints.compile(payload),
  });
}

export function useAutofixDiagram() {
  return useMutation({
    mutationFn: (payload: AutofixRequest) => endpoints.autofix(payload),
  });
}

export function useUploadSketch() {
  return useMutation({
    mutationFn: ({ file, diagramType, projectId }: { file: File; diagramType?: DiagramType; projectId?: string }) =>
      endpoints.uploadSketch(file, diagramType, projectId),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectCreate) => endpoints.createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProjectUpdate }) =>
      endpoints.updateProject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => endpoints.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useExportDiagram() {
  return useMutation({
    mutationFn: ({ format, code, projectId }: { format: ExportFormat; code: string; projectId?: string }) =>
      endpoints.export(format, code, projectId),
  });
}
