import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Não carrega os plugins de deploy nem as credenciais do Vite nos testes unitários.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
  },
});
