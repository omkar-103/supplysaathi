import { useState } from 'react'

export default function Dashboard({ user, ledger, transactions, inventory = [], onReorder }) {
  const [selectedTxn, setSelectedTxn] = useState(null)
  const spent = ledger?.running_total_spent || 0
  const limit = user?.monthly_limit || 10000
  const remaining = Math.max(0, limit - spent)
  const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
  const txnCount = ledger?.txn_count || 0

  let scoreBadge = 'BUILDING RECORD'
  let scoreColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  let scoreDesc = 'Complete 2 more Prava orders to unlock micro-loan credit line.'
  
  if (txnCount >= 5) {
    scoreBadge = 'PRIME FINANCIAL CREDIT'
    scoreColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    scoreDesc = 'Pre-approved for ₹50,000 working capital line by MFI credit partners.'
  } else if (txnCount >= 2) {
    scoreBadge = 'RELIABLE KIRANA'
    scoreColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
    scoreDesc = 'Consistent order pattern logged via Prava agent payments.'
  }

  const lowStockItems = inventory.filter(i => Number(i.current_stock) <= Number(i.reorder_threshold))

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-12 animate-fadeIn">
      
      {/* Financial Inclusion Hero Card */}
      <div className="relative overflow-hidden glass-panel bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 text-white rounded-3xl p-7 shadow-2xl border border-white/10">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-xl text-indigo-300">
                🏦
              </div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">Credit History & Financial Inclusion</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Verified Prava Transaction Ledger</p>
              </div>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-extrabold border uppercase tracking-wider ${scoreColor}`}>
            {scoreBadge}
          </span>
        </div>

        {/* Financial Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/80 rounded-2xl p-5 border border-white/10 mt-5 font-mono">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Total Verified Spent</p>
            <p className="text-2xl font-black text-white mt-1">₹{spent.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Settled Transactions</p>
            <p className="text-2xl font-black text-indigo-300 mt-1">{txnCount}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Microfinance Standing</p>
            <p className="text-xs font-bold text-emerald-400 mt-2">Verified Active Record</p>
          </div>
        </div>

        <p className="text-xs text-indigo-200/90 mt-4 italic font-sans">
          💡 {scoreDesc}
        </p>
      </div>

      {/* Spend Limit Cap Progress Meter */}
      <div className="glass-panel rounded-3xl p-6 shadow-xl border border-white/10 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-black text-white tracking-tight">Monthly Prava Spend Limit Cap</h3>
            <p className="text-xs text-slate-400 font-mono">Autonomous spend safety enforcement</p>
          </div>
          <span className="text-sm font-mono font-bold text-slate-200">Cap: ₹{limit.toFixed(2)}</span>
        </div>

        <div className="space-y-2">
          <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${percent > 85 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono font-semibold">
            <span className="text-slate-400">{percent.toFixed(0)}% Utilized (₹{spent.toFixed(0)})</span>
            <span className="text-emerald-400">₹{remaining.toFixed(2)} Remaining</span>
          </div>
        </div>
      </div>

      {/* Inventory Low-Stock Monitor */}
      <div className="glass-panel rounded-3xl p-6 shadow-xl border border-white/10 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📦</span>
            <h3 className="text-base font-black text-white tracking-tight">Inventory Low-Stock Monitor</h3>
          </div>
          {lowStockItems.length > 0 && (
            <span className="bg-rose-500/20 text-rose-300 text-xs px-3 py-1 rounded-full font-mono font-bold border border-rose-500/30">
              {lowStockItems.length} Low Stock Alert{lowStockItems.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="divide-y divide-white/5">
          {inventory.map((inv) => {
            const isLow = Number(inv.current_stock) <= Number(inv.reorder_threshold)
            return (
              <div key={inv.id} className="py-3.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-extrabold text-white capitalize text-sm">{inv.item_name}</p>
                  <p className="text-slate-400 font-mono mt-0.5">
                    Stock: <span className={isLow ? 'text-rose-400 font-bold' : 'font-semibold text-slate-200'}>{inv.current_stock} {inv.unit}</span> (Threshold: {inv.reorder_threshold} {inv.unit})
                  </p>
                </div>
                {isLow ? (
                  <button
                    onClick={() => onReorder && onReorder(inv.item_name)}
                    className="btn-shine text-xs bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold px-3.5 py-1.5 rounded-xl transition-all shadow-md"
                  >
                    ⚡ Restock Now
                  </button>
                ) : (
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-1 rounded-lg border border-emerald-500/20 uppercase">
                    Optimal
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Verified Prava Transactions Table */}
      <div className="glass-panel rounded-3xl p-6 shadow-xl border border-white/10 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">📄</span>
            <h3 className="text-base font-black text-white tracking-tight">Verified Purchase History</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{transactions?.length || 0} Records</span>
        </div>

        {transactions?.length === 0 ? (
          <p className="text-slate-400 text-center py-10 text-xs font-mono">No Prava transactions yet. Speak to place an order!</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTxn(t)}
                className="glass-card-interactive p-4 rounded-2xl cursor-pointer flex justify-between items-center group"
              >
              <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-white capitalize text-sm">{t.item_name}</p>
                    {t.prava_txn_id?.startsWith('DEMO-FALLBACK-') ? (
                      <span className="bg-amber-500/20 text-amber-300 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase border border-amber-500/30">
                        ⚡ Demo Mode
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase border border-emerald-500/30">
                        Prava Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {t.suppliers?.name || t.supplier_name || 'Best Price Wholesale'} · {new Date(t.created_at).toLocaleDateString()}
                  </p>
                  {t.prava_txn_id && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] font-mono text-indigo-400">
                        Txn: {t.prava_txn_id}
                      </p>
                      {t.prava_txn_id.startsWith('DEMO-FALLBACK-') && (
                        <span className="text-[9px] font-mono text-amber-400/70 italic">
                          (Simulated for demo)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-black text-white font-mono text-base">₹{t.amount?.toFixed(2)}</p>
                  <span className="text-xs text-indigo-400 font-bold group-hover:underline mt-1 inline-block">
                    View Receipt →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Digital Receipt Modal */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fadeIn">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl space-y-4 border border-white/10">
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
              <div>
                <h4 className="font-black text-base text-white">
                  {selectedTxn.prava_txn_id?.startsWith('DEMO-FALLBACK-') ? 'Demo Fallback Receipt' : 'Prava Purchase Receipt'}
                </h4>
                <p className="text-xs text-slate-400 font-mono">ID: {selectedTxn.prava_txn_id}</p>
                {selectedTxn.prava_txn_id?.startsWith('DEMO-FALLBACK-') && (
                  <span className="inline-block mt-1 bg-amber-500/20 text-amber-300 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                    ⚡ Demo Mode
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedTxn(null)}
                className="w-7 h-7 bg-white/5 hover:bg-white/10 text-slate-400 rounded-full font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="glass-panel bg-slate-950/90 p-4 rounded-2xl font-mono text-xs space-y-2.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Purchaser:</span>
                <span className="font-bold text-white">Ramesh Kirana Store</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Supplier:</span>
                <span className="font-bold text-white">{selectedTxn.suppliers?.name || 'Best Price'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Item & Qty:</span>
                <span className="font-bold text-slate-200 capitalize">{selectedTxn.item_name} ({selectedTxn.quantity || 10} units)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Settled Amount:</span>
                <span className="font-bold text-emerald-400 text-sm">₹{selectedTxn.amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Protocol:</span>
                <span className={`font-bold ${selectedTxn.prava_txn_id?.startsWith('DEMO-FALLBACK-') ? 'text-amber-400' : 'text-indigo-400'}`}>
                  {selectedTxn.prava_txn_id?.startsWith('DEMO-FALLBACK-') ? 'Demo Simulated (Fallback)' : 'Prava One-Time Card'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-400">{new Date(selectedTxn.created_at).toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[10px] font-mono text-slate-500 text-center">
              {selectedTxn.prava_txn_id?.startsWith('DEMO-FALLBACK-')
                ? 'Simulated for demo — Prava sandbox was unavailable at time of transaction.'
                : 'Verified by Prava Agentic Trust Protocol. Safe for bank credit verification.'}
            </p>

            <button
              onClick={() => setSelectedTxn(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-xs border border-slate-700 transition-all"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
