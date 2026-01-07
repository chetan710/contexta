// ask/route.ts
import { findRelevantChunks } from "@/lib/findRelevantChunks";
import { buildPromptFromChunks, type Message } from "@/lib/buildPrompt";
import { generateTextWithGoogle, streamFromGoogle } from "@/lib/llm";

type StreamCallbacks = {
  onToken: (token: string) => void;
  onSources: (sources: { id: number; preview: string }[]) => void;
  onDone: () => void;
};

export async function answerFromDocument(documentId: string, question: string) {
  const chunks = await findRelevantChunks(documentId, question);

  // Build prompt for LLM
  const prompt = buildPromptFromChunks(
    chunks.map((c) => ({ content: c.content, score: c.score })),
    question
  );

  // Generate answer
  const answerText = (await generateTextWithGoogle(prompt)).trim();

  // Return structured data
  return {
    answer: answerText,   // ONLY the AI-generated answer
    sources: chunks.map((c, i) => ({
      id: i + 1,
      preview: c.content.slice(0, 120) + "..."
    }))
  };
}

export async function answerFromDocumentStream({
  documentId,
  question,
  messages,
  signal,
  onToken,
  onSources,
  onDone,
}: {
  documentId: string;
  question: string;
  messages: Message[];
  signal?: AbortSignal;
} & StreamCallbacks) {
  // 1️⃣ Retrieve chunks
  const chunks = await findRelevantChunks(documentId, question);

  // 2️⃣ Build prompt with history
  const prompt = buildPromptFromChunks(
    chunks.map((c) => ({ content: c.content })),
    question,
    messages
  );

  // 3️⃣ Stream tokens
  try {
    for await (const token of streamFromGoogle(prompt, signal)) {
      onToken(token);
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === "Generation aborted") {
        return;
      }
    }
    throw new Error("Unknown error");
  }
  
  // 4️⃣ Send sources AFTER text
  if (!signal?.aborted) {
    onSources(
      chunks.map((c, i) => ({
        id: i + 1,
        preview: c.content.slice(0, 120) + "...",
      }))
    );
    onDone();
  }
}
