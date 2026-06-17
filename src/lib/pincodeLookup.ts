export type PincodeLocation = {
  city: string
  state: string
}

type PincodeLookupDb = Record<string, PincodeLocation>

let cache: PincodeLookupDb | null = null
let loadPromise: Promise<PincodeLookupDb> | null = null

export function loadPincodeLookup(): Promise<PincodeLookupDb> {
  if (cache) return Promise.resolve(cache)
  if (loadPromise) return loadPromise

  loadPromise = fetch(`${import.meta.env.BASE_URL}data/pincode-lookup.json`)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`Pincode lookup failed (${res.status})`)
      }
      return res.json() as Promise<PincodeLookupDb>
    })
    .then((data) => {
      cache = data
      return data
    })
    .catch((err) => {
      loadPromise = null
      throw err
    })

  return loadPromise
}

export async function lookupPincode(pincode: string): Promise<PincodeLocation | null> {
  const pin = pincode.trim()
  if (!/^\d{6}$/.test(pin)) return null
  const db = await loadPincodeLookup()
  return db[pin] ?? null
}
