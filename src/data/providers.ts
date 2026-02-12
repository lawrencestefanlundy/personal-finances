/**
 * Maps provider names to their domain for Google Favicon API lookups.
 * Used by ProviderLogo component to display favicons.
 */
export const providerDomains: Record<string, string> = {
  // Banks & Financial
  Monzo: 'monzo.com',
  Chase: 'chase.co.uk',
  'Lloyds Bank': 'lloydsbank.co.uk',
  Amex: 'americanexpress.com',
  Aldermore: 'aldermore.co.uk',
  SLC: 'slc.co.uk',

  // Energy & Utilities
  'Octopus Energy': 'octopusenergy.com',
  'Southern Water': 'southernwater.co.uk',
  'Virgin Media': 'virginmedia.com',

  // Health & Fitness
  Bupa: 'bupa.co.uk',
  Peloton: 'onepeloton.co.uk',

  // Government
  DVLA: 'gov.uk',
  'Lewes District': 'lewes-eastbourne.gov.uk',
  'TV License': 'tvlicensing.co.uk',

  // Insurance
  'Policy Expert': 'policyexpert.co.uk',
  'Purely Pets': 'purelypetsinsurance.co.uk',
  Hastings: 'hastingsdirect.com',

  // Telecoms & Subscriptions
  Smarty: 'smarty.co.uk',
  Spotify: 'spotify.com',
  Amazon: 'amazon.co.uk',

  // Investments & Crypto
  Coinbase: 'coinbase.com',
  Vanguard: 'vanguardinvestor.co.uk',
  'Lunar Ventures': 'lunar.vc',
  Cloudberry: 'cloudberry.vc',
  'Insig AI': 'insig.ai',
  Volkswagen: 'volkswagen.co.uk',

  // Work
  'State of the Future': 'stateofthefuture.io',
};

export function getProviderDomain(provider: string): string | null {
  return providerDomains[provider] ?? null;
}

export function getFaviconUrl(provider: string, size: number = 32): string | null {
  const domain = getProviderDomain(provider);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}
