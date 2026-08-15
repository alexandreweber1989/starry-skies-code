# Plano de Implementação: Barra de Progresso de Seção (Nossa Gênese)

Este plano descreve a adição de uma barra de progresso visual na seção "Nossa Gênese" para indicar o progresso da rolagem do usuário dentro desta seção específica de scrollytelling.

## Alterações Propostas

### UI Architect & Experiência do Usuário

- **Implementação da Barra de Progresso:** Adicionar um componente visual discreto mas funcional que reflita o `scrollYProgress` da seção `Historia`.
- **Estilo:** Uma barra vertical fina ao lado da navegação por capítulos já existente, ou integrada a ela, utilizando a cor primária do sistema.
- **Feedback Visual:** Conforme o usuário rola, a barra será preenchida, indicando quanto do conteúdo total da gênese (os 3 capítulos) já foi percorrido.

## Detalhes Técnicos

- **Componente:** `Historia` em `src/routes/index.tsx`.
- **Lógica:** Utilizar o hook `useScroll` (já presente na seção) e o valor `scrollYProgress` para controlar a escala ou altura de um elemento `motion.div`.
- **Posicionamento:** A barra será fixada (`sticky`) dentro do contêiner da seção, garantindo visibilidade durante toda a jornada pelos capítulos.
- **Responsividade:** O indicador será adaptado para mobile, possivelmente convertendo-se em uma barra horizontal sutil caso o layout vertical da timeline seja ocultado.

## Verificação

- **Manual:** Validar se o preenchimento da barra coincide com o início e o fim da seção "Nossa Gênese".
- **Visual:** Garantir que a barra não obstrua o texto ou os botões de navegação dos capítulos.
- **Performance:** Confirmar que o cálculo de progresso via Framer Motion não gera gargalos de renderização.
