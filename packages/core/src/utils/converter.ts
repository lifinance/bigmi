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
