import { useEffect, useState } from "react";

export type Estado = {
  id: number;
  sigla: string;
  nome: string;
};

export type Cidade = {
  id: number;
  nome: string;
};

export type Bairro = {
  id: number;
  nome: string;
};

export function useLocalidades() {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [loadingBairros, setLoadingBairros] = useState(false);

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((res) => res.json())
      .then((data) => setEstados(data))
      .catch((err) => console.error("Erro ao buscar estados:", err));
  }, []);

  const buscarCidades = async (uf: string) => {
    if (!uf) {
      setCidades([]);
      return;
    }
    setLoadingCidades(true);
    try {
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
      const data = await res.json();
      setCidades(data);
    } catch (err) {
      console.error("Erro ao buscar cidades:", err);
    } finally {
      setLoadingCidades(false);
    }
  };

  const buscarBairros = async (cidadeId: number) => {
    if (!cidadeId) {
      setBairros([]);
      return;
    }
    setLoadingBairros(true);
    try {
      // Nota: A API do IBGE nem sempre tem bairros para todas as cidades.
      // Usamos o endpoint de distritos ou subdistritos como alternativa se necessário,
      // mas o ideal para "bairros" em produção seria uma base de CEPs ou similar.
      // Aqui tentaremos distritos que costumam representar bairros/regiões.
      const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${cidadeId}/distritos?orderBy=nome`);
      const data = await res.json();
      setBairros(data);
    } catch (err) {
      console.error("Erro ao buscar bairros:", err);
    } finally {
      setLoadingBairros(false);
    }
  };

  return { 
    estados, 
    cidades, 
    bairros, 
    buscarCidades, 
    buscarBairros,
    loadingCidades,
    loadingBairros
  };
}
