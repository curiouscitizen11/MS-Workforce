const BARE_PATHS = new Set(["/portal/apply", "/portal/join", "/portal/login", "/portal/login/admin", "/portal/book-labour"])

export function hidePortalChrome(pathname: string) {
  return BARE_PATHS.has(pathname)
}
