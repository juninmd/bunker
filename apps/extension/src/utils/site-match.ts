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

// Suffixes under which unrelated people own subdomains; an entry for one of them must match exactly.
const SHARED_SUFFIXES = new Set(['github.io', 'gitlab.io', 'blogspot.com', 'wordpress.com', 'herokuapp.com', 'netlify.app', 'vercel.app',
  'pages.dev', 'workers.dev', 'web.app', 'firebaseapp.com', 'appspot.com', 'azurewebsites.net', 'cloudfront.net', 's3.amazonaws.com',
  'myshopify.com', 'glitch.me', 'onrender.com', 'fly.dev', 'ngrok.io', 'ngrok-free.app', 'repl.co', 'surge.sh', 'wixsite.com', 'notion.site']);
const COUNTRY_SECOND_LEVEL = /^(com|net|org|gov|edu|co|ac|or|ne|go|gob|mil|nom|ltd|plc)\.[a-z]{2}$/;

function isSharedSuffix(host: string): boolean {
  return !host.includes('.') || SHARED_SUFFIXES.has(host) || COUNTRY_SECOND_LEVEL.test(host);
}

// Subdomains inherit a parent entry, unless the parent is a suffix shared by strangers (com, com.br, github.io).
export function matchesHost(pageHost: string, site: string): boolean {
  const page = siteHost(pageHost);
  const stored = siteHost(site);
  if (!page || !stored) return false;
  if (page === stored) return true;
  return !isSharedSuffix(stored) && page.endsWith(`.${stored}`);
}

export function sameHost(a: string, b: string): boolean {
  const left = siteHost(a);
  return !!left && left === siteHost(b);
}
