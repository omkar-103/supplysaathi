import { useState, useEffect, useRef } from 'react'

/**
 * Payment State Machine:
 *   'idle'            → card visible, ready to authorize
 *   'connecting'      → spinner + "Connecting to Prava..."
 *   'success'         → real Prava succeeded — green confirmation
 *   'failed_fallback' → real Prava failed — shows error + auto-starts fallback
 *   'demo_success'    → local fallback completed — green confirmation + "Demo Mode" badge
 */

export default function PravaCardModal({
  isOpen,
  onClose,
  item,
  supplier,
  quantity,
  amount,
  reasoning,
  onAuthorize,
  onFallback,
}) {
  const [payState, setPayState] = useState('idle')
  const [txnResult, setTxnResult] = useState(null)
  const [realError, setRealError] = useState('')
  const fallbackTimerRef = useRef(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPayState('idle')
      setTxnResult(null)
      setRealError('')
    }
    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current)
    }
  }, [isOpen])

  if (!isOpen) return null

  // ── STEP 1: Try real Prava ──
  const handlePay = async () => {
    setPayState('connecting')
    setRealError('')

    try {
      const res = await onAuthorize()
      // Real Prava succeeded!
      setTxnResult(res)
      setPayState('success')
    } catch (err) {
      // ── STEP 2 & 3: Real Prava failed — show error, then auto-fallback ──
      const errorMessage = err.message || 'Prava sandbox unreachable'
      console.error('Real Prava attempt failed:', errorMessage)
      setRealError(errorMessage)
      setPayState('failed_fallback')

      // After 1.5s visible delay, execute local fallback
      fallbackTimerRef.current = setTimeout(async () => {
        try {
          const fallbackRes = await onFallback()
          setTxnResult(fallbackRes)
          setPayState('demo_success')
        } catch (fbErr) {
          // Even fallback failed — shouldn't happen but handle it
          setRealError(`Fallback also failed: ${fbErr.message}`)
        }
      }, 1500)
    }
  }

  const handleDone = () => {
    setPayState('idle')
    setTxnResult(null)
    setRealError('')
    onClose()
  }

  const isCompleted = payState === 'success' || payState === 'demo_success'
  const isDemoMode = payState === 'demo_success'
  const isProcessing = payState === 'connecting' || payState === 'failed_fallback'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fadeIn">
      <div className="w-full max-w-lg glass-panel rounded-3xl shadow-2xl overflow-hidden border border-white/10 transform transition-all">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 border-b border-white/10 relative">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-lg text-blue-400">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-white tracking-wide">Prava Dynamic Card</h3>
                  <span className="bg-blue-500/20 text-blue-300 text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-400/30">
                    SCOPED SESSION
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-0.5 font-mono">1-Time Scoped Card · Merchant Isolated</p>
              </div>
            </div>
            {!isProcessing && (
              <button
                onClick={handleDone}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-sm font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">

          {/* ═══════════════ CONNECTING STATE ═══════════════ */}
          {payState === 'connecting' && (
            <div className="text-center py-10 space-y-5 animate-fadeIn">
              <div className="w-16 h-16 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderWidth: '3px' }} />
              <div>
                <h4 className="text-lg font-black text-white tracking-tight">Connecting to Prava...</h4>
                <p className="text-xs font-mono text-slate-400 mt-1">Initiating real sandbox payment session</p>
              </div>
            </div>
          )}

          {/* ═══════════════ FAILED → FALLBACK LOADING STATE ═══════════════ */}
          {payState === 'failed_fallback' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Error banner — honest, shows real reason */}
              <div className="bg-rose-950/80 text-rose-200 rounded-2xl p-4 border border-rose-800/80 text-xs font-mono font-bold text-center shadow-xl">
                <span className="text-rose-400">⚠ Real Prava attempt failed:</span>{' '}
                {realError}
              </div>

              {/* Fallback loading state */}
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderWidth: '3px' }} />
                <div>
                  <p className="text-sm font-bold text-amber-300">Using demo payment method</p>
                  <p className="text-xs font-mono text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    Prava sandbox unavailable — simulating transaction for demo purposes
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ IDLE STATE — Card + Pay Button ═══════════════ */}
          {payState === 'idle' && (
            <>
              {/* Apple Card / Ramp Virtual Card Visual */}
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-2xl border border-indigo-500/30">
                <div className="absolute top-0 right-0 -mr-12 -mt-12 w-44 h-44 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-2xl tracking-widest text-white">PRAVA</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono font-bold border border-emerald-500/30">
                      SECURE 1-TIME
                    </span>
                  </div>
                  {/* Card Chip */}
                  <div className="w-10 h-7 bg-gradient-to-tr from-amber-400 to-amber-200 rounded-md border border-amber-300 flex items-center justify-center shadow-md">
                    <div className="w-6 h-4 border-t border-b border-amber-600/40 opacity-70" />
                  </div>
                </div>

                <div className="font-mono text-xl tracking-[0.25em] text-indigo-100 mb-6 drop-shadow-md font-extrabold">
                  4111 •••• •••• {Math.floor(1000 + Math.random() * 9000)}
                </div>

                <div className="flex justify-between items-end text-xs font-mono">
                  <div>
                    <p className="text-slate-400 text-[9px] uppercase tracking-widest">Card Holder</p>
                    <p className="font-bold text-white tracking-wide">Ramesh Kirana (Prava Agent)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-[9px] uppercase tracking-widest">Authorized Spend Limit</p>
                    <p className="font-black text-amber-400 text-sm">₹{amount?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Order Breakdown Context */}
              <div className="glass-panel bg-slate-950/80 rounded-2xl p-4 border border-white/10 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">Supplier / Merchant:</span>
                  <span className="font-bold text-white">{supplier?.name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-slate-400">Item & Quantity:</span>
                  <span className="font-bold text-slate-200 capitalize">{item} ({quantity} units)</span>
                </div>
                {reasoning && (
                  <div className="flex flex-col pb-2 border-b border-white/5 space-y-1">
                    <span className="text-slate-400">AI Reasoning:</span>
                    <span className="font-bold text-slate-300 italic">{reasoning}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Settlement:</span>
                  <span className="text-lg font-black text-blue-400">₹{amount?.toFixed(2)}</span>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="flex items-center gap-3 bg-blue-950/30 rounded-xl p-3 border border-blue-800/40 text-xs text-blue-200">
                <span className="text-xl">🛡️</span>
                <p className="leading-relaxed">
                  Prava limits credit card exposure. Credentials are automatically invalidated after this purchase.
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={handlePay}
                className="w-full py-4 rounded-2xl text-base font-black text-white shadow-xl transition-all btn-shine flex items-center justify-center gap-2 tracking-wide bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] border border-emerald-400/30"
              >
                <span>Authorize & Pay ₹{amount?.toFixed(2)}</span>
                <span>→</span>
              </button>
            </>
          )}

          {/* ═══════════════ SUCCESS / DEMO_SUCCESS STATE ═══════════════ */}
          {isCompleted && (
            <div className="text-center py-4 space-y-5 animate-scaleUp">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-4xl mx-auto border-2 border-emerald-500/40 shadow-xl">
                ✓
              </div>

              <div>
                <h4 className="text-2xl font-black text-white tracking-tight">Payment Settled!</h4>
                {isDemoMode ? (
                  <div className="mt-2 space-y-1">
                    {/* Demo Mode Badge — visible, honest */}
                    <span className="inline-block bg-amber-500/20 text-amber-300 text-[10px] font-mono font-extrabold px-3 py-1 rounded-full border border-amber-500/40 uppercase tracking-wider">
                      ⚡ Demo Mode — Simulated for Demo
                    </span>
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      Local fallback used (Prava sandbox was unavailable)
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-slate-400 mt-1">Prava session settled in real time</p>
                )}
              </div>

              {/* If real Prava failed, show that error context above the receipt */}
              {isDemoMode && realError && (
                <div className="bg-slate-950/80 text-slate-400 rounded-xl p-3 border border-white/5 text-[10px] font-mono text-left">
                  <span className="text-slate-500">Original error:</span> {realError}
                </div>
              )}

              <div className="glass-panel bg-slate-950/90 rounded-2xl p-4 border border-white/10 text-left font-mono text-xs space-y-2 text-slate-300 shadow-inner">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isDemoMode ? 'Fallback Txn ID:' : 'Prava Session ID:'}</span>
                  <span className="text-indigo-400 font-bold">{txnResult?.session_token || txnResult?.prava_txn_id || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Card Used:</span>
                  <span className="text-slate-200 font-semibold">
                    {isDemoMode ? 'Demo Fallback (No Card)' : `Prava Virtual •••• ${txnResult?.card_last4 || '8829'}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Settled Amount:</span>
                  <span className="text-emerald-400 font-bold">₹{amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Credit Profile:</span>
                  <span className="text-blue-400 font-semibold">+1 {isDemoMode ? 'Demo' : 'Verified'} Purchase Logged</span>
                </div>
              </div>

              <button
                onClick={handleDone}
                className="w-full py-3.5 rounded-2xl text-sm font-black bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-lg transition-all"
              >
                Return to Credit Dashboard
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
