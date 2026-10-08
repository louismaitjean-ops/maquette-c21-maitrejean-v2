/* Shared header, footer, icons and small behaviours for every page. */
(function () {
  const page = document.body.dataset.page || '';
  const SPRITE = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="c21-word" viewBox="0 0 170 20"><path fill="currentColor" fill-rule="evenodd" d="M91.465 11.28a4.244 4.244 0 01-8.488 0V0h-3.656v11.28a7.9 7.9 0 0015.8 0V0h-3.656v11.28zM5.53 5.277a5.91 5.91 0 018.116.016l2.099-3.025a9.578 9.578 0 10.02 14.675l-2.098-3.04A5.929 5.929 0 115.53 5.277zM50.913 12.885L41.978 0h-3.657v19.182h3.657V6.295l8.935 12.887h3.657V0h-3.657zM59.446 3.657h5.663v15.525h3.657V3.657h5.663V0H59.446zM160.472 3.657h1.99v15.525h3.673V0h-5.663zM20.653 19.182h12.776v-3.658H24.31v-4.105h7.33V7.762h-7.33V3.657h9.12V0H20.653zM108.3 0h-8.286v19.182h3.657v-6.297h2.345l4.364 6.295h4.352l-4.552-6.59a6.455 6.455 0 004.552-6.156h.015A6.464 6.464 0 00108.3 0zm0 9.212h-4.63V3.657h4.63a2.778 2.778 0 010 5.556v-.001zM126.138 7.762L120.765 0H116.4l7.9 11.404v7.778h3.658v-7.778L135.855 0h-4.351zM155.286 9.583l.091-.14a6.06 6.06 0 10-11.09-3.378v.231h3.672c0-.077-.015-.154-.015-.231a2.394 2.394 0 012.391-2.392 2.323 2.323 0 012.408 2.392 4.972 4.972 0 01-.772 1.867c-.201.308-7.793 11.249-7.793 11.249h12.592v-3.657h-5.602l4.118-5.941zM169.637 17.823a.818.818 0 00-.323-.324.953.953 0 00-.91 0 .818.818 0 00-.323.324.984.984 0 000 .925.818.818 0 00.324.324.953.953 0 00.909 0 .818.818 0 00.323-.324.984.984 0 000-.925z"/></symbol>
  <symbol id="c21-seal" viewBox="0 0 100 100"><path d="M85.1 26.1A43 43 0 1 0 85.1 73.9" fill="none" stroke="currentColor" stroke-width="6.4"/><path fill="currentColor" transform="translate(51 50) scale(2.15) translate(-155.2 -9.6)" d="M155.286 9.583l.091-.14a6.06 6.06 0 10-11.09-3.378v.231h3.672c0-.077-.015-.154-.015-.231a2.394 2.394 0 012.391-2.392 2.323 2.323 0 012.408 2.392 4.972 4.972 0 01-.772 1.867c-.201.308-7.793 11.249-7.793 11.249h12.592v-3.657h-5.602l4.118-5.941zM160.472 3.657h1.99v15.525h3.673V0h-5.663z"/></symbol>
  <symbol id="i-ar" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-tel" viewBox="0 0 24 24"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></symbol>
  <symbol id="i-pin" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></symbol>
  <symbol id="i-pin-o" viewBox="0 0 24 24"><path d="M12 21s-6.5-6.6-6.5-11.5a6.5 6.5 0 0 1 13 0C18.5 14.4 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="12" cy="9.5" r="2.3" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
  <symbol id="i-mail" viewBox="0 0 24 24"><path fill="currentColor" d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4 7.3V8l8 5 8-5v-.7z"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-dl" viewBox="0 0 24 24"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></symbol>
  <symbol id="i-home" viewBox="0 0 24 24"><path d="M3.5 11L12 4l8.5 7M6 9.5V20h4.5v-5.5h3V20H18V9.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></symbol>
  <symbol id="i-size" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 12h8M12 8v8" stroke="currentColor" stroke-width="1.2"/></symbol>
  <symbol id="i-fb" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4a21 21 0 0 0-2.4-.1c-2.4 0-4 1.4-4 4.1v2.1H7.6v3h2.6V21z"/></symbol>
  <symbol id="i-ig" viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor"/></symbol>
  <symbol id="i-in" viewBox="0 0 24 24"><path fill="currentColor" d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1.8 7.2V18h2.6v-7.8zM7.1 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm3.4 4.2V18h2.6v-4.1c0-1.1.2-2.1 1.5-2.1s1.4 1.2 1.4 2.2v4H18.6v-4.6c0-2.3-.5-4-3.1-4-1.3 0-2.1.7-2.5 1.3v-1.1z"/></symbol>
  </svg>`;
  const ar = '<svg class="ar"><use href="#i-ar"/></svg>';
  const logo = (cls = '') => `<a href="index.html" class="logo ${cls}" aria-label="CENTURY 21 Maitrejean Immobilier, accueil"><svg class="seal"><use href="#c21-seal"/></svg><span><svg class="wm" viewBox="0 0 170 20"><use href="#c21-word"/></svg><small>Maitrejean Immobilier</small></span></a>`;
  const NAV = [['index.html', 'Accueil', 'accueil'], ['immobilier-neuf.html', 'Immobilier neuf', 'neuf'], ['viager.html', 'Viager', 'viager'], ['solutions-patrimoniales.html', 'Solutions patrimoniales', 'patrimoine'], ['a-propos.html', 'À propos', 'apropos']];
  const nav = NAV.map(([h, t, k]) => `<a href="${h}"${k === page ? ' class="on" aria-current="page"' : ''}>${t}</a>`).join('');
  const header = `<header class="hd"><div class="wrap">${logo()}<nav class="nav" aria-label="Navigation principale">${nav}</nav>
    <div class="hd-r"><a class="btn btn-green" href="contact.html">Contact ${ar}</a><a class="tel" href="tel:+33237992121"><svg><use href="#i-tel"/></svg>02 37 99 21 21</a></div>
    <button class="burger" aria-label="Ouvrir le menu"><span></span><span></span><span></span></button></div></header>
    <div class="drawer" aria-hidden="true"><button class="x" aria-label="Fermer">×</button>${nav}<a href="contact.html">Contact</a><a href="tel:+33237992121" style="font-family:var(--sans);font-size:18px">02 37 99 21 21</a></div>`;
  const O = 'https://www.century21-maitrejean-chartres.com';
  const footer = `<footer class="ft"><div class="wrap">
      <div>${logo()}</div>
      <div><span class="gold">Chartres &amp; alentours</span><br><a href="immobilier-neuf.html">Immobilier neuf</a> · <a href="viager.html">Viager</a> · <a href="solutions-patrimoniales.html">Solutions patrimoniales</a></div>
      <div><span class="ci"><svg><use href="#i-pin"/></svg>14 rue Mathurin Régnier</span><span class="ci"><svg><use href="#i-pin"/></svg>28000 Chartres</span></div>
      <div><a class="ci" href="tel:+33237992121"><svg><use href="#i-tel"/></svg>02 37 99 21 21</a><a class="ci" href="mailto:contact@maitrejean-immobilier.fr"><svg><use href="#i-mail"/></svg>contact@maitrejean-immobilier.fr</a></div>
      <div class="soc"><a href="https://www.facebook.com/Century21.maitrejean/" target="_blank" rel="noopener" aria-label="Facebook"><svg><use href="#i-fb"/></svg></a><a href="https://www.instagram.com/century21maitrejeanimmobilier/" target="_blank" rel="noopener" aria-label="Instagram"><svg><use href="#i-ig"/></svg></a><a href="https://www.linkedin.com/company/century21fr" target="_blank" rel="noopener" aria-label="LinkedIn"><svg><use href="#i-in"/></svg></a></div>
    </div></footer>
    <div class="ft-b"><div class="wrap"><a href="${O}/mentions_legales/" target="_blank" rel="noopener">Mentions légales</a><i>|</i><a href="${O}/protection-des-donnees/" target="_blank" rel="noopener">Politique de confidentialité</a><i>|</i><a href="${O}/protection-des-donnees/" target="_blank" rel="noopener">Gestion des cookies</a></div></div>`;

  document.body.insertAdjacentHTML('afterbegin', SPRITE + header);
  document.body.insertAdjacentHTML('beforeend', footer);
  window.AR = ar;

  // mobile drawer
  const dr = document.querySelector('.drawer');
  document.querySelector('.burger').addEventListener('click', () => { dr.classList.add('open'); dr.setAttribute('aria-hidden', 'false'); });
  dr.querySelector('.x').addEventListener('click', () => { dr.classList.remove('open'); dr.setAttribute('aria-hidden', 'true'); });

  // reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  window.reveal = root => (root || document).querySelectorAll('.rv:not(.is-in)').forEach(el => io.observe(el));
  window.reveal();
})();
