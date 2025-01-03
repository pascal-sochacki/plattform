import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { db } from "~/server/db";
import { gitlabAccount, project } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "~/server/auth";
import { permanentRedirect } from "next/navigation";
import { Gitlab, type SimpleProjectSchema } from "@gitbeaker/rest";
import { GitlabSelect } from "./ProjectSelect";

export default async function Page() {
  const params = new URLSearchParams();
  params.set("origin", "/app/projects/new");
  const session = await auth();
  if (session == null) {
    permanentRedirect("/");
  }

  const account = await db
    .select()
    .from(gitlabAccount)
    .where(eq(gitlabAccount.userId, session.user.id));

  let gitlabProjectSelect = (
    <div>Could not find Gitlab Projects. Try to login into gitlab</div>
  );
  if (account.length > 0) {
    try {
      let gitlabProjects: SimpleProjectSchema[] = [];
      const api = new Gitlab({
        oauthToken: account[0]!.access_token!,
      });
      gitlabProjects = await api.Projects.all({ owned: true, simple: true });

      gitlabProjectSelect = <GitlabSelect gitlabProjects={gitlabProjects} />;
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      <a href={"/api/connect/init?" + params.toString()} className="w-full">
        <Button className="w-full">Login into Gitlab</Button>
      </a>
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Import Git Repository</CardTitle>
          <CardDescription>Import Git Repository as Project</CardDescription>
        </CardHeader>
        <CardContent>{gitlabProjectSelect}</CardContent>
        <CardFooter className="gap-4"></CardFooter>
      </Card>
    </div>
  );
}
