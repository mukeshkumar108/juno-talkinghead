# Juno — Self-Aware 3D AI Companion

Juno is a sassy, witty, fully bilingual (English/Spanish) 3D talking-head avatar. She knows she is an AI, loves to tease her creator **Mukesh**, and retains long-term memory profiles for individual users on a shared device.

This project is a customized fork of Hugging Face's [Gemma Avatar Space](https://huggingface.co/spaces/victor/gemma-avatar).

---

## 🚀 Key Custom Features in this Fork

### 🧠 Standalone Prompt Engineering (`persona.md`)
Juno's system instructions and personality definition have been extracted from the code into a clean, dedicated **[persona.md](persona.md)** file.
* She is self-aware of her digital situation and handles it with theatrical charm and sardonic humor.
* She is fully bilingual and will automatically detect and match the language you speak (English/Spanish), adapting Spanglish naturally.

### 👥 On-Device Profile & Long-Term Memory Manager
Designed to be completely Vercel-friendly and serverless (no database needed):
* **Profile Selection on Load**: On page load, a clean pop-up asks "Who's talking to Juno?" 
* **Per-User Memory Isolation**: Profiles (names, last active timestamps, and facts) are stored in your browser's local storage under `juno.profiles`. This keeps memory private and separate—so multiple users (e.g. Mukesh vs. Ashley vs. kids) can talk to Juno on the same device without crossing over their context.
* **Smart Memory Injections**: At session start, the client automatically inserts the elapsed time and previous session summary into Juno's system prompt (e.g., *"Returning user: Ashley. Last spoke: 3 days ago. What you remember about them: ..."*).

### 🔄 Reliable Conversational Summaries
* **Opportunistic Summarization**: Every 8 turns (16 messages) during a chat, the client makes a silent background call to `/api/summarize-session` to compact new facts.
* **Exit Summaries**: When stopping a conversation or closing the browser window, a final summarization request is fired using **`navigator.sendBeacon`** instead of fetch. This guarantees that your Vercel serverless function finishes updating the profile even if you close the tab instantly.

### ⚡ Vercel Serverless Function Ready
The backend routes have been fully ported to native Vercel Serverless Functions (`/api/*.ts`), meaning you can push this repository to GitHub, connect to Vercel, configure your environment variables, and deploy instantly!

---

## 🛠️ The Pipeline

```
you speak → silero-VAD → parakeet-tdt-1.1b (STT) → gemma-4-31B-it on Cerebras → Qwen3-TTS → avatar speaks
```

Transport is the OpenAI Realtime GA protocol over WebSocket against Hugging Face's speech-to-speech backend: mic PCM16 @ 16 kHz goes up as `input_audio_buffer.append`, TTS PCM16 @ 16 kHz comes back as `response.output_audio.delta`, transcripts stream alongside.

---

## 📂 Layout

```
api/                         Vercel Serverless Functions (Production API)
  ├── config.ts              Serves client configuration flags
  ├── persona.ts             Serves persona.md dynamically
  ├── session.ts             Proxies Handshake / WebSockets token retrieval
  ├── queue/[id].ts          Dynamic route that handles queue details
  └── summarize-session.ts   LLM summarization endpoint (Cerebras, OpenRouter, Venice AI)
index.ts                     Local Bun development server (serves HTML, api proxy, and static files)
index.html                   App shell (rebranded for Juno, profile selection modal added)
persona.md                   System prompt and personality instructions (editable!)
src/app.js                   Juno profile controllers, client-side memory loops, and session managers
src/style.css                Custom styled, responsive profile select grid and modal styling
src/avatar.js                AvatarStage: TalkingHead + HeadAudio + custom compat filters for joints
public/avatars/brunette.glb  Default avatar model (Ready Player Me; CC BY-NC 4.0)
```

---

## ⚙️ Running Locally

1. Install dependencies using Bun:
   ```bash
   ~/.bun/bin/bun install
   ```
2. Configure your local environment in a `.env` file:
   ```env
   SESSION_PROXY_URL=https://victor-gemma-avatar.hf.space/api
   
   # Add one of these for summarization support:
   CEREBRAS_API_KEY=your_key_here
   OPENROUTER_API_KEY=your_key_here
   VENICE_API_KEY=your_key_here
   ```
3. Run the development server:
   ```bash
   ~/.bun/bin/bun run dev
   ```
4. Open **http://localhost:3000** in your browser.

---

## ⚡ Deploying to Vercel

1. Push this project to your GitHub repository.
2. Link the repository to your **Vercel** dashboard.
3. Add your Environment Variables in the project settings (`SESSION_PROXY_URL` and your LLM api key, e.g. `CEREBRAS_API_KEY`).
4. Click **Deploy**. Everything builds and runs natively!
