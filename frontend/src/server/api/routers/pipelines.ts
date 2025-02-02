import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { CreatePipelineSchema, type ProjectObject } from "../schema";
import * as k8s from "@kubernetes/client-node";
import { z } from "zod";

export const pipelineRouter = createTRPCRouter({
  getPipelineRuns: protectedProcedure
    .input(
      z.object({
        project: z.string(),
      }),
    )
    .output(
      z.array(
        z.object({
          name: z.string(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const customObjectsApi = ctx.kc.makeApiClient(k8s.CustomObjectsApi);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const project = (await customObjectsApi.getClusterCustomObject({
        name: input.project,
        group: "core.plattf0rm.de",
        version: "v1alpha1",
        plural: "projects",
      })) as ProjectObject;

      if (ctx.session.user.id !== project?.metadata?.labels?.user) {
        return [];
      }
      const pipelines = (await customObjectsApi.listNamespacedCustomObject({
        namespace: input.project,
        group: "tekton.dev",
        version: "v1",
        plural: "pipelineruns",
        labelSelector: `project=${input.project}`,
      })) as k8s.KubernetesListObject<ProjectObject>;
      const result = pipelines?.items.map((p) => {
        return { name: p.metadata?.name ?? "" };
      });
      return result;
    }),

  createPipelineRun: protectedProcedure
    .input(CreatePipelineSchema)
    .mutation(async ({ ctx, input }) => {
      const customObjectsApi = ctx.kc.makeApiClient(k8s.CustomObjectsApi);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const project = (await customObjectsApi.getClusterCustomObject({
        name: input.project,
        group: "core.plattf0rm.de",
        version: "v1alpha1",
        plural: "projects",
      })) as ProjectObject;

      if (ctx.session.user.id !== project?.metadata?.labels?.user) {
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await customObjectsApi.createNamespacedCustomObject({
        namespace: input.project,
        version: "v1beta1",
        plural: "pipelineruns",
        group: "tekton.dev",
        body: {
          apiVersion: "tekton.dev/v1beta1",
          kind: "PipelineRun",
          metadata: {
            generateName: `${input.project}`,
            labels: {
              user: ctx.session.user.id,
              project: input.project,
            },
            namespace: input.project,
          },
          spec: {
            pipelineRef: {
              name: input.project,
            },
            params: [
              {
                name: "username",
                value: input.project,
              },
            ],
          },
        },
      });
      console.log(result);
    }),
});
