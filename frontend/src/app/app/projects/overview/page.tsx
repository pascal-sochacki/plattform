import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardFooter, CardHeader } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { auth } from "~/server/auth";
import * as k8s from "@kubernetes/client-node";
import { type ProjectObject } from "~/server/api/schema";

export default async function Page() {
  const session = await auth();
  if (session == null) {
    permanentRedirect("/");
  }
  const kc = new k8s.KubeConfig();
  kc.loadFromDefault();
  const customObjectsApi = kc.makeApiClient(k8s.CustomObjectsApi);

  const projects = (await customObjectsApi.listClusterCustomObject({
    group: "core.plattf0rm.de",
    version: "v1alpha1",
    plural: "projects",
    labelSelector: `user=${session.user.id}`,
  })) as k8s.KubernetesListObject<ProjectObject>;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-row-reverse p-2">
        <Link href={{ pathname: "/app/projects/new" }}>
          <Button>Create new Project</Button>
        </Link>
      </div>
      <Separator />
      <div className="grid grid-cols-3 gap-4 p-4">
        {projects.items.map((p) => {
          const lastStatus =
            p.status.conditions[p.status.conditions.length - 1];
          return (
            <Link href={`./${p.metadata?.name}`} key={p.metadata?.name}>
              <Card
                className={`${lastStatus?.status == "False" ? "border-red-400" : ""}`}
              >
                <CardHeader>{p.metadata?.name}</CardHeader>
                <CardFooter>{lastStatus?.message}</CardFooter>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
