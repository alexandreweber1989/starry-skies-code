import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Baby, Plus, Search, QrCode, Clock, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getChildren, saveChild } from "@/lib/kids.functions";
import { KIDS_CLASSROOM_LABEL, childDisplayName, ageInYears } from "@/lib/kids";

export function KidsCheckinDashboard() {
  const [search, setSearch] = useState("");
  const fetchChildren = useServerFn(getChildren);
  const qc = useQueryClient();

  const { data: children, isLoading } = useQuery({
    queryKey: ["kids-children-all"],
    queryFn: () => fetchChildren({}),
  });

  const filtered = children?.filter(c => 
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.nickname?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-semibold tracking-tight">Módulo Kids</h2>
          <p className="text-sm text-muted-foreground">Gestão de check-in, turmas e segurança infantil.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <QrCode className="mr-2 h-4 w-4" /> Escanear QR
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" /> Nova Criança
          </Button>
        </div>
      </div>

      <Tabs defaultValue="checkin" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="checkin">Check-in / Out</TabsTrigger>
          <TabsTrigger value="children">Crianças</TabsTrigger>
        </TabsList>

        <TabsContent value="checkin" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Check-in Rápido</CardTitle>
              <CardDescription>Busque pelo nome ou apelido da criança para realizar a entrada.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar criança..." 
                  className="pl-9 h-11"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
              ))
            ) : filtered?.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 py-12 text-center border border-dashed rounded-lg">
                <Baby className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">Nenhuma criança encontrada.</p>
              </div>
            ) : (
              filtered?.map(child => (
                <Card key={child.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Baby className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{childDisplayName(child)}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                        {KIDS_CLASSROOM_LABEL[child.classroom] || "Sem turma"} • {ageInYears(child.birth_date)} anos
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <Button size="sm" className="h-7 text-[11px] px-3">Entrada</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="children" className="mt-6">
           <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium">Nome</th>
                      <th className="text-left p-4 font-medium">Turma</th>
                      <th className="text-left p-4 font-medium">Idade</th>
                      <th className="text-left p-4 font-medium">Alergias</th>
                      <th className="text-right p-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered?.map(child => (
                      <tr key={child.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div className="font-medium">{child.full_name}</div>
                          <div className="text-xs text-muted-foreground">{child.nickname}</div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{KIDS_CLASSROOM_LABEL[child.classroom]}</Badge>
                        </td>
                        <td className="p-4">{ageInYears(child.birth_date)} anos</td>
                        <td className="p-4">
                          {child.allergies ? (
                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">Sim</Badge>
                          ) : "Não"}
                        </td>
                        <td className="p-4 text-right">
                          <Button variant="ghost" size="sm">Editar</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
