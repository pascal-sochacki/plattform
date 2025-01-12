"use client";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export function RunPipelineButton() {
  const create = api.pipeline.createPipelineRun.useMutation();

  return (
    <Button onClick={() => create.mutate({ project: "pascal-homelab-league" })}>
      Run Pipeline
    </Button>
  );
}
