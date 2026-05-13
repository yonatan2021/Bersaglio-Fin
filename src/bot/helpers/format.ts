export function formatCurrency(amount: number, currency = 'ILS'): string {
  if (currency === 'ILS') {
    return `${amount.toFixed(2)}₪`;
  }
  return `${amount.toFixed(2)} ${currency}`;
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatTable(rows: Array<{ label: string; value: string }>): string {
  return rows.map(row => `${row.label}: ${row.value}`).join('\n');
}
