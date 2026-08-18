-- Correção de segurança em mesa_addresses:
--  (1) SELECT estava aberto a qualquer autenticado (USING true), expondo todos os
--      endereços residenciais das mesas — agora respeita a visibilidade da mesa.
--  (2) A política de gestão usava has_role(..., 'admin'), mas 'admin' NÃO existe no
--      enum app_role — o cast estourava em runtime e impedia admins/líderes de
--      criar/editar/excluir endereços. Trocado por 'admin_geral'.

DROP POLICY IF EXISTS "Qualquer membro autenticado pode ver endereços" ON public.mesa_addresses;
DROP POLICY IF EXISTS "Admins e líderes podem gerenciar endereços" ON public.mesa_addresses;

-- Ver: quem já pode ver a mesa (admin, membro da mesa ou membro da rede da mesa).
CREATE POLICY "mesa_addresses_select" ON public.mesa_addresses
  FOR SELECT TO authenticated
  USING (public.can_view_mesa(mesa_id, auth.uid()));

-- Gerenciar: admin geral ou a liderança daquela mesa.
CREATE POLICY "mesa_addresses_manage" ON public.mesa_addresses
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin_geral')
    OR EXISTS (
      SELECT 1 FROM public.mesa_members mm
      WHERE mm.mesa_id = mesa_addresses.mesa_id
        AND mm.user_id = auth.uid()
        AND mm.role IN ('lider', 'apascentador', 'pastor')
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin_geral')
    OR EXISTS (
      SELECT 1 FROM public.mesa_members mm
      WHERE mm.mesa_id = mesa_addresses.mesa_id
        AND mm.user_id = auth.uid()
        AND mm.role IN ('lider', 'apascentador', 'pastor')
    )
  );
