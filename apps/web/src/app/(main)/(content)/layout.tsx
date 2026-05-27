export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="container px-4 py-12 flex flex-col lg:max-w-3xl mx-auto w-full">
      <div className="flex flex-col flex-1 gap-1 my-4">{children}</div>
    </main>
  );
}
