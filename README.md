# 🎬 MovieMeter Mini App

**MovieMeter** is a Farcaster Mini App that lets users vote **Yes** or **No** on movies — right from Warpcast or any Farcaster-enabled client. Built to be fun, fast, and rewarding.

> 🧪 Live Preview: [https://moviemeter.io](https://moviemeter.io)  
> 🟣 Warpcast Dev Tool: [Preview on Warpcast](https://warpcast.com/~/developers/mini-apps/debug)

---

## 🚀 Features

- ✅ Vote YES or NO on any movie
- 🎥 Discover trending movies
- 🪙 Earn **cUSD** and **GoodDollar** rewards for participation
- 🔐 Soulbound Token (SBT) identity protection
- 🟣 Fully embedded as a Farcaster Mini App
- 📤 Shareable cast embeds with live voting

---

## 🛠️ Tech Stack

- ⚛️ React + Tailwind CSS
- ⛓️ Thirdweb Smart Contracts (Celo Alfajores)
- 🟣 `@farcaster/frame-sdk`
- 🔑 Wagmi + Ethers.js for wallet interaction
- 🌐 Deployed on [https://moviemeter.io](https://moviemeter.io)

---

## 💻 Local Development

```bash
git clone https://github.com/GideonNut/Moviemeterminiapp.git
cd Moviemeterminiapp
npm install
npm run dev
---

## 🔧 Environment Variables

Create a `.env.local` (or supply the same values in your hosting provider) with your Firebase + TMDB credentials. The Firebase keys below come directly from your project settings → Web App.

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:abcdef123456
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id", ...}
TMDB_API_KEY=your_tmdb_v4_read_access_token
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
ADMIN_PASSCODE=your_admin_passcode
```

Notes:
- `FIREBASE_SERVICE_ACCOUNT_KEY` should be the JSON service account (stringified) used by `firebase-admin` for server actions. You can obtain it from the Firebase console under **Project Settings → Service Accounts**.
- TMDb uses the v4 API Read Access Token (Bearer).
- `ADMIN_PASSCODE` protects all `/admin` pages and `/api/admin/*` routes. Set a strong value in production. (`ADMIN_STATS_PASSCODE` is still accepted as a legacy alias.)

## 🗄️ Database Setup

MovieMeter now uses **Firebase Firestore** for all persisted data (movies, TV shows, votes, comments, watchlists, notification tokens, and user points). The SDKs in `src/lib/firebase.ts` (client) and `src/lib/firebase-admin.ts` (server) handle initialization.

Key collections created automatically:
- `movies` & `tvShows` – canonical media metadata and vote counts.
- `userVotes` – per-user history so we can prevent duplicate votes.
- `comments` – threaded comments + replies for each item.
- `watchlist` – wallet-specific watchlists.
- `userPoints` – aggregated engagement points (votes/comments).
- `notifications` – Farcaster notification tokens.

### Testing Database Connectivity

```bash
npm run test-db
```

This command runs a lightweight Firestore ping plus TMDB image URL checks so you can verify credentials quickly.

