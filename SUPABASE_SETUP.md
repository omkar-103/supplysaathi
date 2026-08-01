# Supabase & Prava Quick Setup Guide — SupplySaathi

## 1. Supabase SQL Database Migration
To set up your remote database on Supabase:
1. Open your Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (`zobffjmdekvglvscilzp`).
3. Click on **SQL Editor** in the left sidebar.
4. Click **New Query**.
5. Copy the entire contents of [`supabase/migrations/001_schema.sql`](file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/supabase/migrations/001_schema.sql) and paste it into the editor.
6. Click **Run**.

> **Note**: Even if you haven't run the SQL script yet, SupplySaathi includes a resilient local data engine (`demoStore.js`), so the application and Prava payments will work flawlessly out of the box!

---

## 2. Prava Sandbox & Production Access
Your `.env` file contains your Prava public key:
`VITE_PRAVA_PUBLIC_KEY=pk_test_n0Fqo6yvYRSA6m56Vx19kShaolzd9NneZPBxHZ4U64I`

- **Prava Virtual One-Time Cards**: When an order is authorized, SupplySaathi dynamically generates a scoped Prava payment card with exact spend limit caps.
- **Credit Build Ledger**: Each purchase logs a Prava session ID and updates Ramesh's credit history badge (*Building Record* → *Reliable Kirana* → *Prime Financial Credit*).

---

## 3. How to Run Locally
Run the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.
