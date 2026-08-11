import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "admin_geral"
  | "admin_ministerio"
  | "lider_mesa"
  | "membro"
  | "admin_livraria"
  | "admin_cantina"
  | "admin_kids";

export interface RoleRow {
  role: AppRole;
  ministry_id: string | null;
  mesa_id: string | null;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: RoleRow[];
  loading: boolean;
  isAdmin: boolean;
  isMinistryAdmin: (ministryId: string) => boolean;
  isMesaLeader: (mesaId: string) => boolean;
  isLivrariaAdmin: boolean;
  isCantinaAdmin: boolean;
  /** Admin geral ou admin do Ministério Infantil. */
  isKidsAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    let active = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (active) {
        setSession(data.session);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!active) return;
      setSession(s);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
        if (event !== "SIGNED_OUT") {
          qc.invalidateQueries();
        } else {
          setLoading(false);
        }
      }
    });

    void init();
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router, qc]);

  useEffect(() => {
    if (!session?.user) {
      setRoles([]);
      if (!session) setLoading(false);
      return;
    }
    let active = true;

    const loadRoles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, ministry_id, mesa_id")
        .eq("user_id", session.user.id);

      if (!active) return;
      if (error) {
        console.error("Não foi possível carregar as permissões do usuário.", error);
        setRoles([]);
      } else {
        setRoles((data ?? []) as RoleRow[]);
      }
      if (active) setLoading(false);
    };


    void loadRoles();
    window.addEventListener("focus", loadRoles);
    return () => {
      active = false;
      window.removeEventListener("focus", loadRoles);
    };
  }, [session?.user?.id]);

  const isAdmin = roles.some((r) => r.role === "admin_geral");
  const isKidsAdmin = isAdmin || roles.some((r) => r.role === "admin_kids");

  const value: AuthState = {
    user: session?.user ?? null,
    session,
    roles,
    loading,
    isAdmin,
    isMinistryAdmin: (id) => isAdmin || roles.some((r) => r.role === "admin_ministerio" && r.ministry_id === id),
    isMesaLeader: (id) => isAdmin || roles.some((r) => r.role === "lider_mesa" && r.mesa_id === id),
    isLivrariaAdmin: isAdmin || roles.some((r) => r.role === "admin_livraria"),
    isCantinaAdmin: isAdmin || roles.some((r) => r.role === "admin_cantina"),
    isKidsAdmin,
    signOut: async () => {
      await qc.cancelQueries();
      qc.clear();
      await supabase.auth.signOut();
      router.navigate({ to: "/auth", replace: true });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}