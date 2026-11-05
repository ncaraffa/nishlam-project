// NISHLAM Project — catálogo + utilitários de imagem compartilhados.

// Número do WhatsApp com DDI+DDD, só dígitos (ex.: '5511999999999').
// Vazio = os botões de orçamento abrem o Direct do Instagram.
const WHATSAPP = '';
const INSTAGRAM = 'nishlamproject';

const COLORS = {
  'branco': '#ffffff', 'canário': '#ffd51f', 'ouro': '#f5ad18', 'laranja': '#ff7a1a',
  'vermelho': '#de1528', 'vinho': '#7e1229', 'pink': '#ee1585', 'rosa bebê': '#f6a6cc',
  'roxo': '#7f13b8', 'azul royal': '#155fe0', 'marinho': '#13306e', 'turquesa': '#17c0e8',
  'verde bandeira': '#11a82a', 'verde musgo': '#1d5e36', 'cinza mescla': '#b9b9b9',
  'cinza chumbo': '#55595e', 'preto': '#141414',
};

const SIZES_REGULAR = { cols: ['P','M','G','GG','XGG'], larg: ['46–50','48–52','53–57','56–60','59–63'], comp: ['65–69','67–71','69–73','72–76','73–77'] };

// cores com foto real da camiseta classic (masculina/feminina) em assets/classic/{cor}.webp;
// as demais cores são recoloridas a partir da branca
const CLASSIC_PHOTOS = ['branco','canário','ouro','laranja','pink','rosa bebê','roxo','azul royal','marinho','turquesa','cinza mescla','cinza chumbo','preto'];
/** caminho da foto real de uma cor: sem acento, espaços viram hífen */
const photoUrl = (p, c, view = 'front') => `assets/${p.photoDir || p.id}/${view === 'back' ? 'costas/' : ''}${c.normalize('NFD').replace(/[̀-ͯ]/g, '').split(' ').join('-')}.webp`;

const PRODUCTS = [
  {
    id: 'masculina', name: 'Camiseta Masculina', line: 'classic', fit: 'Regular', base: 'branco',
    desc: 'O corte clássico, de modelagem regular. A base neutra perfeita para receber a sua estampa em serigrafia.',
    colors: ['branco','azul royal','marinho','canário','cinza chumbo','cinza mescla','ouro','laranja','preto','pink','rosa bebê','roxo','turquesa','vermelho','verde bandeira','verde musgo','vinho'],
    photos: CLASSIC_PHOTOS, photoDir: 'classic', backPhotos: ['branco','preto'],
    sizes: SIZES_REGULAR,
  },
  {
    id: 'feminina', name: 'Camiseta Feminina', line: 'classic', fit: 'Regular', base: 'branco',
    desc: 'Modelagem regular feminina, com caimento ajustado ao corpo. Disponível na paleta completa de cores.',
    colors: ['branco','canário','ouro','laranja','vermelho','vinho','pink','rosa bebê','roxo','azul royal','marinho','turquesa','verde bandeira','verde musgo','cinza mescla','cinza chumbo','preto'],
    photos: CLASSIC_PHOTOS, photoDir: 'classic', backPhotos: ['branco','preto'],
    sizes: { cols: ['P','M','G','GG'], larg: ['38–42','41–45','43–47','45–49'], comp: ['57–61','60–64','62–66','63–67'] },
  },
  {
    id: 'longsleeve', name: 'Longsleeve Masculina', line: 'classic', fit: 'Regular · manga longa', base: 'preto',
    desc: 'A camiseta de manga longa da linha classic. Modelagem regular, nas três cores essenciais.',
    colors: ['branco','cinza mescla','preto'],
    backPhotos: ['preto'],
    sizes: SIZES_REGULAR,
  },
  {
    id: 'oversized', name: 'Camiseta Oversized', line: 'premium', fit: 'Oversized', base: 'branco',
    desc: 'A linha premium: modelagem ampla, ombro caído e comprimento maior. Feita para estampas que pedem presença.',
    colors: ['branco','azul royal','marinho','cinza chumbo','roxo','vermelho','preto'],
    photos: ['branco','preto'],  // assets/oversized/{cor}.webp; as demais cores são recoloridas
    backPhotos: ['branco','preto'],  // costas: assets/{pasta}/costas/{cor}.webp
    sizes: { cols: ['P','M','G','GG','XGG'], larg: ['57–59','59–62','62–65','65–68','68–71'], comp: ['73–76','76–79','79–82','82–85','85–88'] },
  },
];

const LINES = {
  classic: { label: 'Classic', sub: 'Regular' },
  premium: { label: 'Premium', sub: 'Oversized' },
};

function contactUrl(text) {
  return WHATSAPP
    ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`
    : `https://ig.me/m/${INSTAGRAM}`;
}

const loadImg = (src) => new Promise((ok, err) => {
  const i = new Image(); i.onload = () => ok(i); i.onerror = err; i.src = src;
});

const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** borra um mapa (box blur separável, 2 passes ≈ gaussiano) */
function blurMap(src, w, h, r) {
  const a = Float32Array.from(src), t = new Float32Array(src.length);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) {               // horizontal
      let acc = 0; const o = y * w;
      for (let x = -r; x <= r; x++) acc += a[o + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        t[o + x] = acc / (2 * r + 1);
        acc += a[o + Math.min(w - 1, x + r + 1)] - a[o + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {               // vertical
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += t[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        a[y * w + x] = acc / (2 * r + 1);
        acc += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x];
      }
    }
  }
  return a;
}

/**
 * Mapas de uma foto da peça, usados para a tinta parecer impressa no tecido:
 *  mask  = onde há tecido (alpha suave)
 *  light = luz larga relativa (dobras): <1 sombra, >1 realce
 *  tex   = textura fina da malha (diferença entre a foto e a luz larga)
 *  dx/dy = deslocamento da estampa pelas dobras (inclinação do relevo)
 */
function fabricMaps(img, w, h) {
  const d = img.data, n = w * h;
  const mask = new Uint8ClampedArray(n), lum = new Float32Array(n), m = new Float32Array(n);
  const vals = [];
  for (let j = 0, i = 0; j < n; j++, i += 4) {
    mask[j] = d[i + 3]; m[j] = d[i + 3] / 255;
    lum[j] = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) * m[j];
    if (d[i + 3] > 200 && (j % 7) === 0) vals.push(lum[j]);
  }
  vals.sort((a, b) => a - b);
  const med = Math.max(8, vals[vals.length >> 1] || 128);
  const r = Math.max(3, Math.round(w * 0.006));
  // borrado normalizado pela máscara: a borda transparente não escurece a luz
  const bl = blurMap(lum, w, h, r), bm = blurMap(m, w, h, r);
  const bl2 = blurMap(lum, w, h, 1), bm2 = blurMap(m, w, h, 1);
  const light = new Float32Array(n), tex = new Float32Array(n);
  for (let j = 0; j < n; j++) {
    const L = bm[j] > 0.05 ? bl[j] / bm[j] : med;
    const F = bm2[j] > 0.05 ? bl2[j] / bm2[j] : L;
    light[j] = Math.min(1.6, Math.max(0.35, L / med));
    tex[j] = Math.max(-0.3, Math.min(0.3, (F - L) / med));
  }
  // relevo = só as dobras largas (bem borrado); a inclinação dele desloca a estampa
  // (escala para ~0,45% da largura no percentil 98)
  const R = r * 4, rb = blurMap(lum, w, h, R), rm = blurMap(m, w, h, R);
  const relief = new Float32Array(n);
  for (let j = 0; j < n; j++) relief[j] = rm[j] > 0.05 ? rb[j] / rm[j] / med : 1;
  const dx = new Float32Array(n), dy = new Float32Array(n), g = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const j = y * w + x;
    dx[j] = (relief[j + 1] - relief[j - 1]) / 2; dy[j] = (relief[j + w] - relief[j - w]) / 2;
    if (mask[j] > 200 && (j % 11) === 0) g.push(Math.hypot(dx[j], dy[j]));
  }
  g.sort((a, b) => a - b);
  const k = (w * 0.0045) / Math.max(1e-4, g[(g.length * 0.98) | 0] || 1e-4);
  const cap = w * 0.009;
  for (let j = 0; j < n; j++) { dx[j] = Math.max(-cap, Math.min(cap, dx[j] * k)); dy[j] = Math.max(-cap, Math.min(cap, dy[j] * k)); }
  return { mask, light, tex, dx, dy, med };
}

const lumOf = ([r, g, b]) => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * Carrega a foto recortada da peça e devolve um "Shirt"
 * capaz de pintar a peça em qualquer cor e aplicar uma estampa.
 */
async function loadShirt(p, view = 'front') {
  const back = view === 'back';
  // só a peça (sem modelo): a transparência da imagem é a máscara
  const photo = await loadImg(back ? photoUrl(p, p.base, 'back') : `assets/${p.id}-tee.webp`);
  const w = photo.naturalWidth, h = photo.naturalHeight;
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(photo, 0, 0); const src = x.getImageData(0, 0, w, h);
  const mask = new Uint8ClampedArray(w * h);
  const lum = new Float32Array(w * h);
  const vals = [];
  let x0 = w, y0 = h, x1 = 0, y1 = 0;
  for (let i = 0, j = 0; j < mask.length; i += 4, j++) {
    const d = src.data;
    mask[j] = d[i + 3] ? 255 : 0;
    lum[j] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (d[i + 3] > 128) {
      if ((j & 7) === 0) vals.push(lum[j]);
      const px = j % w, py = (j / w) | 0;
      if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
    }
  }
  vals.sort((a, b) => a - b);
  const lo = vals[(vals.length * 0.08) | 0], hi = vals[(vals.length * 0.98) | 0];
  // sombreamento normalizado 0..1 dentro da camiseta (para recolorir a peça)
  const shade = new Float32Array(w * h);
  // foto de peça escura: o ruído do preto vira mancha ao clarear → suaviza e reduz o contraste
  const dark = vals[vals.length >> 1] < 80;
  const L = dark ? blurMap(lum, w, h, 2) : lum;
  for (let j = 0; j < shade.length; j++) {
    const s = (L[j] - lo) / (hi - lo);
    shade[j] = Math.min(1.1, Math.max(-0.8, dark ? 0.62 + (s - 0.55) * 0.55 : s));
  }

  // fotos reais por cor (mesmo enquadramento da base): usadas no lugar da recoloração
  const real = {};
  await Promise.all(((back ? p.backPhotos : p.photos) || []).filter((c) => c !== p.base).map(async (c) => {
    const im = await loadImg(photoUrl(p, c, view));
    x.clearRect(0, 0, w, h); x.drawImage(im, 0, 0, w, h); real[c] = x.getImageData(0, 0, w, h);
  }));
  // mapas do tecido por foto (cada cor fotografada tem as próprias dobras), calculados só quando há estampa
  const maps = {};
  const mapsFor = (color) => {
    const key = real[color] ? color : '';
    return maps[key] || (maps[key] = fabricMaps(real[color] || src, w, h));
  };

  return {
    w, h, src, mask, shade, box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, base: p.base,
    /** desenha a peça na cor `color` com a estampa `art` (canvas) em `place` {cx,cy,width} */
    render(ctx, color, art, place) {
      const out = new ImageData(new Uint8ClampedArray((real[color] || src).data), w, h);
      const o = out.data;
      const recolor = color !== this.base && !real[color];
      if (recolor) {
        const [r, g, b] = hexRgb(COLORS[color]);
        const cl = lumOf([r, g, b]) / 255;
        for (let j = 0, i = 0; j < mask.length; j++, i += 4) {
          const m = mask[j]; if (!m) continue;
          const s = shade[j];
          const k = 0.68 + 0.36 * s;            // multiplica preservando o tecido
          const add = (s - 0.62) * 46 * (1 - cl); // devolve volume em cores escuras
          const a = m / 255;
          o[i] = o[i] * (1 - a) + Math.min(255, r * k + add) * a;
          o[i + 1] = o[i + 1] * (1 - a) + Math.min(255, g * k + add) * a;
          o[i + 2] = o[i + 2] * (1 - a) + Math.min(255, b * k + add) * a;
        }
      }
      if (art) this.printArt(o, color, art, place, recolor);
      ctx.canvas.width = w; ctx.canvas.height = h;
      ctx.putImageData(out, 0, 0);
    },
    /**
     * Tinta de serigrafia sobre o tecido: a arte é deslocada pelas dobras (displacement),
     * recebe a luz/sombra larga da foto e a textura fina da malha, com tinta quase opaca.
     */
    printArt(o, color, art, place, recolor) {
      const M = mapsFor(color);
      // em peça escura as variações relativas de luz da foto são exageradas → comprime
      const gl = recolor ? lumOf(hexRgb(COLORS[color])) : M.med;
      const kl = 0.35 + 0.65 * Math.min(1, gl / 220);
      const aw = place.width, ah = aw * art.height / art.width;
      const pad = Math.ceil(w * 0.012);
      const lw = Math.ceil(aw) + pad * 2, lh = Math.ceil(ah) + pad * 2;
      const lx = Math.round(place.cx - aw / 2) - pad, ly = Math.round(place.cy - ah / 2) - pad;
      const layer = Object.assign(document.createElement('canvas'), { width: lw, height: lh });
      const lc = layer.getContext('2d', { willReadFrequently: true });
      lc.imageSmoothingQuality = 'high';
      lc.drawImage(art, pad, pad, aw, ah);
      const A = lc.getImageData(0, 0, lw, lh).data;
      const X0 = Math.max(0, lx), Y0 = Math.max(0, ly), X1 = Math.min(w, lx + lw), Y1 = Math.min(h, ly + lh);
      for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) {
        const j = Y * w + X;
        const mk = M.mask[j]; if (!mk) continue;
        // amostra bilinear da arte no ponto deslocado pelas dobras
        const sx = X - lx - M.dx[j], sy = Y - ly - M.dy[j];
        const fx = Math.floor(sx), fy = Math.floor(sy);
        if (fx < 0 || fy < 0 || fx >= lw - 1 || fy >= lh - 1) continue;
        const tx = sx - fx, ty = sy - fy;
        const q00 = (fy * lw + fx) * 4, q10 = q00 + 4, q01 = q00 + lw * 4, q11 = q01 + 4;
        const w00 = (1 - tx) * (1 - ty) * A[q00 + 3], w10 = tx * (1 - ty) * A[q10 + 3];
        const w01 = (1 - tx) * ty * A[q01 + 3], w11 = tx * ty * A[q11 + 3];
        const aa = w00 + w10 + w01 + w11;
        if (aa < 1) continue;
        const a = (aa / 255) * (mk / 255) * 0.95;             // tinta quase opaca, só sobre o tecido
        const L = 1 + (M.light[j] - 1) * kl;                   // luz larga (dobras)
        const T = M.tex[j] * 255 * 0.35;                       // textura da malha aparecendo na tinta
        const i = j * 4;
        for (let ch = 0; ch < 3; ch++) {
          let v = (A[q00 + ch] * w00 + A[q10 + ch] * w10 + A[q01 + ch] * w01 + A[q11 + ch] * w11) / aa;
          v = L < 1 ? v * L : v + (255 - v) * (L - 1) * 0.6;   // sombra multiplica, realce clareia
          v = Math.max(0, Math.min(255, v + T));
          o[i + ch] = o[i + ch] * (1 - a) + v * a;
        }
      }
    },
    /** posição padrão: centro do peito */
    /** posições prontas: frente = centro do peito / peito esquerdo; costas = centro das costas / nuca */
    defaultPlace(kind = 'center') {
      const b = this.box;
      if (back) return kind === 'alt'
        ? { cx: b.x + b.w * 0.5, cy: b.y + b.h * 0.13, width: b.w * 0.13 }
        : { cx: b.x + b.w * 0.5, cy: b.y + b.h * 0.36, width: b.w * 0.36 };
      return kind === 'alt'
        ? { cx: b.x + b.w * 0.615, cy: b.y + b.h * 0.29, width: b.w * 0.15 }
        : { cx: b.x + b.w * 0.5, cy: b.y + b.h * 0.34, width: b.w * 0.3 };
    },
  };
}

// Barra de progresso de rolagem (as cores da marca, discretas no topo)
document.addEventListener('scroll', () => {
  const el = document.documentElement;
  el.style.setProperty('--scroll', (el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)).toFixed(4));
}, { passive: true });
