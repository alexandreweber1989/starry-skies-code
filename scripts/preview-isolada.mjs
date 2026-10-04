import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Valores deliberadamente inválidos: nunca usar credenciais reais nesta prévia.
// O ambiente do processo tem precedência sobre os arquivos .env do Vite.
const env = { ...process.env };
for (const prefix of ["", "VITE_"]) {
  env[`${prefix}SUPABASE_URL`] = "https://preview.supabase.invalid";
  env[`${prefix}SUPABASE_PROJECT_ID`] = "preview-isolada";
  env[`${prefix}SUPABASE_PUBLISHABLE_KEY`] = "sb_publishable_preview_sem_acesso";
  env[`${prefix}SUPABASE_ANON_KEY`] = "sb_publishable_preview_sem_acesso";
}
env.SUPABASE_SERVICE_ROLE_KEY = "preview-sem-acesso-administrativo";
delete env.VITE_SUPABASE_SERVICE_ROLE_KEY;
env.VITE_ISOLATED_PREVIEW = "true";

console.log("Prévia visual isolada: login, cadastros e dados do Supabase indisponíveis.");
const child = spawn(
  process.execPath,
  [
    fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)),
    "dev",
    "--host",
    "0.0.0.0",
    ...process.argv.slice(2),
  ],
  { env, stdio: "inherit" },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
});
