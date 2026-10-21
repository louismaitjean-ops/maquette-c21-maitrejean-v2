/* Espace conseiller : add, edit, hide, reorder and delete the new-build programmes and the viagers.
   Production: talks to /api/admin (Netlify functions), every save is published on the site at once.
   Mockup (API empty): demo mode, account raphael / demo, data kept in this browser (localStorage),
   which the mockup pages read back, so the whole flow can be tried without a server. */
(() => {
  const API = '';
  const DEMO = !API;
  const DEMO_KEY = 'c21-demo-data', DEMO_SESSION = 'c21-demo-session';

  const $ = (s, r = document) => r.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const ico = n => `<svg aria-hidden="true"><use href="#${n}"/></svg>`;
  const eur = n => n ? (+n).toLocaleString('fr-FR').replace(/\s/g, ' ') + ' €' : '';
  const num = v => +String(v ?? '').replace(/\D/g, '') || null;
  const src = u => !u ? '' : u.startsWith('assets/') ? '../' + u : u;
  const bg = u => u ? `background-image:url('${src(u).replace(/['"()\\\s]/g, c => '%' + c.charCodeAt(0).toString(16))}')` : '';
  const slug = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  const clone = o => JSON.parse(JSON.stringify(o));
  const fmtDate = iso => iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : '';

  const SEED = { programmes: clone(window.PROGS || []), viagers: clone(window.VIAGERS || []) };
  const STATIC = new Set(SEED.programmes.map(p => p.id));
  const KINDS = ['Appartements', 'Maisons', 'Appartements & maisons', 'Appartement', 'Maison'];
  const DEPS = [['28', 'Eure-et-Loir (28)'], ['27', 'Eure (27)'], ['45', 'Loiret (45)'], ['41', 'Loir-et-Cher (41)'], ['61', 'Orne (61)'], ['72', 'Sarthe (72)'], ['78', 'Yvelines (78)'], ['91', 'Essonne (91)']];
  const TYPES = { occ: 'Viager occupé', lib: 'Viager libre' };
  const TAB = {
    programmes: { title: 'Programmes neufs', one: 'programme', add: 'Ajouter un programme' },
    viagers: { title: 'Viagers', one: 'viager', add: 'Ajouter un viager' },
  };

  /* ---------- backend ---------- */
  const demo = {
    async me() { return sessionStorage.getItem(DEMO_SESSION) ? 'raphael' : null; },
    async login(u, p) {
      if (u.trim().toLowerCase() === 'raphael' && p === 'demo') { sessionStorage.setItem(DEMO_SESSION, '1'); return 'raphael'; }
      throw new Error('Identifiant ou mot de passe incorrect.');
    },
    async logout() { sessionStorage.removeItem(DEMO_SESSION); },
    async load() { return JSON.parse(localStorage.getItem(DEMO_KEY) || 'null') || { programmes: null, viagers: null, version: null }; },
    async save(d) {
      const v = { programmes: d.programmes, viagers: d.viagers, version: String(Date.now()), updatedAt: new Date().toISOString() };
      try { localStorage.setItem(DEMO_KEY, JSON.stringify(v)); }
      catch { throw new Error('Mémoire du navigateur pleine : en démo, gardez peu de photos ajoutées.'); }
      return v;
    },
    async leads() { return []; },
    upload: blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(blob); }),
  };
  const server = {
    async call(path, opt = {}) {
      const r = await fetch(API + path, { credentials: 'same-origin', ...opt, headers: { 'x-c21-admin': '1', ...(opt.headers || {}) } });
      let j = {}; try { j = await r.json(); } catch {}
      if (r.status === 401 && path !== '/login') { showLogin('Votre session a expiré, reconnectez-vous.'); throw new Error('Session expirée.'); }
      if (j.error === 'config') throw new Error('L’espace conseiller n’est pas encore configuré (variables ADMIN_USER, ADMIN_PASSWORD_HASH et SESSION_SECRET à créer sur Netlify).');
      if (!r.ok) throw new Error(j.error || (j.errors || []).join(' · ') || `Erreur ${r.status}, réessayez.`);
      return j;
    },
    async me() { const r = await fetch(API + '/me', { credentials: 'same-origin' }); const j = await r.json().catch(() => ({})); return r.ok ? j.user : null; },
    async login(user, password) { return (await this.call('/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ user, password }) })).user; },
    async logout() { await this.call('/logout', { method: 'POST' }).catch(() => {}); },
    load() { return this.call('/data'); },
    save(d) { return this.call('/data', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(d) }); },
    async leads() { return (await this.call('/leads')).leads; },
    async upload(blob) { return (await this.call('/upload', { method: 'POST', headers: { 'content-type': blob.type }, body: blob })).url; },
  };
  const backend = DEMO ? demo : server;

  /* ---------- state ---------- */
  const S = { user: null, data: null, version: null, updatedAt: null, tab: 'programmes', q: '' };
  const root = $('#root');

  /* ---------- toasts & modal ---------- */
  function toast(msg, kind) {
    const t = document.createElement('div');
    t.className = 'toast' + (kind === 'err' ? ' err' : '');
    t.innerHTML = (kind === 'err' ? '' : ico('i-ok')) + esc(msg);
    $('#toasts').append(t); setTimeout(() => t.remove(), kind === 'err' ? 6000 : 3200);
  }
  function confirmBox(title, text, okLabel = 'Supprimer') {
    return new Promise(res => {
      const m = document.createElement('div'); m.className = 'mo';
      m.innerHTML = `<div role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${esc(text)}</p><div class="acts"><button class="b b-sec" data-r="0">Annuler</button><button class="b ${okLabel === 'Supprimer' ? 'b-del' : 'b-pri'}" data-r="1">${esc(okLabel)}</button></div></div>`;
      m.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (b || e.target === m) { m.remove(); res(b?.dataset.r === '1'); } });
      document.body.append(m); m.querySelector('[data-r="1"]').focus();
    });
  }

  /* ---------- login ---------- */
  function showLogin(msg) {
    closeDrawer(true);
    root.innerHTML = `<div class="login"><form id="lf" novalidate>
      <div class="brand"><svg><use href="#seal"/></svg><div><b>CENTURY 21</b><small>Maitrejean Immobilier</small></div></div>
      <h1>Espace conseiller</h1><p class="s">Gérez les programmes neufs et les viagers publiés sur le site.</p>
      ${msg ? `<div class="err" role="alert">${esc(msg)}</div>` : '<div class="err" role="alert" hidden></div>'}
      <label class="f"><span>Identifiant</span><input name="u" autocomplete="username" autocapitalize="none" required></label>
      <label class="f"><span>Mot de passe</span><div class="pw"><input name="p" type="password" autocomplete="current-password" required><button type="button" class="ib" id="see" aria-label="Afficher le mot de passe">${ico('i-eye')}</button></div></label>
      <button class="b b-pri">Se connecter</button>
      ${DEMO ? '<div class="demo"><b>Version de démonstration.</b> Identifiant <b>raphael</b>, mot de passe <b>demo</b>. Les modifications restent dans ce navigateur et apparaissent sur la maquette.</div>' : ''}
    </form></div>`;
    const f = $('#lf'), err = f.querySelector('.err');
    f.u.focus();
    $('#see').onclick = () => { f.p.type = f.p.type === 'password' ? 'text' : 'password'; };
    f.onsubmit = async e => {
      e.preventDefault();
      const btn = f.querySelector('.b-pri'); btn.disabled = true; err.hidden = true;
      try { S.user = await backend.login(f.u.value, f.p.value); await openApp(); }
      catch (x) { err.textContent = x.message; err.hidden = false; btn.disabled = false; f.p.select(); }
    };
  }

  /* ---------- app ---------- */
  async function openApp() {
    root.innerHTML = '<div class="loading">Chargement…</div>';
    const d = await backend.load();
    S.data = { programmes: d.programmes || clone(SEED.programmes), viagers: d.viagers || clone(SEED.viagers) };
    S.version = d.version || null; S.updatedAt = d.updatedAt || null;
    root.innerHTML = `<header class="top"><div class="in">
        <div class="brand"><svg><use href="#seal"/></svg><div><b>Espace conseiller</b><small>CENTURY 21 Maitrejean</small></div></div>
        <span class="sp"></span><span class="who">${esc(S.user)}</span>
        <button id="leads">${ico('i-mail')}<span class="lbl">Demandes</span></button>
        <a class="site" href="../index.html" target="_blank" rel="noopener">${ico('i-ext')}<span class="lbl">Voir le site</span></a>
        <button id="logout">${ico('i-out')}<span class="lbl">Déconnexion</span></button></div></header>
      <main class="app">
        <div class="head"><div><h1 id="h1"></h1><p id="sub"></p></div><span class="sp"></span><button class="b b-pri" id="add">${ico('i-plus')}<span></span></button></div>
        <div class="tabs" role="tablist">${Object.entries(TAB).map(([k, t]) => `<button role="tab" data-tab="${k}">${t.title} <span class="n"></span></button>`).join('')}</div>
        <div class="bar"><div class="search">${ico('i-search')}<input id="q" type="search" placeholder="Rechercher par nom ou ville" aria-label="Rechercher"></div><span class="info" id="info"></span></div>
        <div class="list" id="list"></div>
      </main>
      <div class="ov" id="ov"></div><aside class="dr" id="dr" aria-hidden="true" aria-label="Édition"></aside>`;
    $('#leads').onclick = showLeads;
    $('#logout').onclick = async () => { await backend.logout(); S.user = null; showLogin(); };
    $('.tabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) { S.tab = b.dataset.tab; S.q = ''; $('#q').value = ''; render(); } };
    $('#q').oninput = e => { S.q = e.target.value.trim().toLowerCase(); renderList(); };
    $('#add').onclick = () => S.tab === 'programmes' ? editProg(null) : editViager(null);
    $('#list').onclick = onListClick;
    $('#ov').onclick = () => closeDrawer();
    render();
  }

  function render() {
    const t = TAB[S.tab], items = S.data[S.tab];
    $('#h1').textContent = t.title;
    $('#add span').textContent = t.add;
    document.querySelectorAll('.tabs button').forEach(b => { b.classList.toggle('on', b.dataset.tab === S.tab); b.setAttribute('aria-selected', b.dataset.tab === S.tab); b.querySelector('.n').textContent = S.data[b.dataset.tab].length; });
    const hidden = items.filter(x => x.hidden).length;
    $('#sub').textContent = `${items.length - hidden} en ligne${hidden ? ` · ${hidden} masqué${hidden > 1 ? 's' : ''}` : ''}` +
      (S.updatedAt ? ` · dernière publication le ${fmtDate(S.updatedAt)}` : ' · liste de départ, pas encore modifiée') + (DEMO ? ' · démo (ce navigateur uniquement)' : '');
    renderList();
  }

  function renderList() {
    const items = S.data[S.tab], prog = S.tab === 'programmes';
    const shown = items.map((x, i) => [x, i]).filter(([x]) => !S.q || `${x.name} ${x.city || x.loc || ''} ${x.quarter || ''}`.toLowerCase().includes(S.q));
    $('#info').textContent = S.q ? `${shown.length} résultat${shown.length > 1 ? 's' : ''}` : (prog ? 'L’ordre de la liste est celui du site. Les programmes « à la une » s’affichent en premier.' : 'L’ordre de la liste est celui du site.');
    if (!shown.length) {
      $('#list').innerHTML = `<div class="empty"><b>${S.q ? 'Aucun résultat' : `Aucun ${TAB[S.tab].one} pour le moment`}</b>${S.q ? 'Essayez un autre nom ou une autre ville.' : `Cliquez sur « ${TAB[S.tab].add} » pour commencer.`}</div>`;
      return;
    }
    $('#list').innerHTML = shown.map(([x, i]) => {
      const img = (x.imgs || [])[0] || x.img;
      const sub = prog ? [x.city + (x.quarter ? ' · ' + x.quarter : ''), x.kind, x.from ? 'dès ' + eur(x.from) : 'prix sur demande'] : [x.loc + ` (${x.dep})`, TYPES[x.type], x.bouquet ? 'bouquet ' + eur(x.bouquet) : '', x.rente ? 'rente ' + eur(x.rente) + '/mois' : ''];
      const tags = [x.featured && prog ? '<span class="tag star">À la une</span>' : '', x.hidden ? '<span class="tag hid">Masqué du site</span>' : '', x.exemple ? '<span class="tag ex">Exemple</span>' : '',
        prog ? `<span class="tag">${(x.imgs || []).length} photo${(x.imgs || []).length > 1 ? 's' : ''}</span>` : (x.tetes ? `<span class="tag">${esc(x.tetes.replace(/^Sur (une|deux) têtes? : /, ''))}</span>` : '')].join('');
      return `<div class="item${x.hidden ? ' off' : ''}" data-i="${i}">
        <div class="th" style="${bg(img)}">${img ? '' : ico('i-img')}</div>
        <div class="tx"><h3>${esc(x.name)}</h3><p>${esc(sub.filter(Boolean).join(' · '))}</p><div class="tags">${tags}</div></div>
        <div class="acts">
          ${prog ? `<button class="ib${x.featured ? ' on' : ''}" data-a="star" title="${x.featured ? 'Retirer de la une' : 'Mettre à la une'}" aria-label="À la une">${ico(x.featured ? 'i-star-f' : 'i-star')}</button>` : ''}
          <button class="ib" data-a="vis" title="${x.hidden ? 'Afficher sur le site' : 'Masquer du site'}" aria-label="${x.hidden ? 'Afficher' : 'Masquer'}">${ico(x.hidden ? 'i-eye-off' : 'i-eye')}</button>
          ${S.q ? '' : `<button class="ib" data-a="up" title="Monter" aria-label="Monter"${i === 0 ? ' disabled' : ''}>${ico('i-up')}</button><button class="ib" data-a="down" title="Descendre" aria-label="Descendre"${i === items.length - 1 ? ' disabled' : ''}>${ico('i-down')}</button>`}
          <button class="ib" data-a="dup" title="Dupliquer" aria-label="Dupliquer">${ico('i-copy')}</button>
          <button class="ib del" data-a="del" title="Supprimer" aria-label="Supprimer">${ico('i-trash')}</button>
          <button class="b b-sec" data-a="edit">${ico('i-edit')}Modifier</button>
        </div></div>`;
    }).join('');
  }

  // applies a change to a copy, saves it, and keeps it only if the save worked
  async function commit(change, okMsg) {
    const next = clone(S.data); change(next);
    try {
      const r = await backend.save({ programmes: next.programmes, viagers: next.viagers, version: S.version });
      S.version = r.version; S.updatedAt = r.updatedAt;
      S.data = r.programmes ? { programmes: r.programmes, viagers: r.viagers } : next;
      render(); toast(okMsg); return true;
    } catch (e) { toast(e.message, 'err'); return false; }
  }

  const uniqueId = (base, list, self) => { let id = slug(base) || 'bien', k = 2; const ids = new Set(list.filter(x => x !== self).map(x => x.id)); while (ids.has(id)) id = `${slug(base)}-${k++}`; return id; };

  async function onListClick(e) {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const i = +b.closest('.item').dataset.i, tab = S.tab, x = S.data[tab][i];
    const a = b.dataset.a;
    if (a === 'edit') return tab === 'programmes' ? editProg(i) : editViager(i);
    if (a === 'star') return commit(d => { d[tab][i].featured = !x.featured; }, x.featured ? `« ${x.name} » n’est plus à la une` : `« ${x.name} » est à la une`);
    if (a === 'vis') return commit(d => { d[tab][i].hidden = !x.hidden; }, x.hidden ? `« ${x.name} » est de nouveau visible sur le site` : `« ${x.name} » est masqué du site`);
    if (a === 'up' || a === 'down') { const j = a === 'up' ? i - 1 : i + 1; return commit(d => { const l = d[tab]; [l[i], l[j]] = [l[j], l[i]]; }, 'Ordre mis à jour'); }
    if (a === 'dup') return commit(d => { const c = clone(x); c.name = x.name + ' (copie)'; c.id = uniqueId(c.name, d[tab]); c.hidden = true; c.featured = false; d[tab].splice(i + 1, 0, c); }, 'Copie créée (masquée du site en attendant vos modifications)');
    if (a === 'del' && await confirmBox(`Supprimer « ${x.name} » ?`, 'Il disparaîtra immédiatement du site. Pour le retirer temporairement, utilisez plutôt l’œil (masquer).')) {
      return commit(d => { d[tab].splice(i, 1); }, `« ${x.name} » a été supprimé`);
    }
  }

  /* ---------- drawer ---------- */
  let dirty = false, onEsc = null;
  function openDrawer(title, body, onSave) {
    const dr = $('#dr');
    dr.innerHTML = `<div class="dr-h"><h2>${esc(title)}</h2><button class="ib" data-close aria-label="Fermer">${ico('i-x')}</button></div>
      <form class="dr-b" id="ef" novalidate>${body}</form>
      <div class="dr-f"><span class="msg" id="emsg" role="alert"></span><button class="b b-gh" data-close>Annuler</button><button class="b b-pri" id="esave">Enregistrer et publier</button></div>`;
    dirty = false;
    dr.classList.add('on'); dr.setAttribute('aria-hidden', 'false'); $('#ov').classList.add('on'); document.body.style.overflow = 'hidden';
    const f = $('#ef');
    f.addEventListener('input', () => { dirty = true; });
    f.addEventListener('submit', e => e.preventDefault());
    dr.querySelectorAll('[data-close]').forEach(b => b.onclick = () => closeDrawer());
    $('#esave').onclick = async () => {
      const btn = $('#esave'); btn.disabled = true; $('#emsg').textContent = '';
      const ok = await onSave(f);
      btn.disabled = false;
      if (ok) closeDrawer(true);
    };
    onEsc = e => { if (e.key === 'Escape' && !document.querySelector('.mo')) closeDrawer(); };
    addEventListener('keydown', onEsc);
    setTimeout(() => f.querySelector('input')?.focus(), 250);
    return f;
  }
  // requests sent from the contact form (kept even before the e-mails are connected)
  async function showLeads() {
    let leads = [];
    try { leads = await backend.leads(); } catch (e) { toast(e.message, 'err'); return; }
    const G = { viager: 'Guide du viager', neuf: 'Guide du neuf', deux: 'Les deux guides', aucun: '' };
    const body = leads.length ? leads.map(l => `<div class="lead"><div class="lead-h"><b>${esc(l.prenom)} ${esc(l.nom)}</b><small>${fmtDate(l.date)}</small></div>
        <div class="lead-c"><a href="tel:${esc(l.tel.replace(/[^\d+]/g, ''))}">${esc(l.tel)}</a> · <a href="mailto:${esc(l.email)}">${esc(l.email)}</a></div>
        <div class="lead-t">${[l.profil, G[l.guide], l.programme].filter(Boolean).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></div>`).join('')
      : `<div class="empty"><b>Aucune demande pour le moment</b>${DEMO ? 'En démo, les demandes ne sont pas enregistrées.' : 'Les demandes envoyées depuis la page Contact apparaîtront ici.'}</div>`;
    openDrawer(`Demandes reçues (${leads.length})`, body, async () => true);
    $('#esave').hidden = true; $('#dr [data-close].b').textContent = 'Fermer';
  }
  async function closeDrawer(force) {
    const dr = $('#dr'); if (!dr || !dr.classList.contains('on')) return;
    if (!force && dirty && !await confirmBox('Abandonner les modifications ?', 'Les changements non enregistrés seront perdus.', 'Abandonner')) return;
    dr.classList.remove('on'); dr.setAttribute('aria-hidden', 'true'); $('#ov').classList.remove('on'); document.body.style.overflow = '';
    removeEventListener('keydown', onEsc);
  }
  const field = (name, label, value, attrs = '', hint = '') => `<label class="f"><span>${label}</span><input name="${name}" value="${esc(value ?? '')}" ${attrs}>${hint ? `<small class="hint">${hint}</small>` : ''}</label>`;
  const area = (name, label, value, rows = 4, hint = '') => `<label class="f"><span>${label}</span><textarea name="${name}" rows="${rows}">${esc(value ?? '')}</textarea>${hint ? `<small class="hint">${hint}</small>` : ''}</label>`;
  const select = (name, label, value, opts) => `<label class="f"><span>${label}</span><select name="${name}">${opts.map(([v, t]) => `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
  const amount = (name, label, value) => field(name, label, value ? (+value).toLocaleString('fr-FR').replace(/\s/g, ' ') : '', 'inputmode="numeric" placeholder="ex. 245 000" data-amount');
  const check = (name, title, text, on) => `<label class="chk"><input type="checkbox" name="${name}"${on ? ' checked' : ''}><span><b>${title}</b><small>${text}</small></span></label>`;
  const lines = v => String(v || '').split('\n').map(s => s.trim()).filter(Boolean);
  function require(f, names) {
    let first = null;
    names.forEach(n => { const el = f[n], bad = !el.value.trim(); el.closest('.f').classList.toggle('bad', bad); if (bad && !first) first = el; });
    if (first) { first.focus(); $('#emsg').textContent = 'Merci de remplir les champs obligatoires.'; return false; }
    return true;
  }
  function bindAmounts(f) {
    f.querySelectorAll('[data-amount]').forEach(i => i.addEventListener('input', () => { const d = i.value.replace(/\D/g, '').slice(0, 9); i.value = d ? (+d).toLocaleString('fr-FR').replace(/\s/g, ' ') : ''; }));
  }

  /* ---------- photos ---------- */
  async function resize(file) {
    const max = DEMO ? 1200 : 2000;
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(res => c.toBlob(res, 'image/jpeg', DEMO ? 0.8 : 0.86));
  }
  // photo manager: list = array of urls (mutated), single = only one photo
  function photos(box, list, single) {
    let pending = 0, dragFrom = null;
    const draw = () => {
      box.innerHTML = `<div class="ph-grid">${list.map((u, i) => `<div class="ph" draggable="${!single}" data-i="${i}" style="${bg(u)}">${i === 0 && !single ? '<span class="cv">Couverture</span>' : ''}
          <button type="button" class="x" data-x="${i}" aria-label="Retirer la photo">${ico('i-trash')}</button>
          ${single ? '' : `<span class="mv">${i ? `<button type="button" data-l="${i}" aria-label="Avancer">‹</button>` : ''}${i < list.length - 1 ? `<button type="button" data-r="${i}" aria-label="Reculer">›</button>` : ''}</span>`}</div>`).join('')}
          ${Array.from({ length: pending }, () => '<div class="ph up">Envoi…</div>').join('')}</div>
        ${single && list.length ? '' : `<div class="drop">Glissez ${single ? 'une photo' : 'vos photos'} ici ou <label>choisissez ${single ? 'un fichier' : 'des fichiers'}<input type="file" accept="image/jpeg,image/png,image/webp" ${single ? '' : 'multiple'} hidden></label><small>JPEG, PNG ou WebP. Les photos sont redimensionnées automatiquement.${single ? '' : ' La première est la photo de couverture ; faites glisser pour changer l’ordre.'}</small></div>`}`;
    };
    const add = async files => {
      files = [...files].filter(f => /^image\/(jpeg|png|webp)$/.test(f.type)).slice(0, single ? 1 : 40 - list.length);
      if (!files.length) return;
      pending += files.length; draw(); dirty = true;
      for (const f of files) {
        try { const url = await backend.upload(await resize(f)); if (single) list.splice(0, list.length, url); else list.push(url); }
        catch (e) { toast(`${f.name} : ${e.message}`, 'err'); }
        pending--; draw();
      }
    };
    box.addEventListener('change', e => { if (e.target.type === 'file') add(e.target.files); });
    box.addEventListener('click', e => {
      const x = e.target.closest('[data-x]'), l = e.target.closest('[data-l]'), r = e.target.closest('[data-r]');
      if (x) { list.splice(+x.dataset.x, 1); dirty = true; draw(); }
      if (l || r) { const i = +(l || r).dataset[l ? 'l' : 'r'], j = l ? i - 1 : i + 1; [list[i], list[j]] = [list[j], list[i]]; dirty = true; draw(); }
    });
    box.addEventListener('dragover', e => { e.preventDefault(); const d = box.querySelector('.drop'); if (d && e.dataTransfer.types.includes('Files')) d.classList.add('on'); const t = e.target.closest('.ph'); box.querySelectorAll('.over').forEach(o => o.classList.remove('over')); if (t && dragFrom !== null) t.classList.add('over'); });
    box.addEventListener('dragleave', e => { if (!box.contains(e.relatedTarget)) box.querySelector('.drop')?.classList.remove('on'); });
    box.addEventListener('dragstart', e => { const t = e.target.closest('.ph'); if (t) { dragFrom = +t.dataset.i; t.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; } });
    box.addEventListener('dragend', () => { dragFrom = null; box.querySelectorAll('.drag,.over').forEach(o => o.classList.remove('drag', 'over')); });
    box.addEventListener('drop', e => {
      e.preventDefault(); box.querySelector('.drop')?.classList.remove('on');
      if (e.dataTransfer.files.length) return add(e.dataTransfer.files);
      const t = e.target.closest('.ph');
      if (t && dragFrom !== null) { const to = +t.dataset.i; const [m] = list.splice(dragFrom, 1); list.splice(to, 0, m); dirty = true; draw(); }
    });
    draw();
    return { busy: () => pending > 0 };
  }

  // chips input for the "prestations" of a programme
  function chips(box, list) {
    const draw = () => {
      box.innerHTML = `<div class="chips">${list.map((t, i) => `<span>${esc(t)}<button type="button" data-i="${i}" aria-label="Retirer ${esc(t)}">×</button></span>`).join('')}<input placeholder="${list.length ? 'Ajouter…' : 'ex. Parking, Ascenseur, RE 2020… (Entrée pour valider)'}" aria-label="Ajouter une prestation"></div>`;
    };
    box.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) { list.splice(+b.dataset.i, 1); dirty = true; draw(); box.querySelector('input').focus(); } });
    // empties the input before redrawing: removing the focused input fires focusout, which must find nothing to add
    const take = i => { const v = i.value.trim(); i.value = ''; if (v && !list.includes(v)) list.push(v); dirty = true; draw(); };
    box.addEventListener('keydown', e => {
      const i = e.target; if (i.tagName !== 'INPUT') return;
      if ((e.key === 'Enter' || e.key === ',') && i.value.trim()) { e.preventDefault(); take(i); box.querySelector('input').focus(); }
      else if (e.key === 'Enter') e.preventDefault();
      else if (e.key === 'Backspace' && !i.value && list.length) { list.pop(); dirty = true; draw(); box.querySelector('input').focus(); }
    });
    box.addEventListener('focusout', e => { const i = e.target; if (i.tagName === 'INPUT' && i.value.trim()) take(i); });
    draw();
  }

  /* ---------- programme editor ---------- */
  function editProg(i) {
    const isNew = i === null, list = S.data.programmes;
    const p = isNew ? { name: '', city: 'Chartres', quarter: '', kind: 'Appartements', typo: '', livraison: '', from: null, head: '', desc: [], lots: [], tags: [], equip: [], imgs: [], featured: false, hidden: false } : clone(list[i]);
    const f = openDrawer(isNew ? 'Nouveau programme' : p.name, `
      <div class="sec"><h3>Informations</h3>
        ${field('name', 'Nom du programme *', p.name, 'required maxlength="120" placeholder="ex. Les Jardins de la Chênaie"')}
        <div class="row">${field('city', 'Ville *', p.city, 'required maxlength="60"')}${field('quarter', 'Quartier <em>(facultatif)</em>', p.quarter, 'maxlength="60" placeholder="ex. Centre-ville"')}</div>
        <div class="row">${select('kind', 'Type de biens', p.kind, KINDS.map(k => [k, k]))}${amount('from', 'Prix à partir de <em>(€)</em>', p.from)}</div>
        ${field('typo', 'Typologie', p.typo, 'maxlength="160" placeholder="ex. Appartements du studio au 4 pièces"')}
        ${field('livraison', 'Livraison', p.livraison, 'maxlength="80" placeholder="ex. Livraison 2e trimestre 2027"')}
      </div>
      <div class="sec"><h3>Photos <small>la première sert de couverture</small></h3><div id="phs"></div></div>
      <div class="sec"><h3>Présentation</h3>
        ${field('head', 'Accroche', p.head, 'maxlength="200" placeholder="ex. Vivez au cœur de l’histoire"')}
        ${area('desc', 'Description', (p.desc || []).join('\n\n'), 7, 'Laissez une ligne vide entre deux paragraphes.')}
      </div>
      <div class="sec"><h3>Lots disponibles</h3>${area('lots', 'Un lot par ligne', (p.lots || []).join('\n'), 4, 'ex. « T3 de 65 m² à partir de 245 000 € » : le prix s’affiche à droite automatiquement.')}</div>
      <div class="sec"><h3>Prestations et avantages</h3><div class="f" id="tg"></div></div>
      <div class="sec"><h3>Équipements</h3>${area('equip', 'Un équipement par ligne', (p.equip || []).join('\n'), 5, 'Une ligne qui se termine par « : » devient un intertitre.')}</div>
      <div class="sec"><h3>Affichage</h3>
        ${check('featured', 'À la une', 'Affiché dans « Nos opportunités du moment » en haut de la page Immobilier neuf.', p.featured)}
        ${check('hidden', 'Masquer du site', 'Le programme est conservé ici mais n’apparaît plus sur le site (brouillon, programme vendu…).', p.hidden)}
      </div>`, async f => {
      if (!require(f, ['name', 'city'])) return false;
      if (ph.busy()) { $('#emsg').textContent = 'Attendez la fin de l’envoi des photos.'; return false; }
      const out = { ...p, name: f.name.value.trim(), city: f.city.value.trim(), quarter: f.quarter.value.trim(), kind: f.kind.value, from: num(f.from.value),
        typo: f.typo.value.trim(), livraison: f.livraison.value.trim(), head: f.head.value.trim(),
        desc: String(f.desc.value).split(/\n\s*\n/).map(s => s.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean),
        lots: lines(f.lots.value), equip: lines(f.equip.value), tags: p.tags, imgs: p.imgs, featured: f.featured.checked, hidden: f.hidden.checked };
      if (isNew) out.id = uniqueId(out.name, list);
      return commit(d => { if (isNew) d.programmes.unshift(out); else d.programmes[i] = out; }, isNew ? `« ${out.name} » est publié sur le site` : `« ${out.name} » est mis à jour sur le site`);
    });
    bindAmounts(f);
    const ph = photos($('#phs'), p.imgs);
    chips($('#tg'), p.tags);
  }

  /* ---------- viager editor ---------- */
  const tetesText = t => {
    if (!t.length) return '';
    const who = h => h.s === 'f' ? 'une femme' : 'un homme', age = h => h.a ? ` de ${h.a} ans` : '';
    if (t.length === 1) return `Sur une tête : ${who(t[0])}${age(t[0])}`;
    const [a, b] = t;
    if (a.s !== b.s) { const [w, m] = a.s === 'f' ? [a, b] : [b, a]; return `Sur deux têtes : une femme${age(w)} et un homme${age(m)}`; }
    return `Sur deux têtes : deux ${a.s === 'f' ? 'femmes' : 'hommes'}${a.a && b.a ? ` de ${a.a} et ${b.a} ans` : ''}`;
  };
  // rebuilds the structured "têtes" from an older text such as "Sur deux têtes : un couple de 76 et 79 ans"
  const tetesParse = s => {
    s = String(s || ''); const ages = (s.match(/\d+/g) || []).map(Number), two = /deux têtes|couple|deux /.test(s);
    if (!s) return [{ s: 'f', a: null }];
    if (!two) return [{ s: /homme/.test(s) && !/femme/.test(s) ? 'h' : 'f', a: ages[0] || null }];
    if (/couple|femme.*homme/.test(s)) return [{ s: 'f', a: ages[0] || null }, { s: 'h', a: ages[1] || null }];
    if (/homme.*femme/.test(s)) return [{ s: 'h', a: ages[0] || null }, { s: 'f', a: ages[1] || null }];
    const x = /hommes/.test(s) ? 'h' : 'f'; return [{ s: x, a: ages[0] || null }, { s: x, a: ages[1] || null }];
  };

  // barème « Transaction patrimoniale » : TTC, sur la valeur libre, cumul des tranches (same as assets/js/data.js)
  const bareme = v => { v = +v || 0; const t = (a, b, r) => Math.max(0, Math.min(v, b) - a) * r;
    return Math.round(8000 + t(80000, 200000, .08) + t(200000, 350000, .07) + t(350000, 500000, .06) + t(500000, Infinity, .05)); };

  function editViager(i) {
    const isNew = i === null, list = S.data.viagers;
    const v = isNew ? { name: '', loc: 'Chartres', dep: '28', type: 'occ', p: null, m2: null, val: null, bouquet: null, rente: null, prix: null, hon: null, honCharge: 'acq',
      head: '', desc: [], tags: [], equip: [], imgs: [], tetes: '', exemple: false, hidden: false } : clone(list[i]);
    const t = v.t || tetesParse(v.tetes);
    v.imgs = v.imgs && v.imgs.length ? v.imgs : v.img ? [v.img] : [];
    v.tags = v.tags || [];
    const teteRow = (h, k) => `<div class="row" data-tete="${k}">${select('ts' + k, `Tête ${k + 1} : sexe`, h.s, [['f', 'Femme'], ['h', 'Homme']])}${field('ta' + k, `Tête ${k + 1} : âge`, h.a || '', 'inputmode="numeric" maxlength="3" placeholder="ex. 82"')}</div>`;
    const f = openDrawer(isNew ? 'Nouveau viager' : v.name, `
      <div class="sec"><h3>Informations</h3>
        ${field('name', 'Titre de l’annonce *', v.name, 'required maxlength="120" placeholder="ex. Maison de caractère"')}
        <div class="row">${field('loc', 'Ville *', v.loc, 'required maxlength="60"')}${select('dep', 'Département', v.dep, DEPS)}</div>
        <div class="row3">${select('type', 'Type de viager', v.type, Object.entries(TYPES))}${field('p', 'Pièces', v.p || '', 'inputmode="numeric" maxlength="2"')}${field('m2', 'Surface (m²)', v.m2 || '', 'inputmode="numeric" maxlength="5"')}</div>
      </div>
      <div class="sec"><h3>Photos <small>la première sert de couverture</small></h3><div id="phs"></div></div>
      <div class="sec"><h3>Présentation</h3>
        ${field('head', 'Accroche', v.head, 'maxlength="200" placeholder="ex. Une maison de caractère au pied de la cathédrale"')}
        ${area('desc', 'Description', (v.desc || []).join('\n\n'), 7, 'Laissez une ligne vide entre deux paragraphes.')}
      </div>
      <div class="sec"><h3>Montants</h3>
        <div class="row">${amount('val', 'Valeur libre du bien (€)', v.val)}${amount('prix', 'Prix d’achat (€)', v.prix)}</div>
        <div class="row">${amount('bouquet', 'Bouquet (€)', v.bouquet)}${amount('rente', 'Rente mensuelle (€)', v.rente)}</div>
        <div class="row">${amount('hon', 'Honoraires TTC (€)', v.hon)}${select('honCharge', 'Honoraires à la charge de', v.honCharge || 'acq', [['acq', 'L’acquéreur'], ['vend', 'Le vendeur']])}</div>
        <p class="preview"><button type="button" class="b b-sec" id="honCalc">Calculer les honoraires selon le barème</button> <span id="honInfo"></span></p>
      </div>
      <div class="sec"><h3>Têtes <small>informent l’acquéreur sur la durée probable</small></h3>
        ${select('tn', 'Nombre de têtes', t.length, [[1, 'Une tête'], [2, 'Deux têtes']])}
        <div id="tetes">${t.map(teteRow).join('')}</div>
        <p class="preview" id="tprev"></p>
      </div>
      <div class="sec"><h3>Points forts</h3><div class="f" id="tg"></div></div>
      <div class="sec"><h3>Équipements et caractéristiques</h3>${area('equip', 'Un élément par ligne', (v.equip || []).join('\n'), 5, 'Une ligne qui se termine par « : » devient un intertitre.')}</div>
      <div class="sec"><h3>Affichage</h3>
        ${check('exemple', 'Bien d’exemple', 'Affiche la mention « Exemple » (pour une annonce fictive).', v.exemple)}
        ${check('hidden', 'Masquer du site', 'Le viager est conservé ici mais n’apparaît plus sur le site (vendu, en attente…).', v.hidden)}
      </div>`, async f => {
      if (!require(f, ['name', 'loc'])) return false;
      if (ph.busy()) { $('#emsg').textContent = 'Attendez la fin de l’envoi des photos.'; return false; }
      const tt = readTetes();
      const out = { ...v, name: f.name.value.trim(), loc: f.loc.value.trim(), dep: f.dep.value, type: f.type.value, p: num(f.p.value), m2: num(f.m2.value),
        val: num(f.val.value), prix: num(f.prix.value), bouquet: num(f.bouquet.value), rente: num(f.rente.value), hon: num(f.hon.value), honCharge: f.honCharge.value,
        head: f.head.value.trim(), desc: String(f.desc.value).split(/\n\s*\n/).map(s => s.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean),
        tags: v.tags, equip: lines(f.equip.value), t: tt, tetes: tetesText(tt), imgs: v.imgs, img: v.imgs[0] || null, exemple: f.exemple.checked, hidden: f.hidden.checked };
      if (isNew) out.id = uniqueId(out.name + '-' + out.loc, list);
      return commit(d => { if (isNew) d.viagers.unshift(out); else d.viagers[i] = out; }, isNew ? `« ${out.name} » est publié sur le site` : `« ${out.name} » est mis à jour sur le site`);
    });
    const readTetes = () => [...f.querySelectorAll('[data-tete]')].map(r => { const k = r.dataset.tete; return { s: f['ts' + k].value, a: num(f['ta' + k].value) }; });
    const prev = () => { $('#tprev').textContent = 'Sur le site : « ' + tetesText(readTetes()) + ' »'; };
    f.tn.onchange = () => {
      const cur = readTetes(), n = +f.tn.value;
      while (cur.length < n) cur.push({ s: cur[0]?.s === 'f' ? 'h' : 'f', a: null });
      $('#tetes').innerHTML = cur.slice(0, n).map(teteRow).join(''); prev();
    };
    // the fee follows the barème on the valeur libre; Raphaël can still type another amount (negotiation)
    const honInfo = () => { const val = num(f.val.value); $('#honInfo').textContent = val ? `Barème : ${eur(bareme(val))} TTC pour une valeur libre de ${eur(val)}.` : 'Renseignez d’abord la valeur libre.'; };
    $('#honCalc').onclick = () => { const val = num(f.val.value); if (!val) { honInfo(); return; } f.hon.value = (bareme(val)).toLocaleString('fr-FR').replace(/\s/g, ' '); dirty = true; honInfo(); };
    f.val.addEventListener('input', honInfo); honInfo();
    f.addEventListener('input', prev); f.addEventListener('change', prev); prev();
    bindAmounts(f);
    const ph = photos($('#phs'), v.imgs);
    chips($('#tg'), v.tags);
  }

  /* ---------- start ---------- */
  (async () => {
    try { S.user = await backend.me(); } catch { S.user = null; }
    if (S.user) openApp().catch(e => { toast(e.message, 'err'); showLogin(); }); else showLogin();
  })();
})();
