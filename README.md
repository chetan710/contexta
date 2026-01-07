# Contexta

A powerful document Q&A system built with Next.js that enables you to upload PDF documents and ask questions about them using Retrieval Augmented Generation (RAG). The system uses semantic search with embeddings to find relevant document chunks and generates accurate answers using Google Gemini.

## Features

- 📄 **PDF Document Upload**: Upload and process PDF documents (supports both text-based and scanned PDFs with OCR)
- 🔍 **Semantic Search**: Uses vector embeddings to find the most relevant document chunks for your questions
- 💬 **Interactive Q&A**: Ask questions about your documents and get accurate, context-aware answers
- 🌊 **Streaming Responses**: Real-time streaming of AI-generated answers for better user experience
- 🧠 **RAG Architecture**: Retrieval Augmented Generation ensures answers are grounded in your document content
- 📊 **PostgreSQL Storage**: Efficient storage of documents, chunks, and embeddings using Prisma ORM
- 🎨 **Modern UI**: Built with Next.js, React, and Tailwind CSS

## Tech Stack

- **Framework**: Next.js 16.1.0
- **Runtime**: Node.js
- **Database**: PostgreSQL with Prisma ORM
- **AI/ML**:
  - Google Gemini 2.5 Flash (text generation)
  - Google Gemini Embedding 001 (embeddings)
  - OpenAI (optional, for embeddings)
- **PDF Processing**:
  - pdf2json (text extraction)
  - Poppler pdftoppm (PDF to image conversion)
  - Tesseract OCR (scanned PDF support)
- **Styling**: Tailwind CSS 4

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v12 or higher)
- **Poppler** (for PDF to image conversion)
  - macOS: `brew install poppler`
  - Ubuntu/Debian: `sudo apt-get install poppler-utils`
  - Windows: Download from [Poppler for Windows](http://blog.alivate.com.au/poppler-windows/)
- **Tesseract OCR** (for scanned PDFs)
  - macOS: `brew install tesseract`
  - Ubuntu/Debian: `sudo apt-get install tesseract-ocr`
  - Windows: Download from [Tesseract at UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd contexta
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/contexta?schema=public"

   # Google AI API (required)
   GOOGLE_API_KEY="your-google-api-key"

   # OpenAI API (optional, for embeddings)
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev
   ```

5. **Create the uploads directory**

   ```bash
   mkdir -p uploads/raw
   ```

## Getting Started

1. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

2. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Upload a PDF document**

   Use the upload API endpoint to upload PDF files. The system will:
   - Extract text from the PDF (with OCR fallback for scanned documents)
   - Chunk the text into manageable pieces
   - Generate embeddings for each chunk
   - Store everything in the database

4. **Ask questions**

   Use the ask API endpoint to query your documents. The system will:
   - Find relevant chunks using semantic search
   - Generate context-aware answers using Google Gemini
   - Stream the response in real-time

## API Endpoints

### POST `/api/upload`

Upload a PDF document for processing.

**Request:**

- Content-Type: `multipart/form-data`
- Body: `file` (PDF file)

**Response:**

```json
{
  "success": true,
  "documentId": "clx...",
  "characters": 12345
}
```

### POST `/api/ask`

Ask a question about a document.

**Request:**

```json
{
  "documentId": "clx...",
  "question": "What is the main topic of this document?",
  "messages": []
}
```

**Response:**

Streaming NDJSON format:

```json
{"type": "token", "value": "The"}
{"type": "token", "value": " main"}
{"type": "sources", "value": [{"id": 1, "preview": "..."}]}
{"type": "done"}
```

## Project Structure

```text
contexta/
├── app/
│   ├── api/
│   │   ├── ask/          # Q&A endpoint
│   │   └── upload/       # Document upload endpoint
│   ├── page.tsx          # Main page
│   └── layout.tsx        # Root layout
├── components/
│   └── ui/               # UI components (chat, input, etc.)
├── lib/
│   ├── answerFromDocument.ts    # Answer generation logic
│   ├── buildPrompt.ts            # Prompt construction
│   ├── chunkText.ts              # Text chunking
│   ├── cosineSimilarity.ts       # Similarity calculation
│   ├── embeddings.ts             # Embedding generation
│   ├── findRelevantChunks.ts     # Semantic search
│   ├── llm.ts                    # LLM integration (Google/OpenAI)
│   ├── pdfExtractor.ts           # PDF text extraction & OCR
│   ├── processDocument.ts        # Document processing pipeline
│   └── prisma.ts                 # Prisma client
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
└── uploads/
    └── raw/                      # Uploaded PDF files
```

## How It Works

1. **Document Upload**: PDF files are uploaded and stored in the `uploads/raw` directory
2. **Text Extraction**:
   - Text-based PDFs: Uses `pdf2json` for direct text extraction
   - Scanned PDFs: Falls back to OCR using Tesseract (via `pdftoppm` for conversion)
3. **Chunking**: Documents are split into smaller chunks for efficient processing
4. **Embedding Generation**: Each chunk is converted to a vector embedding using Google Gemini or OpenAI
5. **Storage**: Documents, chunks, and embeddings are stored in PostgreSQL
6. **Query Processing**:
   - User questions are converted to embeddings
   - Cosine similarity is used to find the most relevant chunks
   - Relevant chunks are used to build a context-aware prompt
7. **Answer Generation**: Google Gemini generates answers based on the retrieved context
8. **Streaming**: Answers are streamed back to the client in real-time

## Database Schema

- **Document**: Stores uploaded documents with metadata
- **DocumentChunk**: Stores text chunks with their embeddings and chunk indices

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Environment Variables

| Variable         | Description                                    | Required |
| ---------------- | ---------------------------------------------- | -------- |
| `DATABASE_URL`   | PostgreSQL connection string                   | Yes      |
| `GOOGLE_API_KEY` | Google AI API key for Gemini                   | Yes      |
| `OPENAI_API_KEY` | OpenAI API key (optional, for embeddings)      | No       |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Deployment

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

For other deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Notes

- Ensure your PostgreSQL database has the `vector` extension if you plan to use pgvector for similarity search (currently using in-memory cosine similarity)
- Make sure Poppler and Tesseract are properly installed and accessible in your system PATH
- The system processes documents sequentially to avoid overwhelming the embedding API
- Large documents may take some time to process due to embedding generation
