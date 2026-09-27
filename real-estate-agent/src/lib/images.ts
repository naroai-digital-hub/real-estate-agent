// ---------------------------------------------------------------------
// Central image library. All public-site imagery lives here so visuals
// are easy to swap or replace later. Every URL is a stable Unsplash
// photo ID; <SmartImage> degrades gracefully if one ever fails.
// ---------------------------------------------------------------------

const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`

export const IMAGES = {
  heroMain: u('photo-1600607687939-ce8a6c25118c', 2000),
  heroCard: u('photo-1560518883-ce09059eeffa', 800),
  aboutMain: u('photo-1600880292203-757bb62b4baf', 1200),
  aboutLayer: u('photo-1521791136064-7986c2920216', 800),
  aboutOffice: u('photo-1497366216548-37526070297c', 1200),
  ctaBand: u('photo-1600585154340-be6161a56a0c', 2000),
  adminLogin: u('photo-1600596542815-ffad4c1539a9', 1400),
  keys: u('photo-1560518883-ce09059eeffa', 900),
} as const

// Service imagery, matched by keyword in the service name.
const SERVICE_IMAGES: Record<string, string> = {
  buyer: u('photo-1556761175-b413da4baf72', 900),
  seller: u('photo-1450101499163-c8848c66ca85', 900),
  viewing: u('photo-1512917774080-9991f1c4c750', 900),
  valuation: u('photo-1503387762-592deb58ef4e', 900),
  investment: u('photo-1486406146926-c627a92ad1ab', 900),
  virtual: u('photo-1460925895917-afdab827c52f', 900),
}

const DEFAULT_SERVICE_IMAGE = u('photo-1600566753086-00f18fb6b3ea', 900)

export function serviceImageFor(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('buyer')) return SERVICE_IMAGES.buyer
  if (n.includes('seller')) return SERVICE_IMAGES.seller
  if (n.includes('viewing') || n.includes('tour') || n.includes('showing'))
    return SERVICE_IMAGES.viewing
  if (n.includes('valuation') || n.includes('appraisal') || n.includes('market value'))
    return SERVICE_IMAGES.valuation
  if (n.includes('invest')) return SERVICE_IMAGES.investment
  if (n.includes('virtual') || n.includes('online') || n.includes('video'))
    return SERVICE_IMAGES.virtual
  return DEFAULT_SERVICE_IMAGE
}
