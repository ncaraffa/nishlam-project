// Home: header, reveal, apresentação com scroll e catálogo.
document.getElementById('y').textContent = new Date().getFullYear();
document.querySelectorAll('.js-contact').forEach((a) => {
  a.href = contactUrl('Olá! Vim pelo site da NISHLAM Project e quero fazer um orçamento.');
  a.target = '_blank'; a.rel = 'noopener';
});

const header = document.getElementById('top');
const hero = document.querySelector('.hero');
// o topo fica preso enquanto a maré sobe; o que ela cobre é apagado e revela a apresentação, que já está atrás
const TIDE = () => innerHeight * 0.8;            // rolagem até a maré apagar o topo inteiro
const fitHero = () => { document.querySelector('.story').style.marginTop = `${-hero.offsetHeight}px`; };
fitHero(); addEventListener('resize', fitHero);
const onScroll = () => {
  header.classList.toggle('solid', scrollY > 30);
  header.classList.toggle('dark', scrollY < TIDE() * 0.62); // a maré alcança o topo
  hero.classList.toggle('gone', scrollY >= TIDE());
};
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// ---------- catálogo ----------
// leque das outras cores (card sozinho na linha, ao passar o mouse): metade de cada lado
const FAN_ORDER = ['azul royal', 'roxo', 'vermelho', 'preto', 'marinho', 'cinza chumbo'];
function fan(p) {
  const others = FAN_ORDER.filter((c) => c !== p.base && p.colors.includes(c));
  const half = Math.ceil(others.length / 2);
  return `<div class="fan" aria-hidden="true">${others.map((c, n) => {
    const k = n < half ? -(half - n) : n - half + 1;           // posições: -3 -2 -1 | 1 2 3
    const src = p.photos?.includes(c) ? `<img src="${photoUrl(p, c)}" alt="" loading="lazy">` : `<canvas data-color="${c}"></canvas>`;
    return `<span class="v" data-c="${c}" title="${c}" style="--s:${Math.sign(k)};--n:${Math.abs(k)}">${src}</span>`;
  }).join('')}<i class="fan-line"></i></div>`;
}
const linesEl = document.getElementById('lines');
linesEl.innerHTML = Object.entries(LINES).map(([key, l]) => {
  const items = PRODUCTS.filter((p) => p.line === key);
  return `<div class="line-block" data-line="${key}">
    <div class="line-title rv"><h3>${l.label}</h3><span>${l.sub}</span><em class="pix">${items.length} ${items.length > 1 ? 'modelos' : 'modelo'}</em></div>
    <div class="grid">${items.map((p, i) => `
      <a class="card rv${items.length === 1 ? ' has-fan' : ''}" style="--d:${i}" href="produto.html?id=${p.id}" data-id="${p.id}">
        ${items.length === 1 ? fan(p) : ''}
        <div class="ph"><span class="tag pix">${l.label} · ${l.sub}</span><img src="assets/${p.id}-tee.webp" alt="${p.name}" loading="lazy"></div>
        <div class="meta">
          <div><h4>${p.name}</h4><div class="fit">${p.fit}</div></div>
          <div class="sw" title="${p.colors.length} cores">${p.colors.slice(0, 4).map((c) => `<i style="background:${COLORS[c]}"></i>`).join('')}<span>${p.colors.length} cores</span></div>
        </div>
      </a>`).join('')}
    </div>
  </div>`;
}).join('');

// cores sem foto real: desenhadas (recoloridas) na primeira vez que o leque aparece
async function renderFan(card) {
  const cs = card.querySelectorAll('.fan canvas[data-color]:not([data-done])');
  if (!cs.length) return;
  cs.forEach((c) => { c.dataset.done = 1; });
  const shirt = await loadShirt(PRODUCTS.find((x) => x.id === card.dataset.id));
  cs.forEach((c) => shirt.render(c.getContext('2d'), c.dataset.color));
}
document.querySelectorAll('.card.has-fan').forEach((card) => card.addEventListener('mouseenter', () => renderFan(card)));

// celular (sem espaço nem mouse): ao rolar, as cores saem de trás da branca em espiral e ficam em volta dela
const smallScreen = matchMedia('(max-width: 1000px), (hover: none)');
const fanCards = [...document.querySelectorAll('.card.has-fan')];
const ease = (t) => 1 - (1 - t) ** 3;
function spiral() {
  for (const card of fanCards) {
    const vs = [...card.querySelectorAll('.fan .v')];
    if (!smallScreen.matches) {
      card.style.removeProperty('--p');
      vs.forEach((v) => { v.style.transform = ''; v.style.opacity = ''; v.style.transition = ''; });
      continue;
    }
    const r = card.querySelector('.fan').getBoundingClientRect();
    // 0 quando o card entra por baixo da tela, 1 quando está mais ou menos no meio
    const p = Math.min(1, Math.max(0, (innerHeight * 0.9 - r.top) / (innerHeight * 0.55)));
    card.style.setProperty('--p', p.toFixed(3));
    if (p > 0) renderFan(card);
    const W = r.width, H = r.height, n = vs.length;
    vs.forEach((v, i) => {
      const t = ease(Math.min(1, Math.max(0, (p - i * 0.06) / 0.6)));
      const a = (-90 + i * (360 / n) - (1 - t) * 200) * Math.PI / 180;   // gira enquanto se afasta = espiral
      const x = Math.cos(a) * W * 0.355 * t, y = Math.sin(a) * H * 0.345 * t;
      v.style.transition = 'none';
      v.style.opacity = Math.min(1, t * 4);
      v.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(0.5 + 0.38 * t).toFixed(3)})`;
    });
  }
}
let spiralQueued = false;
const queueSpiral = () => { if (!spiralQueued) { spiralQueued = true; requestAnimationFrame(() => { spiralQueued = false; spiral(); }); } };
addEventListener('scroll', queueSpiral, { passive: true });
addEventListener('resize', queueSpiral);
smallScreen.addEventListener('change', queueSpiral);
spiral();

document.querySelectorAll('.fan .v').forEach((v) => v.addEventListener('click', (e) => {
  e.preventDefault();
  location.href = `${v.closest('a').getAttribute('href')}&cor=${encodeURIComponent(v.dataset.c)}`;
}));

document.querySelectorAll('.filters button').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.filters button').forEach((o) => o.setAttribute('aria-pressed', o === b));
  document.querySelectorAll('.line-block').forEach((el) => { el.hidden = b.dataset.f !== 'all' && el.dataset.line !== b.dataset.f; });
}));

// ---------- reveal ----------
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.rv').forEach((el) => io.observe(el));

// ---------- apresentação (pinned + troca de cor da peça) ----------
const story = document.querySelector('.story');
const steps = [...document.querySelectorAll('.story-step')];
const dots = [...document.querySelectorAll('.story-dots i')];
const visual = document.querySelector('.story-visual');
const FRAMES = [
  { color: 'branco' }, { color: 'azul royal' }, { color: 'preto' }, { color: 'branco' },
];
let frames = [];

(async () => {
  const p = PRODUCTS.find((x) => x.id === 'masculina');   // fotos reais em todas as cores da apresentação
  const shirt = await loadShirt(p);
  frames = FRAMES.map((f) => {
    const c = document.createElement('canvas');
    c.style.cssText = 'position:absolute;opacity:0;transition:opacity .7s';
    shirt.render(c.getContext('2d'), f.color);
    visual.appendChild(c); return c;
  });
  update();
})();

let current = -1;
function update() {
  const r = story.getBoundingClientRect();
  const prog = Math.min(0.999, Math.max(0, (-r.top - TIDE()) / (r.height - innerHeight - TIDE())));
  const i = Math.floor(prog * steps.length);
  if (i === current && frames.length && frames[i].style.opacity === '1') return;
  current = i;
  steps.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('past', k < i); });
  dots.forEach((d, k) => d.classList.toggle('on', k === i));
  frames.forEach((c, k) => { c.style.opacity = k === i ? '1' : '0'; });
}
addEventListener('scroll', update, { passive: true });
update();

// ---------- ondas da marca passando no fundo do topo (pixeladas, em baixa resolução) ----------
const wv = document.querySelector('.hero-waves');
if (wv) {
  const g = wv.getContext('2d'), PX = 7;
  const css = getComputedStyle(document.documentElement);
  const cols = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'].map((v) => css.getPropertyValue(v).trim());
  let W = 0, H = 0, visible = true;
  const size = () => { W = wv.width = Math.ceil(hero.offsetWidth / PX); H = wv.height = Math.ceil(hero.offsetHeight / PX); };
  size(); addEventListener('resize', size);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);
  const draw = (t) => {
    g.clearRect(0, 0, W, H);
    const gap = H / 5, th = Math.max(3, Math.round(gap * .34)), slope = .22;
    const k0 = -2, k1 = Math.ceil((H + W * slope) / gap) + 1;
    for (let k = k0; k <= k1; k++) {
      g.fillStyle = cols[((k % 6) + 6) % 6];
      for (let x = 0; x < W; x++) {
        const y = k * gap - x * slope + Math.sin(x * .04 - t * .32 + k * 1.3) * gap * .38;
        g.fillRect(x, Math.round(y), 1, th);
      }
    }
  };
  // maré: ao rolar, uma onda com as faixas da marca sobe e cobre o preto, levando à parte branca
  const tide = document.querySelector('.hero-tide'), tg = tide.getContext('2d');
  const order = [cols[5], cols[3], cols[2], cols[1], cols[4], cols[0]];
  const sizeTide = () => { tide.width = W; tide.height = H; };
  sizeTide(); addEventListener('resize', sizeTide);
  // abaixo da onda o topo é recortado (clip-path): aparece a apresentação que está atrás
  const drawTide = (t) => {
    tg.clearRect(0, 0, W, H);
    const amp = H * .07, bt = Math.max(2, Math.round(H * .022)), band = amp * 1.6 + bt * order.length;
    const p = Math.min(1, scrollY / TIDE());
    if (p <= 0) { hero.style.clipPath = ''; return; }
    const base = H + band - p * (H + band * 2);
    const pts = [];
    for (let x = 0; x < W; x++) {
      const yf = Math.round(base + Math.sin(x * .03 - t * .3) * amp + Math.sin(x * .011 + t * .17) * amp * .6);
      order.forEach((c, i) => { tg.fillStyle = c; tg.fillRect(x, yf - (order.length - i) * bt, 1, bt); });
      pts.push(`${x * PX}px ${yf * PX}px`, `${(x + 1) * PX}px ${yf * PX}px`);
    }
    hero.style.clipPath = `polygon(0 0, 100% 0, ${pts.reverse().join(',')})`;
  };
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  addEventListener('scroll', () => { if (still) drawTide(0); }, { passive: true });
  if (still) { draw(0); drawTide(0); }
  else (function loop(now) { if (visible && !hero.classList.contains('gone')) { draw(now / 1000); drawTide(now / 1000); } requestAnimationFrame(loop); })(0);
}
