import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MapPin, Loader2, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MapPicker = lazy(() => import("./map-picker").then(m => ({ default: m.MapPicker })));

interface Suggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  raw?: any;

}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: {
    street: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    full: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

export function AddressAutocomplete({ value, onChange, onAddressSelect, placeholder, className }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Usando API do Google Maps via proxy ou diretamente se a chave for pública (configurada no index.html)
      // Aqui usamos a biblioteca nativa do browser se disponível, ou um fallback
      if (typeof window !== "undefined" && (window as any).google) {
        const service = new (window as any).google.maps.places.AutocompleteService();
        service.getPlacePredictions(
          { input, componentRestrictions: { country: "br" }, types: ["address"] },
          (predictions: any, status: any) => {
            if (status === "OK" && predictions) {
              setSuggestions(predictions);
              setOpen(true);
            } else {
              setSuggestions([]);
            }
            setLoading(false);
          }
        );
      } else {
        // Fallback robusto usando OpenStreetMap Nominatim se Google não carregar
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=br&q=${encodeURIComponent(input)}`);
          const data = await res.json();
          const mapped: Suggestion[] = data.map((item: any) => ({
            description: item.display_name,
            place_id: item.place_id.toString(),
            structured_formatting: {
              main_text: item.address.road || item.display_name.split(",")[0],
              secondary_text: item.display_name.split(",").slice(1).join(",").trim(),
            },
            raw: item
          }));
          setSuggestions(mapped);
          setOpen(true);
        } catch (e) {
          console.error("Maps API and fallback failed", e);
        }
        setLoading(false);
      }

    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setLoading(false);
    }
  };

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.structured_formatting.main_text);
    setOpen(false);
    
    if (onAddressSelect) {
      if ((window as any).google) {
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ placeId: suggestion.place_id }, (results: any, status: any) => {
          if (status === "OK" && results[0]) {
            const res = results[0];
            const components = res.address_components;
            
            const getComp = (type: string) => 
              components.find((c: any) => c.types.includes(type))?.long_name;

            onAddressSelect({
              street: getComp("route") || suggestion.structured_formatting.main_text,
              neighborhood: getComp("sublocality_level_1") || getComp("neighborhood"),
              city: getComp("administrative_area_level_2") || getComp("locality"),
              state: getComp("administrative_area_level_1"),
              full: res.formatted_address
            });
          }
        });
      } else if (suggestion.raw) {
        // Mapeamento para o fallback OpenStreetMap
        const addr = suggestion.raw.address;
        onAddressSelect({
          street: addr.road || suggestion.structured_formatting.main_text,
          neighborhood: addr.suburb || addr.neighbourhood || addr.city_district,
          city: addr.city || addr.town || addr.village,
          state: addr.state,
          full: suggestion.raw.display_name
        });
      }
    }

  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            placeholder={placeholder}
            className={cn("pr-8", className)}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <MapPin className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          size="icon" 
          className="shrink-0"
          onClick={() => setMapOpen(true)}
          title="Selecionar no mapa"
        >
          <MapIcon className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Selecionar local no mapa</DialogTitle>
          </DialogHeader>
          <Suspense fallback={<div className="h-[500px] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <MapPicker 
              onCancel={() => setMapOpen(false)}
              onSelect={(addr) => {
                onAddressSelect?.(addr);
                onChange(addr.street);
                setMapOpen(false);
              }}
            />
          </Suspense>
        </DialogContent>
      </Dialog>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-sm shadow-md max-h-60 overflow-y-auto overflow-x-hidden py-1">
          {suggestions.map((s) => (
            <li
              key={s.place_id}
              onClick={() => handleSelect(s)}
              className="px-3 py-2 hover:bg-muted cursor-pointer text-sm flex flex-col"
            >
              <span className="font-medium text-foreground">{s.structured_formatting.main_text}</span>
              <span className="text-xs text-muted-foreground truncate">
                {s.structured_formatting.secondary_text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
