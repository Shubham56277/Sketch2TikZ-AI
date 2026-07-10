import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Sparkles,
  Plus,
  LayoutDashboard,
  FolderOpen,
  LayoutTemplate,
  Star,
  History,
  Users,
  Settings,
  Cloud,
  HelpCircle,
  Info,
  Terminal,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { section: "Create", items: [
    { to: "/workspace", label: "New Project", icon: Plus, accent: true },
  ]},
  { section: "Library", items: [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/projects", label: "Recent Projects", icon: FolderOpen },
    { to: "/templates", label: "Templates", icon: LayoutTemplate },
    { to: "/favorites", label: "Favorites", icon: Star },
    { to: "/history", label: "History", icon: History },
    { to: "/shared", label: "Shared" , icon: Users },
  ]},
  { section: "System", items: [
    { to: "/settings", label: "Settings", icon: Settings },
    { to: "/developer", label: "IBM Cloud Status", icon: Cloud },
    { to: "/help", label: "Help", icon: HelpCircle },
    { to: "/about", label: "About", icon: Info },
  ]},
] as const;

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 264 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="sticky top-0 h-screen shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col"
    >
      <div className="flex items-center gap-2 px-4 h-16 border-b border-sidebar-border">
        <div className="relative shrink-0 h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-[var(--shadow-glow)]">
          <Sparkles className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <div className="font-display font-bold text-sm truncate">Sketch2TikZ</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">AI · IBM Cloud</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-6">
        {nav.map((group) => (
          <div key={group.section}>
            {!collapsed && (
              <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.section}
              </div>
            )}
            <ul className="space-y-1">
              {group.items.map((it) => {
                const active = pathname === it.to;
                const Icon = it.icon;
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-all",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        (it as any).accent && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground shadow-[var(--shadow-glow)]",
                      )}
                    >
                      {active && !(it as any).accent && (
                        <motion.span
                          layoutId="side-active"
                          className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-primary"
                        />
                      )}
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{it.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/developer"
          className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors"
        >
          <div className="relative shrink-0">
            <Terminal className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_theme(colors.emerald.400)]" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-xs font-medium truncate">IBM Cloud</div>
              <div className="text-[10px] text-muted-foreground truncate">Granite · Online</div>
            </div>
          )}
        </Link>
      </div>
    </motion.aside>
  );
}
