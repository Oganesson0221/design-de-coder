# Archway

Learn system design by building. An AI-powered playground that turns your idea into a real system architecture.

## Environment

Add these values in `.env`:

```env
OPENAI_API_KEY=your_openai_key
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=design_de_coder
PORT=8787
```

## Run

Install dependencies, then run:

```bash
npm install
npm run dev
```

This starts:
- Vite client on `http://localhost:8080`
- Engineer API on `http://localhost:8787`

Engineer mode now stores:
- Generated DB schema
- draw.io XML for relational diagram rendering
- Mentor score and mentoring history
