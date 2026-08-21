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
    
    // Fallback: If no custom keys are provided, the platform uses the internal Lovable AI Gateway.
    if (!apiKey) {
      console.log("AI Gateway: Using internal Lovable AI Gateway.");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // If a key is present, attach it. If not, the platform injects the managed gateway key via proxy.
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
      // Handle 401 specifically to provide context about the API key
      if (response.status === 401) {
        throw new Error(`AI Gateway Auth Error: ${response.status} - Ensure the platform AI gateway is active or valid keys are set.`);
      }
      throw new Error(`AI Gateway Error: ${response.status} - ${err}`);
    }

    return await response.json();
  }
};