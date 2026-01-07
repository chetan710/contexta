import fs from "fs";
import path from "path";
import PDFParser, { type Output } from "pdf2json";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

// --- Main function ---
export async function extractTextFromPDF(filePath: string): Promise<string> {
  // Try pdf2json first (text-based PDF)
  const textFromPdf2Json = await tryPdf2Json(filePath);
  if (textFromPdf2Json.trim().length > 10) return textFromPdf2Json;

  // Fallback: scanned PDF → OCR
  const textFromOcr = await runOcrOnPdf(filePath);
  return textFromOcr;
}

// -----------------------
// Text extraction using pdf2json
async function tryPdf2Json(filePath: string): Promise<string> {
  const pdfParser = new PDFParser();

  return new Promise((resolve, reject) => {
    pdfParser.on("pdfParser_dataError", (err: Error | { parserError: Error }) => {
      reject(err instanceof Error ? err : err.parserError);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: Output) => {
      try {
        let fullText = "";
        const pages = pdfData?.Pages ?? [];
        for (const page of pages) {
          for (const textBlock of page.Texts ?? []) {
            for (const item of textBlock.R ?? []) {
              const text = safeDecodeURIComponent(item.T);
              fullText += text + " ";
            }
          }
        }
        resolve(fullText.trim());
      } catch (err) {
        reject(err);
      }
    });

    pdfParser.loadPDF(filePath);
  });
}

// -----------------------
// OCR fallback using system Tesseract CLI + Poppler pdftoppm
async function runOcrOnPdf(pdfPath: string): Promise<string> {
  // Step 1: Convert PDF pages to PNG images using pdftoppm
  const outDir = path.dirname(pdfPath);
  const outPrefix = path.basename(pdfPath, path.extname(pdfPath));
  const outputPattern = path.join(outDir, outPrefix);

  try {
    await execFileAsync("pdftoppm", [
      "-png",
      pdfPath,
      outputPattern
    ]);
  } catch (err) {
    throw new Error(`Failed to convert PDF to images with pdftoppm: ${err}`);
  }

  // Step 2: Collect all generated PNGs
  const files = fs.readdirSync(outDir);
  const imagePaths = files
    .filter(f => f.startsWith(outPrefix) && f.endsWith(".png"))
    .map(f => path.join(outDir, f))
    .sort();

  if (imagePaths.length === 0) {
    throw new Error("No PNG images generated from PDF for OCR");
  }

  // Step 3: Run Tesseract CLI on each PNG
  let fullText = "";
  for (const imgPath of imagePaths) {
    try {
      const { stdout } = await execFileAsync("tesseract", [
        imgPath,
        "stdout",
        "-l",
        "eng"
      ]);
      fullText += stdout + "\n";
    } catch (err) {
      console.error(`Tesseract failed for ${imgPath}:`, err);
    }

    // Cleanup temporary image
    fs.unlinkSync(imgPath);
  }

  return fullText.trim();
}


function safeDecodeURIComponent(text: string): string {
  try {
    return cleanExtractedText(decodeURIComponent(text));
  } catch {
    return cleanExtractedText(text);
  }
}

function cleanExtractedText(text: string | undefined): string {
  if (!text) return "";
  return text
    // Normalize unicode dashes & quotes
    .replace(/[–—−]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")

    // Remove bullet points
    .replace(/●/g, "")

    // Remove page numbers like "1 of 2"
    .replace(/\b\d+\s+of\s+\d+\b/gi, "")

    // Replace pipes with commas
    .replace(/\s*\|\s*/g, ", ")

    // Remove repeated spaces
    .replace(/\s+/g, " ")

    // Fix space before punctuation
    .replace(/\s+([.,:;])/g, "$1")

    // Trim
    .trim();
}

