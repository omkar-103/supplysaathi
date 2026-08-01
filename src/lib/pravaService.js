// Prava Payment Engine Service

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const PRAVA_TIMEOUT_MS = 9000 // 9 seconds — generous but won't hang the demo

export async function processPravaPayment({
  userId,
  supplierId,
  _supplierName,
  itemName,
  quantity,
  amount,
  reasoning,
  callbackUrl,
}) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY) are missing.')
  }

  // AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), PRAVA_TIMEOUT_MS)

  try {
    // Call Supabase Edge Function to initiate real Prava Payment Session
    const response = await fetch(`${SUPABASE_URL}/functions/v1/prava-purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        user_id: userId,
        supplier_id: supplierId,
        item_name: itemName,
        quantity,
        amount,
        reasoning,
        callback_app_url: callbackUrl || window.location.href,
      }),
      signal: controller.signal,
    })

    const data = await response.json()

    if (!response.ok || !data?.success) {
      const errorMsg = data?.error || `Payment gateway call failed with status ${response.status}`
      console.error('Prava API Payment Error:', errorMsg)
      throw new Error(`Prava Gateway Error: ${errorMsg}`)
    }

    // Real Prava checkout session returned
    return {
      success: true,
      mode: 'prava_live',
      session_token: data.session_token,
      checkout_url: data.checkout_url,
      amount,
      reasoning,
      timestamp: new Date().toISOString(),
      message: 'Real Prava payment session created successfully!',
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Prava sandbox timed out after 9 seconds — connection unreachable.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

