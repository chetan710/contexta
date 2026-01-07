import { prisma } from "@/lib/prisma";

export async function getCandidateChunks(documentId: string) {
  return prisma.documentChunk.findMany({
    where: { documentId },
    select: {
      id: true,
      content: true,
      embedding: true,
    },
  });
}
