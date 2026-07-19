type Column<T> = { key: keyof T; label: string }

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = value instanceof Date ? value.toISOString() : String(value)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns: Column<T>[]): string {
  const header = columns.map((c) => escapeCsvValue(c.label)).join(",")
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(","))
  return [header, ...lines].join("\n")
}