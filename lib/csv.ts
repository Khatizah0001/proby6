/** Penghurai CSV ringkas: sokong petikan, BOM Excel, pemisah koma atau titik koma (Excel Malaysia). */
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^\uFEFF/, '')
  const head = t.split(/\r?\n/, 1)[0] ?? ''
  const delim = (head.match(/;/g)?.length ?? 0) > (head.match(/,/g)?.length ?? 0) ? ';' : ','
  const rows: string[][] = []
  let row: string[] = [], cur = '', q = false
  const push = () => { row.push(cur); cur = ''; if (row.some((x) => x.trim() !== '')) rows.push(row); row = [] }
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++ } else q = false } else cur += c }
    else if (c === '"') q = true
    else if (c === delim) { row.push(cur); cur = '' }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; push() }
    else cur += c
  }
  if (cur !== '' || row.length) push()
  return rows
}

/** Muat turun templat CSV (dengan BOM supaya Excel papar huruf dengan betul). */
export function downloadCsv(filename: string, rows: string[][]) {
  const esc = (v: string) => (/[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const blob = new Blob(['\uFEFF' + rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob); a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
