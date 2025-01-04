"use client";
import { type SimpleProjectSchema } from "@gitbeaker/rest";
import { useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "~/components/ui/form";
import { Label } from "~/components/ui/label";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { api, type RouterInputs } from "~/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateProjectSchema } from "~/server/api/schema";
import { useRouter } from "next/navigation";

export function GitlabSelect(props: { gitlabProjects: SimpleProjectSchema[] }) {
  const router = useRouter();
  const create = api.project.create.useMutation({
    onSuccess: () => {
      router.push("/app/projects/overview");
    },
  });
  const form = useForm<RouterInputs["project"]["create"]>({
    resolver: zodResolver(CreateProjectSchema),
    mode: "onChange",
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          create.mutate(data);
        })}
      >
        <FormField
          control={form.control}
          name="project"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Select Gitlab Project</FormLabel>
              <FormControl>
                <RadioGroup onChange={field.onChange}>
                  {props.gitlabProjects.map((project) => (
                    <div
                      className="flex items-center gap-2 space-x-2"
                      key={project.id}
                    >
                      <RadioGroupItem
                        value={project.id.toString()}
                        id={project.path_with_namespace}
                      />
                      <Label htmlFor={project.path_with_namespace}>
                        {project.path_with_namespace}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-2 pt-4">
          <Button
            className="w-full"
            variant={"secondary"}
            onClick={() => router.push("/app/projects/overview")}
          >
            Back
          </Button>
          <Button
            className="w-full"
            type="submit"
            disabled={!form.formState.isValid}
          >
            Next
          </Button>
        </div>
      </form>
    </Form>
  );
}
