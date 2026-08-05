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
  ChevronRight,
  Menu,
} from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";
import { GlobalSearch } from "@/components/global-search";
import { NotificationsBell } from "@/components/notifications-bell";
import { QuickActions } from "@/components/quick-actions";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { group: "Principal", items: [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/agenda", label: "Calendário", icon: CalendarDays },
    { to: "/membros", label: "Comunidade", icon: Users },
  ]},
  { group: "Ministérios", items: [
    { to: "/kids", label: "Kids", icon: Baby },
    { to: "/louvor", label: "Louvor & Adoração", icon: Music },
    { to: "/ministerios", label: "Ministérios", icon: Sparkles },
    { to: "/redes", label: "Redes", icon: Network },
    { to: "/mesas", label: "Mesas", icon: UtensilsCrossed },
  ]},
  { group: "Recursos", items: [
    { to: "/livraria", label: "Livraria", icon: BookOpen },
    { to: "/cantina", label: "Cantina", icon: Coffee },
    { to: "/igrejas", label: "Igrejas", icon: Church },
  ]}
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary">
      <div className="flex h-screen overflow-hidden">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:flex flex-col w-[280px] bg-sidebar border-r border-sidebar-border shadow-sm z-30">
          <div className="p-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Church className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <div className="font-serif text-xl font-medium tracking-tight">IB Atos</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground leading-none mt-1">
                  Ponta Grossa
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scrollbar-none">
            {nav.map((group) => (
              <div key={group.group} className="space-y-1">
                <h4 className="px-4 text-[10px] font-mono uppercase tracking-[0.15em] text-muted-foreground/60 mb-2">
                  {group.group}
                </h4>
                {group.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                        active
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/10"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4.5 w-4.5 transition-transform duration-300", !active && "group-hover:scale-110")} />
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="h-3 w-3 opacity-50" />}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="p-4 mt-auto border-t border-sidebar-border bg-sidebar/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-sidebar-accent/50 border border-sidebar-border/50">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <UserCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate">{user?.email?.split('@')[0]}</div>
                <div className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">
                  {isAdmin ? 'Administrador' : 'Membro'}
                </div>
              </div>
              <button 
                onClick={signOut}
                className="p-2 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          {/* TOP HEADER */}
          <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-border bg-background/80 backdrop-blur-md z-20">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 rounded-xl hover:bg-accent transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="hidden lg:block">
                 {/* Breadcrumb or search can go here */}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <GlobalSearch />
              <div className="h-4 w-[1px] bg-border mx-1" />
              <NotificationsBell />
              <div className="hidden sm:block">
                 <QuickActions />
              </div>
            </div>
          </header>

          {/* PAGE SCROLL AREA */}
          <main className="flex-1 overflow-y-auto bg-background/50 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,var(--color-primary)_0%,transparent_40%)] opacity-[0.03] pointer-events-none" />
            <PageTransition>{children}</PageTransition>
          </main>
        </div>

        {/* MOBILE OVERLAY MENU (Simplified) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-sidebar border-r border-sidebar-border shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-500">
              <div className="flex items-center gap-3 mb-10">
                <Church className="h-6 w-6 text-primary" />
                <span className="font-serif text-xl">IB Atos</span>
              </div>
              <nav className="flex-1 space-y-2 overflow-y-auto">
                {nav.flatMap(g => g.items).map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium",
                      pathname === item.to ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}
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
    <div className="relative overflow-hidden border-b border-border bg-card/30 backdrop-blur-sm pt-12 pb-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-10 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="space-y-4 max-w-3xl">
            {eyebrow && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-[10px] font-mono uppercase tracking-[0.2em] text-primary border border-primary/20">
                {eyebrow}
              </span>
            )}
            <h1 className="font-serif text-5xl lg:text-7xl leading-[0.95] tracking-tight text-foreground animate-reveal">
              {title}
            </h1>
            {description && (
              <p className="text-lg text-muted-foreground leading-relaxed animate-reveal-slow">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-3 animate-reveal-slow" style={{ animationDelay: '200ms' }}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12 relative z-10">
      <div className="animate-reveal" style={{ animationDelay: '300ms' }}>
        {children}
      </div>
    </div>
  );
}
