// Copia os ARQUIVOS do Storage da origem para o destino (os buckets e as
// policies já foram pelo migrar.sh). Guia: docs/MIGRACAO-SUPABASE.md
//
// As chaves vêm SEMPRE de variáveis de ambiente — nunca as grave em arquivo:
//   ORIG_SUPABASE_URL      https://zrdzocdadiucrhvwvxhq.supabase.co
//   ORIG_SERVICE_ROLE_KEY  service_role da origem (Settings → API)
//   DEST_SUPABASE_URL      https://DEST_REF.supabase.co
//   DEST_SERVICE_ROLE_KEY  service_role do destino
//
// Uso (na raiz do repo):  node scripts/migracao-supabase/copiar-storage.mjs
// Pode rodar de novo sem medo: cada arquivo é regravado (upsert).

import { createClient } from "@supabase/supabase-js";

const env = (nome) => {
  const valor = process.env[nome];
  if (!valor) {
    console.error(`ERRO: defina a variável ${nome}.`);
    process.exit(1);
  }
  return valor;
};

const opcoes = { auth: { persistSession: false, autoRefreshToken: false } };
const origem = createClient(env("ORIG_SUPABASE_URL"), env("ORIG_SERVICE_ROLE_KEY"), opcoes);
const destino = createClient(env("DEST_SUPABASE_URL"), env("DEST_SERVICE_ROLE_KEY"), opcoes);

const PAGINA = 1000;

// Lista todos os arquivos de um bucket, descendo nas pastas.
async function listarArquivos(bucket, prefixo = "") {
  const arquivos = [];
  for (let offset = 0; ; offset += PAGINA) {
    const { data, error } = await origem.storage
      .from(bucket)
      .list(prefixo, { limit: PAGINA, offset, sortBy: { column: "name", order: "asc" } });
    if (error) throw new Error(`listar ${bucket}/${prefixo}: ${error.message}`);
    for (const item of data) {
      const caminho = prefixo ? `${prefixo}/${item.name}` : item.name;
      // Pasta não tem id; arquivo tem.
      if (item.id === null) arquivos.push(...(await listarArquivos(bucket, caminho)));
      else arquivos.push({ caminho, tipo: item.metadata?.mimetype });
    }
    if (data.length < PAGINA) return arquivos;
  }
}

async function garantirBucket(bucket) {
  const { data } = await destino.storage.getBucket(bucket.id);
  if (data) return;
  const { error } = await destino.storage.createBucket(bucket.id, {
    public: bucket.public,
    fileSizeLimit: bucket.file_size_limit ?? undefined,
    allowedMimeTypes: bucket.allowed_mime_types ?? undefined,
  });
  if (error) throw new Error(`criar bucket ${bucket.id} no destino: ${error.message}`);
  console.log(`  bucket ${bucket.id} criado no destino (public=${bucket.public})`);
}

const { data: buckets, error: erroBuckets } = await origem.storage.listBuckets();
if (erroBuckets) {
  console.error(`ERRO ao listar buckets da origem: ${erroBuckets.message}`);
  process.exit(1);
}

let copiados = 0;
const falhas = [];

for (const bucket of buckets) {
  await garantirBucket(bucket);
  const arquivos = await listarArquivos(bucket.id);
  console.log(`==> ${bucket.id}: ${arquivos.length} arquivo(s)`);

  for (const { caminho, tipo } of arquivos) {
    const { data: blob, error: erroDown } = await origem.storage.from(bucket.id).download(caminho);
    if (erroDown) {
      falhas.push(`${bucket.id}/${caminho} (baixar: ${erroDown.message})`);
      continue;
    }
    const { error: erroUp } = await destino.storage
      .from(bucket.id)
      .upload(caminho, blob, { upsert: true, contentType: tipo || blob.type || undefined });
    if (erroUp) {
      falhas.push(`${bucket.id}/${caminho} (enviar: ${erroUp.message})`);
      continue;
    }
    copiados += 1;
  }
}

console.log(`\nCopiados: ${copiados}. Falhas: ${falhas.length}.`);
if (falhas.length) {
  for (const f of falhas) console.log(`  - ${f}`);
  process.exit(1);
}
