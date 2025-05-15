export const urlWithApiKey = (
  url: string,
  apiKey?: {
    name: string
    value?: string
  }
) => {
  const _url = new URL(url)
  if (apiKey?.value) {
    const { name, value } = apiKey
    _url.searchParams.append(name, value)
  }
  return _url.toString()
}
