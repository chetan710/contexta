import { NextRequest, NextResponse } from "next/server";
import { answerFromDocument } from "@/lib/answerFromDocument";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    const { documentId, question } = await req.json();

    const result = await answerFromDocument(documentId, question);

    return NextResponse.json(result);
}
