/**
 * institutional.ts
 * ────────────────
 * Institutional identity, ROR domain resolution, university logo fetching,
 * heraldic insignia generation, and academic cover page typesetting for Voltrix OS.
 *
 * Supports edge environments (Cloudflare Workers, Durable Objects, WhatsApp runtime).
 */

export interface UniversityCrestMeta {
  university: string;
  domain?: string;
  website?: string;
  logoUrl?: string;
}

export interface CoverPageMeta {
  university: string;
  logoUrl?: string;
  studentName?: string;
  studentId?: string;
  department?: string;
  degreeProgram?: string;
  academicLevel?: string;
  academicYear?: string;
  semester?: string;
  courseCode?: string;
  courseName?: string;
  instructor?: string;
  title: string;
  docType?: string;
  submissionDate?: string;
  citationStyle?: string;
  declaration?: string;
  isGroupWork?: boolean;
  groupNumber?: string;
  groupMembers?: Array<{ name: string; id?: string; role?: string } | string>;
}

// ── Known University Domain & Logo Catalog ─────────────────────────────────────

const PRESET_UNIVERSITY_LOGOS: Record<string, string> = {
  // East Africa & Africa
  'makerere': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mak.ac.ug&size=256',
  'mak': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mak.ac.ug&size=256',
  'kyambogo': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://kyu.ac.ug&size=256',
  'kyu': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://kyu.ac.ug&size=256',
  'kampala international': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://kiu.ac.ug&size=256',
  'kiu': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://kiu.ac.ug&size=256',
  'uganda christian': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ucu.ac.ug&size=256',
  'ucu': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ucu.ac.ug&size=256',
  'mubs': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mubs.ac.ug&size=256',
  'makerere university business school': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mubs.ac.ug&size=256',
  'nairobi': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://uonbi.ac.ke&size=256',
  'uon': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://uonbi.ac.ke&size=256',
  'dar es salaam': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://udsm.ac.tz&size=256',
  'udsm': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://udsm.ac.tz&size=256',
  'cape town': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://uct.ac.za&size=256',
  'uct': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://uct.ac.za&size=256',
  'witwatersrand': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://wits.ac.za&size=256',
  'wits': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://wits.ac.za&size=256',
  'pretoria': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://up.ac.za&size=256',
  'stellenbosch': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://sun.ac.za&size=256',
  'ghana': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ug.edu.gh&size=256',
  'lagos': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://unilag.edu.ng&size=256',
  'unilag': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://unilag.edu.ng&size=256',
  'ibadan': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ui.edu.ng&size=256',
  'knust': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://knust.edu.gh&size=256',

  // Ivy League & Global Top Universities
  'massachusetts institute of technology': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mit.edu&size=256',
  'mit': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mit.edu&size=256',
  'harvard': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://harvard.edu&size=256',
  'stanford': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://stanford.edu&size=256',
  'oxford': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ox.ac.uk&size=256',
  'cambridge': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://cam.ac.uk&size=256',
  'berkeley': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://berkeley.edu&size=256',
  'princeton': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://princeton.edu&size=256',
  'yale': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://yale.edu&size=256',
  'columbia': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://columbia.edu&size=256',
  'cornell': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://cornell.edu&size=256',
  'imperial college': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://imperial.ac.uk&size=256',
  'eth zurich': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://ethz.ch&size=256',
  'national university of singapore': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://nus.edu.sg&size=256',
  'nus': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://nus.edu.sg&size=256',
  'toronto': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://utoronto.ca&size=256',
  'michigan': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://umich.edu&size=256',
  'tokyo': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://u-tokyo.ac.jp&size=256',
  'melbourne': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://unimelb.edu.au&size=256',
  'sydney': 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://sydney.edu.au&size=256',
};

/**
 * Resolves a high-resolution crest/logo URL for an academic institution using Google Favicon V2 service
 * and ROR domain data.
 */
export function resolveUniversityLogoUrl(
  universityName?: string,
  domainOrWebsite?: string
): string {
  const uniKey = (universityName || '').trim().toLowerCase();

  // 1. Direct preset match
  for (const [key, url] of Object.entries(PRESET_UNIVERSITY_LOGOS)) {
    if (uniKey.includes(key)) {
      return url;
    }
  }

  // 2. Resolve from domain or website string
  let rawDomain = domainOrWebsite || '';
  if (!rawDomain && universityName) {
    // Attempt simple heuristic domain extraction if name looks like a domain
    if (universityName.includes('.') && !universityName.includes(' ')) {
      rawDomain = universityName;
    }
  }

  if (rawDomain) {
    const cleanDomain = rawDomain
      .replace(/^https?:\/\//i, '')
      .split('/')[0]
      .split(':')[0]
      .trim();
    if (cleanDomain) {
      return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${cleanDomain}&size=256`;
    }
  }

  // 3. Fallback to Makerere or universal academic crest icon
  return 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://mak.ac.ug&size=256';
}

/**
 * Encodes SVG markup into a self-contained base64 data URL.
 * Works universally across Cloudflare Workers, browser DOM, and Node.js runtimes.
 */
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

/**
 * Returns raw standalone SVG vector markup for an academic institution.
 * Self-contained, resolution-independent, and fully offline-capable.
 */
export function getRawUniversityCrestSvg(university = ''): string {
  const u = (university || '').toLowerCase();

  // MIT (Massachusetts Institute of Technology)
  // MIT Crimson (#A31F34), silver border, curved text path "MASSACHUSETTS INSTITUTE OF TECHNOLOGY", "MIT", "MENS ET MANUS", "1861"
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

  // Makerere University (MAK)
  if (u.includes('makerere') || u.includes('mak')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="makGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>
  <path d="M50 5 C75 5, 90 20, 90 50 C90 78, 50 95, 50 95 C50 95, 10 78, 10 50 C10 20, 25 5, 50 5 Z" fill="url(#makGrad)" stroke="url(#goldGrad)" stroke-width="3.5" />
  <rect x="42" y="24" width="16" height="28" fill="#ffffff" rx="1.5" />
  <polygon points="50,15 40,24 60,24" fill="url(#goldGrad)" />
  <path d="M30 62 C38 56, 48 56, 50 60 C52 56, 62 56, 70 62 L68 76 C60 70, 52 70, 50 73 C48 70, 40 70, 32 76 Z" fill="#ffffff" stroke="url(#goldGrad)" stroke-width="1.5" />
  <circle cx="50" cy="48" r="3" fill="url(#goldGrad)" />
  <text x="50" y="88" text-anchor="middle" fill="url(#goldGrad)" font-size="5.5" font-family="'Cinzel', serif" font-weight="bold">PRO DEO ET PATRIA</text>
</svg>`;
  }

  // Kyambogo University (KYU)
  if (u.includes('kyambogo') || u.includes('kyu')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="kyuGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a" />
      <stop offset="100%" stop-color="#172554" />
    </linearGradient>
    <linearGradient id="kyuGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
  </defs>
  <path d="M50 5 C76 5, 90 20, 90 52 C90 80, 50 96, 50 96 C50 96, 10 80, 10 52 C10 20, 24 5, 50 5 Z" fill="url(#kyuGrad)" stroke="url(#kyuGold)" stroke-width="3.5" />
  <polygon points="50,18 45,34 55,34" fill="#ef4444" />
  <circle cx="50" cy="22" r="4" fill="#fbbf24" />
  <rect x="47" y="34" width="6" height="18" fill="url(#kyuGold)" rx="1" />
  <path d="M28 58 C36 52, 48 52, 50 55 C52 52, 64 52, 72 58 L70 72 C62 66, 52 66, 50 69 C48 66, 38 66, 30 72 Z" fill="#ffffff" stroke="url(#kyuGold)" stroke-width="1.5" />
  <text x="50" y="88" text-anchor="middle" fill="url(#kyuGold)" font-size="4.8" font-family="'Cinzel', serif" font-weight="bold">KNOWLEDGE &amp; SKILLS</text>
</svg>`;
  }

  // Oxford University
  if (u.includes('oxford') || u.includes('oxon')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="oxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#002147" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
  </defs>
  <path d="M50 5 C75 5, 90 20, 90 50 C90 78, 50 95, 50 95 C50 95, 10 78, 10 50 C10 20, 25 5, 50 5 Z" fill="url(#oxGrad)" stroke="#d4af37" stroke-width="3" />
  <path d="M30 38 C38 34, 48 34, 50 37 C52 34, 62 34, 70 38 L68 56 C60 52, 52 52, 50 55 C48 52, 40 52, 32 56 Z" fill="#ffffff" stroke="#d4af37" stroke-width="1.5" />
  <text x="40" y="46" font-size="4" font-family="'Cinzel', serif" fill="#002147" font-weight="bold">DOMI</text>
  <text x="40" y="51" font-size="4" font-family="'Cinzel', serif" fill="#002147" font-weight="bold">MINA</text>
  <text x="60" y="46" font-size="4" font-family="'Cinzel', serif" fill="#002147" font-weight="bold">NVST</text>
  <text x="60" y="51" font-size="4" font-family="'Cinzel', serif" fill="#002147" font-weight="bold">ILLV</text>
  <circle cx="36" cy="22" r="4.5" fill="none" stroke="#d4af37" stroke-width="2" />
  <circle cx="64" cy="22" r="4.5" fill="none" stroke="#d4af37" stroke-width="2" />
  <circle cx="50" cy="72" r="4.5" fill="none" stroke="#d4af37" stroke-width="2" />
</svg>`;
  }

  // Cambridge University
  if (u.includes('cambridge') || u.includes('cantab')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <path d="M50 5 C75 5, 90 20, 90 50 C90 78, 50 95, 50 95 C50 95, 10 78, 10 50 C10 20, 25 5, 50 5 Z" fill="#991b1b" stroke="#eab308" stroke-width="3" />
  <line x1="50" y1="5" x2="50" y2="95" stroke="#ffffff" stroke-width="8" />
  <line x1="10" y1="46" x2="90" y2="46" stroke="#ffffff" stroke-width="8" />
  <line x1="50" y1="5" x2="50" y2="95" stroke="#eab308" stroke-width="2" />
  <line x1="10" y1="46" x2="90" y2="46" stroke="#eab308" stroke-width="2" />
  <circle cx="30" cy="26" r="5" fill="#eab308" />
  <circle cx="70" cy="26" r="5" fill="#eab308" />
  <circle cx="30" cy="66" r="5" fill="#eab308" />
  <circle cx="70" cy="66" r="5" fill="#eab308" />
  <rect x="42" y="38" width="16" height="16" fill="#eab308" rx="2" />
  <text x="50" y="50" font-size="8" font-family="'Cinzel', serif" fill="#991b1b" font-weight="bold" text-anchor="middle">📖</text>
</svg>`;
  }

  // Harvard University
  if (u.includes('harvard')) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <path d="M50 5 C75 5, 90 20, 90 50 C90 78, 50 95, 50 95 C50 95, 10 78, 10 50 C10 20, 25 5, 50 5 Z" fill="#a51c30" stroke="#ffffff" stroke-width="2.5" />
  <rect x="28" y="24" width="18" height="15" fill="#ffffff" rx="1" />
  <text x="37" y="34" font-size="7" font-family="'Cinzel', serif" fill="#a51c30" font-weight="bold" text-anchor="middle">VE</text>
  <rect x="54" y="24" width="18" height="15" fill="#ffffff" rx="1" />
  <text x="63" y="34" font-size="7" font-family="'Cinzel', serif" fill="#a51c30" font-weight="bold" text-anchor="middle">RI</text>
  <rect x="41" y="52" width="18" height="15" fill="#ffffff" rx="1" />
  <text x="50" y="62" font-size="7" font-family="'Cinzel', serif" fill="#a51c30" font-weight="bold" text-anchor="middle">TAS</text>
</svg>`;
  }

  // Universal Academic Insignia (VERITAS ET SCIENTIA)
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

/**
 * Returns a self-contained base64 data URL for a university's heraldic crest.
 * This guarantees offline rendering in sandboxed iframes (Doc editor),
 * export fidelity in PDF and HTML generation, and zero network dependence.
 */
export function getUniversityCrestDataUrl(university = ''): string {
  const rawSvg = getRawUniversityCrestSvg(university);
  return svgToDataUrl(rawSvg);
}

/**
 * Authentic University Crest & Heraldic Insignia HTML/SVG Element Generator
 * Used for vector crispness in PDF exports and HTML rendering.
 */
export function getUniversityCrestSvg(university = '', logoUrl = ''): string {
  if (logoUrl) {
    return `<img src="${logoUrl}" alt="${university || 'University'} Crest" class="w-16 h-16 object-contain mx-auto mb-2.5 filter drop-shadow-sm" />`;
  }

  const rawSvg = getRawUniversityCrestSvg(university);
  return `<div class="w-16 h-16 mx-auto mb-2 flex items-center justify-center filter drop-shadow">${rawSvg}</div>`;
}

/**
 * Format a Markdown Academic Cover Page with University Crest.
 * Defaults to a self-contained base64 data URL to ensure 100% reliable rendering
 * inside sandboxed iframes (Voltrix Doc editor) with no network access.
 */
export function formatAcademicCoverPage(meta: CoverPageMeta): string {
  // Always use self-contained base64 data URL crest so that sandboxed iframes (Doc editor),
  // offline print renders, PDF exports, and WhatsApp attachments display crisply without network errors.
  const logo = (meta.logoUrl && meta.logoUrl.startsWith('data:'))
    ? meta.logoUrl
    : getUniversityCrestDataUrl(meta.university);

  const dateStr = meta.submissionDate || new Date().toISOString().slice(0, 10);
  const typeLabel = meta.docType || 'Coursework Submission';

  let rosterOrStudent = '';
  if (meta.isGroupWork && Array.isArray(meta.groupMembers) && meta.groupMembers.length > 0) {
    const rows = meta.groupMembers.map((m, idx) => {
      const name = typeof m === 'string' ? m : (m.name || 'Group Member');
      const id = typeof m === 'object' ? (m.id || '—') : '—';
      const role = typeof m === 'object' ? (m.role || 'Contributor') : 'Contributor';
      return `| ${idx + 1} | **${name}** | \`${id}\` | ${role} |`;
    }).join('\n');

    rosterOrStudent = `
### ${meta.groupNumber || 'Collaborative Group Roster'} (${meta.groupMembers.length} Members)
| # | Student Scholar | Reg / ID No. | Academic Role |
|---|---|---|---|
${rows}
`;
  } else {
    rosterOrStudent = `
| Field | Academic Scholar Credentials |
|---|---|
| **Student Scholar** | **${meta.studentName || 'Academic Scholar'}** |
| **Student ID / Reg No.** | \`${meta.studentId || '—'}\` |
| **Degree Program** | ${meta.degreeProgram || 'Undergraduate Degree Program'} |
| **Academic Standing** | ${[meta.academicLevel, meta.academicYear, meta.semester].filter(Boolean).join(', ') || 'Senior Standing'} |
| **Course Unit** | **${[meta.courseCode, meta.courseName].filter(Boolean).join(' — ') || 'Academic Examination Unit'}** |
| **Faculty / Department** | ${meta.department || 'Faculty of Science & Technology'} |
| **Supervisor / Examiner** | ${meta.instructor || 'Faculty Board of Examiners'} |
| **Submission Date** | ${dateStr} |
| **Official Citation** | ${meta.citationStyle || 'IEEE / APA Standard'} |
`;
  }

  const declaration = meta.declaration ||
    'I hereby declare that this assignment is my own original academic work and that all external sources, theories, and citations have been rigorously attributed according to institutional standards.';

  return `
<div align="center">

![${meta.university} Crest](${logo})

# ${meta.university.toUpperCase()}
### ${meta.department || 'Faculty & Academic Examination Board'}

---

# ${meta.title}
**${typeLabel}**

</div>

${rosterOrStudent}

> **Academic Integrity Declaration:**
> "${declaration}"

---

`;
}

/**
 * System directive to inject into AI agent prompts so that Voltrix OS agents
 * automatically generate academic cover pages with self-contained data URL university crests.
 */
export const ACADEMIC_SUBMISSION_SYSTEM_DIRECTIVE = `
══════════════════════════════════════════════════════════════════════════
ACADEMIC SUBMISSION MANDATE & INSTITUTIONAL IDENTITY PROTOCOL
══════════════════════════════════════════════════════════════════════════
When the student asks to write, draft, generate, or format a coursework, essay,
lab report, research paper, dissertation chapter, problem set submission, or
formal academic assignment:

UNLESS THE STUDENT EXPLICITLY STATES OTHERWISE (e.g., "no cover page", "anonymous",
"skip header", or "plain text only"):

1. ALWAYS PREPEND A FORMAL ACADEMIC COVER PAGE with the university crest and credentials:
   - Centered university logo: ![<University> Crest](<crestDataUrl>)
   - CRITICAL LESSON (SANDBOXED IFRAME NETWORK BARRIER):
     The Doc editor and blueprint environment run inside a strictly sandboxed iframe
     with ZERO DIRECT INTERNET ACCESS. If you use a remote image URL (e.g., https://...),
     the browser CANNOT fetch it, and the <img> silently renders as an empty broken box.
     THEREFORE: Always embed university crests as self-contained base64 data URLs
     (data:image/svg+xml;base64,...), NEVER remote HTTP/HTTPS URLs!
     Because it is embedded as a data URL, it:
       • Renders correctly in the interactive editor with zero network access,
       • Survives reloads,
       • Carries through cleanly into PDF and HTML exports, and
       • Can be sent via WhatsApp if exported as a PDF attachment.
   - For MIT: Use the SVG university seal in MIT crimson (#A31F34) with "MASSACHUSETTS INSTITUTE OF TECHNOLOGY"
     curved around the border, "MIT", the motto "Mens et Manus", and the founding year "1861".
     (If the student provides or uploads their own official logo image, remind them that
     Insert → Image in the toolbar embeds images automatically as base64 data URLs).
   - University Name (UPPERCASE) & Faculty/Department
   - Assignment / Paper Title & Course Unit Code and Name
   - Student Author Name & Student ID / Reg No. (or Group Roster if group work)
   - Degree Program & Academic Year / Level
   - Submission Date (current date)
   - Academic Integrity & Anti-Plagiarism Declaration
   - Clean divider (---) before beginning Section 1 / Introduction.

2. IF GROUP WORK IS DETECTED (keywords: "group", "team", "our group", "members", "we are"):
   - Structure a complete Group Member Roster table with columns: #, Name, Reg/ID, Role.

3. RIGOR & CITATIONS:
   - Ensure all inline citations and reference bibliographies strictly follow the student's
     specified citation standard (IEEE, APA, MLA, Harvard, Chicago).
   - Use rigorous mathematical typography ($...$ and $$...$$) where applicable.
══════════════════════════════════════════════════════════════════════════
`;
