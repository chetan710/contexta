import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY!,
});


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateTextWithGoogle(
    prompt: string
): Promise<string> {
    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });

    return result?.text ?? "";
}

export async function embedTextWithGoogle(text: string): Promise<number[]> {
    const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text,
    });
    const embeddings = response.embeddings?.map(e => e?.values) ?? [];
    return embeddings.flat() as number[];
}

export async function embedTextWithOpenAI(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });

    return response.data[0].embedding;
}

export async function generateTextWithGoogleStreaming(prompt: string) {
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
        async start(controller) {
            const tokens = await fakeLLMStreaming(prompt);
            for await (const token of tokens) {
                controller.enqueue(encoder.encode(token));
            }
            controller.close();
        },
    });

    return readable;
}

async function* fakeLLMStreaming(prompt: string) {
    const words = prompt.split(" ");
    for (const w of words) {
        await new Promise((r) => setTimeout(r, 50));
        yield w + " ";
    }
}

export async function* streamFromGoogle(prompt: string, abortSignal?: AbortSignal) {
    const stream = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: [
            {
                role: "user",
                parts: [{ text: prompt }],
            },
        ],
        config: {
            abortSignal: abortSignal,
        },
    });

    let previousText = "";
    for await (const chunk of stream) {
        // Check if candidates exist and have content
        if (chunk.candidates && chunk.candidates.length > 0 && chunk.candidates[0].content) {
            const currentText = chunk.text;
            if (currentText !== undefined && currentText !== null) {
                // Only yield the incremental portion (new text since last chunk)
                const incrementalText = currentText.slice(previousText.length);
                if (incrementalText) {
                    previousText = currentText;
                    yield incrementalText;
                }
            }
        }
    }
}
