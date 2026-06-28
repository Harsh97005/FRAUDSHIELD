# FRAUDSHIELD AI 🛡️

A production-ready full-stack **Fraud / Scam Message Detection System** powered by AI-based NLP analysis.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- Firebase project (optional — Demo Mode works without it)

---

## ⚙️ Setup

### 1. Clone / Open the project
```
cd c:\Users\dell\Desktop\scamtext
```

### 2. Backend Setup
```bash
cd backend
npm install
# Copy env (already done)
# Edit .env if needed
npm run dev
# Backend runs on http://localhost:3001
```

### 3. Frontend Setup
```bash
cd frontend
npm install
# Configure Firebase (optional)
cp .env.example .env
# Edit .env with your Firebase credentials
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔥 Firebase Setup (Optional)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Add a **Web App** → copy the config
4. Enable **Authentication** → Google + Email/Password
5. Enable **Firestore Database**
6. Add Firestore security rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /scans/{scanId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```
7. Paste your config into `frontend/.env`

> **Without Firebase:** The app runs in Demo Mode — full analysis works, but history isn't persisted.

---

## 🏗️ Architecture

```
scamtext/
├── frontend/          # React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/     # LandingPage, AuthPage, DashboardPage, HistoryPage
│       ├── components/ # Reusable UI components
│       ├── context/   # AuthContext
│       └── firebase/  # Firebase config
└── backend/           # Node.js + Express
    └── src/
        ├── engine/    # fraudDetector.js — NLP engine
        └── routes/    # analyze.js — REST API
```

## 📡 API

### `POST /api/analyze`
```json
// Request
{ "message": "Your suspicious message here" }

// Response
{
  "success": true,
  "result": "FRAUD",
  "score": 87,
  "risk": "high",
  "explanation": "...",
  "suspiciousWords": ["otp", "click here", "verify"],
  "detectionDetails": { ... }
}
```

### `GET /api/health`
Returns backend status.

---

## 🎨 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Auth | Firebase Authentication |
| Database | Firebase Firestore |
| AI Engine | Custom JS NLP (rule-based) |
| UI | Glassmorphism, Framer Motion |

---

## 🛡️ Features

- ✅ Real-time fraud message analysis
- ✅ Confidence score (0–100%) with animated ring
- ✅ Risk level: Low / Medium / High
- ✅ Suspicious word highlighting
- ✅ Scan history with search & filter
- ✅ Firebase Auth (Google + Email)
- ✅ Demo Mode (no Firebase needed)
- ✅ Mobile responsive
- ✅ Rate limiting & security headers
