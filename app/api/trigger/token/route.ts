import { auth } from "@trigger.dev/sdk";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const testRunId = url.searchParams.get("testRunId");

  if (!testRunId) {
    return Response.json({ error: "Missing testRunId" }, { status: 400 });
  }

  const scopes = {
    read: {
      tags: [`test-run:${testRunId}`],
    },
  };

  try {
    const token = await auth.createPublicToken({
      scopes,
      expirationTime: "30m",
    });

    return Response.json({ token });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Token error" },
      { status: 500 }
    );
  }
}
