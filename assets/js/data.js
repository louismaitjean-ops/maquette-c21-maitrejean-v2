/* Programmes and viagers shown on the site.
   Production: read from /api/data (edited in the admin at /admin/). The production build sets API.
   Mockup: no server, so the admin demo saves into this browser (localStorage) and the site reads it back.
   Falls back to the starting lists (progs-data.js, viagers-data.js, articles-data.js) when nothing has been published. */
(function () {
  const API = '';
  const DEMO_KEY = 'c21-demo-data';
  const seed = { programmes: window.PROGS || [], viagers: window.VIAGERS || [], articles: window.ARTICLES || [] };
  const staticIds = new Set(seed.programmes.map(p => p.id)); // these have a prerendered page
  const staticArts = new Set(seed.articles.filter(a => !a.hidden).map(a => a.id));
  // barème « Transaction patrimoniale » (viager, résidences de services) : TTC, sur la valeur libre, cumul des tranches
  const honoraires = v => { v = +v || 0; const t = (a, b, r) => Math.max(0, Math.min(v, b) - a) * r;
    return Math.round(8000 + t(80000, 200000, .08) + t(200000, 350000, .07) + t(350000, 500000, .06) + t(500000, Infinity, .05)); };
  const eur = n => (+n || 0).toLocaleString('fr-FR').replace(/\s/g, '\u202f') + '\u00a0€';
  window.C21 = { honoraires, eur,
    esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]),
    progUrl: p => staticIds.has(p.id) ? `immobilier-neuf-${p.id}.html` : `programme.html?id=${encodeURIComponent(p.id)}`,
    isStatic: id => staticIds.has(id),
    artUrl: a => staticArts.has(a.id) ? `actualite-${a.id}.html` : `article.html?id=${encodeURIComponent(a.id)}`,
    // the site's own photos also exist in WebP (much lighter)
    // lighter copy (720 px) of the programme and viager photos, for cards and small gallery cells
    thumb: u => { const p = window.C21.pic(u); return /^assets\/img\/(prog\/[\w-]+\/[\w-]+|v-op\d)\.webp$/.test(p) ? p.replace(/\.webp$/, '-s.webp') : p; },
    // the main photo of a page: phones load the light copy, and the browser fetches it first
    hero: u => { const p = window.C21.pic(u), t = window.C21.thumb(u); return `src="${p}"${t !== p ? ` srcset="${t} 720w, ${p} 1400w" sizes="(max-width:760px) 100vw, 60vw"` : ''} fetchpriority="high"`; },
    pic: u => String(u || '').replace(/^(assets\/img\/(?:prog\/[\w-]+\/)?[\w-]+)\.jpg$/, '$1.webp'),
  };
  async function load() {
    let d = null;
    try {
      if (API) { const r = await fetch(API, { headers: { accept: 'application/json' } }); if (r.ok) d = await r.json(); }
      else d = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null');
    } catch (e) { d = null; }
    const visible = l => (l || []).filter(x => !x.hidden);
    // articles: newest first
    const articles = visible(d && d.articles || seed.articles).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return { programmes: visible(d && d.programmes || seed.programmes), viagers: visible(d && d.viagers || seed.viagers), articles };
  }
  window.C21Data = load();
})();
