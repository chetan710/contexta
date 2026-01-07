import { prisma } from "@/lib/prisma";

export async function retrieveRelevantChunks(
  documentId: string,
  queryEmbedding: number[],
  topK = 5
) {
  const chunks = await prisma.$queryRaw<
    {
      id: string;
      content: string;
      chunkIndex: number;
      similarity: number;
    }[]
  >`
    SELECT
      id,
      content,
      "chunkIndex",
      1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM "DocumentChunk"
    WHERE "documentId" = ${documentId}
    ORDER BY similarity DESC
    LIMIT ${topK}
  `;

  return chunks;
}
