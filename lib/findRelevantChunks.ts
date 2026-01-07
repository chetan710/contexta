import { cosineSimilarity } from "./cosineSimilarity";
import { embedQuery } from "./embeddings";
import { getCandidateChunks } from "./getCandidateChunks";

export async function findRelevantChunks(
  documentId: string,
  query: string,
  topK = 5
) {
  const queryEmbedding = await embedQuery(query, "google");
  const chunks = await getCandidateChunks(documentId);
  const scored = chunks.map(chunk => ({
    content: chunk.content,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
