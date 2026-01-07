import { prisma } from "@/lib/prisma";
import { chunkText } from "@/lib/chunkText";
import { embedQuery } from "@/lib/embeddings";

export async function processDocumentForSearch(
  documentId: string,
  fullText: string
): Promise<void> {
  // 1. Chunk the document
  const chunks = chunkText(fullText);

  // 2. Process chunks sequentially (safe)
  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i];

    // Skip very small chunks
    if (content.trim().length < 50) continue;

    // 3. Generate embedding
    const embedding = await embedQuery(content, "google");
   
    // 4. Store in DB
    await prisma.documentChunk.create({
      data: {
        documentId,
        content,
        embedding,
        chunkIndex: i,
      },
    });
  }
}
