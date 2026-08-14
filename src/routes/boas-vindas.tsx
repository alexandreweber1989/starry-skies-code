import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Heart, MessageCircle, Gift, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { registerVisitor } from '@/lib/visitors.functions';
import { useServerFn } from '@tanstack/react-start';
import { ChurchLogo } from '@/components/ui/church-logo';

export const Route = createFileRoute('/boas-vindas')({
  component: WelcomePage,
});

function WelcomePage() {
  const [step, setStep] = useState<'intro' | 'form' | 'success'>('intro');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useServerFn(registerVisitor);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 3 || whatsapp.length < 10) {
      toast.error("Por favor, preencha seu nome e WhatsApp corretamente.");
      return;
    }
    setLoading(true);
    try {
      await register({ data: { full_name: name, whatsapp } });
      setStep('success');
      toast.success("Seja bem-vindo(a) à IBA!");
    } catch (err: any) {
      console.error("Registration error:", err);
      toast.error(err?.message || "Erro ao registrar sua visita. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 selection:bg-primary selection:text-primary-foreground">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ChurchLogo className="h-16 w-16 bg-primary text-primary-foreground rounded-2xl p-3 shadow-xl shadow-primary/20" />
          </motion.div>
          
          <AnimatePresence mode="wait">
            {step === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <h1 className="font-serif text-4xl font-bold tracking-tight">
                  Que alegria ter você aqui!
                </h1>
                <p className="text-muted-foreground text-lg">
                  Você não é apenas um visitante, você é um convidado de Deus.
                </p>
                <Button 
                  size="lg" 
                  className="w-full h-14 rounded-full text-lg font-medium group"
                  onClick={() => setStep('form')}
                >
                  Diga um oi para nós
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            )}

            {step === 'form' && (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full space-y-6 bg-card border border-border/50 p-8 rounded-3xl shadow-lg"
              >
                <div className="space-y-2">
                  <h2 className="font-serif text-2xl font-bold">Queremos te conhecer</h2>
                  <p className="text-sm text-muted-foreground">Preencha rapidinho para ganharmos um contato seu.</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nome Completo</label>
                    <Input 
                      placeholder="Ex: Maria Silva" 
                      className="h-12 bg-muted/30"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">WhatsApp</label>
                    <Input 
                      placeholder="(42) 99999-9999" 
                      className="h-12 bg-muted/30"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 rounded-full text-lg"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Tudo pronto!"}
                </Button>
              </motion.form>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Check className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="font-serif text-3xl font-bold">Seja muito bem-vindo!</h2>
                  <p className="text-muted-foreground">
                    Acabamos de enviar um presente especial para o seu WhatsApp.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 pt-4">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10 text-left">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Gift className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Presente Liberado</h4>
                      <p className="text-xs text-muted-foreground">Pegue seu devocional digital no WhatsApp.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-foreground/5 border border-foreground/10 text-left">
                    <div className="h-10 w-10 rounded-full bg-foreground flex items-center justify-center shrink-0">
                      <MessageCircle className="h-5 w-5 text-background" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Quer conversar?</h4>
                      <p className="text-xs text-muted-foreground">Nossa equipe de recepção falará com você em breve.</p>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full h-12 rounded-full"
                  onClick={() => window.location.href = '/'}
                >
                  Conhecer mais a IBA
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="pt-12 text-center text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/60">
          Igreja Batista Atos · PG
        </footer>
      </div>
    </div>
  );
}
