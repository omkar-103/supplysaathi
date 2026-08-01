import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const PRAVA_SECRET_KEY = Deno.env.get("PRAVA_SECRET_KEY")
const PRAVA_BASE_URL = "https://sandbox.api.prava.space"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", { status: 200, headers: corsHeaders })
  }

  const url = new URL(req.url)
  const sessionToken = url.searchParams.get("session_token")
  const appUrl = url.searchParams.get("app_url") || "https://supplysaathi.vercel.app"

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    if (!sessionToken) {
      return redirectWithMessage(appUrl, "No session token from Prava")
    }

    let status = "success"

    if (PRAVA_SECRET_KEY) {
      try {
        const resultRes = await fetch(`${PRAVA_BASE_URL}/v1/sessions/${encodeURIComponent(sessionToken)}/result`, {
          headers: { Authorization: `Bearer ${PRAVA_SECRET_KEY}` },
        })
        if (resultRes.ok) {
          const resultData = await resultRes.json()
          status = resultData?.status || resultData?.payment_status || "success"
        } else {
          console.error("Prava result error:", await resultRes.text())
        }
      } catch (err) {
        console.error("Could not fetch Prava result:", err)
      }
    }

    const { data: txn } = await supabase
      .from("transactions")
      .select("id")
      .eq("prava_txn_id", sessionToken)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (txn) {
      await supabase.from("transactions").update({ status }).eq("id", txn.id)
    }

    return redirectWithMessage(appUrl, `Payment ${status}. You can close this tab.`)
  } catch (err) {
    console.error("Callback error:", err)
    return redirectWithMessage(appUrl, "Payment status update failed")
  }
})

function redirectWithMessage(appUrl: string, message: string) {
  const target = new URL(appUrl)
  target.searchParams.set("prava_message", message)
  return new Response(null, {
    status: 302,
    headers: {
      ...corsHeaders,
      Location: target.toString(),
    },
  })
}
