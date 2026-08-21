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
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // If a key is present, attach it. 
    // If not, the platform's Lovable AI Gateway proxy will handle it if the Authorization header is omitted.
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: options.model || "gpt-4o-mini",
        messages: options.messages,
        response_format: options.response_format,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      
      // If we get a 401 and we had a key, it's an invalid key.
      // If we get a 401 and we HAD NO key, then the Lovable AI Gateway itself is returning 401.
      if (response.status === 401) {
        if (apiKey) {
          throw new Error(`AI Gateway Error: 401 - Chave de API inválida ou expirada.`);
        } else {
          // This usually means the internal gateway is not configured for this specific model or project yet.
          // Or the platform expects a different endpoint for the managed gateway.
          throw new Error(`AI Gateway Error: 401 - O Gateway de IA gerenciado não pôde ser autenticado. Por favor, configure uma chave OpenAI em Configurações > Secrets.`);
        }
      }
      
      throw new Error(`AI Gateway Error: ${response.status} - ${err}`);
    }

    return await response.json();
  }
};