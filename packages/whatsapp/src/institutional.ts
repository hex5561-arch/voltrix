/**
 * institutional.ts — Institutional identity, SVG crest generator & logo resolver for voltrix-whatsapp
 */

const PRESET_UNIVERSITY_LOGOS: Record<string, string> = {
  'makerere': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mak.ac.ug&size=256',
  'mak': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mak.ac.ug&size=256',
  'kyambogo': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://kyu.ac.ug&size=256',
  'kyu': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://kyu.ac.ug&size=256',
  'kampala international': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://kiu.ac.ug&size=256',
  'kiu': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://kiu.ac.ug&size=256',
  'uganda christian': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ucu.ac.ug&size=256',
  'ucu': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ucu.ac.ug&size=256',
  'mubs': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mubs.ac.ug&size=256',
  'nairobi': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://uonbi.ac.ke&size=256',
  'uon': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://uonbi.ac.ke&size=256',
  'dar es salaam': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://udsm.ac.tz&size=256',
  'cape town': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://uct.ac.za&size=256',
  'wits': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://wits.ac.za&size=256',
  'mit': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mit.edu&size=256',
  'harvard': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://harvard.edu&size=256',
  'stanford': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://stanford.edu&size=256',
  'oxford': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ox.ac.uk&size=256',
  'cambridge': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://cam.ac.uk&size=256',
  'berkeley': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://berkeley.edu&size=256',
};

export function resolveUniversityLogoUrl(
  universityName?: string,
  domainOrWebsite?: string
): string {
  const uniKey = (universityName || '').trim().toLowerCase();
  for (const [key, url] of Object.entries(PRESET_UNIVERSITY_LOGOS)) {
    if (uniKey.includes(key)) return url;
  }
  let rawDomain = domainOrWebsite || '';
  if (!rawDomain && universityName && universityName.includes('.') && !universityName.includes(' ')) {
    rawDomain = universityName;
  }
  if (rawDomain) {
    const cleanDomain = rawDomain.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].trim();
    if (cleanDomain) {
      return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanDomain}&size=256`;
    }
  }
  return 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mak.ac.ug&size=256';
}

export function svgToDataUrl(svgMarkup: string): string {
  const trimmed = svgMarkup.trim();
  let base64 = '';
  if (typeof btoa === 'function') {
    base64 = btoa(unescape(encodeURIComponent(trimmed)));
  } else {
    const Buf = (globalThis as unknown as { Buffer?: { from: (s: string, enc: string) => { toString: (enc: string) => string } } }).Buffer;
    if (Buf) {
      base64 = Buf.from(trimmed, 'utf8').toString('base64');
    }
  }
  return `data:image/svg+xml;base64,${base64}`;
}

export function getRawUniversityCrestSvg(university = ''): string {
  const u = (university || '').toLowerCase();
  if (u.includes('mit') || u.includes('massachusetts institute')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200" width="120" height="120">
  <defs>
    <path id="mitArcTop" d="M 26,100 A 74,74 0 1,1 174,100" fill="none" />
    <path id="mitArcBottom" d="M 174,100 A 74,74 0 0,1 26,100" fill="none" />
  </defs>
  <circle cx="100" cy="100" r="96" fill="#A31F34" stroke="#8A8B8C" stroke-width="2.5" />
  <circle cx="100" cy="100" r="88" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-dasharray="2,2" />
  <circle cx="100" cy="100" r="64" fill="#750014" stroke="#FFFFFF" stroke-width="1.8" />
  <text fill="#FFFFFF" font-family="'Cinzel', 'Times New Roman', Georgia, serif" font-size="10.5" font-weight="bold" letter-spacing="1.2">
    <textPath href="#mitArcTop" xlink:href="#mitArcTop" startOffset="50%" text-anchor="middle">MASSACHUSETTS INSTITUTE OF TECHNOLOGY</textPath>
  </text>
  <text fill="#FFFFFF" font-family="'Cinzel', 'Times New Roman', Georgia, serif" font-size="10" font-weight="bold" letter-spacing="1.4">
    <textPath href="#mitArcBottom" xlink:href="#mitArcBottom" startOffset="50%" text-anchor="middle">MENS ET MANUS • 1861</textPath>
  </text>
  <circle cx="26" cy="100" r="2.5" fill="#FFFFFF" />
  <circle cx="174" cy="100" r="2.5" fill="#FFFFFF" />
  <text x="100" y="96" fill="#FFFFFF" font-family="'Cinzel', 'Times New Roman', Georgia, serif" font-size="28" font-weight="bold" text-anchor="middle" letter-spacing="3">MIT</text>
  <text x="100" y="116" fill="#F1F5F9" font-family="'Cinzel', 'Times New Roman', Georgia, serif" font-size="9" font-weight="600" text-anchor="middle" letter-spacing="1.5">MENS ET MANUS</text>
  <text x="100" y="132" fill="#E2E8F0" font-family="'Cinzel', 'Times New Roman', Georgia, serif" font-size="10.5" font-weight="bold" text-anchor="middle">1861</text>
</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="crestGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#eab308" />
      <stop offset="50%" stop-color="#ca8a04" />
      <stop offset="100%" stop-color="#a16207" />
    </linearGradient>
    <linearGradient id="crestSlate" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>
  <path d="M50 6 C76 6, 88 20, 88 50 C88 78, 50 94, 50 94 C50 94, 12 78, 12 50 C12 20, 24 6, 50 6 Z" fill="url(#crestSlate)" stroke="url(#crestGold)" stroke-width="3" />
  <path d="M30 44 C38 40, 48 40, 50 43 C52 40, 62 40, 70 44 L68 62 C60 58, 52 58, 50 61 C48 58, 40 58, 32 62 Z" fill="#ffffff" stroke="url(#crestGold)" stroke-width="1.5" />
  <polygon points="50,22 45,34 55,34" fill="url(#crestGold)" />
  <circle cx="50" cy="24" r="3" fill="#ef4444" />
  <text x="50" y="86" text-anchor="middle" fill="url(#crestGold)" font-size="4.8" font-family="'Cinzel', serif" font-weight="bold">VERITAS ET SCIENTIA</text>
</svg>`;
}

export function getUniversityCrestDataUrl(university = ''): string {
  return svgToDataUrl(getRawUniversityCrestSvg(university));
}
