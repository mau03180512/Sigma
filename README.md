# ⚡ Sigma — Elite AI Assistant Application

Sigma is a high-performance, premium AI chat application engineered specifically for hackers, security researchers, developers, and builders. Featuring a modern glassmorphic dark theme, multi-model support powered by **NVIDIA NIM**, and context-aware specialized modes (CTF, PenTesting, Code Auditing, etc.), Sigma is the ultimate dashboard for technical builders.

---

## 🚀 Key Features

- **Premium Dark-Mode UI**: Built with React, Vite, and Tailwind CSS. Features glassmorphism, responsive collapsible sidebar, typing animations, and custom glowing elements.
- **NVIDIA NIM API Integration**: Zero-latency streaming responses using top-tier developer models like `Llama 4 Maverick`, `Mistral Large 3`, `Qwen3 Coder`, `DeepSeek R1`, and `MiniMax M2`.
- **Specialized Slash Commands**: Tailored context triggers (e.g., `/ctf`, `/audit`, `/pentest`, `/malware`, `/osint`, `/explain`, `/build`, `/ir`) that augment the system prompt for domain-specific tasks.
- **Full-Stack Architecture**: Node.js Express backend acting as a secure NVIDIA NIM proxy to keep API keys server-side.
- **Multi-tenant Auth & Storage**: Real-time authentication via **Firebase Auth** (including Google OAuth and Email/Password flows) and session persistence via **Supabase Database**.
- **Syntax Highlighted Code Output**: Code block rendering using React Markdown and syntax highlighting with a copy-to-clipboard button.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + PostCSS
- **State**: Zustand (stores for auth, chat selection, and real-time streaming)
- **Icons**: Lucide React
- **Markdown & Code**: `react-markdown`, `remark-gfm`, `react-syntax-highlighter`

### Backend (Server)
- **Runtime**: Node.js + Express
- **Language**: TypeScript (compiled to ES Modules)
- **API Clients**: OpenAI SDK (configured for NVIDIA NIM compatibility)
- **Auth & DB**: Firebase Admin SDK & Supabase Client
- **Rate Limiting**: `express-rate-limit`

---

## ⚙️ Environment Configuration

Before running the application, you need to configure your environment variables.

### 1. Server Configuration
Copy `server/.env.example` to `server/.env` and fill in the values:
```bash
PORT=3001
CLIENT_URL=http://localhost:5173

# NVIDIA NIM (Get your key from https://build.nvidia.com)
NVIDIA_API_KEY=your_nvidia_api_key_here

# Firebase Admin SDK Configuration (Service Account JSON stringified)
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# Supabase Configuration (Service/Admin Key for backend bypass of RLS)
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here
```

### 2. Client Configuration
Copy `client/.env.example` to `client/.env` and fill in the values:
```bash
VITE_API_URL=http://localhost:3001

# Firebase Client configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Supabase Client configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🏃 Running Locally

To run the application locally, you can start the development servers for both client and server:

### Start the Server (Backend)
```bash
cd server
npm run dev
```
The server will run on `http://localhost:3001`.
- Health Check: `http://localhost:3001/api/health`
- Supported Models: `http://localhost:3001/api/models`

### Start the Client (Frontend)
```bash
cd client
npm run dev
```
The frontend will run on `http://localhost:5173`. Open this URL in your browser to interact with the application.

---

## 🗄️ Database Setup (Supabase)

Initialize your Supabase database using the following SQL schema to enable conversation history, message synchronization, and row-level security (RLS):

```sql
-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT DEFAULT 'New Chat',
    model TEXT DEFAULT 'meta/llama-4-maverick',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own conversations"
    ON conversations FOR ALL
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can only access messages in their conversations"
    ON messages FOR ALL
    USING (conversation_id IN (
        SELECT id FROM conversations WHERE user_id = auth.uid()::text
    ));

-- Performance Indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
```

---

## 🚢 Deployment Guide

### 1. Backend (Railway)
1. Push the project repository to GitHub (include both `client` and `server` folders in the same repo, or split them).
2. Go to [Railway](https://railway.app), create a new project, and select **Deploy from GitHub repo**.
3. Select your repository.
4. Set the **Root Directory** settings:
   - For backend: Set the root directory to `server`.
5. Railway will automatically detect the Node.js project, build it with `npm run build` (runs `tsc`), and start it using `npm run start` (runs `node dist/index.js`).
6. Under **Variables**, add all of the required variables listed in the [Server Configuration](#1-server-configuration) section (like `NVIDIA_API_KEY`, `SUPABASE_SERVICE_KEY`, etc.).
7. Grab the generated backend URL (e.g. `https://your-backend-production.up.railway.app`) to use in the frontend configuration.

### 2. Frontend (Netlify)
1. Go to [Netlify](https://netlify.com) and click **Add new site** -> **Import an existing project** (GitHub).
2. Select your repository.
3. Configure the site settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`
4. Under **Site configuration** -> **Environment variables**, define all of the client variables listed in [Client Configuration](#2-client-configuration) section. 
   - Note: Set `VITE_API_URL` to your live Railway backend URL.
5. Netlify will use the `client/netlify.toml` file to automatically configure redirects so React Router routes work correctly without throwing 404s.

