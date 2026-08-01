# SupplySaathi — Step-by-Step Integration Fix Guide

**Document Version:** 1.0.0  
**Target Audience:** Developers & System Administrators  
**Project Status:** 🟡 Partially Working (Resilient Local Demo Engine Active)

This guide provides the exact steps required to resolve all findings from the full system health check, connect a real Supabase cloud project, configure live Prava payment API credentials, and eliminate all linter warnings.

---

## Table of Issues & Root Cause Summary

| Issue ID | Category | Problem | Root Cause | Priority |
|---|---|---|---|---|
| **ISSUE-1** | Supabase DB | Remote Supabase URL returns DNS lookup failure | `.env` contains mock project ID `zobffjmdekvglvscilzp` | **Critical** |
| **ISSUE-2** | Prava API | Prava API returns `401 Invalid API key` | Key `pk_test_n0Fqo6y...` is expired or invalid for `api.prava.space` | **High** |
| **ISSUE-3** | Env Config | `.env.example` file is missing | Environment template was not created for developers | **Medium** |
| **ISSUE-4** | Linter | 4 ESLint/Oxlint warnings in JS/JSX files | Unused variables & non-standard boolean expression syntax | **Low** |

---

## Step-by-Step Action Plan (Execution Order)

Follow these steps in numerical order.

---

### Step 1: Create a Valid Supabase Project & Update `.env`

#### 1.1 Create Supabase Project
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New Project** and select your Organization.
3. Note down your **Project URL** (e.g., `https://your-project-id.supabase.co`) and **Anon API Key** (e.g., `eyJhbGci...`).
4. Note down your **Service Role Key** (for Edge Functions).

#### 1.2 Run Migration
1. Go to **SQL Editor** in your Supabase Dashboard.
2. Open [`supabase/migrations/001_schema.sql`](file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/supabase/migrations/001_schema.sql).
3. Paste the contents into the SQL Editor and click **Run**.

#### 1.3 Update Environment File [`.env`](file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/.env)
Update `.env` with your real keys:

```env
VITE_SUPABASE_URL=https://<your-real-project-id>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-real-anon-key>
VITE_PRAVA_PUBLIC_KEY=<your-valid-prava-key>
```

---

### Step 2: Create `.env.example`

Create [`file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/.env.example`](file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/.env.example) to standardize developer setup:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# Prava Payment Gateway
VITE_PRAVA_PUBLIC_KEY=your-prava-public-key-here
```

---

### Step 3: Configure Prava Sandbox API Credentials

1. Sign in to your **Prava Developer Dashboard** at `https://prava.space`.
2. Generate a valid **Public Test Key** (`pk_test_...`) and **Secret Test Key** (`sk_test_...`).
3. Update `VITE_PRAVA_PUBLIC_KEY` in `.env`.
4. Deploy Supabase Edge Functions with secret keys:
   ```bash
   npx supabase secrets set PRAVA_SECRET_KEY=sk_test_... --project-ref <your-project-id>
   npx supabase functions deploy prava-purchase --project-ref <your-project-id>
   npx supabase functions deploy prava-callback --project-ref <your-project-id>
   ```

---

### Step 4: Fix Code Linter Warnings

#### Fix 1: [`src/lib/pravaService.js`](file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/src/lib/pravaService.js) (Line 5)
Pass `PRAVA_PUBLIC_KEY` in the headers if making client requests or remove unused constant.

#### Fix 2: [`src/components/PravaCardModal.jsx`](file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/src/components/PravaCardModal.jsx) (Line 10)
Remove unused prop `reasoning` or display it in order breakdown.

#### Fix 3: [`src/components/AgentResult.jsx`](file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/src/components/AgentResult.jsx) (Line 24)
Replace shortcut expression with standard conditional:
```js
if (onQuantityChange) {
  onQuantityChange(val)
}
```

#### Fix 4: [`src/components/VoiceInput.jsx`](file:///c:/Users/Nishita/OneDrive/Desktop/SupplySaathi-prava/src/components/VoiceInput.jsx) (Line 65)
Replace shortcut expression with standard conditional:
```js
if (onTranscript) {
  onTranscript(transcript)
}
```

---

## Verification Commands

After applying the fixes, run the following commands to confirm everything builds and passes cleanly:

```bash
# 1. Run Linter
npm run lint

# 2. Test Production Build
npm run build

# 3. Test Dev Server
npm run dev
```

---

## Summary of Verification Criteria

- [ ] `npm run lint` finishes with **0 errors and 0 warnings**.
- [ ] `npm run build` generates `/dist` bundle cleanly.
- [ ] Supabase network requests return HTTP 200/201 without DNS errors.
- [ ] Prava API returns session tokens successfully.
