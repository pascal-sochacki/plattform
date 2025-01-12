import { Button } from "~/components/ui/button";
import { RunPipelineButton } from "./RunPipelineButton";

export default async function Page({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const name = (await params).name;
  return <RunPipelineButton />;
}
