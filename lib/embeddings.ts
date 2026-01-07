import { embedTextWithGoogle, embedTextWithOpenAI } from "./llm";

export async function embedQuery(query: string, model: "openai" | "google" = "google"): Promise<number[]> {
  if (model === "google") {
    return embedTextWithGoogle(query);
  } else {
    return embedTextWithOpenAI(query);
  }
}
