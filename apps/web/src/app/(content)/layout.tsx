import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function MdxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-col flex-1">
        <main className="container px-8 py-4 flex flex-col lg:max-w-3xl mx-auto">
          <div className="flex flex-col flex-1 gap-1 my-4">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
