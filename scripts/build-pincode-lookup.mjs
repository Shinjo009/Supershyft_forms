import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const csvPath = path.join(root, 'pincodes.csv')
const outPath = path.join(root, 'public', 'data', 'pincode-lookup.json')

/** Parse one CSV line with quoted fields (handles commas inside quotes). */
function parseCsvLine(line) {
  const fields = []
  let i = 0
  while (i < line.length && fields.length < 5) {
    if (line[i] !== '"') {
      i++
      continue
    }
    i++
    let value = ''
    while (i < line.length) {
      if (line[i] === '"') {
        if (line[i + 1] === '"') {
          value += '"'
          i += 2
          continue
        }
        i++
        break
      }
      value += line[i]
      i++
    }
    fields.push(value)
    if (line[i] === ',') i++
  }
  return fields
}

function modeFromCounts(counts) {
  let best = ''
  let bestN = 0
  for (const [key, n] of counts) {
    if (n > bestN) {
      best = key
      bestN = n
    }
  }
  return best
}

if (!fs.existsSync(csvPath)) {
  console.error(`Missing ${csvPath}`)
  process.exit(1)
}

const raw = fs.readFileSync(csvPath, 'utf8').trim().split(/\r?\n/)
const header = raw[0]
const expected = '"PostOfficeName","Pincode","DistrictsName","City","State"'
if (header !== expected) {
  console.warn('Unexpected CSV header:', header)
}

/** @type {Map<string, { cityCounts: Map<string, number>, stateCounts: Map<string, number> }>} */
const byPin = new Map()
let skipped = 0

for (const line of raw.slice(1)) {
  const fields = parseCsvLine(line)
  if (fields.length < 5) {
    skipped++
    continue
  }
  const pin = fields[1].trim()
  const city = fields[3].trim()
  const state = fields[4].trim()
  if (!/^\d{6}$/.test(pin) || !city || !state) {
    skipped++
    continue
  }

  if (!byPin.has(pin)) {
    byPin.set(pin, { cityCounts: new Map(), stateCounts: new Map() })
  }
  const row = byPin.get(pin)
  row.cityCounts.set(city, (row.cityCounts.get(city) ?? 0) + 1)
  row.stateCounts.set(state, (row.stateCounts.get(state) ?? 0) + 1)
}

/** @type {Record<string, { city: string, state: string }>} */
const lookup = {}
for (const [pin, { cityCounts, stateCounts }] of byPin) {
  lookup[pin] = {
    city: modeFromCounts(cityCounts),
    state: modeFromCounts(stateCounts),
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })
fs.writeFileSync(outPath, JSON.stringify(lookup))

const stat = fs.statSync(outPath)
console.log(`Wrote ${Object.keys(lookup).length} pincodes to ${outPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`)
if (skipped) console.warn(`Skipped ${skipped} rows`)
