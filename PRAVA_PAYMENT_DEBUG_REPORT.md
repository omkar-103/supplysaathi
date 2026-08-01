# Prava Payment Gateway End-to-End Debug Report

**Debug Date:** August 1, 2026  
**Auditor Role:** Senior Full-Stack Engineer, DevOps Engineer, QA Engineer, Solutions Architect  
**Investigation Target:** Prava Payment Integration & Sandbox Dashboard Synchronization

---

## Executive Summary & Root Cause

An end-to-end trace of the Prava payment pipeline revealed why the UI previously rendered a "Payment Settled!" confirmation card while the Prava Sandbox Dashboard displayed **0 Total Orders, 0 Total Transactions, and $0 Total Volume**.

### Key Findings

1. **Local Random Token Generator (Deceptive Fallback)**:
   In [`src/lib/pravaService.js`](file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/src/lib/pravaService.js) line 18, `processPravaPayment` generated a pseudo session token using `prv_live_${Math.random().toString(36)...}` and card digits `4111 •••• •••• ${Math.floor(1000 + Math.random() * 9000)}`.
2. **Failure Swallowing**:
   When the frontend called the Supabase Edge Function `prava-purchase`, the Edge Function received HTTP 401 (`AUTH_1001: Invalid API key`) from `https://api.prava.space/v1/sessions`. The Edge Function returned `{ success: false, error: "Prava returned 401..." }` with HTTP 200. The frontend evaluated `if (data?.success)`, which failed, and silently dropped execution into the client-side fallback engine (`demoStore.addTransaction()`), returning a fake settled payment object to the UI.
3. **Prava Server API Key Rejection**:
   The live Prava API server (`https://api.prava.space/v1/sessions`) rejects both `sk_test_...` and `pk_test_...` with:
   ```json
   {"error":{"code":"AUTH_1001","message":"Invalid API key"}}
   ```

---

## Detailed Codebase Audit (Affected Files)

| File | Problem Location | Architectural Role | Issue Description |
|---|---|---|---|
| [`src/lib/pravaService.js`](file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/src/lib/pravaService.js) | Line 18–105 | Payment Service | Swallowed Prava Edge Function failures and generated fake `prv_live_...` session tokens via `Math.random()`. |
| [`src/components/PravaCardModal.jsx`](file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/src/components/PravaCardModal.jsx) | Line 91, 167–176 | Modal UI | Displayed random credit card numbers and mock receipt cards regardless of Prava API response. |
| [`supabase/functions/prava-purchase/index.ts`](file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/supabase/functions/prava-purchase/index.ts) | Line 140–155 | Deno Edge Function | Captured Prava 401 error and returned `{ success: false, error: ... }` with HTTP 200 OK. |

---

## Architectural Changes Implemented (Before vs. After)

### Before (Simulated Fallback Flow)
```
User Click "Pay with Prava"
  └─> processPravaPayment()
        └─> Calls Edge Function prava-purchase
              └─> Prava API returns 401 Unauthorized
        └─> Edge Function returns success: false
        └─> praveService.js catches success: false
        └─> Generates fake token: prv_live_9a82f7c1 (Math.random)
        └─> Renders "Payment Settled!" UI (False Positive)
```

### After (Strict Gateway Flow)
```
User Click "Pay with Prava"
  └─> processPravaPayment()
        └─> Calls Edge Function prava-purchase
              └─> Prava API returns 401 / Response error
        └─> Edge Function returns success: false
        └─> processPravaPayment throws explicit Error:
            "Prava Gateway Error: Prava returned 401: Invalid API key"
        └─> UI displays exact Prava API failure message to user
```

---

## Network & API Trace Logs

### Request 1: Prava Edge Function Call
- **Endpoint:** `POST https://jeetdktgoorivrwsgvox.supabase.co/functions/v1/prava-purchase`
- **Headers:** `Authorization: Bearer sb_publishable_...`
- **Body:**
  ```json
  {
    "user_id": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    "supplier_id": "43677a0f-650f-4173-bfef-37aafbfd99f4",
    "item_name": "rice",
    "quantity": 10,
    "amount": 500,
    "reasoning": "Test order"
  }
  ```

### Request 2: Edge Function -> Prava Upstream API
- **Endpoint:** `POST https://api.prava.space/v1/sessions`
- **Headers:** `Authorization: Bearer sk_test_...`
- **Response Status:** `HTTP 401 Unauthorized`
- **Response Body:**
  ```json
  {
    "error": {
      "code": "AUTH_1001",
      "message": "Invalid API key"
    }
  }
  ```

---

## Supabase Database State Verification

Database table queries against `https://jeetdktgoorivrwsgvox.supabase.co`:

- **`users` Table:** 1 verified user (`a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11` - Ramesh Kirana).
- **`suppliers` Table:** 22 active market suppliers.
- **`inventory` Table:** 4 commodities (`rice`, `wheat flour`, `sugar`, `pulses`).
- **`transactions` Table:** RLS policies and Service Role inserts verified.
- **`credit_ledger` Table:** PostgreSQL trigger `trg_update_credit_ledger` verified.

---

## Verification & Final Build Status

- **Linter (`npm run lint`):** **0 errors, 0 warnings** across all 15 files.
- **Production Build (`npm run build`):** **✓ Built cleanly in 369ms** (`dist/assets/index-0ejR0JdO.js`).

---

## Next Steps to Activate Live Prava Transactions

To enable real sandbox transactions to appear in your Prava Dashboard (increasing Total Orders, Volume, and decreasing Sandbox Count):

1. Log into your **Prava Dashboard** at `https://prava.space`.
2. Generate an active, unexpired **Secret Key** (`sk_test_...`).
3. Update `.env`:
   ```env
   PRAVA_SECRET_KEY=sk_test_YOUR_VALID_KEY_HERE
   ```
4. Deploy to Supabase Edge Function secrets:
   ```bash
   npx supabase secrets set PRAVA_SECRET_KEY=sk_test_YOUR_VALID_KEY_HERE --project-ref jeetdktgoorivrwsgvox
   ```
