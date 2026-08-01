const ITEM_KEYWORDS = {
  rice: ['rice', 'chawal', 'chaval', 'चावल', 'rice kam'],
  'wheat flour': ['wheat', 'atta', 'atta', 'flour', 'आटा', 'gehun'],
  sugar: ['sugar', 'chini', 'cheeni', 'चीनी'],
  pulses: ['pulses', 'dal', 'daal', 'दाल', 'masoor', 'moong', 'chana'],
  'cattle feed': ['feed', 'chara', 'cattle', 'gau', 'pashu', 'ghaas'],
  medicine: ['medicine', 'dawai', 'dava', 'दवाई', 'inject', 'vaccine'],
  yarn: ['yarn', 'thread', 'dhaga', 'तागा', 'sutra'],
  dye: ['dye', 'colour', 'color', 'rang', 'रंग'],
}

const LOW_STOCK_SIGNALS = [
  'khatam', 'kam', 'low', 'running out', 'nahi hai', 'thak gaya',
  'kam pad raha hai', 'khatam ho raha hai', 'stock', 'restock', 'order',
]

export function parseIntent(transcript, inventory = []) {
  const lower = transcript.toLowerCase().trim()
  const detectedItems = []

  for (const [item, keywords] of Object.entries(ITEM_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      detectedItems.push(item)
    }
  }

  if (detectedItems.length === 0 && inventory.length > 0) {
    return {
      items: inventory.filter(i => i.current_stock <= i.reorder_threshold),
      isGeneralRestock: true,
    }
  }

  const isRestockRequest = LOW_STOCK_SIGNALS.some(s => lower.includes(s))

  if (isRestockRequest && detectedItems.length === 0 && inventory.length > 0) {
    return {
      items: inventory.filter(i => i.current_stock <= i.reorder_threshold),
      isGeneralRestock: true,
    }
  }

  return {
    items: detectedItems.map(name => ({
      item_name: name,
      suggested_qty: 10,
    })),
    isGeneralRestock: false,
  }
}
