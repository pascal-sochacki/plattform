import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { CreateProjectSchema, type ProjectObject } from "../schema";
import { db } from "~/server/db";
import { gitlabAccount } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { Gitlab } from "@gitbeaker/rest";
import * as k8s from "@kubernetes/client-node";

export const projectRouter = createTRPCRouter({
  delete: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const kc = new k8s.KubeConfig();
      kc.loadFromDefault();
      const customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);

      const project = (await customObjectsApi.getClusterCustomObject({
        name: input.name,
        group: "core.plattf0rm.de",
        version: "v1alpha1",
        plural: "projects",
      })) as ProjectObject;
      const userId = project.metadata?.labels?.user ?? "";
      if (userId != ctx.session.user.id) {
        return;
      }
      await customObjectsApi.deleteClusterCustomObject({
        name: input.name,
        group: "core.plattf0rm.de",
        version: "v1alpha1",
        plural: "projects",
      });
    }),

  create: protectedProcedure
    .input(CreateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const account = await db
        .select()
        .from(gitlabAccount)
        .where(eq(gitlabAccount.userId, ctx.session.user.id));

      if (account.length == 0) {
        return;
      }

      const api = new Gitlab({
        oauthToken: account[0]!.access_token!,
      });
      const gitlabProject = await api.Projects.show(input.project);

      const kc = new k8s.KubeConfig();
      kc.loadFromDefault();
      const customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const project = await customObjectsApi.createClusterCustomObject({
        group: "core.plattf0rm.de",
        body: {
          apiVersion: "core.plattf0rm.de/v1alpha1",
          kind: "Project",
          metadata: {
            name: gitlabProject.path_with_namespace.replaceAll("/", "-"),
            labels: {
              user: ctx.session.user.id,
            },
          },
          spec: {
            source: "test",
          },
        },
        version: "v1alpha1",
        plural: "projects",
        // labelSelector: `user=${session.user.id}`,
      });
      console.log(project);
    }),
});
