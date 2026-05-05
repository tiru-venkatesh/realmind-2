# RealMind AI — Local Setup Guide

## Prerequisites
- Node.js 20+
- MongoDB Atlas account (free tier)
- Groq API key (free at console.groq.com)
- HuggingFace API key (free at huggingface.co/settings/tokens)
- Firebase project (free at console.firebase.google.com)
- Blender installed locally (blender.org)

---

## 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 2. Configure Backend

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
```

Required values:
- MONGO_URI — from MongoDB Atlas → Connect → Drivers
- GROQ_API_KEY — from console.groq.com
- HUGGINGFACE_API_KEY — from huggingface.co/settings/tokens
- BLENDER_PATH — path to blender executable
- FIREBASE_* — from Firebase Console → Project Settings → Service Accounts → Generate new private key

---

## 3. Configure Frontend

```bash
cd frontend
cp .env.example .env
# Fill in Firebase config values
```

Firebase config: Firebase Console → Project Settings → Your Apps → Web → Config

---

## 4. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Frontend → http://localhost:3000
Backend  → http://localhost:5000

---

## API Reference

### Chat
POST   /api/chat/session          — Create new chat session
GET    /api/chat                  — List user sessions
GET    /api/chat/:id              — Get session with messages
POST   /api/chat/:id/stream       — Stream AI response (SSE)
DELETE /api/chat/:id              — Delete session

### Image
POST   /api/image/generate        — Generate images via HuggingFace
GET    /api/image                 — List user images
DELETE /api/image/:id             — Delete image

### Blender
POST   /api/blender/generate      — Generate bpy script via AI
POST   /api/blender/:id/run       — Execute script in local Blender
GET    /api/blender               — List scripts
GET    /api/blender/:id           — Get script + log
DELETE /api/blender/:id           — Delete script

### User
GET    /api/user/profile          — Get profile + stats
PATCH  /api/user/profile          — Update name/photo

---

## Project Structure

```
realmind-ai/
├── backend/
│   ├── config/          db.js, firebase.js
│   ├── middleware/       auth.js (Firebase token verify)
│   ├── models/           index.js (User, Chat, Image, Script)
│   ├── routes/           chat.js, image.js, blender.js, user.js
│   ├── .env.example
│   └── server.js
└── frontend/
    └── src/
        ├── components/layout/   Layout.jsx, Sidebar.jsx
        ├── pages/               AuthPage, ChatPage, ImagePage, BlenderPage, ProfilePage
        ├── services/            firebase.js, api.js
        └── store/               index.js (Zustand)
```

---

## Free Tier Limits
| Service        | Limit                              |
|----------------|------------------------------------|
| MongoDB Atlas  | 512MB storage, shared cluster      |
| Groq API       | 14,400 req/day, 500K tokens/day    |
| HuggingFace    | Rate limited, ~30s cold start      |
| Firebase Auth  | 10K auth/month                     |
