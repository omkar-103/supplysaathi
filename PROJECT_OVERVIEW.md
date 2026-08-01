# PROJECT OVERVIEW — SupplySaathi

> **SupplySaathi** is an agentic, voice-first procurement & financial inclusion platform built for India's unbanked micro-merchants (kirana store owners, dairy farmers, and handloom weavers). It enables voice-driven inventory restocking powered by Prava dynamic one-time payment cards while building a verified credit ledger to unlock formal micro-financing.

---

## 1. Problem Statement

### Who This Is For
Millions of rural and semi-urban micro-entrepreneurs across India—such as local kirana shopkeepers, small-scale dairy farmers, and weaver artisans—operate almost entirely in cash or informal credit.

### The Problem
1. **No Formal Financial Footprint**: Traditional banks and NBFCs reject working capital loan applications because micro-merchants lack formal credit scores, GST invoices, or structured banking history.
2. **Friction in Procurement**: Language barriers, complex apps, and digital illiteracy prevent micro-merchants from sourcing raw materials at optimal wholesale rates.
3. **High Security & Fraud Risk**: Exposing personal debit/credit cards or sharing UPI PINs for agentic transactions risks fund draining or unauthorized charges.

### Why It Matters
By combining a **voice-first interface** with **agentic Prava dynamic cards**, SupplySaathi allows shopkeepers to restock inventory effortlessly in their native language while automatically building an audit-proof, bank-verifiable transaction history (Credit Ledger).

---

## 2. What We Focused On

### The Core Bet
Voice procurement simplifies ordering, but the **Credit Ledger** is the long-term value driver. 

An AI agent that merely orders goods is a utility; an AI agent that converts daily restocking activities into a **verifiable credit profile** is a financial inclusion platform. Every completed restock updates the merchant's credit record, moving them closer to pre-approved micro-loans from MFI credit partners.

---

## 3. Full User Flow

### 1. Onboarding & Arrival
- The application loads directly into the main interface using a single demo profile (`DEMO_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'`, representing *Ramesh Kirana Store*).
- *Note*: There is currently no active user signup or authentication flow; user state initializes from Supabase or the resilient fallback store (`demoStore.js`).

### 2. Voice Input Capture
- Handled by `src/components/VoiceInput.jsx`.
- Uses the browser's native Web Speech API (`window.SpeechRecognition || window.webkitSpeechRecognition`).
- Supports language switching between **Hindi (`hi-IN`)** and **English (`en-IN`)**.
- Renders an interactive, 60 FPS animated Voice Orb with ambient particle effects and pulse states (`LISTENING`, `PROCESSING`, `TAP TO TALK`).
- Provides tap-to-test sample prompt buttons (e.g., *"Chawal khatam ho raha hai"*, *"Chini 10kg chahiye"*).

### 3. Intent Parsing
- Implemented in `src/agent/intentParser.js`.
- Uses keyword dictionary matching (`ITEM_KEYWORDS`) across 8 supported commodities:
  - `rice` (*chawal*, *chaval*, *rice*)
  - `wheat flour` (*atta*, *flour*, *gehun*)
  - `sugar` (*chini*, *cheeni*)
  - `pulses` (*dal*, *daal*, *masoor*, *moong*, *chana*)
  - `cattle feed` (*feed*, *chara*, *gau*, *pashu*)
  - `medicine` (*dawai*, *dava*, *vaccine*)
  - `yarn` (*thread*, *dhaga*, *sutra*)
  - `dye` (*colour*, *color*, *rang*)
- If no specific commodity keyword is matched, the parser checks for low-stock signal phrases (`LOW_STOCK_SIGNALS`: *khatam*, *kam*, *low*, *restock*, etc.) and automatically selects all inventory items where `current_stock <= reorder_threshold`.

### 4. Supplier Comparison Algorithm
- Implemented in `src/agent/compareSuppliers.js`.
- Evaluates matching suppliers using a weighted scoring formula:
  $$\text{Price Score} = 1 - \frac{\text{unit\_price}}{\text{max\_price}}$$
  $$\text{Reliability Score} = \frac{\text{reliability\_score} - \text{min\_reliability}}{\text{max\_reliability} - \text{min\_reliability}}$$
  $$\text{Total Score} = (0.6 \times \text{Price Score}) + (0.4 \times \text{Reliability Score})$$
- Sorts suppliers by `totalScore` descending, selecting the top match while returning lower-ranked suppliers as alternatives.
- Generates a human-readable reasoning summary (e.g., *"Chose Best Price Wholesale — ₹50/unit, 2 others considered, reliability 4.7/5"*).

### 5. Confirmation & AI Matrix Display
- Rendered by `src/components/AgentResult.jsx`.
- Displays commodity details, unit pricing, supplier reliability, and quantity adjustment controls (`+` / `-`).
- Features a collapsible accordion (*"COMPARE OTHER MARKET SUPPLIERS"*) showing price differentials.
- Enforces an automated **Spend Cap Safeguard**: Checks if `totalAmount > (user.monthly_limit - running_total_spent)`. If exceeded, the purchase button is disabled with a prominent warning banner.

### 6. Payment Authorization Flow (Real Prava First)
- Handled via `src/components/PravaCardModal.jsx` and `src/lib/pravaService.js`.
- Clicking *"Authorize & Pay"* sets modal state to `connecting` (displays spinner + *"Connecting to Prava..."*).
- `processPravaPayment()` issues a `POST` request to the Supabase Edge Function `prava-purchase`:
  ```json
  POST /functions/v1/prava-purchase
  {
    "user_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "supplier_id": "sup-3",
    "item_name": "rice",
    "quantity": 10,
    "amount": 500,
    "reasoning": "Chose Best Price Wholesale — ₹50/unit...",
    "callback_app_url": "http://localhost:5173"
  }
  ```
- The Edge Function verifies budget limit in PostgreSQL and calls Prava Sandbox API (`POST https://sandbox.api.prava.space/v1/sessions`) with `PRAVA_SECRET_KEY`.
- Prava creates a merchant-isolated, 1-time virtual card session and returns a checkout session token.
- The request runs with a 9-second `AbortController` timeout.

### 7. Fallback Payment Flow (Sandbox Down / Timeout)
- If the real Prava API call fails or times out after 9 seconds:
  1. Modal state transitions to `failed_fallback`.
  2. Displays an honest red error banner detailing the failure reason.
  3. Displays an amber loading indicator: *"Using demo payment method (Prava sandbox unavailable) — simulating transaction for demo purposes"*.
  4. After a **1.5-second visible delay** (allowing judges to see the real attempt failed), `handleFallbackPayment()` triggers.
  5. Local fallback inserts a transaction row with `prava_txn_id: 'DEMO-FALLBACK-' + Date.now()`, updates the local ledger, and increases inventory stock in `demoStore.js`.
  6. Displays `demo_success` state in modal with a distinct **"⚡ Demo Mode — Simulated for Demo"** amber badge.
  7. In `Dashboard.jsx`, fallback transactions display an amber `⚡ Demo Mode` badge and `(Simulated for demo)` tag next to the transaction ID.

### 8. Credit Ledger Database Update
- **PostgreSQL Database Level** (`001_schema.sql`):
  A database trigger `trg_update_credit_ledger` fires `AFTER INSERT ON transactions`:
  ```sql
  CREATE OR REPLACE FUNCTION update_credit_ledger()
  RETURNS TRIGGER AS $$
  BEGIN
    IF NEW.status = 'success' THEN
      INSERT INTO credit_ledger (user_id, running_total_spent, txn_count, updated_at)
      VALUES (NEW.user_id, NEW.amount, 1, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        running_total_spent = credit_ledger.running_total_spent + EXCLUDED.running_total_spent,
        txn_count = credit_ledger.txn_count + 1,
        updated_at = NOW();
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```
- **Local Application Level** (`demoStore.js`):
  Atomically updates `running_total_spent` and `txn_count`, and increments inventory `current_stock` for the ordered item.

---

## 4. Project Structure

```
SupplySaathi-prava/
├── .env.example                  # Template for required environment variables
├── .gitignore                    # Excludes node_modules, dist, .env, .env.local
├── .oxlintrc.json                # Oxlint linter configuration
├── index.html                    # Single page HTML entry point
├── package.json                  # Project dependencies & scripts
├── vite.config.js                # Vite build configuration with React plugin
│
├── src/                          # Application source code
│   ├── main.jsx                  # React 19 root renderer
│   ├── App.jsx                   # Main application state, tab router, fallback handler
│   ├── index.css                 # Tailwind v4 styles, glassmorphism, animations & mobile query
│   │
│   ├── agent/                    # Core agentic decision logic
│   │   ├── compareSuppliers.js   # 60/40 weighted supplier ranking algorithm
│   │   └── intentParser.js       # Keyword parser & low-stock fallback intent parser
│   │
│   ├── components/               # React UI components
│   │   ├── AgentResult.jsx       # AI supplier match card, quantity editor & alternatives matrix
│   │   ├── Dashboard.jsx         # Credit history metrics, spend limit progress bar & receipts
│   │   ├── PravaCardModal.jsx    # 5-state payment authorization modal with fallback handling
│   │   ├── SupplySaathiLogo.jsx  # SVG brand logo header component
│   │   └── VoiceInput.jsx        # Animated voice orb centerpiece (Web Speech API)
│   │
│   └── lib/                      # Service wrappers and data stores
│       ├── demoStore.js          # Resilient in-memory & localStorage fallback data store
│       ├── pravaService.js       # Prava Edge Function client with 9s timeout
│       └── supabaseClient.js     # Supabase JS SDK client instance
│
└── supabase/                     # Supabase backend configuration
    ├── functions/                # Edge Functions (Deno runtime)
    │   ├── prava-purchase/       # Verifies budget cap & creates Prava v1 session
    │   │   └── index.ts
    │   └── prava-callback/       # Prava session result webhook callback
    │       └── index.ts
    │
    └── migrations/               # Database schema definition
        └── 001_schema.sql        # Tables, RLS policies, seed data & credit ledger trigger
```

---

## 5. Tech Stack

| Package / Technology | Version | Purpose |
|---|---|---|
| **React** | `^19.2.7` | UI library for component state and view rendering |
| **Vite** | `^8.1.1` | Modern frontend build tool and development server |
| **Tailwind CSS** | `^4.3.3` | Utility-first CSS framework for glassmorphism styling |
| **Framer Motion** | `^12.43.0` | Motion library for tab switching and entrance animations |
| **Lucide React** | `^1.28.0` | UI icons |
| **Prava SDK** | `^0.1.30` | Official Prava payment protocol SDK |
| **Supabase JS** | `^2.110.8` | Client for Supabase Postgres database and Edge Functions |
| **PostgreSQL (`pg`)** | `^8.22.0` | Database driver for Supabase migrations |
| **Oxlint** | `^1.71.0` | High-performance JavaScript code linter |

---

## 6. Environment Variables

### Frontend Environment Variables (`.env` / `.env.local`)
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

### Supabase Edge Function Secrets (Configured via Supabase CLI / Dashboard)
```env
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
PRAVA_SECRET_KEY=your-prava-sandbox-secret-key
```

> **Security Confirmation**: `.env` and `.env.local` are explicitly listed in `.gitignore` and are excluded from version control before repository uploads. Real API keys are never hardcoded in source files.

---

## 7. Known Limitations

To maintain full transparency, the following features are deliberately simplified or not implemented in the current scope:

1. **Single User Profile**: The app operates under a single demo user profile (`DEMO_USER_ID`). Full multi-tenant authentication (signup, login, JWT session management) is not built.
2. **Rule-Based Intent Parsing**: The intent parser uses deterministic keyword dictionary matching (`intentParser.js`) rather than a live LLM endpoint for parsing complex conversational phrasing.
3. **Static Supplier Catalog**: Suppliers are pre-seeded in the database (`001_schema.sql`) and `demoStore.js`, rather than scraped from live e-commerce APIs in real-time.
4. **Browser Speech API Dependency**: Voice input relies on browser-native Web Speech API support (supported natively in Chrome, Edge, and Safari). Tap-to-test buttons are provided as fallbacks for unsupported environments.
