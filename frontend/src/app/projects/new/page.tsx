"use client";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { signIn } from "next-auth/react";

export default function Page() {
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      <Button onClick={() => signIn("gitlab")}>Login into Gitlab</Button>
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
