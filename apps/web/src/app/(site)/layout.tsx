import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <div className="flex flex-col flex-1 container items-center lg:max-w-7xl mx-auto">
        {children}
      </div>
      <Footer />
    </div>
  );
}
