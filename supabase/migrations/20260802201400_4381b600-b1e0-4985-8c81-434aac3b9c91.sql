-- Permitir perfis de membros sem conta de login (cadastro feito pela secretaria)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

WITH nomes_m AS (
  SELECT ARRAY['João','Pedro','Lucas','Mateus','Tiago','Gabriel','Rafael','Daniel','Samuel','Davi','Caleb','Isaac','Josué','Elias','Marcos','Paulo','André','Felipe','Thiago','Bruno','Rodrigo','Vinícius','Eduardo','Carlos','Fernando'] AS v
), nomes_f AS (
  SELECT ARRAY['Maria','Ana','Sara','Raquel','Rebeca','Ester','Débora','Priscila','Júlia','Beatriz','Larissa','Camila','Fernanda','Patrícia','Juliana','Aline','Bruna','Carolina','Letícia','Mariana','Isabela','Renata','Vanessa','Tatiane','Simone'] AS v
), sobrenomes AS (
  SELECT ARRAY['Silva','Santos','Oliveira','Souza','Lima','Pereira','Costa','Almeida','Ferreira','Rodrigues','Martins','Barbosa','Ribeiro','Carvalho','Gomes','Araújo','Moreira','Cardoso','Teixeira','Nascimento'] AS v
), profissoes AS (
  SELECT ARRAY['Professor(a)','Enfermeiro(a)','Autônomo(a)','Comerciante','Estudante','Motorista','Analista de Sistemas','Contador(a)','Aposentado(a)','Vendedor(a)','Cozinheiro(a)','Advogado(a)','Eletricista','Designer','Recepcionista'] AS v
), bairros AS (
  SELECT ARRAY['Parque N. S. das Graças','Uvaranas','Oficinas','Boa Vista','Centro','Jardim Carvalho','Colônia Dona Luíza','Contorno','Chapada','Nova Rússia'] AS v
), base AS (
  SELECT
    g AS i,
    CASE WHEN (g % 2) = 0 THEN 'masculino' ELSE 'feminino' END AS gen,
    (current_date - ((floor(random() * 26000) + 2000)::int)) AS nasc,
    random() AS r1, random() AS r2, random() AS r3, random() AS r4, random() AS r5
  FROM generate_series(1, 200) g
)
INSERT INTO public.profiles (
  full_name, email, phone, gender, birth_date, marital_status, profession,
  neighborhood, city, state, membership_status, member_since, is_baptized, church_function
)
SELECT
  CASE WHEN b.gen = 'masculino'
       THEN (SELECT v FROM nomes_m)[1 + floor(b.r1 * 25)::int]
       ELSE (SELECT v FROM nomes_f)[1 + floor(b.r1 * 25)::int]
  END
  || ' ' || (SELECT v FROM sobrenomes)[1 + floor(b.r2 * 20)::int]
  || ' ' || (SELECT v FROM sobrenomes)[1 + floor(b.r3 * 20)::int],
  'membro' || b.i || '@exemplo.com.br',
  '(42) 9' || lpad(floor(b.r4 * 99999999)::text, 8, '0'),
  b.gen,
  b.nasc,
  CASE
    WHEN age(b.nasc) < interval '18 years' THEN 'solteiro'
    WHEN b.r5 < 0.45 THEN 'casado'
    WHEN b.r5 < 0.80 THEN 'solteiro'
    WHEN b.r5 < 0.90 THEN 'uniao_estavel'
    WHEN b.r5 < 0.96 THEN 'divorciado'
    ELSE 'viuvo'
  END,
  CASE WHEN age(b.nasc) < interval '16 years' THEN 'Estudante'
       ELSE (SELECT v FROM profissoes)[1 + floor(b.r5 * 15)::int] END,
  (SELECT v FROM bairros)[1 + floor(b.r2 * 10)::int],
  'Ponta Grossa',
  'PR',
  'ativo',
  (current_date - ((floor(b.r3 * 3800) + 30)::int)),
  (b.r4 < 0.7),
  'membro'::public.church_function
FROM base b;