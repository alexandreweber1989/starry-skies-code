-- Inserção dos 9 ministérios da Igreja Batista Atos para que apareçam na página de Ministérios
INSERT INTO public.ministries (name, slug, description, icon, is_active, color)
VALUES 
  ('Louvor', 'louvor', 'Adoração através da música, instrumentos e artes sonoras, conduzindo a igreja à presença de Deus.', 'Music', true, '#3b82f6'),
  ('Mídia', 'midia', 'Comunicação visual, transmissões, design e redes sociais, levando a mensagem além das paredes.', 'Camera', true, '#6366f1'),
  ('Dança', 'danca', 'Expressão corporal e artes cênicas como forma de adoração e entrega ao Senhor.', 'Sparkles', true, '#ec4899'),
  ('Mulheres · Sabaoth', 'mulheres-sabaoth', 'Rede dedicada ao fortalecimento, comunhão e edificação das mulheres da nossa casa.', 'Users', true, '#f43f5e'),
  ('Homens · Zadoque', 'homens-zadoque', 'Rede focada no desenvolvimento da identidade e do propósito dos homens como sacerdotes.', 'UserSquare2', true, '#1e40af'),
  ('Jovens', 'jovens', 'Movimento de jovens apaixonados por Jesus, focados em discipulado e relevância na cultura.', 'Flame', true, '#f97316'),
  ('Adolescentes', 'adolescentes', 'Formação de identidade e base bíblica para a nova geração enfrentar os desafios da vida.', 'Compass', true, '#8b5cf6'),
  ('Kids', 'kids', 'Ministério infantil focado em ensinar o caminho do Senhor de forma lúdica, segura e amorosa.', 'Baby', true, '#eab308'),
  ('Atos de Amor', 'atos-de-amor', 'Braço social da igreja, servindo à comunidade com auxílio prático e o amor de Cristo.', 'HeartHandshake', true, '#ef4444');

-- Assegurar que os membros autenticados possam ver os ministérios
GRANT SELECT ON public.ministries TO authenticated;
GRANT SELECT ON public.ministries TO anon;
