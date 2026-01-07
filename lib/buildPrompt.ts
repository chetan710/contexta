export interface Message {
    role: "user" | "assistant";
    text: string;
}

export function buildPrompt(contextChunks: string[], question: string) {
    return `
        You are an assistant that answers ONLY using the context below.
        If the answer is not in the context, say "I don't know".
  
        Context:
        ${contextChunks.map(chunk => `- ${chunk}`).join("\n")}
  
        Question:
        ${question}
  
        Answer:
        `.trim();
}

export function buildPromptFromChunks(
    chunks: { content: string; score?: number }[],
    question: string,
    messages: Message[] = []
) {
    const context = chunks
        .map((c, i) => `[Source ${i + 1}]\n${c.content}`)
        .join("\n\n");

    let history = "";
    if (messages.length > 0) {
        history = messages
            .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
            .join("\n");
    }

    return `
            You are a helpful AI assistant.
            
            Rules:
            - Answer ONLY using the sources below.
            - If the answer is not present, say: "I don't know".
            - Mention source numbers when relevant (e.g., Source 1, Source 3).
            - Use previous conversation context if needed.
            
            Sources:
            ${context}
            
            Conversation history:
            ${history}
            
            Current question:
            ${question}
            
            Answer:
            `;
}


