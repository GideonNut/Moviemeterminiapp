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

Create a `.env.local` in the project root and add:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/moviemetrer?retryWrites=true&w=majority&ssl=true
TMDB_API_KEY=your_tmdb_v4_read_access_token
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

Notes:
- **MongoDB**: Use the connection string from your MongoDB Atlas cluster. The app now uses Mongoose for better connection management and schema validation.
- **TMDb**: Use the v4 API Read Access Token (Bearer).
- **MongoDB is required** - the app has been migrated from in-memory/KV storage to use Mongoose with MongoDB Atlas.

## 🗄️ Database Setup

The app now uses **Mongoose** with the following schemas:

- **Movies**: Store movie information with voting data
- **Votes**: Track individual votes with timestamps
- **Notifications**: Store user notification preferences

### Testing Database Connection

To test your MongoDB connection:

```bash
npm run test-db
```

This will verify that your MongoDB connection string is working correctly.

### Database Collections

The app will automatically create these collections in your MongoDB database:
- `movies` - Movie information and vote counts
- `votes` - Individual vote records
- `notifications` - User notification settings

