const BARE_PATHS = new Set(["/portal/apply", "/portal/join", "/portal/login", "/portal/login/admin"])

export function hidePortalChrome(pathname: string) {
  return BARE_PATHS.has(pathname)
}
