/* Actualités band: a slim strip at the bottom of the screen with the latest article (of the page's theme when
   there is one). The cross hides it until a newer article is published. Not shown on the blog and contact pages. */
C21Data.then(({ articles: A }) => {
  const page = document.body.dataset.page;
  if (!A.length || page === 'actus' || page === 'contact') return;
  const KEY = 'c21-news-closed', latest = A[0].id;
  try { if (localStorage.getItem(KEY) === latest) return; } catch (e) {}
  const cat = { viager: 'Viager', neuf: 'Immobilier neuf', patrimoine: 'Patrimoine' }[page];
  const a = A.find(x => x.cat === cat) || A[0], e = C21.esc;
  const band = document.createElement('aside');
  band.className = 'news'; band.setAttribute('aria-label', 'Actualité');
  band.innerHTML = `<span class="k">Actualité</span><a class="t" href="${C21.artUrl(a)}">${e(a.name)}</a>
    <a class="l" href="${C21.artUrl(a)}">Lire ${window.AR || ''}</a><a class="all" href="actualites.html">Toutes les actualités</a>
    <button type="button" class="x" aria-label="Fermer le bandeau d'actualité">×</button>`;
  band.querySelector('.x').onclick = () => {
    try { localStorage.setItem(KEY, latest); } catch (err) {}
    band.classList.remove('on'); document.body.classList.remove('has-news');
    setTimeout(() => band.remove(), 400);
  };
  document.body.append(band);
  setTimeout(() => { band.classList.add('on'); document.body.classList.add('has-news'); }, 900);
});
