# Plano: Atualização do Sistema Tipográfico (4 Fontes)

Implementação de um esquema tipográfico semântico com 4 fontes (Syne, Lora, DM Sans, Inter) conforme especificações de design.

## Passos

1. **Importação**: Atualizar `src/routes/__root.tsx` para incluir Google Fonts (Syne, Lora, DM Sans, Inter) com os pesos corretos.
2. **Configuração Tailwind**: Atualizar `src/styles.css` (@theme inline) para registrar as 4 famílias de fontes como variáveis do sistema.
3. **Aplicação Semântica**:
    - `h1`, `h2` -> Syne.
    - `h3`, `h4`, `h5`, `h6` -> DM Sans.
    - `p` (conteúdo editorial) -> Lora.
    - `body` (base) e elementos de sistema (botões, inputs, labels) -> Inter.
4. **Refinamento de Componentes**: Ajustar o `Landing Page` (src/routes/index.tsx) e `AppShell` para aplicar as fontes nos alvos específicos.

## Especificação de Fontes
- **Syne**: Impacto Visual.
- **Lora**: Blocos descritivos e históricos.
- **DM Sans**: Transição e UI amigável.
- **Inter**: Dados funcionais e sistema.
