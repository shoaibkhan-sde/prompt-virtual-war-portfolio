/**
 * Determines whether a navigation link is active based on the current pathname.
 *
 * Rules:
 * - Root path ('/'): strictly matches '/'
 * - Subpaths ('/scenarios'): matches exactly '/scenarios' or any nested route '/scenarios/*'
 * - Unlinked paths ('/plan/new'): returns false for both
 */
export function isActive(pathname: string, href: string): boolean {
  if (!pathname || !href) {
    return false;
  }
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
