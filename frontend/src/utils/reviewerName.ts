const STORAGE_KEY = 'rocketlab:reviewerName'

export function getReviewerName(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function setReviewerName(name: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, name)
  } catch {
    // Sessão sem acesso a sessionStorage (ex: navegação privada restrita) — segue sem persistir.
  }
}
