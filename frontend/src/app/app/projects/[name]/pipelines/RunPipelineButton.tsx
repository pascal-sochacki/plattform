"use client";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";

export function RunPipelineButton(props: { name: string }) {
  const create = api.pipeline.createPipelineRun.useMutation();

  return (
    <Button onClick={() => create.mutate({ project: props.name })}>
      Run Pipeline
    </Button>
  );
}
