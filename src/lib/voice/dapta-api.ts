/**
 * Dapta API client for creating web calls
 * Adapted for Node.js runtime (Trigger.dev)
 */

const DAPTA_API = "https://webcall-back.dapta.ai/api/create-web-call";
const LIVEKIT_HOST = "wss://retell-ai-4ihahnq7.livekit.cloud";

export interface WebCallResponse {
  call_id: string;
  call_type: string;
  agent_id: string;
  agent_version: number;
  agent_name: string;
  retell_llm_dynamic_variables: Record<string, string>;
  call_status: string;
  access_token: string;
}

/**
 * Create a web call via Dapta API
 */
export async function createWebCall(
  agentId: string,
  contactName: string
): Promise<WebCallResponse> {
  const response = await fetch(DAPTA_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Referer: "https://app.dapta.ai/",
    },
    body: JSON.stringify({
      agent_id: agentId,
      dynamic_variables: { contact_name: contactName },
      page_url: "https://app.dapta.ai/",
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "Unable to read body");
    console.error("Dapta API error details:", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
      requestBody: { agent_id: agentId, contact_name: contactName },
    });
    throw new Error(
      `Failed to create web call: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  return response.json() as Promise<WebCallResponse>;
}

/**
 * Get the LiveKit server URL
 */
export function getLiveKitUrl(): string {
  return LIVEKIT_HOST;
}
