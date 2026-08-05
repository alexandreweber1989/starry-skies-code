import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Network,
  UtensilsCrossed,
  Church,
  LogOut,
  UserCircle,
  ShieldCheck,
  BookOpen,
  Coffee,
  Music,
  CalendarDays,
  Baby,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";
import { GlobalSearch } from "@/components/global-search";
import { NotificationsBell } from "@/components/notifications-bell";
import { QuickActions } from "@/components/quick-actions";

const nav = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/ministerios", label: "Ministérios", icon: Sparkles },
  { to: "/louvor", label: "Louvor", icon: Music },
  { to: "/redes", label: "Redes", icon: Network },
  { to: "/mesas", label: "Mesas", icon: UtensilsCrossed },
  { to: "/membros", label: "Membros", icon: Users },
  { to: "/kids", label: "Kids", icon: Baby },
  { to: "/igrejas", label: "Igrejas", icon: Church },
  { to: "/livraria", label: "Livraria", icon: BookOpen },
  { to: "/cantina", label: "Cantina", icon: Coffee },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
          <div className="px-6 py-8 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-sm bg-sidebar-primary/20 flex items-center justify-center">
                <Church className="h-5 w-5 text-sidebar-primary" />
              </div>
              <div>
                <div className="font-serif text-lg leading-none">Igreja Batista</div>
                <div className="font-mono text-xs uppercase tracking-widest text-sidebar-primary mt-1">
                  Atos
                </div>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-6 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
            <Link
              to="/perfil"
              className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <UserCircle className="h-4 w-4" />
              <div className="flex-1 min-w-0">
                <div className="truncate">{user?.email}</div>
                {isAdmin && (
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-sidebar-primary mt-0.5">
                    <ShieldCheck className="h-3 w-3" /> Admin geral
                  </div>
                )}
              </div>
            </Link>
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </aside>
        <main className="min-w-0">
          <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
            <div className="flex items-center gap-2">
              <Church className="h-5 w-5 text-primary" />
              <span className="font-serif">IB Atos</span>
            </div>
            <div className="flex items-center gap-1">
              <GlobalSearch />
              <NotificationsBell />
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <div className="hidden lg:flex items-center justify-end gap-2 px-10 py-3 border-b border-border bg-card">
            <GlobalSearch />
            <NotificationsBell />
          </div>
          <nav className="lg:hidden flex overflow-x-auto gap-1 px-2 py-2 border-b border-border bg-card">
            {nav.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 rounded-sm text-xs whitespace-nowrap ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <PageTransition>{children}</PageTransition>
        </main>
        <QuickActions />
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          {eyebrow && (
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary mb-3">
              {eyebrow}
            </div>
          )}
          <h1 className="font-serif text-4xl lg:text-5xl leading-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">{children}</div>;
}