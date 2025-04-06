"use client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";

export default function ProjectHeader() {
  const router = useRouter();
  const params = useParams<{ name: string }>();
  const deleteProject = api.project.delete.useMutation({
    onSuccess: () => {
      router.push("/app/projects/overview");
    },
  });
  return (
    <div>
      <h1 className="p-2">Project: {params.name}</h1>
      <div className="flex gap-3 p-2">
        <Link href={`/app/projects/${params.name}/pipelines`}>
          <Button>Pipelines</Button>
        </Link>
        <Button>Logs</Button>
        <Button>Metrics</Button>
        <Link href={`/app/projects/${params.name}/traces`}>
          <Button>Traces</Button>
        </Link>
      </div>
      <Separator />
    </div>
  );
}
