# PDF Learning Assistant (MVP)

A local web application that uses Google Gemini to turn PDFs into structured learning modules and quizzes.

## Features
- **PDF Ingestion**: Upload PDFs (up to ~100 pages).
- **AI Analysis**: Gemini analyzes the document structure and generates bite-sized learning modules.
- **Smart Modules**: Each module contains a summary, key terms, and cited page references.
- **Interactive Quizzes**: Generate 5-question quizzes on demand for any module.
- **Review Mode**: Review past quiz attempts with explanations and citations.
- **PDF Viewer**: Integrated viewer to jump to cited pages.
- **Exports**: Download study guides (Markdown) and quiz history (JSON).

## Setup

1. **Prerequisites**: Node.js 18+ installed.
2. **Clone/Navigate**: Go to the project directory.
3. **Environment**:
   Create a `.env` file in the root directory:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```
   Get an API key from [Google AI Studio](https://aistudio.google.com/).

4. **Install & Run**:
   ```bash
   ./run_dev.sh
   ```
   Or manually:
   ```bash
   npm install
   npx prisma db push
   npm run dev
   ```
5. **Open**: Visit `http://localhost:3000`.

### Docker Setup

1. **Prerequisites**: Docker installed.
2. **Environment**: Ensure `.env` exists with `GEMINI_API_KEY`.
3. **Run**:
   ```bash
   docker-compose up --build
   ```
4. **Open**: Visit `http://localhost:3000`.

## Architecture
- **Frontend**: Next.js (App Router), Tailwind CSS.
- **Backend**: Next.js API Routes.
- **Database**: SQLite (via Prisma).
- **AI**: Google Generative AI SDK (`gemini-1.5-flash`).
- **Real-time**: Server-Sent Events (SSE) for processing progress.
- **Storage**: Local filesystem (`uploads/`) for PDFs.

## Troubleshooting
- **Upload Fails**: Ensure the `uploads/` directory exists and is writable (the app creates it automatically).
- **Gemini Errors**: Check your API key and quotas.
- **Database Issues**: Run `rm dev.db && npx prisma db push` to reset.

## Testing
Run the JSON utility test:
```bash
npx tsx scripts/test-json.ts
```
