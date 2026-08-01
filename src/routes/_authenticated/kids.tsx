import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Baby, ShieldCheck, HeartPulse } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageBody } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  KIDS_CLASSROOM_LABEL,
  ageInYears,
  childDisplayName,
  type KidsChild,
  type KidsSession,
} from "@/lib/kids";
import { ChildDialog, EditChildButton } from "@/components/kids/child-dialog";
import { SessionDialog, EditSessionButton } from "@/components/kids/session-dialog";
import { CheckinBoard } from "@/components/kids/checkin-board";
import { VisitorQueue } from "@/components/kids/visitor-queue";

export const Route = createFileRoute("/_authenticated/kids")({
  head: () => ({
    meta: [
      { title: "Kids — Ministério Infantil | IB Atos" },
      {
        name: "description",
        content:
          "Check-in e check-out seguro das crianças da Igreja Batista Atos, com código de retirada, responsáveis autorizados e alertas de saúde.",
      },
      { property: "og:title", content: "Kids — Ministério Infantil | IB Atos" },
      {
        property: "og:description",
        content: "Check-in seguro, responsáveis autorizados e alertas de saúde das crianças.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KidsPage,
});

function KidsPage() {
  const { isKidsAdmin } = useAuth();
  const [sessionId, setSessionId] = useState<string>("");

  const { data: sessions } = useQuery({
    queryKey: ["kids-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_sessions")
        .select("*")
        .order("session_date", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as KidsSession[];
    },
  });

  const { data: children } = useQuery({
    queryKey: ["kids-children"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kids_children")
        .select("*")
        .order("full_name");
      if (error) throw error;
      return data as KidsChild[];
    },
  });

  const activeSession =
    (sessions ?? []).find((s) => s.id === sessionId) ?? (sessions ?? [])[0] ?? null;
  const activeChildren = (children ?? []).filter((c) => c.is_active);

  return (
    <>
      <PageHeader
        eyebrow="Ministério infantil"
        title="Kids"
        description="Cada criança entra com etiqueta e código único, e só sai com quem os pais autorizaram. Alergias e cuidados de saúde ficam visíveis para a equipe da sala."
        actions={
          isKidsAdmin ? (
            <div className="flex gap-2">
              <SessionDialog />
              <ChildDialog />
            </div>
          ) : undefined
        }
      />
      <PageBody>
        {!isKidsAdmin ? (
          <GuardianView children={children ?? []} />
        ) : (
          <Tabs defaultValue="checkin">
            <TabsList>
              <TabsTrigger value="checkin">Check-in do culto</TabsTrigger>
              <TabsTrigger value="visitantes">Visitantes</TabsTrigger>
              <TabsTrigger value="criancas">Crianças ({activeChildren.length})</TabsTrigger>
              <TabsTrigger value="sessoes">Sessões</TabsTrigger>
            </TabsList>


            <TabsContent value="checkin" className="mt-6 space-y-6">
              {!activeSession ? (
                <EmptyState
                  icon={ShieldCheck}
                  title="Nenhuma sessão criada"
                  text="Crie a sessão do culto para começar os check-ins do dia."
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <Select value={activeSession.id} onValueChange={setSessionId}>
                      <SelectTrigger className="w-full sm:w-96">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(sessions ?? []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.title} — {new Date(`${s.session_date}T00:00:00`).toLocaleDateString("pt-BR")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <EditSessionButton session={activeSession} />
                  </div>
                  <CheckinBoard session={activeSession} children={activeChildren} />
                </>
              )}
            </TabsContent>

            <TabsContent value="visitantes" className="mt-6">
              <VisitorQueue
                session={activeSession}
                churchId={activeSession?.church_id ?? null}
              />
            </TabsContent>

            <TabsContent value="criancas" className="mt-6">

              {activeChildren.length === 0 ? (
                <EmptyState
                  icon={Baby}
                  title="Nenhuma criança cadastrada"
                  text="Cadastre as crianças com responsáveis e cuidados de saúde."
                />
              ) : (
                <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeChildren.map((child) => (
                    <li key={child.id} className="border border-border bg-card rounded-sm p-5">
                      <Baby className="h-5 w-5 text-primary" />
                      <h3 className="font-serif text-xl mt-3">{childDisplayName(child)}</h3>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                        {KIDS_CLASSROOM_LABEL[child.classroom] ?? child.classroom}
                        {ageInYears(child.birth_date) !== null
                          ? ` · ${ageInYears(child.birth_date)} anos`
                          : ""}
                      </div>
                      {child.allergies && (
                        <Badge variant="destructive" className="mt-3 gap-1">
                          <HeartPulse className="h-3 w-3" /> {child.allergies}
                        </Badge>
                      )}
                      <div className="mt-4">
                        <EditChildButton child={child} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="sessoes" className="mt-6">
              <ul className="space-y-2">
                {(sessions ?? []).map((s) => (
                  <li
                    key={s.id}
                    className="border border-border bg-card rounded-sm px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-serif text-lg">{s.title}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        {new Date(`${s.session_date}T00:00:00`).toLocaleDateString("pt-BR")}
                        {s.start_time ? ` · ${s.start_time.slice(0, 5)}` : ""}
                        {s.room ? ` · ${s.room}` : ""}
                      </div>
                    </div>
                    <EditSessionButton session={s} />
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        )}
      </PageBody>
    </>
  );
}

/** Visão dos pais: só as próprias crianças, garantida também por RLS no banco. */
function GuardianView({ children }: { children: KidsChild[] }) {
  if (children.length === 0) {
    return (
      <EmptyState
        icon={Baby}
        title="Nenhuma criança vinculada a você"
        text="Fale com a equipe do Kids para vincular seu filho ao seu cadastro."
      />
    );
  }
  return (
    <ul className="grid md:grid-cols-2 gap-4">
      {children.map((child) => (
        <li key={child.id} className="border border-border bg-card rounded-sm p-5">
          <h3 className="font-serif text-xl">{childDisplayName(child)}</h3>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
            {KIDS_CLASSROOM_LABEL[child.classroom] ?? child.classroom}
          </div>
          {child.allergies && (
            <p className="mt-3 text-sm text-muted-foreground">Alergias: {child.allergies}</p>
          )}
        </li>
      ))}
    </ul>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Baby;
  title: string;
  text: string;
}) {
  return (
    <div className="border border-dashed border-border rounded-sm p-10 text-center">
      <Icon className="h-8 w-8 text-muted-foreground mx-auto" />
      <h3 className="font-serif text-2xl mt-4">{title}</h3>
      <p className="text-muted-foreground mt-2">{text}</p>
    </div>
  );
}
