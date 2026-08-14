import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  Network,
  UtensilsCrossed,
  Church,
  Heart,
  LogOut,
  UserCircle,
  ShieldCheck,
  BookOpen,
  Coffee,
  Music,
  CalendarDays,
  Baby,
  Menu,
  Layout,
  Megaphone,
  MapPin,
  Sprout,
  Newspaper,
  FileText,
  HeartHandshake,
  Presentation,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useAuth, type AppRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { PageTransition } from "@/components/page-transition";
import { GlobalSearch } from "@/components/global-search";
import { NotificationsBell } from "@/components/notifications-bell";
import { QuickActions } from "@/components/quick-actions";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChurchLogo } from "@/components/ui/church-logo";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  requiredRoles?: AppRole[];
}

const nav: NavItem[] = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/avisos", label: "Avisos", icon: Megaphone },
  { to: "/noticias", label: "Notícias", icon: Newspaper },
  { to: "/pregacoes", label: "Pregações", icon: Presentation, requiredRoles: ["admin_geral"] },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/ministerios", label: "Ministérios", icon: Sparkles },
  { to: "/louvor", label: "Louvor", icon: Music },
  { to: "/redes", label: "Redes", icon: Network },
  { to: "/mesas", label: "Mesas", icon: UtensilsCrossed },
  { to: "/cuidado-semana", label: "Cuidado da Semana", icon: HeartHandshake, requiredRoles: ["admin_geral", "lider_mesa"] },
  { to: "/faxina", label: "Faxina", icon: Sparkles },
  { to: "/visitantes", label: "Visitantes", icon: Sparkles, requiredRoles: ["admin_geral", "pastor"] },
  { to: "/membros", label: "Membros", icon: Users, requiredRoles: ["admin_geral"] },
  { to: "/mapa", label: "Mapa", icon: MapPin, requiredRoles: ["admin_geral"] },
  { to: "/onboarding", label: "Integração", icon: Sprout, requiredRoles: ["admin_geral"] },

  { to: "/kids", label: "Kids", icon: Baby, requiredRoles: ["admin_geral", "admin_kids"] },
  { to: "/kids/relatorios", label: "Relatórios Kids", icon: FileText, requiredRoles: ["admin_geral", "admin_kids"] },
  { to: "/igrejas", label: "Ações Sociais", icon: Heart, requiredRoles: ["admin_geral"] },
  { to: "/livraria", label: "Livraria", icon: BookOpen, requiredRoles: ["admin_geral", "admin_livraria"] },
  { to: "/cantina", label: "Cantina", icon: Coffee, requiredRoles: ["admin_geral", "admin_cantina"] },
  { to: "/midia", label: "Mídia", icon: Layout, requiredRoles: ["admin_geral"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, roles, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredNav = nav.filter((item) => {
    if (isAdmin) return true;
    if (!item.requiredRoles) return true;
    return roles.some((r) => item.requiredRoles?.includes(r.role));
  });

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground lg:border-r border-sidebar-border shadow-2xl">
      <div className="px-6 py-8 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <ChurchLogo className="h-10 w-10 bg-sidebar-primary/20 rounded-sm p-1.5 text-sidebar-primary" />
          <div>
            <div className="font-serif text-lg leading-none">Igreja Batista</div>
            <div className="font-mono text-xs uppercase tracking-widest text-sidebar-primary mt-1">
              Atos
            </div>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-border/50">
        {filteredNav.map((item) => {
          const active = pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-all duration-200 ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:translate-x-1"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1 bg-sidebar/50 backdrop-blur-sm">
        <Link
          to="/perfil"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground group"
        >
          <UserCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">{user?.email}</div>
            {isAdmin && (
              <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-sidebar-primary mt-0.5 font-bold">
                <ShieldCheck className="h-3 w-3" /> Admin geral
              </div>
            )}
          </div>
        </Link>
        <button
          onClick={() => {
            setMobileMenuOpen(false);
            signOut();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground hover:text-destructive transition-colors group"
        >
          <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:flex flex-col border-r border-sidebar-border sticky top-0 h-screen overflow-hidden">
          {sidebarContent}
        </aside>

        <main className="min-w-0 flex flex-col">
          <header className="sticky top-0 z-30 flex h-14 sm:h-16 items-center justify-between border-b border-border/50 bg-background/80 px-4 backdrop-blur-xl lg:px-10 transition-all duration-300 shadow-sm">
            <div className="flex items-center gap-2 lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 bg-sidebar border-r-0">
                  {sidebarContent}
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-2">
                <ChurchLogo className="h-5 w-5 text-primary" />
                <span className="font-serif font-bold text-sm tracking-tight">IB Atos</span>
              </div>
            </div>

            <div className="hidden lg:block flex-1 max-w-xl">
              <GlobalSearch />
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
              <div className="lg:hidden">
                <GlobalSearch />
              </div>
              <NotificationsBell />
              <div className="hidden sm:block h-6 w-px bg-border mx-1" />
              <div className="hidden sm:flex items-center gap-2">
                 <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
                   {user?.email?.split('@')[0]}
                 </span>
              </div>
            </div>
          </header>
          
          <div className="flex-1 min-h-0">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
      <QuickActions />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-b border-border/40 bg-card/40 backdrop-blur-xl relative overflow-hidden group ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 lg:py-20 flex flex-col md:flex-row md:items-end md:justify-between gap-6 sm:gap-8 relative z-10">
        <div className="space-y-4">
          {eyebrow && (
            <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-primary font-bold">
              {eyebrow}
            </div>
          )}
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-6xl leading-tight text-foreground animate-in fade-in slide-in-from-left-4 duration-700">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-base lg:text-lg text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-left-6 duration-1000">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export function PageBody({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12 animate-in fade-in duration-1000">
      {children}
    </div>
  );
}
