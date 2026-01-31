// Dapta API client for fetching agent configuration

const DAPTA_API_BASE = "https://api.dapta.ai/api/devops-dapta-tech-169-938-7";

export interface DaptaAgentResponse {
  id: string;
  name: string;
  instructions: string;
  llm_model?: string;
  voice_id?: string;
  variables?: Array<{ key: string; value: string }>;
  workspace_id?: string;
  organization_id?: string;
  retell_agent_id?: string;
  llm_id?: string;
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
  daptaAgentId: string
): Promise<DaptaAgentResponse | null> {
  try {
    const response = await fetch(`${DAPTA_API_BASE}/getagent/${daptaAgentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch Dapta agent: ${response.status}`);
      return null;
    }

    return response.json();
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
