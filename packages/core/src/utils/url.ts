export const urlWithParams = (
  url: string,
  params: Record<string, string | number | undefined>
) => {
  const _url = new URL(url)
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      _url.searchParams.set(key, String(value))
    }
  })
  return decodeURIComponent(_url.toString())
}
