import ProjectHeader from "./header";

export default async function Page({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const name = (await params).name;
  return (
    <>
      <ProjectHeader name={name} />
      My Post: {name}
    </>
  );
}
