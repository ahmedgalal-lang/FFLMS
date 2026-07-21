import Link from "next/link";
import { LayoutDashboard, Users, ClipboardCheck, Tags, BarChart3 } from "lucide-react";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/review", label: "Review queue", icon: ClipboardCheck },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-1 border-b pb-3">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
    </nav>
  );
}
