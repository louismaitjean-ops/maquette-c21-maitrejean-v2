/* Programmes and viagers shown on the site.
   Production: read from /api/data (edited in the admin at /admin/). The production build sets API.
   Mockup: no server, so the admin demo saves into this browser (localStorage) and the site reads it back.
   Falls back to the starting lists (progs-data.js, viagers-data.js) when nothing has been published. */
(function () {
  const API = '';
  const DEMO_KEY = 'c21-demo-data';
  const seed = { programmes: window.PROGS || [], viagers: window.VIAGERS || [] };
  const staticIds = new Set(seed.programmes.map(p => p.id)); // these have a prerendered page
  // barème « Transaction patrimoniale » (viager, résidences de services) : TTC, sur la valeur libre, cumul des tranches
  const honoraires = v => { v = +v || 0; const t = (a, b, r) => Math.max(0, Math.min(v, b) - a) * r;
    return Math.round(8000 + t(80000, 200000, .08) + t(200000, 350000, .07) + t(350000, 500000, .06) + t(500000, Infinity, .05)); };
  const eur = n => (+n || 0).toLocaleString('fr-FR').replace(/\s/g, '\u202f') + '\u00a0€';
  window.C21 = { honoraires, eur,
    esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]),
    progUrl: p => staticIds.has(p.id) ? `immobilier-neuf-${p.id}.html` : `programme.html?id=${encodeURIComponent(p.id)}`,
    isStatic: id => staticIds.has(id),
  };
  async function load() {
    let d = null;
    try {
      if (API) { const r = await fetch(API, { headers: { accept: 'application/json' } }); if (r.ok) d = await r.json(); }
      else d = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null');
    } catch (e) { d = null; }
    const visible = l => (l || []).filter(x => !x.hidden);
    return { programmes: visible(d && d.programmes || seed.programmes), viagers: visible(d && d.viagers || seed.viagers) };
  }
  window.C21Data = load();
})();
