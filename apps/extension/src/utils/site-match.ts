// Stored sites may be bare hosts ("github.com") or full URLs imported from LastPass ("https://github.com/login").
export function siteHost(site: string): string {
  const value = (site || '').trim().toLowerCase();
  if (!value) return '';
  try {
    const host = new URL(value.includes('://') ? value : `https://${value}`).hostname;
    return host.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Subdomains inherit a parent entry only when the parent has a dot, so a bare "com" or "io" never matches everything.
export function matchesHost(pageHost: string, site: string): boolean {
  const page = siteHost(pageHost);
  const stored = siteHost(site);
  if (!page || !stored) return false;
  if (page === stored) return true;
  return stored.includes('.') && page.endsWith(`.${stored}`);
}

export function sameHost(a: string, b: string): boolean {
  const left = siteHost(a);
  return !!left && left === siteHost(b);
}
