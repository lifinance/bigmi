export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | undefined

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = undefined
    }, delay)
  }) as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = undefined
    }
  }

  return debounced
}
