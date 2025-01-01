import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

export default function Page() {
  const params = new URLSearchParams();
  params.set("origin", "/app/projects/new");
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      <a href={"/api/connect/init?" + params.toString()} className="w-full">
        <Button className="w-full">Login into Gitlab</Button>
      </a>
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Import Git Repository</CardTitle>
          <CardDescription>Import Git Repository as Project</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card Content</p>
        </CardContent>
        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
    </div>
  );
}
