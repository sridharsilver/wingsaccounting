import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-24">{children}</main>
      <Footer />
    </div>
  );
}
