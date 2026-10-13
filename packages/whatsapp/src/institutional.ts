/**
 * institutional.ts — Institutional identity & logo resolver for voltrix-whatsapp
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
