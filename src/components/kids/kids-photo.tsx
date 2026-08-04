import { Baby, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKidsPhotoUrl } from "@/lib/kids-photos";

interface KidsPhotoProps {
  value?: string | null;
  alt: string;
  variant?: "crianca" | "responsavel";
  className?: string;
}

/** Exibe uma foto do módulo Kids resolvendo a URL assinada do bucket privado. */
export function KidsPhoto({ value, alt, variant = "crianca", className }: KidsPhotoProps) {
  const { data: url } = useKidsPhotoUrl(value);
  const Icon = variant === "crianca" ? Baby : User;

  return (
    <div className={cn("overflow-hidden bg-muted border border-border", className)}>
      {url ? (
        <img src={url} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full grid place-items-center text-muted-foreground">
          <Icon className="h-1/2 w-1/2 opacity-30" />
        </div>
      )}
    </div>
  );
}
