import { z } from "zod";
import type * as k8s from "@kubernetes/client-node";
export const CreateProjectSchema = z.object({ project: z.string() });

export interface ProjectObject extends k8s.KubernetesObject {
  status: ProjectStatus;
  spec: ProjectSpec;
}

export interface ProjectSpec {
  source: string;
}

export interface ProjectStatus {
  conditions: ProjectStatusCondition[];
}

export interface ProjectStatusCondition {
  type: string;
  lastTransitionTime: string;
  message: string;
  reason: string;
  status: string;
}
