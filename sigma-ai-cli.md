Sigma CLI — Implementation Plan
Command Name
sigma-ai — e.g., sigma-ai "explain RCE" or sigma-ai chat
Architecture
sigma-ai "prompt"
    ↓
CLI (Node.js) ──auth──→ Firebase REST API (verify token)
    ↓
CLI ──chat──→ Railway Backend (/api/chat with Groq)
    ↓
Backend ──→ Groq API (LLM response)
Backend ──→ Supabase (save conversations)
    ↓
Response streamed back to CLI
Package Structure (cli/)
cli/
├── src/
│   ├── index.ts          # Entry point — parses args, routes commands
│   ├── commands/
│   │   ├── chat.ts       # `sigma-ai chat` — interactive REPL mode
│   │   ├── ask.ts        # `sigma-ai "prompt"` — one-shot Q&A
│   │   ├── login.ts      # `sigma-ai login` — Firebase auth, saves token
│   │   ├── logout.ts     # `sigma-ai logout` — removes stored token
│   │   └── models.ts     # `sigma-ai models` — list available models
│   ├── utils/
│   │   ├── api.ts        # HTTP client for Railway backend
│   │   ├── auth.ts       # Firebase REST API login (email + password)
│   │   ├── config.ts     # Read/write ~/.config/sigma-ai/config.json
│   │   ├── render.ts     # Terminal rendering (markdown → colored output)
│   │   └── stream.ts     # SSE stream handler for CLI output
│   └── types.ts
├── bin/
│   └── sigma-ai.js       # Shebang entry point
├── package.json          # With "bin" field for npm global install
├── tsconfig.json
└── README.md
Features
Command	Description
sigma-ai "prompt"	One-shot question, prints response and exits
sigma-ai chat	Interactive REPL with history, slash commands, streaming
sigma-ai login	Authenticate with Firebase (saves token to ~/.config/sigma-ai/)
sigma-ai logout	Remove saved credentials
sigma-ai models	List available models
sigma-ai --model deepseek-r1 "prompt"	Choose model
cat file.js | sigma-ai "review this"	Pipe support
sigma-ai /ctf "analyze this pcap"	Slash commands work in CLI too
Auth (Stored Token)
- sigma-ai login prompts for email + password
- Authenticates via Firebase REST API (identitytoolkit.googleapis.com)
- Saves idToken + refreshToken to ~/.config/sigma-ai/credentials.json
- Token auto-refreshes when expired
- Subsequent commands use saved token silently
Backend Changes Needed
The Railway backend currently uses NVIDIA NIM. We need to update it to support Groq:
1. New service: server/src/services/groq.ts
2. Route update: server/src/routes/chat.ts — add provider param (nim | groq)
3. New env var: GROQ_API_KEY (add to Railway Variables)
Dependencies (CLI)
- commander — CLI argument parsing
- chalk — colored terminal output
- ora — spinners for loading states
- inquirer — interactive prompts
- marked — markdown → terminal rendering
- node-fetch — HTTP requests (or use Node 18+ built-in fetch)
Installation
npm install -g sigma-ai-cli
sigma-ai login          # one-time setup
sigma-ai "what is XSS?" # use the CLI
Distribution
- Package name: sigma-ai-cli on npm
- Auto-published via GitHub Actions on tag push