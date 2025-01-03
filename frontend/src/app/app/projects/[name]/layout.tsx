export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex flex-1 flex-col gap-4">{children}</div>;
}
