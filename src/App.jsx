import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from './lib/supabaseClient'
import { demoStore } from './lib/demoStore'
import { processPravaPayment } from './lib/pravaService'
import { parseIntent } from './agent/intentParser'
import { compareSuppliers } from './agent/compareSuppliers'
import VoiceInput from './components/VoiceInput'
import AgentResult from './components/AgentResult'
import Dashboard from './components/Dashboard'
import PravaCardModal from './components/PravaCardModal'
import SupplySaathiLogo from './components/SupplySaathiLogo'

const DEMO_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

const VOICE_PROMPTS = [
  { label: '🌾 "Chawal khatam ho raha hai"', text: 'chawal khatam ho raha hai' },
  { label: '🍬 "Chini 10kg chahiye"', text: 'chini kam hai 10kg chahiye' },
  { label: '🌾 "Wheat flour order karo"', text: 'wheat flour stock kam hai' },
  { label: '🐄 "Cattle feed chahiye"', text: 'doodh ke liye feed chahiye' },
  { label: '🧵 "Kapde ke liye yarn"', text: 'mujhe yarn chahiye' },
]

function speakText(text, lang = 'hi-IN', soundEnabled = true) {
  if (!soundEnabled || !window.speechSynthesis) return
  try {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = 0.95
    window.speechSynthesis.speak(utter)
  } catch (e) {
    console.warn('Speech synthesis error:', e)
  }
}

function App() {
  const [user, setUser] = useState(demoStore.getUser())
  const [inventory, setInventory] = useState(demoStore.getInventory())
  const [suppliers, setSuppliers] = useState(demoStore.getSuppliers())
  const [transactions, setTransactions] = useState(demoStore.getTransactions())
  const [ledger, setLedger] = useState(demoStore.getLedger())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(true)
  
  const [selectedItem, setSelectedItem] = useState(null)
  const [quantity, setQuantity] = useState(10)
  const [activeTab, setActiveTab] = useState('agent') // 'agent' | 'dashboard'
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [language, setLanguage] = useState('hi-IN')

  // Load data from Supabase if available, fallback to demoStore
  const reloadData = useCallback(async () => {
    try {
      const [userRes, invRes, supRes, txnRes, ledgerRes] = await Promise.allSettled([
        supabase.from('users').select('*').eq('id', DEMO_USER_ID).single(),
        supabase.from('inventory').select('*').eq('user_id', DEMO_USER_ID),
        supabase.from('suppliers').select('*'),
        supabase.from('transactions').select('*, suppliers(name)').eq('user_id', DEMO_USER_ID).order('created_at', { ascending: false }),
        supabase.from('credit_ledger').select('*').eq('user_id', DEMO_USER_ID).single(),
      ])

      if (userRes.status === 'fulfilled' && userRes.value?.data) {
        setUser(userRes.value.data)
      }
      if (invRes.status === 'fulfilled' && invRes.value?.data?.length > 0) {
        setInventory(invRes.value.data)
      }
      if (supRes.status === 'fulfilled' && supRes.value?.data?.length > 0) {
        setSuppliers(supRes.value.data)
      }
      if (txnRes.status === 'fulfilled' && txnRes.value?.data) {
        setTransactions(txnRes.value.data)
      }
      if (ledgerRes.status === 'fulfilled' && ledgerRes.value?.data) {
        setLedger(ledgerRes.value.data)
      }
    } catch (err) {
      console.warn('Supabase fetch notice: using local resilient store', err)
    } finally {
      // Fallback local store sync
      setUser(prev => prev || demoStore.getUser())
      setInventory(prev => prev.length ? prev : demoStore.getInventory())
      setSuppliers(prev => prev.length ? prev : demoStore.getSuppliers())
      setTransactions(prev => prev.length ? prev : demoStore.getTransactions())
      setLedger(prev => prev || demoStore.getLedger())
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reloadData()
  }, [reloadData])

  const handleTranscript = (transcript) => {
    if (!transcript.trim()) return
    setError('')

    const currentInventory = inventory.length ? inventory : demoStore.getInventory()
    const currentSuppliers = suppliers.length ? suppliers : demoStore.getSuppliers()

    const parsed = parseIntent(transcript, currentInventory)
    let targetItem = parsed.items[0]

    if (!targetItem || !targetItem.item_name) {
      setError(language === 'hi-IN' ? 'Koi saman samajh nahi aaya. Kripya dobara boliye.' : 'Could not detect item. Please try speaking again.')
      speakText('Saman samajh nahi aaya. Dobara boliye.', language, soundEnabled)
      return
    }

    const result = compareSuppliers(currentSuppliers, targetItem.item_name, quantity)
    if (!result) {
      setError(language === 'hi-IN' ? `"${targetItem.item_name}" ke liye market supplier nahi mila.` : `No supplier found for "${targetItem.item_name}".`)
      speakText('Is item ke liye supplier nahi mila.', language, soundEnabled)
      return
    }

    setSelectedItem({ ...targetItem, ...result, qty: quantity })
    
    const speechMsg = language === 'hi-IN'
      ? `Sabse accha supplier ${result.best.name} hai, daam ${result.totalAmount.toFixed(0)} rupaye.`
      : `Best supplier is ${result.best.name}, total amount ${result.totalAmount.toFixed(0)} rupees.`
    
    speakText(speechMsg, language, soundEnabled)
  }

  const handleQuantityChange = (qty) => {
    setQuantity(qty)
    if (selectedItem?.item_name) {
      const currentSuppliers = suppliers.length ? suppliers : demoStore.getSuppliers()
      const result = compareSuppliers(currentSuppliers, selectedItem.item_name, qty)
      if (result) {
        setSelectedItem({ ...selectedItem, ...result, qty })
      }
    }
  }

  const handleOpenPaymentModal = () => {
    if (!selectedItem?.best) return
    setIsModalOpen(true)
  }

  const handleAuthorizePravaPayment = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await processPravaPayment({
        userId: user?.id || DEMO_USER_ID,
        supplierId: selectedItem.best.id,
        supplierName: selectedItem.best.name,
        itemName: selectedItem.item_name,
        quantity: quantity,
        amount: selectedItem.totalAmount,
        reasoning: selectedItem.reasoning,
      })

      // Real Prava succeeded — update local store to match
      demoStore.addTransaction({
        user_id: user?.id || DEMO_USER_ID,
        supplier_id: selectedItem.best.id,
        supplier_name: selectedItem.best.name,
        item_name: selectedItem.item_name,
        quantity: quantity,
        amount: selectedItem.totalAmount,
        reasoning: selectedItem.reasoning,
        prava_txn_id: res.session_token || 'prv_live_' + Date.now(),
        status: 'success',
        suppliers: { name: selectedItem.best.name },
      })

      // Refresh state from local store
      setLedger(demoStore.getLedger())
      setTransactions(demoStore.getTransactions())
      setInventory(demoStore.getInventory())
      setSelectedItem(null)

      speakText(
        language === 'hi-IN' ? 'Prava payment safal raha. Samaan order ho gaya!' : 'Payment succeeded via Prava! Order confirmed.',
        language,
        soundEnabled
      )

      return res
    } catch (err) {
      console.error('Real Prava attempt failed:', err)
      // Don't set global error — PravaCardModal handles the error display & fallback
      throw err
    } finally {
      setBusy(false)
    }
  }

  // ── FALLBACK: Local demo payment when Prava sandbox is unreachable ──
  const handleFallbackPayment = async () => {
    const fallbackTxnId = 'DEMO-FALLBACK-' + Date.now()

    const { txn, ledger: updatedLedger, inventory: updatedInv } = demoStore.addTransaction({
      user_id: user?.id || DEMO_USER_ID,
      supplier_id: selectedItem.best.id,
      supplier_name: selectedItem.best.name,
      item_name: selectedItem.item_name,
      quantity: quantity,
      amount: selectedItem.totalAmount,
      reasoning: selectedItem.reasoning,
      prava_txn_id: fallbackTxnId,
      status: 'success',
      suppliers: { name: selectedItem.best.name },
    })

    // Refresh all state from local store
    setLedger(updatedLedger)
    setTransactions(demoStore.getTransactions())
    setInventory(updatedInv)
    setSelectedItem(null)

    speakText(
      language === 'hi-IN' ? 'Demo payment safal raha. Samaan order ho gaya!' : 'Demo payment completed. Order confirmed.',
      language,
      soundEnabled
    )

    return {
      success: true,
      mode: 'demo_fallback',
      prava_txn_id: fallbackTxnId,
      amount: selectedItem.totalAmount,
      reasoning: selectedItem.reasoning,
      timestamp: new Date().toISOString(),
    }
  }

  const handleReorderItem = (itemName) => {
    setActiveTab('agent')
    handleTranscript(`${itemName} stock khatam ho raha hai`)
  }

  const spent = ledger?.running_total_spent || 0
  const limit = user?.monthly_limit || 10000
  const remaining = Math.max(0, limit - spent)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-mono tracking-widest text-slate-400">INITIALIZING SUPPLYSAATHI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Container */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Navbar Header with New Brand Mark Logo */}
        <header className="glass-panel rounded-3xl p-5 shadow-2xl border border-white/10 mb-8 flex flex-wrap justify-between items-center gap-4">
          
          <SupplySaathiLogo />

          <div className="flex items-center gap-4">
            {/* Language Controls */}
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-white/10 text-xs font-mono">
              <button
                onClick={() => setLanguage('hi-IN')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${language === 'hi-IN' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                हिंदी
              </button>
              <button
                onClick={() => setLanguage('en-IN')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${language === 'en-IN' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                English
              </button>
            </div>

            {/* Audio Feedback Button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all ${soundEnabled ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-md' : 'bg-slate-950 border-white/10 text-slate-500'}`}
              title={soundEnabled ? 'Audio feedback active' : 'Audio feedback muted'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>

            {/* Prava Limit Cap Pill */}
            <div className="text-right pl-4 border-l border-white/10 font-mono">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Prava Spend Cap</p>
              <p className="text-lg font-black text-amber-400 tracking-tight">₹{remaining.toFixed(0)}</p>
            </div>
          </div>
        </header>

        {/* Tab Switcher */}
        <div className="glass-panel p-1.5 rounded-2xl border border-white/10 max-w-md mx-auto mb-8 flex shadow-2xl">
          <button
            onClick={() => setActiveTab('agent')}
            className={`flex-1 py-3 rounded-xl font-mono font-extrabold text-xs transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${activeTab === 'agent' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span>🎙️ Voice Procurement</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-3 rounded-xl font-mono font-extrabold text-xs transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span>📊 Credit Ledger</span>
          </button>
        </div>

        {/* Global Banner Error */}
        {error && (
          <div className="max-w-xl mx-auto bg-rose-950/80 text-rose-200 rounded-2xl p-4 mb-6 border border-rose-800/80 text-xs font-mono font-bold text-center animate-fadeIn shadow-xl">
            {error}
          </div>
        )}

        {/* Main View Area — Animated Tab Transitions */}
        <AnimatePresence mode="wait">
          {activeTab === 'agent' ? (
            <motion.div
              key="agent-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="flex flex-col items-center space-y-6"
            >
              
              {/* Voice Orb Agent Centerpiece */}
              <div className="glass-panel rounded-3xl p-8 shadow-2xl border border-white/10 w-full max-w-xl text-center">
                <VoiceInput onTranscript={handleTranscript} language={language} />

                {/* Sample Voice Order Prompts */}
                {!selectedItem?.best && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <p className="text-[10px] font-mono font-extrabold text-slate-400 uppercase tracking-widest mb-3">
                      Sample Voice Orders (Tap to Test):
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {VOICE_PROMPTS.map((prompt) => (
                        <button
                          key={prompt.text}
                          onClick={() => handleTranscript(prompt.text)}
                          className="glass-card-interactive text-slate-300 hover:text-white border border-white/10 rounded-2xl px-3.5 py-2 text-xs font-medium transition-all active:scale-95"
                        >
                          {prompt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Agent Recommendation & Comparison Result — slides up */}
              <AnimatePresence>
                {selectedItem?.best && (
                  <motion.div
                    key="agent-result"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 24 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full flex justify-center"
                  >
                    <AgentResult
                      item={selectedItem.item_name}
                      supplier={selectedItem.best}
                      alternatives={selectedItem.alternatives || []}
                      reasoning={selectedItem.reasoning}
                      totalAmount={selectedItem.totalAmount}
                      quantity={quantity}
                      onConfirm={handleOpenPaymentModal}
                      remainingBudget={remaining}
                      loading={busy}
                      error={error}
                      onQuantityChange={handleQuantityChange}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Financial Credit Ledger Dashboard */
            <motion.div
              key="dashboard-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Dashboard
                user={user}
                ledger={ledger}
                transactions={transactions}
                inventory={inventory}
                onReorder={handleReorderItem}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Prava Virtual Card Payment Modal */}
      <PravaCardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem?.item_name}
        supplier={selectedItem?.best}
        quantity={quantity}
        amount={selectedItem?.totalAmount}
        reasoning={selectedItem?.reasoning}
        onAuthorize={handleAuthorizePravaPayment}
        onFallback={handleFallbackPayment}
      />
    </div>
  )
}

export default App
