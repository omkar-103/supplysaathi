import { useState } from 'react'

export default function AgentResult({
  item,
  supplier,
  alternatives = [],
  reasoning,
  totalAmount,
  quantity,
  onConfirm,
  remainingBudget,
  loading,
  error,
  onQuantityChange,
}) {
  const [qty, setQty] = useState(quantity || 10)
  const [showAlternatives, setShowAlternatives] = useState(false)
  const exceedsBudget = totalAmount > remainingBudget
  const budgetAfter = remainingBudget - totalAmount

  const handleQtyChange = (e) => {
    const val = Math.max(1, Number(e.target.value))
    setQty(val)
    if (onQuantityChange) onQuantityChange(val)
  }

  return (
    <div className="w-full max-w-xl glass-panel rounded-3xl p-7 shadow-2xl border-white/10 mt-6 space-y-6">
      
      {/* Header Badge */}
      <div className="flex justify-between items-center pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-lg text-indigo-400">
            ⚡
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">AI Supplier Matrix</h3>
            <p className="text-xs text-slate-400 font-mono">Weighted Algorithm: 60% Price · 40% Reliability</p>
          </div>
        </div>
        <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full font-mono font-bold border border-emerald-500/30 uppercase tracking-wider">
          ★ Top Match
        </span>
      </div>

      {/* Item & Quantity Selector */}
      <div className="glass-panel bg-slate-900/80 rounded-2xl p-4 border border-white/10 flex justify-between items-center">
        <div>
          <span className="text-[10px] font-mono text-indigo-300 uppercase tracking-widest font-extrabold">TARGET COMMODITY</span>
          <h4 className="text-xl font-black text-white capitalize mt-0.5">{item}</h4>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400">Quantity:</span>
          <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shadow-inner">
            <button
              onClick={() => handleQtyChange({ target: { value: qty - 1 } })}
              className="px-3 py-1.5 text-slate-300 hover:text-white font-bold text-lg hover:bg-slate-800 transition-colors"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              value={qty}
              onChange={handleQtyChange}
              className="w-14 bg-transparent text-center text-base font-extrabold text-white focus:outline-none"
            />
            <button
              onClick={() => handleQtyChange({ target: { value: qty + 1 } })}
              className="px-3 py-1.5 text-slate-300 hover:text-white font-bold text-lg hover:bg-slate-800 transition-colors"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Selected Supplier Highlight Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950/80 via-slate-900 to-indigo-950/60 rounded-2xl p-6 border border-indigo-500/40 shadow-xl">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-start">
          <div>
            <span className="bg-indigo-500/30 text-indigo-200 text-[10px] font-mono font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-widest border border-indigo-400/30">
              OPTIMAL PROCUREMENT CHOICE
            </span>
            <h4 className="text-2xl font-black text-white mt-2 tracking-tight">{supplier?.name}</h4>
            <p className="text-sm font-semibold text-slate-300 mt-1">
              ₹{supplier?.unit_price?.toFixed(2)} <span className="text-xs text-slate-400 font-normal">/ unit</span>
            </p>
          </div>

          <div className="text-right">
            <div className="bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-xl inline-block text-right">
              <span className="text-base font-black text-emerald-400">★ {supplier?.reliability_score?.toFixed(1)}</span>
              <span className="text-[9px] font-mono text-emerald-300 block uppercase font-bold">Reliability</span>
            </div>
            {supplier?.delivery_days && (
              <p className="text-[11px] font-mono text-slate-400 mt-2">⚡ {supplier.delivery_days} day dispatch</p>
            )}
          </div>
        </div>

        {/* AI Explanation Box */}
        <div className="mt-4 pt-3.5 border-t border-indigo-500/20 text-xs font-medium text-slate-300 flex items-start gap-2 bg-indigo-900/20 p-3 rounded-xl">
          <span className="text-sm">💡</span>
          <p className="italic leading-relaxed font-sans text-slate-200">{reasoning}</p>
        </div>
      </div>

      {/* Alternative Market Quotes Accordion */}
      {alternatives.length > 0 && (
        <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-900/40">
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="w-full p-4 flex justify-between items-center text-xs font-mono font-bold text-slate-300 hover:text-white transition-colors"
          >
            <span>COMPARE OTHER MARKET SUPPLIERS ({alternatives.length})</span>
            <span>{showAlternatives ? '▲ HIDE' : '▼ VIEW MATRIX'}</span>
          </button>

          {showAlternatives && (
            <div className="p-4 bg-slate-950/80 space-y-3 divide-y divide-white/5 border-t border-white/10">
              {alternatives.map((alt) => (
                <div key={alt.id} className="pt-2.5 first:pt-0 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-white">{alt.name}</p>
                    <p className="text-slate-400 font-mono text-[11px]">
                      ₹{alt.unit_price?.toFixed(2)} / unit · ★ {alt.reliability_score?.toFixed(1)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-slate-300">₹{(alt.unit_price * qty).toFixed(2)}</span>
                    <span className="block text-[10px] text-rose-400 font-mono">
                      +₹{((alt.unit_price - supplier.unit_price) * qty).toFixed(0)} diff
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Financial Summary Box */}
      <div className="glass-panel bg-slate-950/90 rounded-2xl p-5 border border-white/10 space-y-3 shadow-inner">
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Total Order Value</span>
          <span className="text-3xl font-black text-amber-400 tracking-tight">₹{totalAmount?.toFixed(2)}</span>
        </div>

        <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs">
          <span className="text-slate-400">Available Prava Spend Limit:</span>
          <span className={`font-mono font-bold ${exceedsBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
            ₹{remainingBudget?.toFixed(2)}
          </span>
        </div>

        {!exceedsBudget && (
          <div className="flex justify-between items-center text-xs text-slate-400 pt-1 font-mono">
            <span>Limit Cap Remaining After:</span>
            <span className="font-bold text-slate-200">₹{budgetAfter?.toFixed(2)}</span>
          </div>
        )}
      </div>

      {exceedsBudget && (
        <div className="bg-rose-950/60 text-rose-300 rounded-2xl p-4 text-xs font-mono font-bold text-center border border-rose-800/60">
          ⚠️ SPEND CAP EXCEEDED. PRAVA SAFEGUARD BLOCKED PURCHASE.
        </div>
      )}

      {error && !exceedsBudget && (
        <p className="text-rose-400 text-xs font-bold text-center font-mono">{error}</p>
      )}

      {/* Action Button */}
      <button
        onClick={onConfirm}
        disabled={exceedsBudget || loading}
        className={`
          w-full py-4.5 rounded-2xl text-base font-black text-white shadow-2xl transition-all btn-shine flex items-center justify-center gap-2 tracking-wide
          ${exceedsBudget || loading
            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] shadow-emerald-600/30 border border-emerald-400/30'}
        `}
      >
        {loading ? 'Executing Prava Order...' : '⚡ Pay with Prava One-Time Card'}
      </button>
    </div>
  )
}
