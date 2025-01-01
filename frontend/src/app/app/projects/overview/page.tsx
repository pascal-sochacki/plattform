import { eq } from "drizzle-orm";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardHeader } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { project } from "~/server/db/schema";

export default async function Page() {
  const session = await auth();
  if (session == null) {
    permanentRedirect("/");
  }
  const projects = await db
    .select()
    .from(project)
    .where(eq(project.userId, session.user.id));
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-row-reverse p-2">
        <Link href={{ pathname: "/app/projects/new" }}>
          <Button>Create new Project</Button>
        </Link>
      </div>
      <Separator />
      <div className="grid grid-cols-3 gap-4 p-4">
        {projects.map((p) => (
          <Link href={`./${p.id}`} key={p.id}>
            <Card>
              <CardHeader>{p.name}</CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
