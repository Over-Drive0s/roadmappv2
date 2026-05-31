/** Full reload so workspace storage re-initializes for the active profile session. */
export function reloadToHashRoute(route: string) {
  const normalized = route.startsWith('/') ? route : `/${route}`
  const base = `${window.location.pathname}${window.location.search}`
  window.location.replace(`${base}#${normalized}`)
  window.location.reload()
}
