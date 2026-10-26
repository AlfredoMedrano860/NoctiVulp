// Solo enlaces https: evita que un "javascript:" pegado por error termine en un href.
export function isSafeUrl(href: string) {
  try {
    return new URL(href).protocol === 'https:'
  } catch {
    return false
  }
}
