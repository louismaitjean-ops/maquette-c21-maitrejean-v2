/* Actualités card: floats at the bottom of the screen and cycles through the latest articles (those of the page's theme
   when there are some). It steps aside over the footer. The cross hides it until a newer article is published.
   Not shown on the blog and contact pages. */
C21Data.then(({ articles: A }) => {
  const page = document.body.dataset.page;
  if (!A.length || page === 'actus' || page === 'contact') return;
  const KEY = 'c21-news-closed', latest = A[0].id;
  try { if (localStorage.getItem(KEY) === latest) return; } catch (e) {}
  const cat = { viager: 'Viager', neuf: 'Immobilier neuf', patrimoine: 'Patrimoine' }[page];
  const themed = A.filter(x => x.cat === cat), e = C21.esc;
  const L = (themed.length ? themed : A).slice(0, 3);
  const calm = matchMedia('(prefers-reduced-motion:reduce)').matches, moving = L.length > 1 && !calm;
  const band = document.createElement('aside');
  band.className = 'news'; band.setAttribute('aria-label', 'Actualités');
  band.innerHTML = `<a class="n-all" href="actualites.html">Actualités</a><div class="n-st">${L.map((a, i) => `<a class="n-s${i ? '' : ' cur'}" href="${C21.artUrl(a)}">
      ${a.img ? `<span class="n-im"><img src="${e(C21.thumb(a.img))}" alt=""></span>` : ''}<span class="n-tx"><span class="n-t">${e(a.name)}</span><span class="n-l">Lire l'article ${window.AR || ''}</span></span></a>`).join('')}</div>
    ${moving ? '<span class="n-p" aria-hidden="true"><i></i></span>' : ''}<button type="button" class="x" aria-label="Fermer l'actualité">×</button>`;
  const S = [...band.querySelectorAll('.n-s')], fill = band.querySelector('.n-p i');
  let at = 0, clean, hover = false, focus = false, atFooter = false;
  const sync = () => { band.classList.toggle('hid', atFooter); band.classList.toggle('pause', hover || focus || atFooter || document.hidden); };
  const next = () => {
    const n = (at + 1) % S.length;
    S.forEach(s => s.classList.remove('was', 'go'));
    S[at].classList.replace('cur', 'was'); S[n].classList.add('cur', 'go'); at = n;
    clearTimeout(clean); clean = setTimeout(() => S.forEach(s => s.classList.remove('was')), 700);
    fill.style.animation = 'none'; fill.offsetWidth; fill.style.animation = '';
  };
  if (moving) {
    fill.addEventListener('animationend', next);
    if (matchMedia('(hover:hover)').matches) { band.addEventListener('mouseenter', () => { hover = true; sync(); }); band.addEventListener('mouseleave', () => { hover = false; sync(); }); }
    band.addEventListener('focusin', ev => { focus = ev.target.matches(':focus-visible'); sync(); });
    band.addEventListener('focusout', () => { focus = false; sync(); });
    document.addEventListener('visibilitychange', sync);
  }
  band.querySelector('.x').onclick = () => {
    try { localStorage.setItem(KEY, latest); } catch (err) {}
    band.classList.remove('on');
    setTimeout(() => band.remove(), 800);
  };
  document.body.append(band);
  const foot = document.querySelector('.ft');
  if (foot) new IntersectionObserver(([x]) => { atFooter = x.isIntersecting; sync(); }).observe(foot);
  band.classList.add('pause');
  setTimeout(() => { band.classList.add('on'); sync(); }, 900);
});
