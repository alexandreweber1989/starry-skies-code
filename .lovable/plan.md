# Plano de Implementação: Transições Dinâmicas de Versículos

Implementarei um sistema de transições variadas para os versículos da tela de login, alternando entre diferentes efeitos visuais (Partículas, Hacker/Matrix, Cinematográfico e Slide) para manter a interface dinâmica e profissional.

## Alterações Técnicas

### Frontend (`src/components/auth/VersiculoAnimado.tsx`)

1.  **Novas Variantes de Animação**:
    *   Criar definições de animação para os 4 estilos solicitados.
    *   **Partículas**: Efeito de `scale` e `opacity` fragmentado.
    *   **Hacker/Matrix**: Reveal de caracteres com troca rápida de símbolos.
    *   **Cinematográfico**: Efeito de `zoom-in` suave com desfoque radial.
    *   **Slide**: Movimento horizontal com aceleração `expo`.

2.  **Lógica de Alternância**:
    *   Adicionar estado para controlar o tipo de transição atual.
    *   Implementar função para sortear a próxima transição a cada troca de versículo.

3.  **Refatoração do Componente**:
    *   Substituir o efeito fixo de `blur` atual por um sistema dinâmico baseado na transição sorteada.
    *   Garantir que o efeito de digitação permaneça consistente em todos os modos.

## Detalhes para o Usuário
*   Os versículos agora terão uma transição diferente a cada vez que mudarem.
*   Você verá efeitos de desaparecimento em partículas, revelação estilo "hacker", zooms suaves e slides elegantes.
*   A legibilidade e o tempo de leitura (5s) serão preservados.

## Validação
*   Verificar se cada transição termina corretamente antes da próxima começar.
*   Garantir que não haja "saltos" visuais ou travamentos nas animações do Framer Motion.
