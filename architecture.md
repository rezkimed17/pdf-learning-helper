# System Architecture

## Data Flow

1. **Upload**: User uploads PDF -> saved to `uploads/` -> SHA-256 hash computed -> `Workspace` record created.
2. **Processing (Background)**:
   - `JobManager` starts an async process (detached from API response).
   - PDF uploaded to Gemini File API.
   - **Phase 1 (Planning)**: Gemini analyzes structure and proposes module count/ranges.
   - **Phase 2 (Generation)**: Loop through modules, prompting Gemini for content per module.
   - Data is incrementally saved to SQLite `Module` table.
   - Progress events are emitted via `progressEvents` table and SSE.
3. **Client Progress**: `app/workspace/[id]/page.tsx` connects to `/api/workspace/[id]/stream` (SSE) to receive real-time updates.
4. **Quizzes**:
   - User requests quiz -> API prompts Gemini with module context -> Returns JSON questions.
   - Quiz stored in `QuizDefinition`.
   - Submission stored in `QuizAttempt`.

## Database Schema (SQLite)

- **Workspace**: Root entity, tracks file status and progress.
- **Module**: Child of Workspace, contains learning content.
- **QuizDefinition**: Stores generated questions.
- **QuizAttempt**: Stores user results.
- **ProgressEvent**: Log entries for the UI feed.

## Key Decisions

- **Local Storage**: Files and DB are local for privacy and simplicity (MVP).
- **Gemini 1.5 Flash**: Chosen for speed, low cost, and long context window (suitable for whole PDFs).
- **SSE vs WebSockets**: SSE chosen for simplicity (unidirectional progress updates).
- **JSON Repair**: Basic regex/retry logic implemented to handle potential LLM formatting issues.
