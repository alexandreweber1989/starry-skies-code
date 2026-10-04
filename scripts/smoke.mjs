import assert from "node:assert/strict";

// Somente GET em páginas públicas; não faz login, envia formulário ou escreve no banco.
const base = new URL(process.argv[2] ?? "http://localhost:3000");
if (!["http:", "https:"].includes(base.protocol) || base.username || base.password) {
  throw new Error("Informe uma URL HTTP(S) sem credenciais.");
}
const cases = [
  ["/", 200, "Uma casa sobre a rocha"],
  ["/auth", 200, "Entrar — Igreja Batista Atos"],
  ["/boas-vindas", 200, "Que alegria ter você aqui!"],
  ["/kids/visitante", 200, "Bem-vindo ao Kids!"],
  ["/config-vercel", 200, "Integrando GitHub &amp; Vercel"],
  ["/validacao-rota-inexistente", 404, "Página não encontrada"],
];

let failures = 0;
for (const [path, expectedStatus, expectedContent] of cases) {
  try {
    const response = await fetch(new URL(path, base), {
      redirect: "manual",
      signal: AbortSignal.timeout(30_000),
    });
    assert.equal(response.status, expectedStatus, `HTTP esperado: ${expectedStatus}`);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/);
    const html = await response.text();
    assert.ok(html.includes(expectedContent), "Conteúdo esperado ausente no HTML");
    assert.ok(!html.includes("Ops! Algo deu errado"), "A página exibiu o erro global");
    console.log(`OK ${response.status} ${path}`);
  } catch (error) {
    failures++;
    console.error(`FALHOU ${path}: ${error.message}`);
  }
}
console.log("Smoke HTTP não valida hidratação, autenticação, banco, RLS ou experiência mobile.");
process.exitCode = failures ? 1 : 0;
