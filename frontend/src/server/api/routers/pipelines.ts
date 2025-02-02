import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { CreatePipelineSchema, type ProjectObject } from "../schema";
import * as k8s from "@kubernetes/client-node";

export const pipelineRouter = createTRPCRouter({
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
            namespace: input.project,
          },
          spec: {
            pipelineRef: {
              name: input.project,
            },
            params: [
              {
                name: "username",
                value: "Tekton",
              },
            ],
          },
        },
      });
      console.log(result);
    }),
});
