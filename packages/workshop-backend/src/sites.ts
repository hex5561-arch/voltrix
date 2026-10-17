/**
 * sites.ts
 * ────────
 * Edge Web Hosting Engine for Voltrix OS.
 * Stores, normalizes, indexes, and serves production-grade HTML5 web applications
 * from Cloudflare R2 with global edge distribution (sub-50ms TTFB).
 */

export interface PublishSiteParams {
  html: string;
  title?: string;
  slug?: string;
  userId?: string;
  authorName?: string;
  description?: string;
  origin?: string;
}

export interface SiteMetadata {
  slug: string;
  title: string;
  userId: string;
  authorName: string;
  description: string;
  version: number;
  views: number;
  sizeBytes: number;
  publishedAt: string;
  updatedAt: string;
  liveUrl: string;
  r2Key: string;
}

export interface PublishSiteResult {
  success: boolean;
  slug: string;
  liveUrl: string;
  title: string;
  version: number;
  sizeBytes: number;
  publishedAt: string;
}

export function getVoltrixDbScript(slug?: string): string {
  const safeSlug = (slug || '').replace(/[^a-z0-9-_]/gi, '');
  return `<script id="voltrix-edge-sdk">
(function() {
  if (window.VoltrixDB) return;
  var appSlug = ${JSON.stringify(safeSlug || '')};
  function getSlug() {
    if (appSlug) return appSlug;
    if (window.__VOLTRIX_APP_SLUG__) return window.__VOLTRIX_APP_SLUG__;
    var m = window.location.pathname.match(/\\/s\\/([^/?#]+)/);
    return m ? m[1].replace(/\\.html$/i, '') : 'default-app';
  }
  function getApiBase() {
    var origin = (window.location && window.location.origin && window.location.origin.indexOf('http') === 0)
      ? window.location.origin
      : 'https://voltrix.stream';
    return origin + '/api/sites/data';
  }

  window.VoltrixDB = {
    async get(key) {
      var s = getSlug();
      try {
        var res = await fetch(getApiBase() + '?slug=' + encodeURIComponent(s) + '&key=' + encodeURIComponent(key));
        if (res.ok) {
          var data = await res.json();
          if (data && data.success) return data.value;
        }
      } catch (e) {
        console.warn('[VoltrixDB] get network fallback:', e);
      }
      try {
        var local = localStorage.getItem('vdb_' + s + '_' + key);
        return local !== null ? JSON.parse(local) : null;
      } catch (err) {
        return null;
      }
    },

    async set(key, val) {
      var s = getSlug();
      try {
        localStorage.setItem('vdb_' + s + '_' + key, JSON.stringify(val));
      } catch (e) {}
      try {
        var res = await fetch(getApiBase(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: s, key: key, value: val })
        });
        if (res.ok) {
          var data = await res.json();
          return data.value !== undefined ? data.value : val;
        }
      } catch (e) {
        console.warn('[VoltrixDB] set network error:', e);
      }
      return val;
    },

    async getAll() {
      var s = getSlug();
      try {
        var res = await fetch(getApiBase() + '?slug=' + encodeURIComponent(s));
        if (res.ok) {
          var data = await res.json();
          if (data && data.success && data.data) return data.data;
        }
      } catch (e) {
        console.warn('[VoltrixDB] getAll fallback:', e);
      }
      try {
        var all = {};
        var prefix = 'vdb_' + s + '_';
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(prefix) === 0) {
            all[k.slice(prefix.length)] = JSON.parse(localStorage.getItem(k));
          }
        }
        return all;
      } catch (e) {
        return {};
      }
    },

    async delete(key) {
      var s = getSlug();
      try { localStorage.removeItem('vdb_' + s + '_' + key); } catch (e) {}
      try {
        var res = await fetch(getApiBase() + '?slug=' + encodeURIComponent(s) + '&key=' + encodeURIComponent(key), {
          method: 'DELETE'
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    },

    async clear() {
      var s = getSlug();
      try {
        var prefix = 'vdb_' + s + '_';
        var keysToRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(prefix) === 0) keysToRemove.push(k);
        }
        keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
      } catch (e) {}
      try {
        var res = await fetch(getApiBase() + '?slug=' + encodeURIComponent(s), {
          method: 'DELETE'
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    }
  };
})();
</script>`;
}

export function normalizeSiteHtml(rawHtml: string, title = 'Interactive Web Application', slug?: string): string {
  let clean = (rawHtml || '').trim();

  // Strip markdown code fences if present
  const fenceMatch = clean.match(/^```(?:html|xml|web)?\s*([\s\S]*?)```$/i);
  if (fenceMatch) {
    clean = fenceMatch[1].trim();
  }

  const scriptTag = getVoltrixDbScript(slug);

  // If already a full HTML5 document, inject Voltrix Edge DB SDK and return
  if (/<(!DOCTYPE|html|body)/i.test(clean)) {
    if (!clean.includes('id="voltrix-edge-sdk"') && !clean.includes('window.VoltrixDB')) {
      if (/<\/head>/i.test(clean)) {
        clean = clean.replace(/<\/head>/i, `${scriptTag}\n</head>`);
      } else if (/<\/body>/i.test(clean)) {
        clean = clean.replace(/<\/body>/i, `${scriptTag}\n</body>`);
      } else {
        clean = `${scriptTag}\n${clean}`;
      }
    }
    return clean;
  }

  // Otherwise wrap fragment in modern responsive dark-mode shell
  const safeTitle = (title || 'Interactive Web Application')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} • Voltrix</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
  ${scriptTag}
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-indigo-500/30">
  <header class="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
    <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
          V
        </div>
        <div>
          <h1 class="font-bold text-sm text-white tracking-tight leading-tight">${safeTitle}</h1>
          <span class="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live on Global Edge
          </span>
        </div>
      </div>
      <a href="https://voltrix.stream" target="_blank" rel="noopener noreferrer" class="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1">
        Voltrix OS <span>→</span>
      </a>
    </div>
  </header>
  <main class="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
    <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-2xl">
      ${clean}
    </div>
  </main>
  <footer class="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
    © 2026 Voltrix Stream • Hosted on Cloudflare Global Edge
  </footer>
  <script>
    if (window.lucide) { lucide.createIcons(); }
  </script>
</body>
</html>`;
}

export function sanitizeSiteSlug(rawSlug?: string, title?: string): string {
  let slug = (rawSlug || '').toLowerCase().replace(/[^a-z0-9-]+/g, '').replace(/^-+|-+$/g, '').slice(0, 48);
  if (!slug || slug === 'app' || slug === 'site' || slug.startsWith('site-')) {
    const base = (title || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'app';
    const suffix = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function publishSiteToStorage(
  bucket: R2Bucket,
  params: PublishSiteParams
): Promise<PublishSiteResult> {
  const cleanTitle = (params.title || 'Interactive Web Application').trim();
  const slug = sanitizeSiteSlug(params.slug, cleanTitle);
  const normalizedHtml = normalizeSiteHtml(params.html, cleanTitle, slug);
  const userId = params.userId || 'anon';
  const authorName = params.authorName || 'Academic Scholar';
  const description = params.description || '';
  const baseDomain = params.origin || 'https://voltrix.stream';
  const liveUrl = `${baseDomain}/s/${slug}`;

  const r2HtmlKey = `sites/${slug}.html`;
  const r2MetaKey = `sites/_meta/${slug}.json`;

  // Check existing metadata for versioning
  let existingMeta: SiteMetadata | null = null;
  try {
    const metaObj = await bucket.get(r2MetaKey);
    if (metaObj) {
      existingMeta = await metaObj.json<SiteMetadata>();
    }
  } catch {}

  const version = existingMeta ? ((existingMeta.version || 1) + 1) : 1;
  const views = existingMeta?.views || 0;
  const publishedAt = existingMeta?.publishedAt || new Date().toISOString();
  const updatedAt = new Date().toISOString();

  const metadata: SiteMetadata = {
    slug,
    title: cleanTitle,
    userId,
    authorName,
    description,
    version,
    views,
    sizeBytes: new TextEncoder().encode(normalizedHtml).length,
    publishedAt,
    updatedAt,
    liveUrl,
    r2Key: r2HtmlKey
  };

  // Write HTML document
  await bucket.put(r2HtmlKey, normalizedHtml, {
    httpMetadata: {
      contentType: 'text/html; charset=utf-8',
      cacheControl: 'public, max-age=60',
    },
    customMetadata: {
      slug,
      title: cleanTitle,
      version: String(version),
      userId,
    }
  });

  // Write metadata JSON
  await bucket.put(r2MetaKey, JSON.stringify(metadata, null, 2), {
    httpMetadata: {
      contentType: 'application/json',
      cacheControl: 'no-cache',
    }
  });

  // Update indexes
  try {
    const userIndexKey = `sites/_index/user_${userId}.json`;
    let userSites: Array<{ slug: string; title: string; liveUrl: string; views: number; version: number; updatedAt: string }> = [];
    const userIndexObj = await bucket.get(userIndexKey);
    if (userIndexObj) {
      userSites = await userIndexObj.json();
    }
    const updatedUser = [
      { slug, title: cleanTitle, liveUrl, views, version, updatedAt },
      ...userSites.filter(s => s.slug !== slug)
    ].slice(0, 100);
    await bucket.put(userIndexKey, JSON.stringify(updatedUser), {
      httpMetadata: { contentType: 'application/json' }
    });
  } catch {}

  try {
    const globalIndexKey = 'sites/_index/all.json';
    let allSites: Array<{ slug: string; title: string; liveUrl: string; authorName: string; views: number; version: number; updatedAt: string }> = [];
    const globalIndexObj = await bucket.get(globalIndexKey);
    if (globalIndexObj) {
      allSites = await globalIndexObj.json();
    }
    const updatedAll = [
      { slug, title: cleanTitle, liveUrl, authorName, views, version, updatedAt },
      ...allSites.filter(s => s.slug !== slug)
    ].slice(0, 500);
    await bucket.put(globalIndexKey, JSON.stringify(updatedAll), {
      httpMetadata: { contentType: 'application/json' }
    });
  } catch {}

  return {
    success: true,
    slug,
    liveUrl,
    title: cleanTitle,
    version,
    sizeBytes: metadata.sizeBytes,
    publishedAt
  };
}

export async function getSiteFromStorage(
  bucket: R2Bucket,
  rawSlug: string,
  ctx?: ExecutionContext
): Promise<{ content: string; meta?: SiteMetadata } | null> {
  const slug = (rawSlug || '').replace(/\.html$/i, '').trim();
  if (!slug) return null;

  const r2HtmlKey = `sites/${slug}.html`;
  const obj = await bucket.get(r2HtmlKey);
  if (!obj) return null;

  let content = await obj.text();

  // If the stored HTML doesn't have VoltrixDB yet, ensure it gets injected
  if (!content.includes('id="voltrix-edge-sdk"') && !content.includes('window.VoltrixDB')) {
    content = normalizeSiteHtml(content, undefined, slug);
  }

  // Non-blocking view counter increment
  const incrementView = async () => {
    try {
      const metaKey = `sites/_meta/${slug}.json`;
      const metaObj = await bucket.get(metaKey);
      if (metaObj) {
        const meta = await metaObj.json<SiteMetadata>();
        meta.views = (meta.views || 0) + 1;
        meta.updatedAt = new Date().toISOString();
        await bucket.put(metaKey, JSON.stringify(meta, null, 2), {
          httpMetadata: { contentType: 'application/json' }
        });
      }
    } catch {}
  };

  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(incrementView());
  } else {
    incrementView().catch(() => {});
  }

  return { content };
}

// ── Edge Backend Storage & State API for Hosted Apps ──────────────────────────

export interface SiteDataState {
  [key: string]: any;
}

export async function getSiteData(
  bucket: R2Bucket,
  rawSlug: string,
  key?: string
): Promise<{ value?: any; data?: SiteDataState }> {
  const slug = (rawSlug || '').replace(/[^a-z0-9-_]/gi, '').trim();
  if (!slug) return key ? { value: null } : { data: {} };

  const dataKey = `sites/data/${slug}.json`;
  try {
    const obj = await bucket.get(dataKey);
    if (!obj) {
      return key ? { value: null } : { data: {} };
    }
    const state: SiteDataState = await obj.json();
    if (key !== undefined) {
      return { value: state[key] !== undefined ? state[key] : null };
    }
    return { data: state || {} };
  } catch (err) {
    console.warn(`[sites.ts] getSiteData error for ${slug}:`, err);
    return key ? { value: null } : { data: {} };
  }
}

export async function setSiteData(
  bucket: R2Bucket,
  rawSlug: string,
  key?: string,
  value?: any,
  data?: Record<string, any>
): Promise<{ value?: any; data?: SiteDataState; updated: boolean }> {
  const slug = (rawSlug || '').replace(/[^a-z0-9-_]/gi, '').trim();
  if (!slug) throw new Error("slug is required");

  const dataKey = `sites/data/${slug}.json`;
  let state: SiteDataState = {};

  try {
    const obj = await bucket.get(dataKey);
    if (obj) {
      state = (await obj.json()) || {};
    }
  } catch {}

  if (key !== undefined) {
    state[key] = value;
  }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    Object.assign(state, data);
  }

  await bucket.put(dataKey, JSON.stringify(state, null, 2), {
    httpMetadata: {
      contentType: "application/json",
      cacheControl: "no-cache",
    },
    customMetadata: {
      slug,
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    value: key !== undefined ? state[key] : undefined,
    data: state,
    updated: true,
  };
}

export async function deleteSiteData(
  bucket: R2Bucket,
  rawSlug: string,
  key?: string
): Promise<{ deleted: boolean; remaining?: SiteDataState }> {
  const slug = (rawSlug || '').replace(/[^a-z0-9-_]/gi, '').trim();
  if (!slug) return { deleted: false };

  const dataKey = `sites/data/${slug}.json`;
  if (!key) {
    await bucket.delete(dataKey);
    return { deleted: true };
  }

  try {
    const obj = await bucket.get(dataKey);
    if (obj) {
      const state: SiteDataState = (await obj.json()) || {};
      delete state[key];
      await bucket.put(dataKey, JSON.stringify(state, null, 2), {
        httpMetadata: {
          contentType: "application/json",
          cacheControl: "no-cache",
        },
      });
      return { deleted: true, remaining: state };
    }
  } catch {}

  return { deleted: true };
}

export async function getSiteMetadata(
  bucket: R2Bucket,
  rawSlug: string
): Promise<SiteMetadata | null> {
  const slug = (rawSlug || '').replace(/\.html$/i, '').trim();
  if (!slug) return null;

  const metaObj = await bucket.get(`sites/_meta/${slug}.json`);
  if (!metaObj) return null;
  return await metaObj.json<SiteMetadata>();
}

export async function getUserSites(
  bucket: R2Bucket,
  userId = 'anon'
): Promise<any[]> {
  const userIndexKey = `sites/_index/user_${userId}.json`;
  const obj = await bucket.get(userIndexKey);
  if (!obj) return [];
  try {
    const list = await obj.json<any[]>();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function deleteSiteFromStorage(
  bucket: R2Bucket,
  rawSlug: string,
  userId = 'anon'
): Promise<boolean> {
  const slug = (rawSlug || '').replace(/\.html$/i, '').trim();
  if (!slug) return false;

  await bucket.delete(`sites/${slug}.html`);
  await bucket.delete(`sites/_meta/${slug}.json`);

  try {
    const userIndexKey = `sites/_index/user_${userId}.json`;
    const userIndexObj = await bucket.get(userIndexKey);
    if (userIndexObj) {
      const existing = await userIndexObj.json<any[]>();
      if (Array.isArray(existing)) {
        await bucket.put(userIndexKey, JSON.stringify(existing.filter(s => s.slug !== slug)), {
          httpMetadata: { contentType: 'application/json' }
        });
      }
    }
  } catch {}

  return true;
}

export function renderSiteNotFoundHtml(slug?: string): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Site Not Found • Voltrix Stream</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }</style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col items-center justify-center p-6 antialiased">
  <div class="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md">
    <div class="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-5 text-2xl font-bold">
      404
    </div>
    <h2 class="text-xl font-bold text-white mb-2">Web Application Not Found</h2>
    <p class="text-slate-400 text-sm mb-6 leading-relaxed">
      No live application is hosted at <code class="text-indigo-400 font-mono text-xs px-2 py-1 bg-slate-800/80 rounded">/s/${(slug || '').replace(/</g, '&lt;')}</code>. The site may have been moved or unpublished.
    </p>
    <a href="https://voltrix.stream" class="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/20">
      ← Return to Volt Studio
    </a>
  <footer class="mt-8 text-xs text-slate-500">
    Voltrix Global Edge • Cloudflare Workers &amp; R2
  </footer>
</body>
</html>
`;
}