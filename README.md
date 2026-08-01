# SupplySaathi

**Agentic Voice-First Procurement & Financial Inclusion Platform for Micro-Merchants**

![Vite](https://img.shields.io/badge/Vite-8.1.1-646CFF?logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-19.2.7-61DAFB?logo=react&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Edge%20Functions-3ECF8E?logo=supabase&logoColor=white)
![Prava](https://img.shields.io/badge/Prava-Dynamic%20Card%20Protocol-6366F1)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4.3.3-06B6D4?logo=tailwindcss&logoColor=white)

---

<!-- Screenshots captured on mobile via localhost port-forwarding; replace placeholders in ./screenshots/ before final submission -->

## Screenshots

### 1. Main Page — Voice Procurement
![Main Page](./screenshots/01-main-page.png)

### 2. Credit Ledger Dashboard
![Credit Ledger](./screenshots/02-credit-ledger.png)

### 3. Payment Authorization (Connecting to Prava)
![Payment Connecting](./screenshots/03-payment-connecting.png)

### 4. Payment Failure (Real Prava Sandbox Timeout/Error)
![Payment Failed](./screenshots/04-payment-failed.png)

### 5. Fallback Demo Mode Payment
![Fallback Demo Mode](./screenshots/05-fallback-demo-mode.png)

---

## Problem Statement

- **Financial Exclusion**: Millions of rural and semi-urban micro-entrepreneurs in India operate entirely in cash, lacking formal credit scores or GST invoices required by traditional banks.
- **Procurement Friction**: Language barriers and digital complexity prevent small kirana, dairy, and weaver business owners from sourcing raw materials at optimal wholesale rates.
- **Security & Fraud Risk**: Exposing personal debit cards or sharing UPI PINs for automated purchases creates severe vulnerability to fund draining.
- **The Solution**: SupplySaathi combines a native-language voice procurement agent with Prava 1-time dynamic payment cards to automate restocking while building a bank-verifiable Credit Ledger.

---

## Features

### Voice & Agent Intelligence
- **🎙️ Voice-First Procurement Agent**: Speak restock needs in Hindi (`hi-IN`) or English (`en-IN`) using browser-native Web Speech API. Features an interactive 60 FPS animated Voice Orb and tap-to-test voice prompts.
- **🔍 Automated Intent Parsing & Low-Stock Auto-Detect**: Keyword dictionary matching across 8 core commodities (*rice, wheat flour, sugar, pulses, cattle feed, medicine, yarn, dye*). Automatically identifies inventory items falling below reorder thresholds (`current_stock <= reorder_threshold`).
- **⚖️ Weighted Supplier Comparison Algorithm**: Automatically ranks suppliers based on a 60% price and 40% reliability score weighted formula, presenting the optimal choice alongside alternative market quotes.

### Payments & Trust
- **🛡️ Spend Cap Safeguard**: Enforces autonomous safety by checking available monthly spend limits (`user.monthly_limit - running_total_spent`) before purchase authorization.
- **⚡ Prava Agentic Virtual Card Integration**: Integrates Prava's 1-time scoped payment cards via Supabase Edge Functions, keeping financial credentials isolated per transaction.
- **🔄 Transparent Demo-Mode Fallback Safeguard**: Always attempts the real Prava sandbox API first with a 9-second timeout. If unreachable or timing out, displays actual error details and transitions after 1.5 seconds to a local fallback transaction—honestly labeled with **"⚡ Demo Mode"** tags across the modal, receipts, and Credit Ledger.

### Credit Building
- **📊 Verified Credit Ledger & Microfinance Profile**: Automatically tracks verified purchase history, total spend, and transaction counts in PostgreSQL (`credit_ledger`), calculating credit tiers (*Building Record*, *Reliable Kirana*, *Prime Financial Credit*) to support micro-loan applications.

---

## Tech Stack

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | `^19.2.7` | UI component tree & application state management |
| **Build Tool** | Vite | `^8.1.1` | Next-gen frontend tooling and development server |
| **Styling** | Tailwind CSS | `^4.3.3` | Utility-first CSS framework for custom glassmorphism design |
| **Animations** | Framer Motion | `^12.43.0` | Motion library for tab switching and UI entrance transitions |
| **Icons** | Lucide React | `^1.28.0` | Modern UI icon set |
| **Payment Protocol** | Prava SDK | `^0.1.30` | Agentic 1-time dynamic card payment integration |
| **Backend & DB** | Supabase JS Client | `^2.110.8` | Interface for PostgreSQL database and Edge Functions |
| **Database Driver** | PostgreSQL (`pg`) | `^8.22.0` | Driver for database schema migration scripts |
| **Linter** | Oxlint | `^1.71.0` | JavaScript / JSX code quality linter |

---

## Project Structure

```
SupplySaathi-prava/
├── .env.example                  # Environment variable configuration template
├── .gitignore                    # Excludes node_modules, dist, .env, .env.local
├── .oxlintrc.json                # Linter configuration
├── index.html                    # HTML document root
├── package.json                  # Dependencies, scripts, and package metadata
├── vite.config.js                # Vite build config with React plugin
│
├── src/                          # Application source code
│   ├── main.jsx                  # React 19 root entry point
│   ├── App.jsx                   # Main controller, tab router, fallback handler
│   ├── index.css                 # CSS styles, glassmorphism utilities & keyframe animations
│   │
│   ├── agent/                    # Decision engine
│   │   ├── compareSuppliers.js   # 60/40 weighted supplier ranking algorithm
│   │   └── intentParser.js       # Keyword parser & low-stock fallback intent parser
│   │
│   ├── components/               # React UI components
│   │   ├── AgentResult.jsx       # Supplier match result, quantity controls & alternatives matrix
│   │   ├── Dashboard.jsx         # Credit history, spend cap meter, stock monitor & receipts
│   │   ├── PravaCardModal.jsx    # 5-state payment authorization modal with fallback handling
│   │   ├── SupplySaathiLogo.jsx  # SVG brand logo header component
│   │   └── VoiceInput.jsx        # Animated voice orb centerpiece (Web Speech API)
│   │
│   └── lib/                      # Services and data layer
│       ├── demoStore.js          # Resilient in-memory & localStorage fallback data store
│       ├── pravaService.js       # Prava Edge Function client with 9s timeout
│       └── supabaseClient.js     # Supabase JS client initializer
│
└── supabase/                     # Supabase backend
    ├── functions/                # Edge Functions (Deno runtime)
    │   ├── prava-purchase/       # Verifies budget cap & creates Prava v1 session
    │   │   └── index.ts
    │   └── prava-callback/       # Handles Prava checkout webhook callback
    │       └── index.ts
    │
    └── migrations/               # Database schema
        └── 001_schema.sql        # Database schema, RLS, seed data & credit ledger trigger
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### Setup & Launch

1. **Clone the repository**
   ```bash
   git clone https://github.com/omkar-103/supplysaathi.git
   cd supplysaathi
   ```

2. **Install project dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy example template to local environment file
   cp .env.example .env.local
   ```
   *Edit `.env.local` with your credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`). `.env` and `.env.local` are safely excluded by `.gitignore`.*

4. **Initialize Supabase Database**
   ```bash
   # Execute supabase/migrations/001_schema.sql in Supabase SQL Editor
   ```

5. **Deploy Supabase Edge Functions**
   ```bash
   # Deploy purchase and callback edge functions
   supabase functions deploy prava-purchase
   supabase functions deploy prava-callback
   ```

6. **Set Edge Function Secrets**
   ```bash
   # Configure secrets via Supabase CLI
   supabase secrets set SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key PRAVA_SECRET_KEY=your_prava_key
   ```

7. **Start local development server**
   ```bash
   # Launch Vite dev server on http://localhost:5173
   npm run dev
   ```

---

## Payment Flow Note

SupplySaathi always attempts the real Prava sandbox integration first on every transaction. If the Prava sandbox API is unreachable or times out (after 9 seconds), the modal displays the exact error message to the user and, after a 1.5-second visible delay, executes a local fallback payment. This fallback updates the local ledger and inventory, clearly labeling the transaction with **"⚡ Demo Mode"** tags on the modal, receipts, and Credit Ledger. This transparent fallback safeguard prevents dead screens or silent crashes during live demonstrations while maintaining complete honesty.

---

## Known Limitations

- **Single Demo Profile**: The application runs on a single demo profile (`DEMO_USER_ID`) representing *Ramesh Kirana Store*. Multi-user authentication and registration flows are not included.
- **Rule-Based Intent Parsing**: Intent parsing relies on a deterministic keyword dictionary matching algorithm (`intentParser.js`) rather than a live LLM natural language processing endpoint.
- **Static Supplier Catalog**: Supplier records are pre-seeded in the database and local store rather than scraped dynamically from live e-commerce APIs.
- **Browser Speech API Dependency**: Voice input depends on browser-native Web Speech API support (Chrome, Edge, Safari). Tap-to-test buttons are provided for unsupported environments.

---

## Built For

Built for the **Prava Agentic Payments Hackathon** as a working prototype demonstrating agentic procurement and financial inclusion for micro-merchants.
