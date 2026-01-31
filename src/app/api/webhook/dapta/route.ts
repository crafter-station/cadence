import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";

import { db } from "@/db";
import { prompt, externalAgent } from "@/db/schema";

// Schema validation for Dapta Extension payload
const DaptaAgentExportSchema = z.object({
  agent: z.object({
    name: z.string(),
    daptaAgentId: z.string(),
    retellAgentId: z.string(),
    llmId: z.string(),
    voiceId: z.string(),
  }),
  configuration: z.object({
    llmModel: z.string(),
    systemPrompt: z.string(),
    inputVariables: z.record(z.string()).optional(),
  }),
  organization: z.object({
    workspaceId: z.string(),
    organizationId: z.string(),
  }),
  metadata: z.object({
    exportedAt: z.string(),
    sourceUrl: z.string(),
    extensionVersion: z.string(),
  }),
});

export type DaptaAgentExport = z.infer<typeof DaptaAgentExportSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate the payload
    const parsed = DaptaAgentExportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payload",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Create a new prompt from the agent's system prompt
    const promptId = nanoid();
    const externalAgentId = nanoid();
    const userId = data.organization.organizationId; // Use org ID as user ID

    // Insert prompt
    await db.insert(prompt).values({
      id: promptId,
      userId,
      name: data.agent.name,
      content: data.configuration.systemPrompt,
      version: 1,
      isActive: true,
    });

    // Insert external agent reference
    await db.insert(externalAgent).values({
      id: externalAgentId,
      promptId,
      source: "dapta",
      agentName: data.agent.name,
      externalAgentId: data.agent.daptaAgentId,
      retellAgentId: data.agent.retellAgentId,
      llmId: data.agent.llmId,
      voiceId: data.agent.voiceId,
      organizationId: data.organization.organizationId,
      workspaceId: data.organization.workspaceId,
      llmModel: data.configuration.llmModel,
      inputVariables: data.configuration.inputVariables,
      rawPayload: data as unknown as Record<string, unknown>,
      sourceUrl: data.metadata.sourceUrl,
      extensionVersion: data.metadata.extensionVersion,
      importedAt: new Date(data.metadata.exportedAt),
    });

    // Return success with the created prompt ID
    return NextResponse.json({
      success: true,
      data: {
        promptId,
        agentName: data.agent.name,
        message: "Agent imported successfully. Ready for evaluation.",
        links: {
          evaluate: `/?promptId=${promptId}`,
          api: `/api/prompts/${promptId}`,
        },
        // Echo back important IDs for reference
        references: {
          daptaAgentId: data.agent.daptaAgentId,
          retellAgentId: data.agent.retellAgentId,
          organizationId: data.organization.organizationId,
          importedAt: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Webhook error:", error);

    // Check if it's a database error (likely not connected)
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return NextResponse.json(
        {
          success: false,
          error: "Database not configured",
          message: "The server is not connected to a database yet.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check / info
export async function GET() {
  return NextResponse.json({
    name: "Cadence - Dapta Agent Import Webhook",
    version: "1.0.0",
    status: "active",
    endpoints: {
      import: "POST /api/webhook/dapta",
      health: "GET /api/webhook/dapta",
    },
    expectedPayload: {
      agent: {
        name: "string",
        daptaAgentId: "string (UUID)",
        retellAgentId: "string",
        llmId: "string",
        voiceId: "string",
      },
      configuration: {
        llmModel: "string",
        systemPrompt: "string",
        inputVariables: "object (optional)",
      },
      organization: {
        workspaceId: "string (UUID)",
        organizationId: "string (UUID)",
      },
      metadata: {
        exportedAt: "string (ISO 8601)",
        sourceUrl: "string (URL)",
        extensionVersion: "string",
      },
    },
  });
}
