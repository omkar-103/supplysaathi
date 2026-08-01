export function compareSuppliers(suppliers, itemName, quantity = 10) {
  const filtered = suppliers.filter(
    s => s.item_name.toLowerCase().trim() === itemName.toLowerCase().trim()
  )

  if (filtered.length === 0) return null

  const maxPrice = Math.max(...filtered.map(s => s.unit_price))
  const minReliability = Math.min(...filtered.map(s => s.reliability_score))
  const maxReliability = Math.max(...filtered.map(s => s.reliability_score))

  const scored = filtered.map(s => {
    const priceScore = maxPrice > 0 ? 1 - (s.unit_price / maxPrice) : 1
    const reliabilityScore = maxReliability > minReliability
      ? (s.reliability_score - minReliability) / (maxReliability - minReliability)
      : 0.5

    return {
      ...s,
      priceScore,
      reliabilityScore,
      totalScore: (priceScore * 0.6) + (reliabilityScore * 0.4),
    }
  })

  scored.sort((a, b) => b.totalScore - a.totalScore)
  const best = scored[0]

  const reasoning = `Chose ${best.name} — ₹${best.unit_price.toFixed(0)}/unit` +
    (filtered.length > 1 && scored.length > 1
      ? `, ${filtered.length - 1} other${filtered.length > 2 ? 's' : ''} considered`
      : '') +
    `, reliability ${best.reliability_score.toFixed(1)}/5`

  return {
    best,
    alternatives: scored.slice(1),
    reasoning,
    totalAmount: best.unit_price * quantity,
  }
}
