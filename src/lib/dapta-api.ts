// Dapta API client for fetching agent configuration

const DAPTA_API_BASE = "https://api.dapta.ai/api/devops-dapta-tech-169-938-7";

export interface DaptaAgentResponse {
  id: string;
  name: string;
  instructions: string;
  llm_model?: string;
  model?: string;
  voice_id?: string;
  voice?: string;
  voice_model?: string;
  voice_speed?: number;
  voice_language?: string;
  variables?: Array<{ key: string; value: string }>;
  workspace_id?: string;
  organization_id?: string;
  retell_agent_id?: string;
  llm_id?: string;
  // Alternative field names from API
  voice_retell_agent_id?: string;
  voice_llm_id?: string;
}

export interface DaptaLLMResponse {
  llm_id: string;
  model: string;
  general_prompt?: string;
}

export interface DaptaRetellAgentResponse {
  agent_id: string;
  llm_id: string;
  voice_id: string;
  agent_name?: string;
}

export async function fetchDaptaAgent(
  daptaAgentId: string,
  apiKey?: string
): Promise<DaptaAgentResponse | null> {
  try {
    const key = apiKey ?? process.env.DAPTA_API_KEY;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (key) {
      headers["x-api-key"] = key;
    }

    const response = await fetch(`${DAPTA_API_BASE}/getagent/${daptaAgentId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.error(`Failed to fetch Dapta agent: ${response.status}`);
      return null;
    }

    const data = await response.json();
    // API returns { agent: {...} } wrapper
    return data.agent ?? data;
  } catch (error) {
    console.error("Error fetching Dapta agent:", error);
    return null;
  }
}

export async function fetchDaptaLLM(
  llmId: string
): Promise<DaptaLLMResponse | null> {
  try {
    const response = await fetch(
      `${DAPTA_API_BASE}/get_voice_llm_by_llm_id?llm_id=${llmId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch Dapta LLM: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching Dapta LLM:", error);
    return null;
  }
}

export async function fetchRetellAgent(
  retellAgentId: string
): Promise<DaptaRetellAgentResponse | null> {
  try {
    const response = await fetch(
      `${DAPTA_API_BASE}/get_retell_agent?agent_id=${retellAgentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch Retell agent: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching Retell agent:", error);
    return null;
  }
}

// Deduplicate variables by key (API can return duplicates)
export function deduplicateVariables(
  variables: Array<{ key: string; value: string }> | undefined
): Array<{ key: string; value: string }> {
  if (!variables) return [];

  const seen = new Set<string>();
  return variables.filter((v) => {
    if (seen.has(v.key)) return false;
    seen.add(v.key);
    return true;
  });
}

export interface UpdateAgentResult {
  success: boolean;
  message: string;
  agentName?: string;
}

export async function fetchDaptaAgentRaw(
  daptaAgentId: string,
  apiKey?: string
): Promise<Record<string, unknown> | null> {
  try {
    const key = apiKey ?? process.env.DAPTA_API_KEY;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (key) {
      headers["x-api-key"] = key;
    }

    const response = await fetch(`${DAPTA_API_BASE}/getagent/${daptaAgentId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      console.error(`Failed to fetch Dapta agent: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.agent ?? data;
  } catch (error) {
    console.error("Error fetching Dapta agent:", error);
    return null;
  }
}

export async function updateDaptaAgentPrompt(
  daptaAgentId: string,
  newPrompt: string,
  apiKey?: string
): Promise<UpdateAgentResult> {
  const key = apiKey ?? process.env.DAPTA_API_KEY;

  // 1. Obtener el objeto completo del agente
  const agent = await fetchDaptaAgentRaw(daptaAgentId, key);
  if (!agent) {
    return { success: false, message: "Agent not found" };
  }

  const retellAgentId = agent.voice_retell_agent_id ?? agent.retell_agent_id;
  const llmId = agent.voice_llm_id ?? agent.llm_id;

  if (!retellAgentId || !llmId) {
    return { success: false, message: "Agent missing retell_agent_id or llm_id" };
  }

  // 2. Modificar solo el campo instructions
  const updatedAgent = {
    ...agent,
    instructions: newPrompt,
  };

  // 3. PUT con el objeto completo
  const url = `${DAPTA_API_BASE}/updatevoiceagentllm?agent_id=${retellAgentId}&llm_id=${llmId}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key!,
      "origin": "https://app.dapta.ai",
      "referer": "https://app.dapta.ai/",
    },
    body: JSON.stringify(updatedAgent),
  });

  if (!response.ok) {
    return { success: false, message: `Update failed: ${response.status}` };
  }

  // Check for error in response body (API returns 200 with error object)
  const data = await response.json();
  if (data.error) {
    const errorMsg = typeof data.error === "string" ? data.error : data.error.message ?? JSON.stringify(data.error);
    return { success: false, message: `Update failed: ${errorMsg}` };
  }

  return { success: true, message: "Agent updated", agentName: agent.name as string };
}

export async function testDaptaAgentUpdate(
  daptaAgentId: string,
  apiKey?: string
): Promise<UpdateAgentResult> {
  const key = apiKey ?? process.env.DAPTA_API_KEY;

  // 1. Obtener prompt actual
  const agent = await fetchDaptaAgent(daptaAgentId, key);
  if (!agent) {
    return { success: false, message: "Agent not found" };
  }

  // 2. Hacer modificación mínima (agregar/quitar espacio al final)
  const currentPrompt = agent.instructions || "";
  const newPrompt = currentPrompt.endsWith(" ")
    ? currentPrompt.trimEnd()
    : currentPrompt + " ";

  // 3. Actualizar
  return updateDaptaAgentPrompt(daptaAgentId, newPrompt, apiKey);
}
