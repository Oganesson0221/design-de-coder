# Archway

![React](https://img.shields.io/badge/React-18-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Express](https://img.shields.io/badge/Express-Backend-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-AI-412991?logo=openai&logoColor=white)

Archway is an AI-assisted system design playground for learning by building.

Live app: [archway-ai.replit.app](https://archway-ai.replit.app)

It helps a user move from an idea to:
- a clearer product framing
- a system architecture workspace
- a database schema and relationship diagram
- guided critique from mentor-style roles
- community and mentor participation flows

## What The App Does

Archway combines a React frontend with an Express backend.

Core experiences in the current app:
- Landing page and onboarding flow
- Workspace with build, learning, reverse-engineering, and engineering views
- Engineer mode with schema generation and draw.io-compatible relationship diagrams
- Bias detector and explanation views
- Community page
- Mentor page and mentor intake flow

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Zustand
- UI: Radix UI, Framer Motion, Lucide
- Backend: Express
- Data: MongoDB
- AI: OpenAI API

## Prerequisites

Before running locally, make sure you have:
- Node.js installed
- npm installed
- a MongoDB database
- an OpenAI API key

## Environment Variables

Create a `.env` file in the project root with:

```env
OPENAI_API_KEY=your_openai_key
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=design_de_coder
PORT=3001
```

Notes:
- `OPENAI_API_KEY` is required for AI-powered flows
- `MONGODB_URI` is required for app data, sessions, projects, and schema storage
- `PORT` is the Express API port
- the Vite client runs on port `8080`
- frontend requests to `/api` are proxied to `http://localhost:3001`

## Getting Started

Install dependencies:

```bash
npm install
```

Start the full app:

```bash
npm run dev
```

This starts:
- the frontend on `http://localhost:8080`
- the backend API on `http://localhost:3001`

## Available Scripts

```bash
npm run dev
```
Runs frontend and backend together.

```bash
npm run dev:client
```
Runs only the Vite frontend.

```bash
npm run dev:server
```
Runs only the Express backend.

```bash
npm run build
```
Builds the frontend for production.

```bash
npm run preview
```
Previews the production frontend build.

```bash
npm run lint
```
Runs ESLint.

```bash
npm run test
```
Runs tests with Vitest.

## Project Structure

```text
.
├── src/
│   ├── components/        # Shared UI and workspace-specific components
│   ├── pages/             # Route-level pages
│   ├── services/          # Frontend API clients
│   ├── stores/            # Zustand state stores
│   └── lib/               # Shared utilities
├── server/
│   └── src/
│       └── index.js       # Express server and API routes
├── public/                # Static assets
└── README.md
```

## Key Backend Responsibilities

The backend currently handles:
- engineer session initialization
- schema generation and persistence
- schema updates and schema-agent changes
- relationship diagram XML generation
- mentor chat and engineering prompts
- project lookup and session hydration

## Notes On Engineer Mode

Engineer mode stores and returns:
- generated DB schema
- Mermaid ER diagram output
- draw.io XML for relationship diagram rendering
- mentor score and related engineering state

## Troubleshooting

### Missing `MONGODB_URI`

If the server exits immediately, check that `.env` includes:

```env
MONGODB_URI=...
```

### Frontend loads but API calls fail

Check:
- the backend is running on port `3001`
- the frontend is running on port `8080`
- your `.env` values are present

### OpenAI-backed features are unavailable

If `OPENAI_API_KEY` is missing, AI-powered flows may not work as expected.

## Development Notes

- The frontend uses `@` as an alias for `./src`
- The Vite dev server proxies `/api` requests to the local Express server
- App state such as points, badges, and onboarding data is managed in Zustand

## License

No license file is currently included in this repository.
