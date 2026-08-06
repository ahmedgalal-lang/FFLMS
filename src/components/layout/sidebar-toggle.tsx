"use client";

import { PanelLeft } from "lucide-react";
import { useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";

export function SidebarToggle() {
  const { collapsed, toggle } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="hidden sm:inline-flex"
    >
      <PanelLeft className="h-5 w-5" />
    </Button>
  );
}
