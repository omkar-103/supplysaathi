# SupplySaathi — Demo Script

## Opening (30s)
"SupplySaathi is a voice-first procurement agent for India's 12 million kirana store owners, dairy farmers, and weavers — people who've never had access to a formal financial system.

Ramesh runs a kirana store in Lucknow. He's never had a credit card, a loan, or any financial record. Every day he speaks his restock needs to SupplySaathi."

## Demo Flow

### 1. Voice Input
Tap the mic, say:
- **Hindi:** "Stock khatam ho raha hai" (stock is running out)
- **Hindi:** "Chawal aur cheeni chahiye" (need rice and sugar)
- **English:** "Rice is low"

The agent transcribes and identifies the items.

### 2. Agent Intelligence
SupplySaathi:
1. Checks Ramesh's inventory — sees rice is at 8 units (below 10-unit reorder threshold)
2. Queries all suppliers in the database
3. Compares them using a weighted score (60% price, 40% reliability)
4. Picks **Best Price** (₹50/unit, 4.7★ reliability) over Agra Grains (₹52/unit, 4.5★)
5. Generates reasoning: "Chose Best Price — ₹50/unit, reliability 4.7/5"

### 3. Confirmation Card
A clean card shows Ramesh:
- What: Rice, 10 units
- Supplier: Best Price
- Total: ₹500
- Remaining monthly budget: ₹9,500 / ₹10,000
- Clear "Pay with Prava" button

### 4. Real Payment via Prava
On confirm, SupplySaathi calls a Supabase Edge Function that:
1. Validates Ramesh hasn't exceeded his monthly spend cap
2. Calls Prava's API server-side (secret key never exposed to frontend)
3. Executes the purchase and receives a Prava transaction ID
4. Writes to the transactions table
5. Updates the credit ledger

### 5. Credit Ledger (The Differentiator)
Open the dashboard to show:
- **Running total spent:** ₹500 / ₹10,000
- **Transaction count:** 1
- **Credit profile badge:** "Building" → "Reliable" → "Very Reliable"
- **Recent transactions** with Prava IDs and supplier details

**Why this matters:** After 6 months of regular SupplySaathi use, Ramesh now has a verifiable financial history. A bank or microfinance institution can see that he's consistently purchased inventory, stayed within budget, and transacted responsibly. This is his first ever credit record — and it was built entirely through voice.

## Closing
"SupplySaathi turns every daily purchase into a step toward financial inclusion. The agent does the hard work — comparing suppliers, staying within budgets, building records — so the shop owner can focus on running their business. And Prava makes it real: every transaction is traceable, verifiable, and creditworthy."
