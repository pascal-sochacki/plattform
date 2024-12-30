import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-row-reverse p-2">
        <Link href="/projects/new">
          <Button>Create new Project</Button>
        </Link>
      </div>
      <Separator />
    </div>
  );
}
