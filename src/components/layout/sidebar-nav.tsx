"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, GraduationCap, LayoutGrid, ShieldCheck } from "lucide-react";
import type { Role } from "@prisma/client";
import { useSidebar } from "@/components/layout/sidebar-context";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: typeof BookOpen };

export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  const items: NavItem[] = [
    { href: "/courses", label: "Catalog", icon: BookOpen },
    { href: "/my-learning", label: "My Learning", icon: GraduationCap },
    ...(role === "INSTRUCTOR" || role === "ADMIN"
      ? [{ href: "/studio", label: "Studio", icon: LayoutGrid }]
      : []),
    ...(role === "ADMIN" ? [{ href: "/admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  return (
    <aside
      className={cn(
        "sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 flex-col border-r bg-card transition-[width] duration-200 sm:flex",
        collapsed ? "w-16" : "w-56",
      )}
    >
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
