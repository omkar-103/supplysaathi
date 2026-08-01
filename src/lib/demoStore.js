// Fallback in-memory & localStorage store for SupplySaathi
const DEMO_USER_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

const INITIAL_USER = {
  id: DEMO_USER_ID,
  name: 'Ramesh Kirana Store',
  email: 'ramesh@lucknowkirana.in',
  business_type: 'kirana',
  phone: '+91 98765 43210',
  location: 'Lucknow, Uttar Pradesh',
  monthly_limit: 10000,
  language_pref: 'hi-IN',
  created_at: new Date().toISOString(),
}

const INITIAL_SUPPLIERS = [
  // Kirana staples
  { id: 'sup-1', name: 'Agra Grains Co.', category: 'kirana', item_name: 'rice', unit_price: 52.00, reliability_score: 4.5, delivery_days: 1, min_order: 5 },
  { id: 'sup-2', name: 'Bharat Rice Mill', category: 'kirana', item_name: 'rice', unit_price: 48.00, reliability_score: 3.8, delivery_days: 2, min_order: 10 },
  { id: 'sup-3', name: 'Best Price Wholesale', category: 'kirana', item_name: 'rice', unit_price: 50.00, reliability_score: 4.7, delivery_days: 1, min_order: 5 },
  
  { id: 'sup-4', name: 'Agra Grains Co.', category: 'kirana', item_name: 'wheat flour', unit_price: 38.00, reliability_score: 4.5, delivery_days: 1, min_order: 5 },
  { id: 'sup-5', name: 'Bharat Mills', category: 'kirana', item_name: 'wheat flour', unit_price: 36.00, reliability_score: 3.9, delivery_days: 2, min_order: 10 },
  { id: 'sup-6', name: 'Best Price Wholesale', category: 'kirana', item_name: 'wheat flour', unit_price: 37.00, reliability_score: 4.7, delivery_days: 1, min_order: 5 },
  
  { id: 'sup-7', name: 'Agra Grains Co.', category: 'kirana', item_name: 'sugar', unit_price: 42.00, reliability_score: 4.5, delivery_days: 1, min_order: 5 },
  { id: 'sup-8', name: 'Bharat Mills', category: 'kirana', item_name: 'sugar', unit_price: 40.00, reliability_score: 3.8, delivery_days: 2, min_order: 5 },
  { id: 'sup-9', name: 'Best Price Wholesale', category: 'kirana', item_name: 'sugar', unit_price: 41.00, reliability_score: 4.7, delivery_days: 1, min_order: 5 },
  
  { id: 'sup-10', name: 'Agra Grains Co.', category: 'kirana', item_name: 'pulses', unit_price: 92.00, reliability_score: 4.5, delivery_days: 1, min_order: 2 },
  { id: 'sup-11', name: 'Bharat Mills', category: 'kirana', item_name: 'pulses', unit_price: 88.00, reliability_score: 3.8, delivery_days: 2, min_order: 5 },
  { id: 'sup-12', name: 'Best Price Wholesale', category: 'kirana', item_name: 'pulses', unit_price: 90.00, reliability_score: 4.7, delivery_days: 1, min_order: 2 },

  // Dairy items
  { id: 'sup-13', name: 'Krishna Feed Mills', category: 'dairy', item_name: 'cattle feed', unit_price: 28.00, reliability_score: 4.6, delivery_days: 1, min_order: 10 },
  { id: 'sup-14', name: 'Gau Sevak Supplies', category: 'dairy', item_name: 'cattle feed', unit_price: 25.00, reliability_score: 3.7, delivery_days: 3, min_order: 20 },
  { id: 'sup-15', name: 'Dairy Best Co-op', category: 'dairy', item_name: 'cattle feed', unit_price: 27.00, reliability_score: 4.8, delivery_days: 1, min_order: 5 },

  { id: 'sup-16', name: 'Krishna Feed Mills', category: 'dairy', item_name: 'medicine', unit_price: 145.00, reliability_score: 4.6, delivery_days: 1, min_order: 1 },
  { id: 'sup-17', name: 'Gau Sevak Supplies', category: 'dairy', item_name: 'medicine', unit_price: 135.00, reliability_score: 3.7, delivery_days: 2, min_order: 1 },
  { id: 'sup-18', name: 'Dairy Best Co-op', category: 'dairy', item_name: 'medicine', unit_price: 140.00, reliability_score: 4.8, delivery_days: 1, min_order: 1 },

  // Weaver items
  { id: 'sup-19', name: 'Silk House Varanasi', category: 'weaver', item_name: 'yarn', unit_price: 320.00, reliability_score: 4.4, delivery_days: 2, min_order: 2 },
  { id: 'sup-20', name: 'Thread Masters', category: 'weaver', item_name: 'yarn', unit_price: 310.00, reliability_score: 4.1, delivery_days: 3, min_order: 5 },
  { id: 'sup-21', name: 'Silk House Varanasi', category: 'weaver', item_name: 'dye', unit_price: 85.00, reliability_score: 4.4, delivery_days: 2, min_order: 1 },
  { id: 'sup-22', name: 'Thread Masters', category: 'weaver', item_name: 'dye', unit_price: 80.00, reliability_score: 4.1, delivery_days: 3, min_order: 2 },
]

const INITIAL_INVENTORY = [
  { id: 'inv-1', user_id: DEMO_USER_ID, item_name: 'rice', current_stock: 8, reorder_threshold: 10, unit: 'kg' },
  { id: 'inv-2', user_id: DEMO_USER_ID, item_name: 'wheat flour', current_stock: 15, reorder_threshold: 12, unit: 'kg' },
  { id: 'inv-3', user_id: DEMO_USER_ID, item_name: 'sugar', current_stock: 4, reorder_threshold: 8, unit: 'kg' },
  { id: 'inv-4', user_id: DEMO_USER_ID, item_name: 'pulses', current_stock: 6, reorder_threshold: 7, unit: 'kg' },
  { id: 'inv-5', user_id: DEMO_USER_ID, item_name: 'cattle feed', current_stock: 5, reorder_threshold: 15, unit: 'kg' },
]

const INITIAL_TRANSACTIONS = [
  {
    id: 'txn-demo-1',
    user_id: DEMO_USER_ID,
    supplier_id: 'sup-3',
    item_name: 'rice',
    amount: 500.00,
    quantity: 10,
    prava_txn_id: 'prv_live_9a82f7c1',
    status: 'success',
    reasoning: 'Chose Best Price Wholesale — ₹50/unit, reliability 4.7/5',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    suppliers: { name: 'Best Price Wholesale' }
  }
]

const INITIAL_LEDGER = {
  id: 'led-1',
  user_id: DEMO_USER_ID,
  running_total_spent: 500.00,
  txn_count: 1,
  updated_at: new Date().toISOString(),
}

const STORAGE_KEYS = {
  USER: 'supplysaathi_user',
  INVENTORY: 'supplysaathi_inventory',
  SUPPLIERS: 'supplysaathi_suppliers',
  TRANSACTIONS: 'supplysaathi_txns',
  LEDGER: 'supplysaathi_ledger',
}

function getItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function setItem(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch (e) {
    console.warn('LocalStorage error:', e)
  }
}

export const demoStore = {
  getUser() {
    return getItem(STORAGE_KEYS.USER, INITIAL_USER)
  },
  getSuppliers() {
    return getItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS)
  },
  getInventory() {
    return getItem(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY)
  },
  getTransactions() {
    return getItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS)
  },
  getLedger() {
    return getItem(STORAGE_KEYS.LEDGER, INITIAL_LEDGER)
  },
  addTransaction(txn) {
    const txns = this.getTransactions()
    const newTxn = {
      id: `txn-${Date.now()}`,
      created_at: new Date().toISOString(),
      status: 'success',
      ...txn,
    }
    const updatedTxns = [newTxn, ...txns]
    setItem(STORAGE_KEYS.TRANSACTIONS, updatedTxns)

    // Update ledger
    const ledger = this.getLedger()
    const updatedLedger = {
      ...ledger,
      running_total_spent: (ledger.running_total_spent || 0) + Number(txn.amount || 0),
      txn_count: (ledger.txn_count || 0) + 1,
      updated_at: new Date().toISOString(),
    }
    setItem(STORAGE_KEYS.LEDGER, updatedLedger)

    // Update inventory if matching item found
    const inv = this.getInventory()
    const updatedInv = inv.map((item) => {
      if (item.item_name.toLowerCase() === txn.item_name.toLowerCase()) {
        return {
          ...item,
          current_stock: Number(item.current_stock) + Number(txn.quantity || 1),
        }
      }
      return item
    })
    setItem(STORAGE_KEYS.INVENTORY, updatedInv)

    return { txn: newTxn, ledger: updatedLedger, inventory: updatedInv }
  },
  resetData() {
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.INVENTORY)
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS)
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS)
    localStorage.removeItem(STORAGE_KEYS.LEDGER)
  }
}
