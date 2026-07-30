-- Helpers
CREATE OR REPLACE FUNCTION public.is_livraria_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin_geral','admin_livraria'));
$$;

CREATE OR REPLACE FUNCTION public.is_cantina_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin_geral','admin_cantina'));
$$;

CREATE OR REPLACE FUNCTION public.gen_pickup_code(_prefix text)
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT _prefix || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 5));
$$;

-- ============ LIVRARIA ============
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'outros',
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  track_stock boolean NOT NULL DEFAULT true,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_select_all ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY products_manage_admin ON public.products FOR ALL TO authenticated
  USING (public.is_livraria_admin(auth.uid())) WITH CHECK (public.is_livraria_admin(auth.uid()));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pickup_code text NOT NULL UNIQUE DEFAULT public.gen_pickup_code('LIV'),
  status text NOT NULL DEFAULT 'aguardando_pagamento'
    CHECK (status IN ('aguardando_pagamento','pago','entregue','cancelado')),
  total_cents integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  payment_proof_url text,
  notes text,
  confirmed_by uuid,
  confirmed_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_select_own_or_admin ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_livraria_admin(auth.uid()));
CREATE POLICY orders_insert_own ON public.orders FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY orders_update_own_or_admin ON public.orders FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_livraria_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_livraria_admin(auth.uid()));
CREATE POLICY orders_delete_admin ON public.orders FOR DELETE TO authenticated USING (public.is_livraria_admin(auth.uid()));
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX orders_user_id_idx ON public.orders(user_id);
CREATE INDEX orders_status_idx ON public.orders(status);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price_cents integer NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY order_items_select ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.is_livraria_admin(auth.uid()))));
CREATE POLICY order_items_insert ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY order_items_manage_admin ON public.order_items FOR ALL TO authenticated
  USING (public.is_livraria_admin(auth.uid())) WITH CHECK (public.is_livraria_admin(auth.uid()));
CREATE INDEX order_items_order_id_idx ON public.order_items(order_id);

-- ============ CANTINA ============
CREATE TABLE public.canteen_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'outros',
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canteen_items TO authenticated;
GRANT ALL ON public.canteen_items TO service_role;
ALTER TABLE public.canteen_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY canteen_items_select_all ON public.canteen_items FOR SELECT TO authenticated USING (true);
CREATE POLICY canteen_items_manage_admin ON public.canteen_items FOR ALL TO authenticated
  USING (public.is_cantina_admin(auth.uid())) WITH CHECK (public.is_cantina_admin(auth.uid()));
CREATE TRIGGER canteen_items_updated_at BEFORE UPDATE ON public.canteen_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.canteen_menus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  service_date date NOT NULL,
  notes text,
  art_url text,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('rascunho','aberto','encerrado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canteen_menus TO authenticated;
GRANT ALL ON public.canteen_menus TO service_role;
ALTER TABLE public.canteen_menus ENABLE ROW LEVEL SECURITY;
CREATE POLICY canteen_menus_select ON public.canteen_menus FOR SELECT TO authenticated
  USING (status <> 'rascunho' OR public.is_cantina_admin(auth.uid()));
CREATE POLICY canteen_menus_manage_admin ON public.canteen_menus FOR ALL TO authenticated
  USING (public.is_cantina_admin(auth.uid())) WITH CHECK (public.is_cantina_admin(auth.uid()));
CREATE TRIGGER canteen_menus_updated_at BEFORE UPDATE ON public.canteen_menus FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.canteen_menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL REFERENCES public.canteen_menus(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.canteen_items(id) ON DELETE CASCADE,
  price_cents integer NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (menu_id, item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canteen_menu_items TO authenticated;
GRANT ALL ON public.canteen_menu_items TO service_role;
ALTER TABLE public.canteen_menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY canteen_menu_items_select ON public.canteen_menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY canteen_menu_items_manage_admin ON public.canteen_menu_items FOR ALL TO authenticated
  USING (public.is_cantina_admin(auth.uid())) WITH CHECK (public.is_cantina_admin(auth.uid()));

CREATE TABLE public.canteen_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid NOT NULL REFERENCES public.canteen_menus(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  pickup_code text NOT NULL UNIQUE DEFAULT public.gen_pickup_code('CAN'),
  status text NOT NULL DEFAULT 'reservado' CHECK (status IN ('reservado','retirado','cancelado')),
  total_cents integer NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  notes text,
  picked_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canteen_reservations TO authenticated;
GRANT ALL ON public.canteen_reservations TO service_role;
ALTER TABLE public.canteen_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY canteen_res_select ON public.canteen_reservations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_cantina_admin(auth.uid()));
CREATE POLICY canteen_res_insert_own ON public.canteen_reservations FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY canteen_res_update ON public.canteen_reservations FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_cantina_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_cantina_admin(auth.uid()));
CREATE POLICY canteen_res_delete_admin ON public.canteen_reservations FOR DELETE TO authenticated USING (public.is_cantina_admin(auth.uid()));
CREATE TRIGGER canteen_res_updated_at BEFORE UPDATE ON public.canteen_reservations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX canteen_res_menu_idx ON public.canteen_reservations(menu_id);
CREATE INDEX canteen_res_user_idx ON public.canteen_reservations(user_id);

CREATE TABLE public.canteen_reservation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.canteen_reservations(id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.canteen_items(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  unit_price_cents integer NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.canteen_reservation_items TO authenticated;
GRANT ALL ON public.canteen_reservation_items TO service_role;
ALTER TABLE public.canteen_reservation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY canteen_res_items_select ON public.canteen_reservation_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.canteen_reservations r WHERE r.id = reservation_id AND (r.user_id = auth.uid() OR public.is_cantina_admin(auth.uid()))));
CREATE POLICY canteen_res_items_insert ON public.canteen_reservation_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.canteen_reservations r WHERE r.id = reservation_id AND r.user_id = auth.uid()));
CREATE POLICY canteen_res_items_manage_admin ON public.canteen_reservation_items FOR ALL TO authenticated
  USING (public.is_cantina_admin(auth.uid())) WITH CHECK (public.is_cantina_admin(auth.uid()));
CREATE INDEX canteen_res_items_res_idx ON public.canteen_reservation_items(reservation_id);

-- ============ CONFIG (chave PIX) ============
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY app_settings_select ON public.app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY app_settings_manage_admin ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin_geral')) WITH CHECK (public.has_role(auth.uid(),'admin_geral'));
CREATE TRIGGER app_settings_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (key, value) VALUES
  ('pix_key', '00.000.000/0001-00'),
  ('pix_name', 'Igreja Batista Atos'),
  ('pix_city', 'Sao Paulo');

-- Seed de exemplo
INSERT INTO public.products (name, description, category, price_cents, stock, image_url) VALUES
  ('Bíblia de Estudo NAA', 'Capa dura, letra grande, com notas de estudo.', 'livros', 12900, 8, null),
  ('Livro — Vida no Espírito', 'Leitura devocional para o dia a dia.', 'livros', 4900, 15, null),
  ('Camiseta Atos — Preta', 'Algodão premium, estampa serigrafia. Tamanhos P ao GG.', 'vestuario', 6900, 20, null),
  ('Camiseta Atos — Branca', 'Algodão premium, estampa serigrafia. Tamanhos P ao GG.', 'vestuario', 6900, 18, null),
  ('Garrafa Térmica Atos', 'Inox 500ml, mantém a temperatura por 12h.', 'acessorios', 8900, 12, null),
  ('Caderno de Anotações', 'Capa dura, 200 páginas pautadas.', 'acessorios', 3500, 25, null);

INSERT INTO public.canteen_items (name, description, category, price_cents) VALUES
  ('Café Coado', 'Copo 200ml', 'bebidas', 500),
  ('Cappuccino', 'Copo 200ml com canela', 'bebidas', 900),
  ('Água Mineral', 'Garrafa 500ml', 'bebidas', 300),
  ('Refrigerante Lata', '350ml gelado', 'bebidas', 600),
  ('Brigadeiro', 'Unidade', 'doces', 400),
  ('Bolo de Cenoura', 'Fatia com cobertura de chocolate', 'doces', 800),
  ('Coxinha', 'Frita na hora', 'salgados', 900),
  ('Pão de Queijo', 'Porção com 3 unidades', 'salgados', 700);