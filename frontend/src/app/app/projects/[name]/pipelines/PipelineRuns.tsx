"use client";

import { useEffect } from "react";
import { api } from "~/trpc/react";

export function PipelineRuns(props: { name: string }) {
  const pipelines = api.pipeline.getPipelineRuns.useQuery({
    project: props.name,
  });
  // make a timer to refetch get pipelines each sec
  useEffect(() => {
    const interval = setInterval(() => void pipelines.refetch(), 1000);
    return () => clearInterval(interval);
  }, [pipelines]);

  return <ul>{pipelines.data?.map((p) => <li key={p.name}>{p.name}</li>)}</ul>;
}
