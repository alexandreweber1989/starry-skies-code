# Plano de Implementação: Gestão de Endereços Inteligente e Eventos de Mesa

Este plano detalha a implementação de um sistema robusto de endereços para "Mesas", integrando a API do Google Maps para autocompletar, suporte a múltiplos locais por grupo, e um fluxo de agendamento de eventos com notificações push.

## Alterações Estruturais

### 1. Banco de Dados (Supabase)
- **Nova Tabela `mesa_addresses`**: Armazenará múltiplos endereços para cada Mesa.
    - Colunas: `id`, `mesa_id`, `label` (ex: Principal, Casa do Líder), `street`, `number`, `neighborhood`, `city`, `state`, `postal_code`, `complement`, `full_address`, `geo_coords` (opcional).
    - RLS: Membros da mesa podem visualizar; Admins e Líderes podem gerenciar.
- **Extensão da Tabela `events`**: Adição da coluna `mesa_address_id` para vincular um evento a um endereço específico da mesa.

### 2. Componentes de Interface
- **AddressAutocomplete**: Novo componente reutilizável que utiliza `google.maps.places.AutocompleteService` para sugerir nomes de ruas enquanto o usuário digita.
- **AddressManager**: Interface dentro do diálogo de edição da Mesa para gerenciar a lista de endereços.
- **MesaEventDialog**: Extensão do formulário de eventos para permitir a seleção de um endereço cadastrado quando o escopo for "Mesa".

## Funcionalidades e Fluxos

### Gestão de Endereços (CRUD)
- Ao criar/editar uma Mesa, o usuário poderá adicionar endereços usando o autocompletar.
- O campo de número será posicionado na mesma linha da rua para agilidade.
- Cada endereço terá um botão "Abrir no GPS" (link `https://www.google.com/maps/dir/?api=1&destination=...`).

### Agendamento de Compromissos
- Um novo botão "Agendar Reunião" será adicionado à lista de Mesas.
- Ao clicar, abrirá um diálogo para gerar o evento daquela semana.
- O usuário deve escolher um dos endereços pré-cadastrados daquela Mesa.
- O evento herdará as informações da Mesa (dia/horário) mas permitirá ajustes.

### Notificações e Experiência do Usuário
- **Push Notifications**: Integração com o sistema de lembretes existente para enviar alertas aos membros da mesa sobre o local e horário da reunião.
- **Deep Linking**: O link do endereço nos detalhes do evento abrirá diretamente no aplicativo de mapas do celular.

## Detalhes Técnicos (Para Desenvolvedores)

- **Frontend**: React 19, Framer Motion para transições de diálogo, TanStack Query para sincronização de endereços.
- **Geocoding**: Utilização da biblioteca `@googlemaps/js-api-loader` para carregar a API do Maps com segurança.
- **RLS**: Implementação de políticas que garantem que apenas líderes da respectiva mesa ou admins gerais possam alterar a lista de endereços.
- **Push**: Utilização da trigger de banco de dados e função servidora já existente (`event_reminders`) para processar os envios.

## Verificação e Qualidade

- Testar autocompletar em conexões lentas (debouncing).
- Validar se a seleção de endereço no evento atualiza corretamente o local exibido no painel.
- Verificar responsividade do formulário de endereço em dispositivos móveis.
