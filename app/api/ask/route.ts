import { NextRequest } from "next/server";
import { answerFromDocumentStream } from "@/lib/answerFromDocument";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { documentId, question, messages } = await req.json();

  const abortController = new AbortController();

  req.signal?.addEventListener("abort", () => { 
    abortController.abort();
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        await answerFromDocumentStream({
          documentId,
          question,
          messages,
          signal: abortController.signal,
          onToken(token) {
            console.log('token', JSON.stringify({ type: "token", value: token }) + "\n")
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "token", value: token }) + "\n"
              )
            );
          },
          onSources(sources) {
            controller.enqueue(
              encoder.encode(
                JSON.stringify({ type: "sources", value: sources }) + "\n"
              )
            );
          },
          onDone() {
            controller.enqueue(
              encoder.encode(JSON.stringify({ type: "done" }) + "\n")
            );
            controller.close();
          }
        });
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "error",
              message: "Generation failed"
            }) + "\n"
          )
        );
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache"
    }
  });
}
