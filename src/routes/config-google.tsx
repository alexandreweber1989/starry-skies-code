import { createFileRoute } from "@tanstack/react-router";
import { 
  Settings, 
  ExternalLink, 
  Key, 
  ShieldCheck, 
  Database,
  Info,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/config-google")({
  head: () => ({
    meta: [
      { title: "Configurar Google OAuth — Igreja Batista Atos" },
      { name: "description", content: "Guia passo a passo para configurar o Google Login no Lovable Cloud." },
    ],
  }),
  component: ConfigGooglePage,
});

function ConfigGooglePage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-mono text-xs uppercase tracking-widest">
            <Settings className="h-4 w-4" /> Configuração do Sistema
          </div>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight">Configurar Login com Google</h1>
          <p className="text-muted-foreground text-lg">
            Siga este guia para ativar o acesso via Google na plataforma da sua igreja.
          </p>
        </header>

        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Como a infraestrutura é gerenciada pelo Lovable Cloud, você precisa inserir as credenciais diretamente na interface do Lovable, não no código.
          </AlertDescription>
        </Alert>

        <div className="grid gap-8">
          {/* Passo 1 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">1</div>
              <h2 className="text-2xl font-serif">Obter credenciais no Google Cloud</h2>
            </div>
            <Card className="border-border/40 bg-card/50">
              <CardContent className="pt-6 space-y-4">
                <p className="text-muted-foreground">
                  Acesse o <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4 inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-3 w-3" /></a> e crie um projeto (ou use um existente).
                </p>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                  <li>Vá em <strong>APIs e Serviços &gt; Tela de permissão OAuth</strong> e configure como "Externo".</li>
                  <li>Vá em <strong>Credenciais &gt; Criar Credenciais &gt; ID do cliente OAuth</strong>.</li>
                  <li>Tipo de aplicativo: <strong>Aplicativo da Web</strong>.</li>
                  <li>Origens JavaScript autorizadas: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">https://zrdzocdadiucrhvwvxhq.supabase.co</code></li>
                  <li>URIs de redirecionamento autorizados: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">https://zrdzocdadiucrhvwvxhq.supabase.co/auth/v1/callback</code></li>
                </ul>
                <div className="p-3 bg-muted/50 rounded-lg text-xs font-mono break-all">
                  DICA: Copie o <strong>Client ID</strong> e o <strong>Client Secret</strong> que o Google vai gerar.
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Passo 2 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">2</div>
              <h2 className="text-2xl font-serif">Inserir no Lovable Cloud</h2>
            </div>
            <Card className="border-border/40 bg-card/50">
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 text-primary"><Database className="h-5 w-5" /></div>
                    <div>
                      <h3 className="font-medium">Abra o Painel de Backend</h3>
                      <p className="text-sm text-muted-foreground">No editor do Lovable, clique no botão "View Backend" (ou ícone de banco de dados) na barra lateral.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 text-primary"><ShieldCheck className="h-5 w-5" /></div>
                    <div>
                      <h3 className="font-medium">Vá em Configurações de Auth</h3>
                      <p className="text-sm text-muted-foreground">Procure por "Authentication" ou "Auth Settings" e localize a seção de "Providers".</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-5 w-5 text-primary"><Key className="h-5 w-5" /></div>
                    <div>
                      <h3 className="font-medium">Configure o Google</h3>
                      <p className="text-sm text-muted-foreground">Ative o Google e cole os valores:</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary" /> <strong>Google Client ID</strong></li>
                        <li className="flex items-center gap-2"><ChevronRight className="h-3 w-3 text-primary" /> <strong>Google Client Secret</strong></li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="default" className="w-full md:w-auto" asChild>
                    <a href="https://lovable.dev/projects/6d1db2ee-a5ae-4cba-ae0c-cded8da0180f" target="_blank" rel="noreferrer">
                      Ir para o Painel do Projeto <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Passo 3 */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">3</div>
              <h2 className="text-2xl font-serif">Salvar e Testar</h2>
            </div>
            <p className="text-muted-foreground ml-11">
              Após salvar no painel do Lovable, o login com Google começará a funcionar instantaneamente na sua plataforma.
            </p>
          </section>
        </div>

        <footer className="pt-12 border-t border-border/40 text-center">
          <Button variant="ghost" asChild>
            <a href="/auth">Voltar para a página de login</a>
          </Button>
        </footer>
      </div>
    </div>
  );
}
