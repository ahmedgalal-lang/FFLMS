import { SiteHeader } from "@/components/layout/site-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-8">{children}</main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        LMS Platform · Built with Next.js
      </footer>
    </div>
  );
}
