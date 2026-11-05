// Página de produto: cor, tamanho, medidas e simulador de estampa.
const $ = (id) => document.getElementById(id);
const product = PRODUCTS.find((p) => p.id === new URLSearchParams(location.search).get('id'));
if (!product) location.replace('index.html#catalogo');

const line = LINES[product.line];
const askedColor = new URLSearchParams(location.search).get('cor');
const state = { color: product.colors.includes(askedColor) ? askedColor : product.base, size: null, art: null, raw: null, place: null, scale: 40, pos: 'center' };

document.title = `${product.name} — NISHLAM Project`;
$('y').textContent = new Date().getFullYear();
$('crumb-line').textContent = `${line.label.toLowerCase()} · ${product.name.toLowerCase()}`;
$('line').textContent = `${line.label} · ${line.sub}`;
$('name').textContent = product.name;
$('desc').textContent = product.desc;
document.querySelectorAll('.js-contact').forEach((a) => {
  a.href = contactUrl('Olá! Vim pelo site da NISHLAM Project e quero fazer um orçamento.');
  a.target = '_blank'; a.rel = 'noopener';
});

// ---------- cor / tamanho / medidas ----------
$('swatches').innerHTML = product.colors.map((c) =>
  `<button style="--sw:${COLORS[c]}" data-c="${c}" aria-label="${c}" title="${c}" aria-pressed="${c === state.color}"></button>`).join('');
$('sizes').innerHTML = product.sizes.cols.map((s) => `<button data-s="${s}" aria-pressed="false">${s}</button>`).join('');
const sz = product.sizes;
$('measures').innerHTML = `<tr><th></th>${sz.cols.map((s) => `<th>${s}</th>`).join('')}</tr>
  <tr><td>Largura</td>${sz.larg.map((v) => `<td>${v}</td>`).join('')}</tr>
  <tr><td>Comprimento</td>${sz.comp.map((v) => `<td>${v}</td>`).join('')}</tr>`;

$('swatches').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  state.color = b.dataset.c;
  $('swatches').querySelectorAll('button').forEach((o) => o.setAttribute('aria-pressed', o === b));
  sync(); draw();
});
$('sizes').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  state.size = b.dataset.s;
  $('sizes').querySelectorAll('button').forEach((o) => o.setAttribute('aria-pressed', o === b));
  sync();
});

// frente/costas: cada lado guarda a própria estampa
let view = 'front';
const sides = { front: {}, back: {} };
const shirts = {};

function sync() {
  $('color-name').textContent = state.color;
  $('size-name').textContent = state.size || 'escolha';
  const printed = ['front', 'back'].filter((v) => (v === view ? state.art : sides[v].art));
  const where = printed.map((v) => (v === 'front' ? 'frente' : 'costas')).join(' e ');
  $('order').href = contactUrl(
    `Olá! Quero um orçamento na NISHLAM Project:\n• ${product.name} (${line.label} · ${line.sub})\n• Cor: ${state.color}\n• Tamanho: ${state.size || 'a definir'}`
    + (printed.length ? `\n• Estampa: ${where}\nFiz a simulação no site e vou enviar a arte por aqui.` : ''));
}
sync();

// ---------- render ----------
const cv = $('cv'), ctx = cv.getContext('2d'), viewer = $('viewer');
let shirt = null, queued = false;
function draw() {
  if (!shirt || queued) return;
  if (state.art && !state.place) setPos('center');
  queued = true;
  requestAnimationFrame(() => { queued = false; shirt.render(ctx, state.color, state.art, state.place); });
}
shirts.front = loadShirt(product);
shirts.front.then((s) => { shirt = s; viewer.classList.remove('loading'); draw(); });

const POS_LABELS = { front: ['Centro do peito', 'Peito esquerdo'], back: ['Centro das costas', 'Nuca'] };
const thumb = (id) => { const c = $(id); return c.getContext('2d').getImageData(0, 0, c.width, c.height); };
async function switchView(v) {
  if (v === view) return;
  // guarda o lado atual
  sides[view] = { art: state.art, raw: state.raw, place: state.place, scale: state.scale, pos: state.pos, orig: state.orig,
    info: $('artinfo').textContent, tO: thumb('artorig'), tP: thumb('artprev') };
  view = v;
  const sd = sides[v];
  Object.assign(state, { art: sd.art || null, raw: sd.raw || null, place: sd.place || null, scale: sd.scale || 40, pos: sd.pos || 'center', orig: sd.orig || null });
  ['artorig', 'artprev'].forEach((id, i) => {
    const t = i ? sd.tP : sd.tO;
    if (t) $(id).getContext('2d').putImageData(t, 0, 0); else $(id).getContext('2d').clearRect(0, 0, 56, 56);
  });
  $('artinfo').textContent = sd.info || '';
  $('sim').classList.toggle('ready', !!state.raw); $('remove').hidden = !state.raw; $('file').value = '';
  viewer.classList.toggle('has-art', !!state.art);
  $('hint').textContent = state.art ? 'arraste para posicionar' : (v === 'back' ? 'costas' : 'pré-visualização');
  $('scale').value = state.scale; $('scalev').textContent = `${state.scale}%`;
  document.querySelectorAll('#pos [data-p]').forEach((b, i) => { b.textContent = POS_LABELS[v][i]; b.setAttribute('aria-pressed', b.dataset.p === state.pos); });
  document.querySelectorAll('#side [data-v]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === v));
  $('sim-h').textContent = v === 'back' ? 'Simule sua estampa nas costas' : 'Simule sua estampa';
  // vira a peça
  viewer.classList.remove('flip'); void viewer.offsetWidth; viewer.classList.add('flip');
  if (!shirts[v]) { viewer.classList.add('loading'); shirts[v] = loadShirt(product, v); }
  const s = await shirts[v];
  if (view !== v) return;
  shirt = s; viewer.classList.remove('loading');
  sync(); draw();
}
document.querySelectorAll('#side [data-v]').forEach((b) => b.addEventListener('click', () => switchView(b.dataset.v)));

// ---------- arte: carregar, recortar fundo, aparar ----------
const MAX = 1400;
async function loadArt(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImg(url);
    let w = img.naturalWidth || 1000, h = img.naturalHeight || 1000;
    const k = Math.min(1, MAX / Math.max(w, h)); w = Math.round(w * k); h = Math.round(h * k);
    const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h);
    state.raw = x.getImageData(0, 0, w, h);
    // guarda o tamanho original (a prévia trabalha reduzida a no máx. 1400 px)
    state.orig = { name: file.name, w: img.naturalWidth || w, h: img.naturalHeight || h };
    const po = $('artorig').getContext('2d'); po.clearRect(0, 0, 56, 56);
    const ko = Math.min(56 / w, 56 / h);
    po.drawImage(img, (56 - w * ko) / 2, (56 - h * ko) / 2, w * ko, h * ko);
    // arte que já vem com transparência: não precisa recortar
    const d = state.raw.data; let transparent = 0;
    for (let i = 3; i < d.length; i += 4 * 97) if (d[i] < 250) transparent++;
    $('rmbg').checked = transparent < 3;
    $('artinfo').textContent = `${file.name} · ${state.orig.w}×${state.orig.h} px`;
    $('sim').classList.add('ready');
    $('remove').hidden = false;
    if (!state.place) setPos('center');
    buildArt();
  } catch { alert('Não foi possível abrir essa imagem. Tente PNG ou JPG.'); }
  finally { URL.revokeObjectURL(url); }
}

function buildArt() {
  if (!state.raw) return;
  const { width: w, height: h } = state.raw;
  const img = new ImageData(new Uint8ClampedArray(state.raw.data), w, h), d = img.data;
  $('tolwrap').style.display = $('rmbg').checked ? '' : 'none';
  $('inner').parentElement.style.display = $('rmbg').checked ? '' : 'none';
  if ($('rmbg').checked) removeBackground(d, w, h, +$('tol').value, $('inner').checked);
  // apara ao conteúdo visível
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 10) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  if (x1 < 0) { state.art = null; draw(); return; }
  const c = Object.assign(document.createElement('canvas'), { width: x1 - x0 + 1, height: y1 - y0 + 1 });
  c.getContext('2d').putImageData(img, -x0, -y0);
  state.art = c;
  const p = $('artprev').getContext('2d'); p.clearRect(0, 0, 56, 56);
  const k = Math.min(56 / c.width, 56 / c.height);
  p.drawImage(c, (56 - c.width * k) / 2, (56 - c.height * k) / 2, c.width * k, c.height * k);
  viewer.classList.add('has-art'); $('hint').textContent = 'arraste para posicionar';
  sync(); draw();
}

/** Fundo = cor média da borda. Remove por inundação a partir das bordas (ou em toda a arte). */
function removeBackground(d, w, h, tol, everywhere) {
  let r = 0, g = 0, b = 0, n = 0;
  const add = (i) => { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; };
  for (let x = 0; x < w; x++) { add(x * 4); add(((h - 1) * w + x) * 4); }
  for (let y = 0; y < h; y++) { add(y * w * 4); add((y * w + w - 1) * 4); }
  r /= n; g /= n; b /= n;
  const dist = (j) => { const i = j * 4; return Math.hypot(d[i] - r, d[i + 1] - g, d[i + 2] - b); };
  const reach = tol * 1.5;
  const alphaFor = (dd) => Math.max(0, Math.min(1, (dd - tol * 0.6) / (tol * 0.9)));
  const total = w * h;
  if (everywhere) {
    for (let j = 0; j < total; j++) { const dd = dist(j); if (dd < reach) d[j * 4 + 3] *= alphaFor(dd); }
    return;
  }
  const seen = new Uint8Array(total), stack = new Int32Array(total); let sp = 0;
  const push = (j) => { if (!seen[j] && dist(j) < reach) { seen[j] = 1; stack[sp++] = j; } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (sp) {
    const j = stack[--sp]; d[j * 4 + 3] *= alphaFor(dist(j));
    const x = j % w;
    if (x > 0) push(j - 1); if (x < w - 1) push(j + 1);
    if (j >= w) push(j - w); if (j < total - w) push(j + w);
  }
}

// ---------- controles ----------
$('file').addEventListener('change', (e) => loadArt(e.target.files[0]));
const drop = $('drop');
['dragenter', 'dragover'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.add('over'); }));
['dragleave', 'drop'].forEach((t) => drop.addEventListener(t, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
drop.addEventListener('drop', (e) => loadArt(e.dataTransfer.files[0]));
viewer.addEventListener('dragover', (e) => e.preventDefault());
viewer.addEventListener('drop', (e) => { e.preventDefault(); loadArt(e.dataTransfer.files[0]); });

let rebuild;
['rmbg', 'inner'].forEach((id) => $(id).addEventListener('change', buildArt));
$('tol').addEventListener('input', () => { $('tolv').textContent = $('tol').value; clearTimeout(rebuild); rebuild = setTimeout(buildArt, 120); });
$('tolv').textContent = $('tol').value;

$('scale').addEventListener('input', () => {
  state.scale = +$('scale').value; $('scalev').textContent = `${state.scale}%`;
  if (state.place && shirt) { state.place.width = shirt.box.w * state.scale / 100; draw(); }
});

function setPos(kind) {
  if (!shirt) return;
  state.pos = kind; state.place = shirt.defaultPlace(kind);
  state.scale = Math.round(state.place.width / shirt.box.w * 100);
  $('scale').value = state.scale; $('scalev').textContent = `${state.scale}%`;
  document.querySelectorAll('#pos [data-p]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.p === kind));
  draw();
}
document.querySelectorAll('#pos [data-p]').forEach((b) => b.addEventListener('click', () => setPos(b.dataset.p)));
$('remove').addEventListener('click', () => {
  state.art = null; state.raw = null; $('file').value = '';
  $('sim').classList.remove('ready'); viewer.classList.remove('has-art'); $('hint').textContent = 'pré-visualização';
  sync(); draw();
});

// arrastar a estampa
let drag = null;
cv.addEventListener('pointerdown', (e) => {
  if (!state.art || zooming) return;
  const r = cv.getBoundingClientRect(), k = cv.width / r.width;
  drag = { k, sx: e.clientX, sy: e.clientY, cx: state.place.cx, cy: state.place.cy };
  cv.setPointerCapture(e.pointerId); viewer.classList.add('dragging');
});
cv.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const b = shirt.box;
  state.place.cx = Math.min(b.x + b.w, Math.max(b.x, drag.cx + (e.clientX - drag.sx) * drag.k));
  state.place.cy = Math.min(b.y + b.h, Math.max(b.y, drag.cy + (e.clientY - drag.sy) * drag.k));
  draw();
});
const end = () => { drag = null; viewer.classList.remove('dragging'); };
cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

// baixar a simulação
$('download').addEventListener('click', () => {
  if (!shirt) return;
  const o = Object.assign(document.createElement('canvas'), { width: cv.width + 160, height: cv.height + 120 });
  const x = o.getContext('2d'); x.fillStyle = '#f3f2f1'; x.fillRect(0, 0, o.width, o.height);
  x.drawImage(cv, 80, 120);
  o.toBlob((blob) => {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(blob), download: `nishlam-${product.id}-${state.color.replace(/\s/g, '-')}-${view === 'back' ? 'costas' : 'frente'}.png`,
    });
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
});

// lupa: mostra o detalhe da estampa no tecido (2,5x da imagem exibida)
const loupe = $('loupe'), lctx = loupe.getContext('2d');
let zooming = false;
$('zoom').addEventListener('click', () => {
  zooming = !zooming;
  $('zoom').setAttribute('aria-pressed', zooming);
  viewer.classList.toggle('zooming', zooming);
  if (!zooming) loupe.style.opacity = 0;
});
cv.addEventListener('pointermove', (e) => {
  if (!zooming) return;
  const r = cv.getBoundingClientRect(), vr = viewer.getBoundingClientRect();
  const k = cv.width / r.width, Z = 2.5;
  const px = (e.clientX - r.left) * k, py = (e.clientY - r.top) * k;
  const src = loupe.offsetWidth * k / Z;                       // área da foto mostrada na lupa
  lctx.fillStyle = '#f3f2f1'; lctx.fillRect(0, 0, loupe.width, loupe.height);
  lctx.imageSmoothingQuality = 'high';
  lctx.drawImage(cv, px - src / 2, py - src / 2, src, src, 0, 0, loupe.width, loupe.height);
  loupe.style.left = `${e.clientX - vr.left}px`; loupe.style.top = `${e.clientY - vr.top}px`;
  loupe.style.opacity = 1;
});
cv.addEventListener('pointerleave', () => { loupe.style.opacity = 0; });
