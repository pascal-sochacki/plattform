import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { CreateProjectSchema } from "../schema";
import { db } from "~/server/db";
import { gitlabAccount, project } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { Gitlab } from "@gitbeaker/rest";

export const projectRouter = createTRPCRouter({
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
      await db.insert(project).values({
        name: gitlabProject.path_with_namespace,
        userId: ctx.session.user.id,
        source_id: input.project,
      });
    }),
});
