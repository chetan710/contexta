import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTextFromPDF } from "@/lib/pdfExtractor";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { processDocumentForSearch } from "@/lib/processDocument";

export const runtime = "nodejs"; 

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        if (!file.name.toLowerCase().endsWith(".pdf")) {
            return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
        }

        const userId = "demo-user";

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${randomUUID()}.pdf`;
        const filePath = path.join(process.cwd(), "uploads/raw", fileName);

        await writeFile(filePath, buffer);

        // Extract text
        const text = await extractTextFromPDF(filePath);
        // Store in DB
        const document = await prisma.document.create({
            data: {
                userId,
                name: file.name,
                content: text,
            },
        });

        // Process document for search
        await processDocumentForSearch(document.id, text);

        return NextResponse.json({
            success: true,
            documentId: document.id,
            characters: text.length,
        });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Upload failed" },
            { status: 500 }
        );
    }
}
