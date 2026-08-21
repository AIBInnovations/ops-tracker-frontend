export function formatCurrency(value: number): string {
  // Sign leads the symbol — "-₹15,312" rather than "₹-15,312".
  const rounded = Math.round(value)
  return `${rounded < 0 ? '-' : ''}₹${Math.abs(rounded).toLocaleString('en-IN')}`
}

export function formatHours(value: number): string {
  return `${value.toFixed(1)} hrs`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`
}
