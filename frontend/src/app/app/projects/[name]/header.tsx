"use client";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Separator } from "~/components/ui/separator";
import { api } from "~/trpc/react";

export default function ProjectHeader({ name }: { name: string }) {
  const router = useRouter();
  const deleteProject = api.project.delete.useMutation({
    onSuccess: () => {
      router.push("/app/projects/overview");
    },
  });
  return (
    <div>
      <h1 className="p-2">{name}</h1>
      <div className="flex flex-row-reverse p-2">
        <Popover>
          <PopoverTrigger>
            <Button variant={"destructive"}>Delete Project</Button>
          </PopoverTrigger>
          <PopoverContent>
            <div>Are you sure?</div>
            <Button
              variant={"destructive"}
              onClick={() => void deleteProject.mutate({ name: name })}
            >
              Yes!
            </Button>
          </PopoverContent>
        </Popover>
      </div>
      <Separator />
    </div>
  );
}
