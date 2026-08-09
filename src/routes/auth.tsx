import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Church, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Igreja Batista Atos" },
      { name: "description", content: "Entre na plataforma da Igreja Batista Atos." },
      { property: "og:title", content: "Entrar — Igreja Batista Atos" },
      { property: "og:description", content: "Acesse a plataforma dos ministérios." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo(a)!");
    navigate({ to: "/dashboard", replace: true });
  }

  /**
   * O acesso é restrito a membros da igreja: em vez de criar a conta na hora,
   * registramos uma solicitação que fica pendente para o administrador aprovar.
   */
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("membership_requests").insert({
      full_name: fullName.trim().slice(0, 120),
      email: email.trim().toLowerCase().slice(0, 255),
      phone: phone.trim().slice(0, 30) || null,
      notes: notes.trim().slice(0, 500) || null,
      status: "pendente",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Solicitação enviada. Um administrador vai avaliar seu cadastro.");
    setFullName("");
    setPhone("");
    setNotes("");
    setMode("signin");
  }

  /**
   * Login com Google via Supabase (OAuth direto).
   *
   * Antes usávamos o broker do Lovable (`lovable.auth.signInWithOAuth`), que
   * envia o navegador para `/~oauth/initiate` — um caminho RELATIVO, servido
   * apenas pela hospedagem do Lovable. Fora dela (Vercel) ninguém atende esse
   * endereço e o app caía no 404. Ver #22.
   *
   * O Supabase devolve para `redirectTo` com o código na URL; o cliente tem
   * `detectSessionInUrl` ligado (padrão) e conclui a sessão sozinho, por isso
   * não é preciso uma rota de callback dedicada.
   */
  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (error) {
      toast.error(
        error.message.includes("provider is not enabled")
          ? "O login com Google ainda não está habilitado. Use e-mail e senha."
          : "Não foi possível entrar com o Google. Tente novamente.",
      );
    }
    // Em caso de sucesso o navegador é redirecionado para o Google.
  }

  /** Envia o e-mail de redefinição de senha. */
  async function handleRecuperarSenha() {
    if (!email) {
      return toast.error("Digite seu e-mail acima para receber o link de redefinição.");
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link de redefinição para o seu e-mail.");
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-2">
      <aside className="hidden lg:flex flex-col justify-between bg-sidebar text-sidebar-foreground p-12">
        <Link
          to="/"
          className="flex items-center gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao início
        </Link>
        <div>
          <Church className="h-8 w-8 text-sidebar-primary mb-6" />
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-sidebar-primary mb-4">
            Plataforma interna
          </div>
          <h2 className="font-serif text-4xl leading-tight">
            "Perseveravam na doutrina dos apóstolos, na comunhão, no partir do pão e nas orações."
          </h2>
          <p className="font-mono text-xs uppercase tracking-widest text-sidebar-foreground/60 mt-6">
            Atos 2:42
          </p>
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-sidebar-foreground/40">
          Igreja Batista Atos
        </div>
      </aside>

      <div className="flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary mb-2">
              Acesso à plataforma
            </div>
            <h1 className="font-serif text-3xl">Bem-vindo(a) de volta</h1>
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Solicitar cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-6">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <button
                      type="button"
                      onClick={handleRecuperarSenha}
                      disabled={loading}
                      className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" loading={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-6">
                <p className="text-xs text-muted-foreground">
                  A plataforma é exclusiva para membros da Igreja Batista Atos. Envie sua
                  solicitação: um administrador avalia e libera o acesso.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="fn">Nome completo</Label>
                  <Input
                    id="fn"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email2">E-mail</Label>
                  <Input
                    id="email2"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone2">Telefone</Label>
                  <Input id="phone2" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes2">Seu vínculo com a igreja</Label>
                  <Textarea
                    id="notes2"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Mesa, rede ou ministério que frequenta, quem pode confirmar…"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Solicitar cadastro"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            <span className="font-mono uppercase tracking-widest">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
            Continuar com Google
          </Button>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            O acesso é liberado por um administrador. O primeiro usuário a entrar se torna Admin
            geral.
          </p>
        </div>
      </div>
    </div>
  );
}
