# Sarkari Karamchari (सरकारी कर्मचारी) 🇮🇳

An Intelligent Hyper-Local Civic Grievance Routing System powered by a cascading Multi-Model AI architecture.

## 🚀 The Problem
Citizens often don't know *which* specific government department or municipal body is responsible for their civic issues (e.g., dead animals, broken streetlights, water leakage). Finding the exact official email address for their specific pincode is incredibly frustrating and time-consuming, leading to unreported issues.

## 💡 Our Solution
**Sarkari Karamchari** acts as an AI bridge between citizens and the government. A citizen simply types their problem in natural language (Hindi, English, or Hinglish) and provides their Pincode. 

Our system:
1. **Understands the Intent:** Uses AI to comprehend the issue (translating Hinglish/Hindi to professional English).
2. **Identifies the Authority:** Accurately determines the exact department (e.g., Sanitation, PWD, Traffic, Forest).
3. **Hyper-Local Routing (The Magic):** Uses a pre-seeded, self-learning database of **1,500+ verified official emails** covering 36 States/UTs and Top Tier-1/Tier-2 cities using a Longest-Prefix-Match algorithm on the Pincode.
4. **Drafts the Email:** Generates a highly professional, formatted email body with exact coordinates and subjects.

## 🧠 Technical Architecture

We built a highly resilient, **fail-proof Multi-Model AI Cascade** to ensure 100% uptime:

- **Database Cache (MongoDB):** 1,500+ hyper-local region mappings for 0.01s lookups (No AI delay).
- **AI Layer 1 (Google Gemini):** Fast, primary categorization and drafting.
- **AI Layer 2 (Groq - Llama-3.3-70b):** Used with an active 5-Key Rotation strategy to completely bypass free-tier rate limits.
- **AI Layer 3 (Local Ollama):** Air-gapped fallback ensuring the system never crashes even if external APIs are down.
- **Automated Web-Scraping:** If a rural Pincode's email isn't in our DB, the AI dynamically generates search queries, scrapes web engines (Google/DuckDuckGo/Brave), extracts the official email, and **auto-saves it to the MongoDB cache** for future users!

## 🛠️ Tech Stack
- **Frontend:** React, TailwindCSS, Lucide Icons (Glassmorphism UI)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose) with Geospatial/Prefix Indexing
- **AI Models:** Gemini 3.5 Flash, Llama-3.3-70b (via Groq), Llama 3.2 (via Ollama)
- **Web Scraping:** Cheerio, Axios

## 📦 How to Run Locally

1. Clone the repository
2. Set up your `.env` file in the `backend` directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   GEMINI_API_KEY=your_gemini_key
   OLLAMA_URL=http://localhost:11434
   ```
3. Run the Hyper-Local Seed Script (Populates the 1,500+ records):
   ```bash
   cd backend
   node seed/seedIndiaHyperLocal.js
   ```
4. Start the Backend and Frontend:
   ```bash
   # Run the provided batch file
   ./start.bat
   ```

## 🏆 Hackathon Highlights
- **Real World Impact:** Solves a genuine pan-India civic problem.
- **Highly Scalable:** The caching mechanism ensures we don't spam AI APIs.
- **Self-Learning DB:** The more it is used in remote areas, the smarter the DB gets via automated web search.
- **Fault-Tolerant:** 3 layers of AI redundancy (Gemini -> Groq -> Local).
