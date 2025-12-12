export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="container px-8 py-4 flex flex-col lg:max-w-3xl">
      <div className="flex flex-col flex-1 gap-1 my-4">{children}</div>
    </main>
  );
}
