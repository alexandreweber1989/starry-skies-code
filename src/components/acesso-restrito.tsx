import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, PageBody } from "@/components/app-shell";

/**
 * Guarda de página por papel. O menu já esconde as áreas administrativas, mas
 * o endereço continuava aberto: um membro que digitasse a URL via a tela de
 * administração (vazia ou com erros do RLS). Aqui ele vê um aviso claro.
 * O RLS no banco continua sendo a proteção real dos dados.
 */
export function AcessoRestrito({
  titulo,
  permitido,
  children,
}: {
  titulo: string;
  /** Regra extra além do admin geral (ex.: admin do Kids). */
  permitido?: (auth: ReturnType<typeof useAuth>) => boolean;
  children: ReactNode;
}) {
  const auth = useAuth();
  if (auth.loading) return null;
  const liberado = auth.isAdmin || (permitido ? permitido(auth) : false);
  if (liberado) return <>{children}</>;
  return (
    <>
      <PageHeader eyebrow="Restrito" title={titulo} />
      <PageBody>
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Esta área é exclusiva da administração.
        </div>
      </PageBody>
    </>
  );
}
