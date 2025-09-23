export type RetryOptions = {
  retries?: number
  factor?: number
  minTimeoutMs?: number
  maxTimeoutMs?: number
}

export async function retry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const {
    retries = 3,
    factor = 2,
    minTimeoutMs = 300,
    maxTimeoutMs = 4000,
  } = opts

  let attempt = 0
  let lastError: any
  while (attempt <= retries) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (attempt === retries) break
      const delay = Math.min(maxTimeoutMs, Math.floor(minTimeoutMs * Math.pow(factor, attempt)))
      const jitter = Math.floor(Math.random() * 200)
      await new Promise((res) => setTimeout(res, delay + jitter))
      attempt++
    }
  }
  throw lastError
}
