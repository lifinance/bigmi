export function hexToBase64(hex: string): string {
  const raw = hex
    .match(/.{1,2}/g)!
    .map((byte: string) => String.fromCharCode(Number.parseInt(byte, 16)))
    .join('')
  return btoa(raw)
}

export function base64ToHex(base64: string): string {
  const raw = atob(base64)
  let hex = ''
  for (let i = 0; i < raw.length; i++) {
    const hexByte = raw.charCodeAt(i).toString(16)
    hex += hexByte.length === 2 ? hexByte : `0${hexByte}`
  }
  return hex
}

export function base64urlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str)
  const encodedString = btoa(String.fromCharCode(...bytes))
  return encodedString
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function stringToHex(value: string): string {
  const hex = Array.from(value)
    .map((char: string) => char.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('')

  return `0x${hex}`
}

export function hexToUnit8Array(value: string): Uint8Array {
  return new Uint8Array(
    value.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || []
  )
}
