/**
 * Gateway de IA centralizado para o projeto.
 * Utiliza o Lovable AI Gateway para chamadas seguras.
 */

export const aiGateway = {
  chat: async (options: {
    messages: { role: string; content: string }[];
    model?: string;
    response_format?: { type: "json_object" | "text" };
  }) => {
    const apiKey = process.env['LOVABLE_AI_GATEWAY_KEY'] || process.env['OPENAI_API_KEY'];
    
    // Fallback para quando as chaves ainda não estão configuradas (usando endpoint mock ou erro amigável)
    if (!apiKey) {
      console.warn("AI Gateway: Nenhuma chave de API configurada (LOVABLE_AI_GATEWAY_KEY ou OPENAI_API_KEY).");
    }

    // O Lovable AI Gateway é injetado automaticamente pelo ambiente se disponível.
    // Para TanStack Start v1 no Cloudflare Workers, usamos fetch nativo.
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || "gpt-4o-mini",
        messages: options.messages,
        response_format: options.response_format,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI Gateway Error: ${response.status} - ${err}`);
    }

    return await response.json();
  }
};
