import { createContext, useContext } from "react";

/**
 * Nome acessível herdado do rótulo de um campo.
 *
 * Um `<Input>` se liga ao rótulo por `htmlFor`/`id`. O `Select` do Radix não:
 * a raiz não renderiza elemento no DOM, então o `id` não chega ao gatilho e o
 * leitor de tela anuncia apenas "caixa de seleção", sem dizer de quê.
 *
 * Este contexto resolve isso sem exigir mudança em nenhum ponto de uso: o
 * componente `Field` publica o id do seu rótulo, e o `SelectTrigger` o consome
 * como `aria-labelledby` — respeitando qualquer nome explícito já informado.
 */
export const FieldLabelContext = createContext<string | undefined>(undefined);

export function useFieldLabelId() {
  return useContext(FieldLabelContext);
}
