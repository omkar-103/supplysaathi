import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const PRAVA_SECRET_KEY = Deno.env.get("PRAVA_SECRET_KEY")
const PRAVA_BASE_URL = "https://sandbox.api.prava.space"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { status: 200, headers: corsHeaders })
  }

  try {
    const { user_id, supplier_id, item_name, quantity, amount, reasoning, callback_app_url } = await req.json()

    if (!user_id || !supplier_id || !item_name || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    if (!PRAVA_SECRET_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Prava secret key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("monthly_limit, email")
      .eq("id", user_id)
      .single()

    if (userErr || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: ledger } = await supabase
      .from("credit_ledger")
      .select("running_total_spent")
      .eq("user_id", user_id)
      .single()

    const spent = ledger?.running_total_spent || 0
    const remaining = user.monthly_limit - spent

    if (amount > remaining) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Budget exceeded. ₹${remaining.toFixed(2)} remaining, but ₹${amount.toFixed(2)} needed.`,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { data: supplier, error: supplierErr } = await supabase
      .from("suppliers")
      .select("unit_price")
      .eq("id", supplier_id)
      .single()

    if (supplierErr || !supplier) {
      return new Response(
        JSON.stringify({ success: false, error: "Supplier not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const callbackUrl = new URL(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/prava-callback`)
    if (callback_app_url) {
      callbackUrl.searchParams.set("app_url", callback_app_url)
    }

    const totalAmountPaise = Math.round(amount * 100)
    const qty = quantity || 1
    const unitPricePaise = Math.round((supplier.unit_price || amount / qty) * 100)

    const sessionPayload = {
      user_id,
      user_email: user.email || `${user_id}@supplysaathi.demo`,
      total_amount: totalAmountPaise.toString(),
      currency: "INR",
      purchase_context: [
        {
          name: item_name,
          quantity: qty,
          unit_price: unitPricePaise,
          description: `${item_name} x ${qty}`,
        },
      ],
      integration_type: "full_checkout",
      callback_url: callbackUrl.toString(),
      metadata: {
        user_id,
        supplier_id,
        item_name,
        quantity: qty,
        reason: reasoning || "",
      },
    }

    let sessionData: any = null
    let pravaError = ""

    try {
      const sessionRes = await fetch(`${PRAVA_BASE_URL}/v1/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PRAVA_SECRET_KEY}`,
        },
        body: JSON.stringify(sessionPayload),
      })

      const responseText = await sessionRes.text()
      try {
        sessionData = JSON.parse(responseText)
      } catch {
        sessionData = { raw: responseText }
      }

      if (!sessionRes.ok) {
        pravaError = `Prava returned ${sessionRes.status}: ${responseText.slice(0, 300)}`
        console.error("Prava session error:", pravaError)
        return new Response(
          JSON.stringify({ success: false, error: pravaError }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }
    } catch (pravaErr) {
      pravaError = pravaErr.message || "Prava API unreachable"
      console.error("Prava API call failed:", pravaError)
      return new Response(
        JSON.stringify({ success: false, error: pravaError }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const sessionToken = sessionData?.session_token || sessionData?.token || sessionData?.session_id || sessionData?.id
    const iframeUrl = sessionData?.iframe_url || sessionData?.url || sessionData?.checkout_url || sessionData?.hosted_url || sessionData?.redirect_url
    const checkoutUrl = sessionToken && iframeUrl
      ? `${iframeUrl}${iframeUrl.includes("?") ? "&" : "?"}session_token=${encodeURIComponent(sessionToken)}`
      : iframeUrl

    if (!checkoutUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Prava did not return a checkout URL", raw: sessionData }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const { error: txnErr } = await supabase.from("transactions").insert({
      user_id,
      supplier_id,
      item_name,
      amount,
      quantity: qty,
      prava_txn_id: sessionToken || sessionData?.id || null,
      status: "pending",
      reasoning,
    })

    if (txnErr) {
      console.error("Transaction insert error:", txnErr)
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save transaction" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: "pending",
        checkout_url: checkoutUrl,
        session_token: sessionToken || null,
        amount,
        reasoning,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err) {
    console.error("Edge Function error:", err)
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
