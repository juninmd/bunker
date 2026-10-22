const CORPORATE_DOMAINS = ['slack', 'google', 'aws', 'microsoft', 'okta', 'github'];

export function getSaasApps(vault: any[]): string[] {
  if (!Array.isArray(vault)) return [];
  const apps = vault
    .filter(item => item.site && CORPORATE_DOMAINS.some(domain => item.site.toLowerCase().includes(domain)))
    .map(item => item.title || item.site);

  return Array.from(new Set(apps)).slice(0, 10);
}
