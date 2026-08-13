import { useState } from "react";
import { cn } from "@/lib/utils";
import { useMesaAddresses, type MesaAddress } from "@/lib/use-mesa-addresses";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, MapPin, Navigation } from "lucide-react";
import { Card } from "@/components/ui/card";

export function AddressManager({ mesaId }: { mesaId: string }) {
  const { data: addresses, save, remove } = useMesaAddresses(mesaId);
  const [newLabel, setNewLabel] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newNumber, setNewNumber] = useState("");
  const [details, setDetails] = useState<any>(null);

  const handleAdd = () => {
    if (!newAddress || !newNumber) return;
    save.mutate({
      label: newLabel || "Principal",
      street: details?.street || newAddress,
      number: newNumber,
      neighborhood: details?.neighborhood,
      city: details?.city,
      state: details?.state,
      full_address: `${details?.full || newAddress}, ${newNumber}`,
    });
    setNewLabel("");
    setNewAddress("");
    setNewNumber("");
    setDetails(null);
  };

  const openInMaps = (addr: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Endereços da Mesa</Label>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Até 5 endereços</p>
      </div>

      <div className="grid gap-3">
        {addresses?.map((addr) => (
          <Card key={addr.id} className="p-3 bg-muted/30 border-border/40 relative group">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge className="h-4 px-1.5 text-[9px] uppercase tracking-wider">{addr.label}</Badge>
                  <span className="text-sm font-medium truncate">{addr.street}, {addr.number}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">{addr.neighborhood ? `${addr.neighborhood}, ` : ""}{addr.city}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openInMaps(addr.full_address)}>
                  <Navigation className="h-4 w-4 text-primary" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove.mutate(addr.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {(addresses?.length || 0) < 5 && (
        <div className="border border-dashed border-border p-4 rounded-sm space-y-3 bg-muted/10">
          <div className="grid grid-cols-[100px_1fr] gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Rótulo</Label>
              <Input 
                placeholder="Principal" 
                value={newLabel} 
                onChange={(e) => setNewLabel(e.target.value)} 
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase">Rua</Label>
              <AddressAutocomplete 
                value={newAddress} 
                onChange={setNewAddress} 
                onAddressSelect={setDetails}
                className="h-8 text-xs"
                placeholder="Digite o nome da rua..."
              />
            </div>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-2">
             <div className="space-y-1">
                <Label className="text-[10px] uppercase">Número</Label>
                <Input 
                  placeholder="123" 
                  value={newNumber} 
                  onChange={(e) => setNewNumber(e.target.value)} 
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full h-8" size="sm" onClick={handleAdd} disabled={!newAddress || !newNumber}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar endereço
                </Button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80", className)}>
      {children}
    </span>
  );
}
