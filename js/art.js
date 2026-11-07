'use strict';
/* art_b.js - procedural pixel art for the night-market game (Canvas 2D only). Exposes global ART. */
const ART = (() => {
  const PI = Math.PI, sin = Math.sin, cos = Math.cos, abs = Math.abs, rnd = Math.round, fl = Math.floor;
  const R = (g, x, y, w, h, c) => { if (c) g.fillStyle = c; g.fillRect(rnd(x), rnd(y), rnd(w) || (w > 0 ? 1 : 0), rnd(h) || (h > 0 ? 1 : 0)); };
  const shCache = {};
  function sh(c, k) { // darken (k<1) / lighten (k>1) a #rrggbb colour
    const key = c + k; if (shCache[key]) return shCache[key];
    const n = parseInt(String(c).slice(1, 7), 16) || 0;
    const f = v => Math.max(0, Math.min(255, rnd(v * k)));
    return shCache[key] = '#' + [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => f(v).toString(16).padStart(2, '0')).join('');
  }
  const hash = n => { const x = sin(n * 127.1 + 311.7) * 43758.5453; return x - fl(x); };
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
  function line(g, x0, y0, x1, y1, w, c) { // pixel line with square brush
    x0 = rnd(x0); y0 = rnd(y0); x1 = rnd(x1); y1 = rnd(y1);
    const dx = abs(x1 - x0), dy = abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx - dy;
    g.fillStyle = c;
    for (let i = 0; i < 400; i++) { g.fillRect(x0, y0, w, w); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 > -dy) { e -= dy; x0 += sx; } if (e2 < dx) { e += dx; y0 += sy; } }
  }
  function bowl(g, cx, top, hw, h, c, l) { // lower half-ellipse bowl
    for (let i = 0; i < h; i++) { const w = rnd(hw * Math.sqrt(1 - (i / h) * (i / h))); R(g, cx - w, top + i, w * 2, 1, c); R(g, cx - w, top + i, Math.min(2, w), 1, l); }
  }
  function star4(g, x, y, c) { R(g, x, y - 1, 1, 3, c); R(g, x - 1, y, 3, 1, c); }

  /* ------------------------------------------------------------------ people */
  const HATC = { cap: '#C0504A', helmet: '#F2F2F2', peci: '#1E1E26', captain: '#EDEDF2', conical: '#D8C18A', band: '#E2574C', beret: '#7C2E3A' };
  function person(g, cx, by, look, o) {
    o = o || {}; look = look || {};
    const t = o.t || 0, kid = !!look.kid, ghost = !!look.ghost, acc = look.acc || [], seated = !!o.seated, walk = !!o.walk && !seated;
    const step = walk ? fl(t * 8) % 2 : 0;
    let bob = walk ? (step ? -1 : 0) : 0;
    if (ghost) bob = rnd(sin(t * 2.2) * 2) - 3;
    const legH = kid ? 4 : 7, torH = kid ? 5 : 8, hh = kid ? 7 : 6, hw = kid ? 8 : 6, tw = kid ? 6 : 8, tx = -tw / 2;
    const torTop = by - legH - torH + bob, ht = torTop - hh, hx = -hw / 2;
    const skin = look.skin || '#F1C9A5', top = look.top || '#888', bot = look.bot || '#444', hair = look.hair || '#222';
    g.save();
    g.globalAlpha = (o.alpha == null ? 1 : o.alpha) * (ghost ? 0.6 : 1);
    g.translate(rnd(cx), 0); if (o.flip) g.scale(-1, 1);
    if (look.hs === 'long' || look.hs === 'ghost') R(g, hx - 1, ht, hw + 2, hh + 4, hair); // back hair
    if (acc.includes('backpack')) R(g, tx - 3, torTop + 1, 3, torH - 1, '#8a5a34');
    // legs / robe
    if (ghost) {
      for (let y = torTop; y < by; y++) { const w = tw + rnd((y - torTop) * 0.6); R(g, -w / 2, y, w, 1, (y - torTop) % 3 === 2 ? sh(top, .93) : top); }
      for (let x = -6; x < 6; x += 2) { const d = rnd(sin(t * 3 + x) * 1.5 + 1); R(g, x, by - 1, 2, d, top); }
    } else if (!seated) {
      const a = step ? legH - 2 : legH, b = step ? legH : legH - 2;
      R(g, -3, by - a, 3, a, bot); R(g, 0, by - b, 3, b, sh(bot, .85));
      R(g, -3, by - 1, 3, 1, '#1b1822'); R(g, 0, by - 1, 3, 1, '#1b1822');
    }
    // torso
    if (!ghost) { R(g, tx, torTop, tw, torH, top); R(g, tx + tw - 1, torTop, 1, torH - 1, sh(top, .82)); R(g, tx, torTop + torH - 1, tw, 1, sh(top, .65)); }
    if (acc.includes('apron')) { R(g, -3, torTop + 2, 6, torH + (seated ? -2 : legH - 3), '#EDE6D3'); R(g, -3, torTop + 2, 6, 1, '#cfc6b0'); }
    if (acc.includes('tie')) { R(g, 0, torTop, 1, 4, '#E2574C'); R(g, -1, torTop, 3, 1, '#E2574C'); }
    if (acc.includes('chain')) { R(g, -2, torTop + 1, 4, 1, '#E8C547'); R(g, 0, torTop + 2, 1, 1, '#E8C547'); }
    // arms
    const sw = walk ? (step ? 1 : -1) : 0, armH = torH - 1;
    R(g, tx - 2, torTop + 1 + sw, 2, armH, top); R(g, tx - 2, torTop + armH + sw, 2, 1, skin);
    if (o.eat && fl(t * 3) % 2 === 0) { R(g, tx + tw, torTop + 2, 2, 3, top); R(g, tx + tw - 1, ht + hh - 2, 2, 2, skin); }
    else { R(g, tx + tw, torTop + 1 - sw, 2, armH, top); R(g, tx + tw, torTop + armH - sw, 2, 1, skin); }
    if (acc.includes('tattoo')) { R(g, tx - 2, torTop + 3 + sw, 2, 1, '#3E8E7A'); R(g, tx + tw, torTop + 3 - sw, 2, 1, '#3E8E7A'); }
    // head
    R(g, hx, ht, hw, hh, skin); R(g, hx + hw - 1, ht + 1, 1, hh - 1, sh(skin, .9));
    R(g, -2, ht + hh - 3, 1, ghost ? 2 : 1, '#1b1822'); R(g, 1, ht + hh - 3, 1, ghost ? 2 : 1, '#1b1822');
    if (kid) { R(g, -3, ht + hh - 2, 1, 1, '#E89A8A'); R(g, 2, ht + hh - 2, 1, 1, '#E89A8A'); }
    // hair
    const hs = look.hs || 'short', h = hair;
    const cap = () => { R(g, hx, ht - 1, hw, 2, h); R(g, hx, ht + 1, 1, 2, h); R(g, hx + hw - 1, ht + 1, 1, 2, h); };
    switch (hs) {
      case 'short': cap(); break;
      case 'long': R(g, hx, ht - 1, hw, 2, h); R(g, hx - 1, ht, 1, hh + 4, h); R(g, hx + hw, ht, 1, hh + 4, h); break;
      case 'bun': cap(); R(g, -2, ht - 3, 4, 3, h); R(g, -1, ht - 3, 2, 1, sh(h, 1.3)); break;
      case 'bald': R(g, hx, ht + 1, 1, 2, h); R(g, hx + hw - 1, ht + 1, 1, 2, h); R(g, -1, ht, 2, 1, sh(skin, 1.12)); break;
      case 'spiky': cap(); R(g, hx, ht - 3, 2, 2, h); R(g, -1, ht - 4, 2, 3, h); R(g, hx + hw - 2, ht - 3, 2, 2, h); break;
      case 'pony': cap(); R(g, hx + hw, ht, 2, 2, h); R(g, hx + hw + 1, ht + 2, 1, 4, h); break;
      case 'bob': R(g, hx - 1, ht - 1, hw + 2, 2, h); R(g, hx - 1, ht + 1, 2, hh - 1, h); R(g, hx + hw - 1, ht + 1, 2, hh - 1, h); break;
      case 'twin': cap(); R(g, hx - 2, ht + 1, 2, 5, h); R(g, hx + hw, ht + 1, 2, 5, h); R(g, hx - 2, ht + 1, 2, 1, '#E2574C'); R(g, hx + hw, ht + 1, 2, 1, '#E2574C'); break;
      case 'slick': R(g, hx, ht - 1, hw, 2, h); R(g, hx + 1, ht - 1, 2, 1, sh(h, 2.2)); R(g, hx, ht + 1, 1, 1, h); break;
      case 'ghost': R(g, hx - 1, ht - 1, hw + 2, 3, h); R(g, hx - 1, ht + 1, 3, hh + 6, h); R(g, hx + hw - 2, ht + 1, 3, hh + 6, h); R(g, -1, ht + 2, 2, 2, h); break;
    }
    // face accessories
    if (acc.includes('glasses')) { R(g, -3, ht + hh - 4, 3, 2, '#2a2634'); R(g, 0, ht + hh - 4, 3, 2, '#2a2634'); R(g, -2, ht + hh - 3, 1, 1, '#BFE3F5'); R(g, 1, ht + hh - 3, 1, 1, '#BFE3F5'); }
    if (acc.includes('sunglasses')) R(g, -3, ht + hh - 4, 6, 2, '#0c0c12');
    if (acc.includes('beard')) { R(g, hx, ht + hh - 2, hw, 2, h); R(g, -1, ht + hh, 2, 1, h); }
    if (acc.includes('mustache')) R(g, -2, ht + hh - 2, 4, 1, h);
    if (acc.includes('scarf')) { R(g, tx, torTop - 1, tw, 2, '#E2574C'); R(g, tx + 1, torTop + 1, 2, 3, '#E2574C'); }
    if (acc.includes('bow')) { R(g, hx + hw - 2, ht - 2, 3, 2, '#F27AA6'); R(g, hx + hw - 1, ht - 1, 1, 1, '#fff'); }
    if (acc.includes('flower')) { R(g, hx + hw - 3, ht, 3, 3, '#F7EFE0'); R(g, hx + hw - 2, ht + 1, 1, 1, '#F2A33A'); }
    // hats
    const hat = look.hat, hc = HATC[hat];
    switch (hat) {
      case 'cap': R(g, hx, ht - 2, hw, 3, hc); R(g, 1, ht + 1, 4, 1, sh(hc, .7)); break;
      case 'helmet': R(g, hx - 1, ht - 2, hw + 2, 4, hc); R(g, -1, ht - 2, 2, 2, '#C0504A'); R(g, hx - 1, ht + 1, hw + 2, 1, '#cfcfd8'); break;
      case 'peci': R(g, hx, ht - 3, hw, 4, hc); R(g, hx, ht, hw, 1, '#C9A43A'); break;
      case 'hijab': R(g, hx - 1, ht - 2, hw + 2, 3, top); R(g, hx - 1, ht, 2, hh + 3, top); R(g, hx + hw - 1, ht, 2, hh + 3, top); R(g, hx - 1, ht + hh + 1, hw + 2, 2, sh(top, .85)); break;
      case 'captain': R(g, hx - 1, ht - 3, hw + 2, 3, hc); R(g, hx - 1, ht, hw + 2, 1, '#1b1b24'); R(g, -1, ht - 2, 2, 1, '#E8C547'); break;
      case 'conical': R(g, -2, ht - 5, 4, 1, hc); R(g, -4, ht - 4, 8, 1, sh(hc, .9)); R(g, -6, ht - 3, 12, 1, hc); R(g, -8, ht - 2, 16, 1, sh(hc, .9)); R(g, -9, ht - 1, 18, 1, sh(hc, .8)); break;
      case 'band': R(g, hx, ht, hw, 1, hc); R(g, hx + hw, ht, 2, 2, hc); break;
      case 'beret': R(g, hx - 1, ht - 2, hw + 3, 2, hc); R(g, hx, ht - 3, hw, 1, hc); R(g, 0, ht - 4, 1, 1, hc); break;
    }
    // mood
    if (o.mood) {
      const my = ht - 14 + rnd(sin(t * 5) * 1.5);
      if (o.mood === 'wait') { R(g, -4, my, 8, 10, '#3a2a10'); R(g, -3, my + 1, 6, 8, '#F2D14A'); R(g, -1, my + 2, 2, 4, '#3a2a10'); R(g, -1, my + 7, 2, 1, '#3a2a10'); R(g, -1, my + 10, 2, 1, '#3a2a10'); }
      else if (o.mood === 'happy') { const hp = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...']; hp.forEach((r, j) => { for (let i = 0; i < 7; i++) if (r[i] === '#') R(g, i - 3, my + 2 + j, 1, 1, i < 2 && j < 2 ? '#FFB8D0' : '#F27AA6'); }); }
      else if (o.mood === 'angry') { const c = '#E2574C'; R(g, -4, my + 2, 3, 1, c); R(g, -4, my + 2, 1, 3, c); R(g, 1, my + 2, 3, 1, c); R(g, 3, my + 2, 1, 3, c); R(g, -4, my + 7, 3, 1, c); R(g, -4, my + 5, 1, 3, c); R(g, 1, my + 7, 3, 1, c); R(g, 3, my + 5, 1, 3, c); }
    }
    g.restore();
  }

  function portrait(canvas, look) {
    const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 24, 24);
    look = look || {}; const kid = !!look.kid, tall = look.hat === 'peci' || look.hat === 'conical' || look.hat === 'beret';
    g.save(); g.translate(12, 0); g.scale(3, 3);
    const k = { ...look, acc: (look.acc || []).filter(a => a !== 'backpack') };
    person(g, 0, (kid ? 17 : 22) + (tall ? 1 : 0) + (kid ? 1 : 0), k, { alpha: 1 });
    g.restore();
  }

  /* ------------------------------------------------------------------ seats */
  const TABLES = [
    [[165, 232]],
    [[110, 228], [220, 228]],
    [[80, 214], [180, 214], [150, 246]],
    [[80, 214], [190, 214], [110, 246], [220, 246]]
  ];
  const SEATS = TABLES.map(ts => ts.flatMap(([cx, by]) => [{ x: cx - 16, by, flip: false }, { x: cx + 16, by, flip: true }]));
  const ENTRY = { x: -14, by: 238 }, EXIT_X = 494;
  const MAP_SPOTS = { stall: { x: 240, y: 205 }, harbor: { x: 150, y: 205 }, market: { x: 215, y: 110 }, grocery: { x: 345, y: 85 }, workshop: { x: 410, y: 175 }, hospital: { x: 70, y: 90 }, casino: { x: 318, y: 165 }, bank: { x: 440, y: 98 } };

  /* ------------------------------------------------------------------ cooking close-up */
  function flames(g, x, y, w, k, t) {
    for (let i = 0; i < w; i += 3) {
      const h = (3 + (sin(t * 12 + i * 1.7) + 1) * 4 + hash(i) * 3) * k;
      R(g, x + i, y - h, 3, h, '#E2574C'); R(g, x + i, y - h * 0.65, 3, h * 0.65, '#F2A33A'); R(g, x + i + 1, y - h * 0.35, 1, h * 0.35, '#FFE98A');
    }
  }
  function puffs(g, x, y, t, n, col, spread, speed, H, big) {
    for (let i = 0; i < n; i++) {
      const ph = (t * speed + i / n) % 1, px = x + sin(i * 7 + t * 2) * spread * ph + (i % 3 - 1) * 3, sz = 2 + ph * (big || 4);
      g.globalAlpha = (1 - ph) * 0.7; R(g, px - sz / 2, y - ph * H, sz, sz, col);
    }
    g.globalAlpha = 1;
  }
  function sparkles(g, cx, cy, r, t, n) { for (let i = 0; i < n; i++) { const a = t * 2.2 + i * PI * 2 / n; star4(g, cx + cos(a) * r, cy + sin(a) * r * 0.6, i % 2 ? '#FFE98A' : '#fff'); } }
  function deco(g, lv, t, bx, by, bw, bh, hnd, C, Lc) {
    if (lv === 1) {
      [[.15, .3, 3], [.5, .6, 2], [.75, .25, 3], [.3, .75, 2], [.88, .65, 2]].forEach(([a, b, s]) => { R(g, bx + bw * a, by + bh * b, s, 2, '#7a3f22'); R(g, bx + bw * a + 1, by + bh * b, 1, 1, '#a65a30'); });
      R(g, bx + bw - 3, by + 1, 3, 3, sh(C, .55)); R(g, bx, by + bh - 3, 2, 2, sh(C, .55));
    }
    if (lv === 3) {
      [[2, 2], [bw - 4, 2], [2, bh - 4], [bw - 4, bh - 4]].forEach(([a, b]) => { R(g, bx + a, by + b, 2, 2, Lc); R(g, bx + a + 1, by + b + 1, 1, 1, sh(C, .6)); });
    }
    if (hnd && lv >= 3) for (let i = 0; i < hnd[2]; i += 3) R(g, hnd[0] + i, hnd[1], 1, hnd[3], lv === 5 ? '#8a6a10' : '#2e2216');
    if (lv === 4) {
      R(g, bx + 2, by + bh * .5, bw - 4, 1, sh(C, .62)); R(g, bx + 2, by + bh * .5 + 2, bw - 4, 1, sh(C, .75));
      for (let i = 4; i < bw - 4; i += 6) R(g, bx + i, by + bh * .5 - 1, 1, 1, Lc);
      const gx = bx + ((t * 30) % (bw + 24)) - 8; if (gx > bx && gx < bx + bw - 2) { g.globalAlpha = .55; R(g, gx, by + 1, 2, bh - 2, '#fff'); g.globalAlpha = 1; }
    }
    if (lv === 5) {
      R(g, bx, by, bw, 2, '#FFE98A'); R(g, bx, by + bh - 2, bw, 1, '#A07A10');
      for (let i = 3; i < bw - 3; i += 6) { R(g, bx + i, by + bh * .5, 2, 2, '#FFE98A'); R(g, bx + i + 2, by + bh * .5 + 2, 1, 1, '#A07A10'); }
      sparkles(g, bx + bw / 2, by + bh / 2, Math.max(bw, bh) * .75, t, 3);
    }
  }
  const WOOD = '#6b4a30';
  function drawTool(g, m, lv, t, s, tool) {
    s = s || {}; lv = Math.max(1, Math.min(5, lv | 0 || 1));
    const T = TOOL_TIERS[lv - 1], C = T.c, Lc = T.l, cx = 80;
    const heat = s.phase === 'heat', warm = s.phase === 'warm', k = tool ? 0 : (heat ? 1 : warm ? .55 : s.phase === 'done' ? .2 : .15);
    const pos = s.pos || 0;
    const food = (x, y) => { if (!s.food || tool) return; g.font = '16px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(s.food, rnd(x), rnd(y)); };
    if (m === 'wok') {
      const dy = heat ? rnd(-abs(sin(t * 5)) * 4) : 0, top = 40 + dy;
      if (!tool) { R(g, cx - 16, 62, 32, 4, '#2a2a34'); flames(g, cx - 14, 62, 28, k, t); }
      R(g, cx + 30, top + 1, 26, 3, WOOD); R(g, cx + 30, top + 1, 26, 1, sh(WOOD, 1.3));
      bowl(g, cx, top, 31, 18, C, Lc); R(g, cx - 32, top - 1, 64, 2, Lc);
      R(g, cx - 24, top + 4, 48, 3, sh(C, .6)); // interior shadow
      deco(g, lv, t, cx - 22, top + 8, 44, 8, [cx + 30, top + 1, 26, 3], C, Lc);
      if (heat && !tool) for (let i = 0; i < 6; i++) { const ph = (t * 1.6 + i / 6) % 1; R(g, cx - 18 + i * 7, top - sin(ph * PI) * 28, 2, 2, ['#E2574C', '#F2A33A', '#4FC1B0', '#F7EFE0', '#8FD06A', '#E2574C'][i]); }
      food(cx, heat ? top - 6 - abs(sin(t * 5)) * 10 : top - 4);
    } else if (m === 'pan') {
      const top = 52;
      if (!tool) { R(g, cx - 16, 64, 32, 4, '#2a2a34'); flames(g, cx - 14, 64, 28, k * .8, t); }
      R(g, cx - 66 + 40, top, 24, 3, WOOD); R(g, cx - 66 + 40, top, 24, 1, sh(WOOD, 1.3));
      bowl(g, cx, top, 34, 9, C, Lc); R(g, cx - 35, top - 1, 70, 2, Lc);
      const stops = ['#EADFB4', '#E0B93C', '#8E5A26', '#17120f'], u = Math.min(.999, pos / 100) * 3, i0 = fl(u), f = u - i0;
      const mix = (a, b, x) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); const ch = sft => rnd(((A >> sft) & 255) * (1 - x) + ((B >> sft) & 255) * x); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
      R(g, cx - 28, top, 56, 3, '#14100e'); R(g, cx - 22, top - 4, 44, 5, mix(stops[i0], stops[Math.min(3, i0 + 1)], f)); R(g, cx - 18, top - 4, 12, 1, 'rgba(255,255,255,.25)');
      deco(g, lv, t, cx - 26, top + 3, 52, 5, [cx - 26, top, 24, 3], C, Lc);
      if (!tool && (heat || warm)) for (let i = 0; i < 8; i++) { const ph = (t * 3 + i * .37) % 1; R(g, cx - 28 + i * 8 + sin(i) * 3, top - 6 - sin(ph * PI) * 16, 1, 2, '#F2C94C'); }
      food(cx, top - 14);
    } else if (m === 'pot') {
      if (!tool) { R(g, cx - 18, 66, 36, 4, '#2a2a34'); flames(g, cx - 16, 66, 32, k * .7, t); }
      R(g, cx - 22, 34, 44, 32, C); R(g, cx - 22, 34, 4, 32, Lc); R(g, cx + 18, 34, 4, 32, sh(C, .75)); R(g, cx - 24, 33, 48, 3, Lc);
      R(g, cx - 29, 40, 7, 4, sh(C, .8)); R(g, cx + 22, 40, 7, 4, sh(C, .8));
      R(g, cx - 20, 30, 40, 5, '#C98F3E'); R(g, cx - 20, 30, 40, 1, '#E8B060');
      deco(g, lv, t, cx - 20, 46, 40, 18, [cx - 29, 40, 7, 4], C, Lc);
      if (!tool) {
        for (let i = 0; i < 6; i++) { const ph = (t * 1.4 + i * .31) % 1; if (ph < .6 || heat) R(g, cx - 16 + i * 6.5, 30 + (ph > .8 ? -1 : 0), 3, 2, '#F2D79A'); }
        const lx = cx + cos(t * 3) * 9, ly = 29 + sin(t * 3) * 2; line(g, lx, ly, lx + 16, ly - 20, 2, '#8a6a45'); R(g, lx - 3, ly, 6, 4, '#B4BEC9');
        puffs(g, cx, 28, t, 6, '#E7EAF2', 10, .45 + k * .4, 26, 4);
      }
      food(cx - 8, 22);
    } else if (m === 'grill') {
      R(g, cx - 30, 64, 4, 8, sh(C, .6)); R(g, cx + 26, 64, 4, 8, sh(C, .6));
      R(g, cx - 34, 46, 68, 18, C); R(g, cx - 34, 46, 68, 2, Lc); R(g, cx - 34, 62, 68, 2, sh(C, .6));
      R(g, cx - 31, 48, 62, 11, '#2b1a16');
      for (let i = 0; i < 20; i++) { const v = sin(t * 4 + i * 1.7) * .5 + .5, a = tool ? .5 : (.35 + k * .65) * v; R(g, cx - 30 + i * 3, 50 + (i % 3) * 3, 3, 3, a > .75 ? '#FFE98A' : a > .5 ? '#F2A33A' : a > .28 ? '#E2574C' : '#6a2a22'); }
      R(g, cx - 33, 44, 66, 2, '#2a2a34'); for (let i = 0; i < 17; i++) R(g, cx - 32 + i * 4, 44, 1, 3, '#555a6a');
      deco(g, lv, t, cx - 34, 56, 68, 8, null, C, Lc);
      for (let j = 0; j < 3; j++) { const ox = cx - 28 + j * 22, oy = 38 + (heat ? rnd(sin(t * 2 + j) * 1) : 0); line(g, ox, oy, ox + 28, oy + 3, 1, '#c9b48a'); for (let b = 0; b < 3; b++) R(g, ox + 6 + b * 6, oy + 1, 5, 4, b === 1 ? '#8E5A26' : '#B8692E'); }
      if (!tool) puffs(g, cx, 36, t, 7, '#8d8a99', 18, .35 + k * .4, 30, 5);
      food(cx, 28);
    } else if (m === 'fryer') {
      const dip = heat ? 10 + rnd(sin(t * 3) * 2) : warm ? 4 : 0;
      R(g, cx - 28, 46, 56, 8, '#E0A52A'); R(g, cx - 28, 46, 56, 1, '#F2C94C');
      for (let i = 0; i < 4; i++) R(g, cx - 24 + ((t * 14 + i * 14) % 50), 48 + (i % 2) * 2, 5, 1, '#F7DE7A');
      if (!tool) for (let i = 0; i < 16; i++) { const ph = (t * 1.5 + i * .23) % 1; R(g, cx - 26 + (i * 37 % 52), 52 - ph * 7, (i % 3 ? 1 : 2), (i % 3 ? 1 : 2), '#FFF1B0'); }
      const by0 = 20 + dip; R(g, cx - 11, by0, 22, 18, '#2a2a34'); for (let i = 0; i < 6; i++) { R(g, cx - 10 + i * 4, by0 + 1, 1, 16, '#B4BEC9'); } for (let j = 0; j < 5; j++) R(g, cx - 10, by0 + 2 + j * 4, 20, 1, '#8d96a3');
      R(g, cx + 10, by0 + 2, 28, 3, WOOD); R(g, cx + 10, by0 + 2, 28, 1, sh(WOOD, 1.3));
      R(g, cx - 30, 52, 60, 18, C); R(g, cx - 30, 52, 60, 2, Lc); R(g, cx - 30, 68, 60, 2, sh(C, .6)); R(g, cx + 30, 56, 9, 3, sh(C, .8));
      deco(g, lv, t, cx - 30, 54, 60, 14, [cx + 10, by0 + 2, 28, 3], C, Lc);
      if (!tool) puffs(g, cx, 44, t, 4, '#F7DE7A', 14, .5, 14, 3);
      food(cx, by0 + 8);
    } else if (m === 'steamer') {
      const rat = heat ? rnd(sin(t * 34) * 1) : 0;
      R(g, cx - 25, 56, 50, 13, C); R(g, cx - 25, 56, 50, 2, Lc); R(g, cx - 25, 67, 50, 2, sh(C, .6)); R(g, cx - 30, 59, 6, 3, sh(C, .8)); R(g, cx + 25, 59, 6, 3, sh(C, .8));
      if (!tool) { R(g, cx - 17, 70, 34, 3, '#2a2a34'); flames(g, cx - 15, 73, 30, k * .6, t); }
      for (let i = 0; i < 3; i++) {
        const y = 44 - i * 12, dx = i === 2 ? rat : 0; R(g, cx - 22 + dx, y, 44, 12, '#C99A4B'); R(g, cx - 22 + dx, y, 44, 1, '#E0B766');
        for (let x = 0; x < 44; x += 4) R(g, cx - 21 + x + dx, y + 2, 1, 8, '#9a6e2c'); R(g, cx - 23 + dx, y + 10, 46, 2, C); R(g, cx - 23 + dx, y + 10, 46, 1, Lc);
      }
      const ly = 10 + (heat ? rnd(sin(t * 34 + 1)) : 0); R(g, cx - 24 + rat, ly + 8, 48, 3, '#B07F36'); R(g, cx - 18 + rat, ly + 5, 36, 3, '#C99A4B'); R(g, cx - 10 + rat, ly + 2, 20, 3, '#D5A857'); R(g, cx - 2 + rat, ly - 1, 4, 3, C);
      deco(g, lv, t, cx - 23, 56, 46, 12, null, C, Lc);
      if (!tool) { puffs(g, cx - 24, 30, t, 6, '#F0F3F8', 8, .4 + k * .5, 34, 8); puffs(g, cx + 24, 30, t + .3, 6, '#F0F3F8', 8, .4 + k * .5, 34, 8); if (heat) puffs(g, cx, 8, t, 5, '#fff', 10, .8, 26, 9); }
      food(cx, ly - 8);
    }
    if (!tool && s.phase === 'done') sparkles(g, cx, 36, 36, t, 4);
  }
  function cook(g, method, lv, t, s) {
    s = s || {}; t = t || 0; g.save(); g.imageSmoothingEnabled = false;
    R(g, 0, 0, 160, 90, '#1a1626');
    for (let y = 0; y < 70; y += 8) for (let x = (y / 8 % 2) * 10; x < 160; x += 20) R(g, x, y, 19, 7, ((x + y) / 4 | 0) % 3 ? '#211c30' : '#241f35');
    R(g, 0, 70, 160, 20, '#2e2a45'); R(g, 0, 70, 160, 2, '#3A3F5C'); R(g, 0, 72, 160, 1, '#241f38');
    const glow = s.phase === 'heat' ? .16 : s.phase === 'warm' ? .09 : .04; g.globalAlpha = glow + sin(t * 9) * .02; R(g, 20, 30, 120, 40, '#F2A33A'); g.globalAlpha = 1;
    drawTool(g, method, lv, t, s, false);
    g.restore();
  }
  const iconCache = {}, iconCv = {};
  function iconCanvas(m, lv) {
    const key = m + lv; if (iconCv[key]) return iconCv[key];
    const [big, bg] = mk(160, 90); drawTool(bg, m, lv, 0.4, { phase: 'idle' }, true);
    const [c, g] = mk(32, 32); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(big, 30, 4, 100, 74, 1, 5, 30, 22);
    return iconCv[key] = c;
  }
  function toolIcon(m, lv) { const key = m + lv; return iconCache[key] || (iconCache[key] = iconCanvas(m, lv).toDataURL('image/png')); }

  /* ------------------------------------------------------------------ scene */
  const wireY = x => 8 + rnd(2 * sin(x * 0.04));
  const LANT = i => 20 + i * 31.4;
  function lantern(g, x, y, lit, col, big) {
    const w = big ? 13 : 9, h = big ? 15 : 9, x0 = rnd(x - w / 2);
    R(g, x, y - 3, 1, 3, '#15182B');
    R(g, x0 + 1, y, w - 2, 2, '#2a1f1a');
    const body = lit ? col : '#3A3F5C';
    R(g, x0, y + 2, w, h, body); R(g, x0, y + 2, 2, h, lit ? sh(col, .75) : '#2E2A45'); R(g, x0 + w - 2, y + 2, 2, h, lit ? sh(col, .8) : '#2E2A45');
    if (lit) { R(g, x0 + 3, y + 4, w - 6, h - 4, sh(col, 1.25)); R(g, x0 + w / 2 - 1, y + 4, 2, h - 4, '#FFE5A8'); }
    for (let i = 1; i < 3; i++) R(g, x0, y + 2 + rnd(h * i / 3), w, 1, lit ? sh(col, .6) : '#262339');
    R(g, x0 + 1, y + h + 2, w - 2, 2, '#2a1f1a'); R(g, x, y + h + 4, 1, 3, lit ? '#E2574C' : '#3A3F5C');
  }
  function glowAt(g, x, y, r, a, col) { g.fillStyle = col || '#F2A33A'; for (let i = 3; i >= 1; i--) { g.globalAlpha = a / 3; g.beginPath(); g.arc(x, y, r * i / 3, 0, PI * 2); g.fill(); } g.globalAlpha = 1; }
  function bgPaint(g, lv, lit) {
    // sky bands with dithered seams
    [['#15182B', 0], ['#191d33', 44], ['#1e2238', 78], ['#22263D', 104], ['#2E2A45', 120]].forEach(([c, y], i, a) => { R(g, 0, y, 480, (a[i + 1] ? a[i + 1][1] : 130) - y, c); if (i) for (let x = (i % 2); x < 480; x += 2) R(g, x, y - 1, 1, 1, c); });
    for (let i = 0; i < 40; i++) R(g, hash(i) * 480, hash(i + 50) * 100, 1, 1, '#4a5078');
    // moon
    glowAt(g, 372, 40, 26, .1, '#F7EFE0');
    for (let y = -11; y <= 11; y++) { const w = rnd(Math.sqrt(121 - y * y)); R(g, 372 - w, 40 + y, w * 2, 1, '#F7EFE0'); R(g, 372 + w - 3, 40 + y, 3, 1, w > 3 ? '#E3D8C0' : '#F7EFE0'); }
    R(g, 366, 36, 3, 2, '#E3D8C0'); R(g, 374, 45, 4, 2, '#E3D8C0'); R(g, 369, 31, 2, 2, '#E3D8C0');
    // sea + harbour silhouettes
    R(g, 0, 124, 480, 52, '#1B2038'); R(g, 0, 124, 480, 1, '#3A3F5C'); R(g, 0, 150, 480, 26, '#171B31');
    const sil = '#101322';
    [[40, 86], [196, 94], [270, 100]].forEach(([x, y]) => { R(g, x, y, 3, 124 - y, sil); R(g, x + 14, y + 8, 3, 116 - y, sil); R(g, x - 6, y, 30, 4, sil); R(g, x + 18, y, 14, 3, sil); R(g, x + 22, y, 1, 24, sil); R(g, x, y + 4, 17, 1, sil); });
    for (let i = 0; i < 9; i++) { R(g, 90 + i * 9, 114 + (i % 2) * 5, 8, 10 - (i % 2) * 5, i % 3 ? sil : '#14172a'); }
    R(g, 118, 108, 80, 16, sil); R(g, 130, 100, 30, 8, sil); R(g, 170, 104, 6, 4, sil); R(g, 200, 110, 22, 14, sil);
    R(g, 300, 108, 70, 16, sil); R(g, 320, 100, 34, 8, sil);
    for (let i = 0; i < 7; i++) R(g, 125 + i * 10, 112 + (i % 2) * 2, 2, 2, '#5a4a38');
    R(g, 0, 172, 480, 4, '#0f1220'); for (let x = 12; x < 480; x += 60) { R(g, x, 166, 4, 8, '#2a2f4a'); R(g, x, 166, 4, 2, '#4a5078'); }
    // quay floor
    R(g, 0, 176, 480, 94, '#2E2A45');
    [[178, 14], [192, 18], [210, 22], [232, 26], [258, 12]].forEach(([y, h], r) => { R(g, 0, y, 480, 1, '#3a3558'); for (let x = (r % 2) * 20; x < 480; x += 40 + r * 4) R(g, x, y + 1, 1, h - 1, '#262239'); });
    for (let i = 0; i < 60; i++) R(g, hash(i + 9) * 480, 180 + hash(i + 3) * 88, 2, 1, '#38335a');
    // stall by level
    const post = ['#5a4636', '#7a5638', '#9b2f2a', '#9b2f2a'][lv - 1], postS = sh(post, .7);
    [12, 296].forEach(x => { R(g, x, 30, lv === 4 ? 6 : 4, 148, post); R(g, x + (lv === 4 ? 4 : 3), 30, 1, 148, postS); });
    if (lv === 1) {
      for (let x = 8; x < 304; x++) { const top = 30 + rnd((x - 8) / 296 * 0) , end = 51 + rnd(3 * sin((x - 8) * .09) + hash(x) * 2); R(g, x, top, 1, end - top, '#5C6B73'); R(g, x, end - 2, 1, 2, '#3b474d'); }
      [[40, 36, 26, 11, '#7A5A3A'], [150, 38, 30, 10, '#3F5B66'], [230, 34, 22, 13, '#8a8f94']].forEach(([x, y, w, h, c]) => { R(g, x, y, w, h, c); for (let i = 0; i < w; i += 3) { R(g, x + i, y, 1, 1, '#2e2a45'); R(g, x + i, y + h - 1, 1, 1, '#2e2a45'); } });
      for (let x = 20; x < 296; x += 38) R(g, x, 31, 2, 2, '#9aa6ab');
      line(g, 12, 33, 8, 60, 1, '#c9b48a'); line(g, 300, 33, 304, 62, 1, '#c9b48a');
      R(g, 112, 58, 36, 9, '#8a6a45'); R(g, 148, 60, 36, 9, '#7d5e3c'); R(g, 112, 66, 36, 1, '#5a4030'); R(g, 148, 68, 36, 1, '#5a4030');
      R(g, 130, 52, 1, 6, '#c9b48a'); R(g, 168, 52, 1, 8, '#c9b48a'); R(g, 114, 60, 1, 1, '#2a2a34'); R(g, 181, 62, 1, 1, '#2a2a34');
      g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2b1d12'; g.fillText('月嬤', 130, 63); g.fillText('灶腳', 166, 65);
      R(g, 204, 52, 1, 8, '#15182B'); R(g, 203, 60, 3, 2, '#3a3a44');
    } else if (lv === 2) {
      R(g, 8, 28, 296, 4, '#5a3a24');
      for (let x = 8; x < 304; x += 10) { const c = (x / 10 | 0) % 2 ? '#F7EFE0' : '#E2574C'; R(g, x, 32, 10, 18, c); R(g, x + 1, 50, 8, 2, c); R(g, x + 3, 52, 4, 1, c); R(g, x, 32, 1, 18, sh(c, .85)); }
      R(g, 8, 32, 296, 2, 'rgba(0,0,0,.18)');
      R(g, 96, 58, 108, 13, '#9b6a3d'); R(g, 96, 58, 108, 2, '#b98350'); R(g, 96, 69, 108, 2, '#6d4526'); R(g, 99, 61, 1, 1, '#2a2a34'); R(g, 200, 61, 1, 1, '#2a2a34');
      g.font = 'bold 9px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#F7EFE0'; g.fillText('月嬤的灶腳', 150, 65);
    } else if (lv === 3) {
      for (let r = 0; r < 11; r++) { const y = 24 + r * 3, ins = (10 - r) * 3; R(g, 8 + ins, y, 296 - ins * 2, 3, '#33445a'); R(g, 8 + ins, y, 296 - ins * 2, 1, '#4d6480'); for (let x = 8 + ins + (r % 2) * 3; x < 304 - ins; x += 6) R(g, x, y + 1, 1, 2, '#243245'); }
      R(g, 38, 21, 236, 3, '#B8692E'); R(g, 38, 21, 236, 1, '#F0A35E'); R(g, 34, 18, 5, 5, '#B8692E'); R(g, 273, 18, 5, 5, '#B8692E');
      R(g, 2, 51, 12, 3, '#33445a'); R(g, 298, 51, 12, 3, '#33445a'); R(g, 0, 49, 4, 3, '#33445a'); R(g, 308, 49, 4, 3, '#33445a');
      R(g, 8, 57, 296, 6, '#7b2f2a'); R(g, 8, 57, 296, 1, '#a8443a'); for (let x = 14; x < 300; x += 12) R(g, x, 59, 3, 2, '#E8B93A');
      R(g, 22, 160, 12, 12, '#B8692E'); R(g, 20, 158, 16, 3, '#d98a4a'); for (let i = 0; i < 5; i++) { R(g, 18 + i * 4 + (i % 2) * 2, 142 + (i % 3) * 5, 5, 14, i % 2 ? '#3E8E6A' : '#5FB88A'); }
      R(g, 284, 160, 12, 12, '#B8692E'); R(g, 282, 158, 16, 3, '#d98a4a'); for (let i = 0; i < 4; i++) R(g, 284 + i * 4 - 3, 146 + (i % 2) * 5, 5, 13, i % 2 ? '#5FB88A' : '#3E8E6A');
    } else {
      R(g, 4, 138, 310, 40, '#3A3F5C'); R(g, 4, 138, 310, 2, '#555a7a'); // stone base
      for (let r = 0; r < 4; r++) { const y = 14 + r * 5, ins = (3 - r) * 8; R(g, 6 + ins, y, 300 - ins * 2, 5, '#7b2f2a'); R(g, 6 + ins, y, 300 - ins * 2, 1, '#E8B93A'); for (let x = 8 + ins; x < 304 - ins; x += 8) R(g, x, y + 2, 4, 2, '#9b3f35'); }
      R(g, 144, 6, 24, 8, '#E8B93A'); R(g, 148, 2, 16, 5, '#E8B93A'); R(g, 150, 0, 12, 3, '#B8862A');
      R(g, 0, 34, 312, 6, '#E8B93A'); R(g, 0, 34, 312, 1, '#FFE98A'); R(g, 0, 39, 312, 1, '#8a5a14');
      R(g, 8, 40, 296, 14, '#7b2f2a'); for (let x = 12; x < 300; x += 10) R(g, x, 44, 6, 6, '#9b3f35');
      R(g, 70, 58, 172, 24, '#E8B93A'); R(g, 72, 60, 168, 20, '#8a1f1f'); R(g, 70, 58, 172, 2, '#FFE98A'); R(g, 70, 80, 172, 2, '#8a5a14');
      [[72, 60], [236, 60], [72, 76], [236, 76]].forEach(([x, y]) => R(g, x, y, 4, 4, '#E8B93A'));
      g.font = 'bold 14px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#FFE98A'; g.fillText('月嬤的灶腳', 156, 70);
      R(g, 8, 28, 6, 6, '#E8B93A'); R(g, 298, 28, 6, 6, '#E8B93A');
    }
    // kitchen back wall + header
    R(g, 306, 88, 170, 90, '#2a2740'); for (let x = 306; x < 476; x += 12) R(g, x, 88, 1, 90, '#232037'); R(g, 306, 88, 170, 3, '#1a1830');
    for (let y = 150; y < 178; y += 7) for (let x = 306 + ((y / 7 | 0) % 2) * 6; x < 476; x += 12) R(g, x, y, 11, 6, '#3A3F5C');
    [110, 130].forEach((y, r) => { R(g, 316, y + 6, 74, 3, '#7a5638'); R(g, 316, y + 9, 74, 1, '#4a3424'); for (let i = 0; i < 6; i++) { const c = ['#4FC1B0', '#E2574C', '#F2A33A', '#F7EFE0', '#8a6a45', '#9b4fa8'][(i + r * 2) % 6], h = 7 + (i * 3 + r) % 4; R(g, 319 + i * 12, y + 6 - h, 8, h, c); R(g, 319 + i * 12, y + 6 - h, 8, 2, sh(c, .7)); } });
    R(g, 420, 96, 50, 2, '#15182B'); for (let i = 0; i < 4; i++) { R(g, 426 + i * 12, 98, 1, 6, '#15182B'); R(g, 424 + i * 12, 104, 5, 8 + (i % 2) * 4, '#B4BEC9'); }
    const kr = ['#6E6259', '#7a5638', '#33445a', '#9b2f2a'][lv - 1];
    R(g, 300, 56, 180, 14, kr); R(g, 300, 56, 180, 2, sh(kr, 1.35)); R(g, 300, 68, 180, 2, sh(kr, .65)); if (lv === 1) for (let x = 302; x < 480; x += 5) R(g, x, 58, 1, 10, sh(kr, .8)); if (lv === 4) for (let x = 306; x < 478; x += 12) R(g, x, 60, 6, 4, '#E8B93A');
    R(g, 302, 70, 6, 135, post); R(g, 474, 70, 6, 135, post);
    // lanterns string
    for (let x = 0; x < 480; x++) R(g, x, wireY(x), 1, 1, '#0c0e1a');
    for (let i = 0; i < 15; i++) { const x = LANT(i), on = i < lit; if (on) glowAt(g, x, wireY(x) + 11, 20, .1); lantern(g, x, wireY(x) + 3, on, i % 3 === 2 ? '#E2574C' : '#F2A33A', false); }
    if (lv >= 2) { lantern(g, 40, 74, true, '#E2574C', lv === 4); lantern(g, 262, 74, true, '#E2574C', lv === 4); glowAt(g, 40, 84, 26, .08, '#E2574C'); glowAt(g, 262, 84, 26, .08, '#E2574C'); }
    // warm floor pool under lanterns
    g.globalAlpha = 0.07; g.fillStyle = '#F2A33A'; g.fillRect(24, 196, 270, 60); g.fillRect(44, 204, 230, 44); g.globalAlpha = 1;
  }
  const bgCache = {};
  function bg(lv, sign, lit) {
    const key = lv + '|' + sign + '|' + lit; if (bgCache[key]) return bgCache[key];
    const keys = Object.keys(bgCache); if (keys.length > 24) delete bgCache[keys[0]];
    const [c, g] = mk(480, 270); bgPaint(g, lv, lit); return bgCache[key] = c;
  }
  function tableDraw(g, lv, cx, by, candle, t) {
    if (lv === 4) {
      R(g, cx - 16, by - 12, 32, 3, '#F7EFE0'); R(g, cx - 14, by - 9, 28, 8, '#F7EFE0'); R(g, cx - 14, by - 9, 28, 1, '#fff'); R(g, cx - 14, by - 3, 28, 2, '#E2574C');
      for (let x = cx - 14; x < cx + 14; x += 4) R(g, x, by - 1, 3, 2, '#F7EFE0'); R(g, cx - 16, by - 10, 1, 2, '#d8cfb8'); R(g, cx - 12, by - 12, 24, 1, '#E8B93A');
    } else {
      const w = ['#8a5a34', '#9b6a3d', '#7a4a2a'][lv - 1];
      R(g, cx - 14, by - 11, 28, 3, sh(w, 1.25)); R(g, cx - 14, by - 8, 28, 2, w); R(g, cx - 13, by - 6, 26, 1, sh(w, .6));
      R(g, cx - 12, by - 5, 2, 7, sh(w, .75)); R(g, cx + 10, by - 5, 2, 7, sh(w, .75));
      if (lv === 3) { R(g, cx - 3, by - 14, 6, 3, '#E2574C'); R(g, cx - 3, by - 14, 6, 1, '#F2A33A'); }
    }
    if (candle) { R(g, cx - 1, by - 17, 2, 5, '#F7EFE0'); R(g, cx - 1 + rnd(sin(t * 9)), by - 20, 2, 3, '#F2A33A'); R(g, cx, by - 20, 1, 1, '#FFE98A'); }
  }
  function stool(g, lv, x, by, flip) {
    const c = ['#D8483E', '#8a5a34', '#5a3a28', '#7b2f2a'][lv - 1];
    R(g, x - 4, by - 6, 8, 2, sh(c, 1.2)); R(g, x - 4, by - 4, 8, 1, sh(c, .7)); R(g, x - 3, by - 3, 1, 5, sh(c, .6)); R(g, x + 2, by - 3, 1, 5, sh(c, .6));
    if (lv === 4) { const bx = flip ? x + 4 : x - 6; R(g, bx, by - 16, 2, 12, '#E8B93A'); }
  }
  function drawKitchen(g, st, t, lv) {
    const tools = st.tools || {};
    // counter
    R(g, 310, 196, 166, 4, '#a07a50'); R(g, 310, 196, 166, 1, '#c29a68'); R(g, 310, 200, 166, 24, '#5a4030');
    for (let x = 316; x < 476; x += 22) R(g, x, 200, 1, 24, '#3d2a1e'); R(g, 310, 218, 166, 2, '#3d2a1e'); R(g, 310, 224, 166, 2, '#241a14');
    // hero
    const hero = (typeof SPECIAL !== 'undefined' && SPECIAL.hero) ? SPECIAL.hero.look : { skin: '#F1C9A5', hair: '#241C18', hs: 'short', top: '#2E6F8E', bot: '#2A2A3A', acc: ['apron'] };
    person(g, 405, 205, hero, { t, mood: null });
    if (st.cooking) { const k = sin(t * 7) * 3, hx = 405 + 5, hy = 205 - 17; line(g, hx, hy, 430 + k, 192 - abs(k), 2, hero.top); R(g, 430 + k, 190 - abs(k), 3, 3, hero.skin); }
    // stove
    R(g, 424, 190, 50, 6, '#2a2a34'); R(g, 424, 190, 50, 1, '#555a6a'); R(g, 436, 187, 26, 3, '#15182B');
    if (st.cooking) {
      flames(g, 438, 187, 22, 1, t);
      const ic = iconCanvas(st.cooking, tools[st.cooking] || 1), dy = st.cooking === 'wok' ? rnd(-abs(sin(t * 5)) * 2) : 0;
      g.imageSmoothingEnabled = true; g.drawImage(ic, 436 + rnd(sin(t * 20) * (st.cooking === 'steamer' ? 1 : 0)), 160 + dy, 26, 26); g.imageSmoothingEnabled = false;
      puffs(g, 449, 168, t, 7, '#E7EAF2', 10, .5, 34, 6);
    } else { R(g, 446, 185, 3, 2, '#E2574C'); R(g, 447, 184, 1, 1, '#F2A33A'); }
    // tool props
    ['wok', 'pan', 'pot', 'grill', 'fryer', 'steamer'].forEach((m, i) => {
      const ic = iconCanvas(m, tools[m] || 1); g.imageSmoothingEnabled = true; g.drawImage(ic, 314 + i * 16, 182, 16, 16); g.imageSmoothingEnabled = false;
      const c = TOOL_TIERS[(tools[m] || 1) - 1].l; R(g, 320 + i * 16, 197, 4, 1, c);
    });
    // shutter / closed sign
    if (!st.open) {
      R(g, 304, 70, 174, 64, '#4a4a58'); for (let y = 72; y < 134; y += 4) { R(g, 304, y, 174, 3, '#6a6a7c'); R(g, 304, y + 3, 174, 1, '#34343f'); }
      R(g, 300, 134, 182, 4, '#2a2a34'); R(g, 386, 134, 6, 4, '#9aa6ab');
      const sw = rnd(sin(t * 1.5) * 1); R(g, 380 + sw, 140, 26, 14, '#F7EFE0'); R(g, 380 + sw, 140, 26, 1, '#cfc6b0'); R(g, 392 + sw, 137, 1, 3, '#15182B');
      g.font = 'bold 8px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#E2574C'; g.fillText('休息中', 393 + sw, 148);
    }
  }
  function scene(g, st, t) {
    st = st || {}; t = t || 0; const lv = Math.max(1, Math.min(4, st.lv | 0 || 1)), lit = Math.max(0, Math.min(15, st.lit | 0));
    g.save(); g.imageSmoothingEnabled = false;
    g.drawImage(bg(lv, st.sign ? 1 : 0, lit), 0, 0);
    // twinkling stars + ship lights + water shimmer
    for (let i = 0; i < 16; i++) { const x = 20 + hash(i + 77) * 440, y = 14 + hash(i + 31) * 80; if (x > 300 && x < 480 && y > 54) continue; const a = (sin(t * 2 + i * 2.3) + 1) / 2; if (a > .35) { g.globalAlpha = a; star4(g, x, y, '#F7EFE0'); } }
    g.globalAlpha = 1;
    [[135, 104, '#F2A33A'], [150, 100, '#E2574C'], [212, 108, '#4FC1B0'], [320, 104, '#F2A33A']].forEach(([x, y, c], i) => { if (sin(t * 2.4 + i * 1.7) > -.4) { R(g, x, y, 2, 2, c); g.globalAlpha = .25; R(g, x - 1, y - 1, 4, 4, c); g.globalAlpha = 1; } });
    for (let i = 0; i < 26; i++) { const x = (hash(i) * 500 + t * (4 + i % 3)) % 500 - 10, y = 130 + (i * 7) % 42; g.globalAlpha = .25 + .2 * sin(t * 3 + i); R(g, x, y, 6 + i % 5, 1, i % 4 ? '#3A3F5C' : '#6a6f95'); }
    g.globalAlpha = .3; for (let i = 0; i < 6; i++) R(g, 368 - 5 + sin(t * 2 + i) * 3, 128 + i * 7, 10 - i, 1, '#F7EFE0'); g.globalAlpha = 1;
    // lantern glow flicker
    for (let i = 0; i < lit; i++) glowAt(g, LANT(i), wireY(LANT(i)) + 12, 18, .06 + .03 * sin(t * 3 + i * 1.3));
    // bulb / neon / string lights
    if (lv === 1) { const f = sin(t * 31) + sin(t * 17.3) > 1.5 ? .35 : 1; R(g, 204, 62, 3, 4, f > .5 ? '#FFF1B0' : '#8a7a50'); g.globalAlpha = f * .35; glowAt(g, 205, 64, 22, .35, '#F2D14A'); g.globalAlpha = 1; }
    if (lv === 3) for (let x = 10, i = 0; x < 304; x += 12, i++) { const y = 66 + rnd(3 * sin(x * .05 + .5)), c = ['#F2A33A', '#E2574C', '#4FC1B0', '#F7EFE0'][i % 4]; R(g, x, y - 1, 12, 1, '#15182B'); const on = sin(t * 3 + i * 1.9) > -.3; R(g, x + 3, y, 2, 3, on ? c : '#3A3F5C'); if (on) { g.globalAlpha = .25; R(g, x + 2, y - 1, 4, 5, c); g.globalAlpha = 1; } }
    if (st.sign) {
      const fl2 = sin(t * 37) + sin(t * 23.3) > 1.7 ? .3 : 1; g.globalAlpha = fl2; const x = 330, y = 74, w = 112, h = 17;
      R(g, x, y, w, 1, '#4FC1B0'); R(g, x, y + h, w, 1, '#4FC1B0'); R(g, x, y, 1, h, '#4FC1B0'); R(g, x + w, y, 1, h + 1, '#4FC1B0');
      g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#E2574C'; g.fillText('味憶夜市', x + w / 2, y + 9); g.globalAlpha = fl2 * .12; R(g, x - 3, y - 3, w + 7, h + 7, '#4FC1B0'); g.globalAlpha = 1;
    }
    if (st.fan) { const fx = 282, fy = 78; R(g, fx, 66, 1, 8, '#15182B'); R(g, fx - 3, 74, 7, 7, '#555a6a'); for (let i = 0; i < 2; i++) { const a = t * 14 + i * PI; line(g, fx + .5, fy + 2, fx + .5 + cos(a) * 9, fy + 2 + sin(a) * 9, 2, '#B4BEC9'); } R(g, fx, fy + 1, 2, 2, '#2a2a34'); }
    // kitchen
    drawKitchen(g, st, t, lv);
    // depth-sorted dining
    const items = [], seats = SEATS[lv - 1], people = st.people || [];
    seats.forEach((s, i) => { items.push({ k: s.by - .3 + i * .001, f: () => stool(g, lv, s.x, s.by, s.flip) }); });
    for (let i = 0; i < seats.length; i += 2) { const cx = (seats[i].x + seats[i + 1].x) / 2, by = seats[i].by; items.push({ k: by + .5, f: () => tableDraw(g, lv, cx, by, st.candles, t) }); }
    people.forEach(p => {
      items.push({ k: p.by, f: () => person(g, p.x, p.by, p.look, { t: t + (p.x % 7) * .3, walk: p.walk, seated: p.seated, mood: p.mood, flip: p.flip, eat: p.eat, alpha: p.alpha }) });
      if (p.dish && p.seated) items.push({ k: p.by + .6, f: () => { g.font = '10px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(p.dish, rnd(p.x + (p.flip ? -9 : 9)), rnd(p.by - 14)); } });
    });
    items.sort((a, b) => a.k - b.k).forEach(it => it.f());
    if (st.dark) {
      g.globalAlpha = .68; R(g, 0, 0, 480, 270, '#05060f'); g.globalAlpha = 1;
      if (st.candles) for (let i = 0; i < seats.length; i += 2) { const cx = (seats[i].x + seats[i + 1].x) / 2, by = seats[i].by; glowAt(g, cx, by - 16, 34 + sin(t * 8 + i) * 2, .25, '#F2A33A'); R(g, cx - 1, by - 17, 2, 5, '#F7EFE0'); R(g, cx - 1, by - 20, 2, 3, '#F2A33A'); R(g, cx, by - 20, 1, 1, '#FFE98A'); }
    }
    g.restore();
  }
  function stallPreview(lv) {
    lv = Math.max(1, Math.min(4, lv | 0 || 1)); const key = 'p' + lv; if (iconCache[key]) return iconCache[key];
    const [c, g] = mk(120, 68); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(bg(lv, 0, 15), 0, 0, 480, 270, 0, 0, 120, 68);
    return iconCache[key] = c.toDataURL('image/png');
  }

  /* ------------------------------------------------------------------ town map */
  const MAPBG = {};
  function pine(g, x, y, s) { R(g, x, y + 8 * s, 2, 4, '#4a3524'); for (let i = 0; i < 4; i++) { const w = (i + 1) * 3 * s; R(g, x + 1 - w / 2, y + i * 2.5 * s, w, 3 * s, i % 2 ? '#2b5a4c' : '#1d3d36'); } }
  function lamp(g, x, y, t, i) { R(g, x, y, 1, 12, '#0c0e1a'); R(g, x - 2, y - 3, 5, 3, '#15182B'); R(g, x - 1, y - 2, 3, 2, '#F2A33A'); glowAt(g, x, y - 1, 15 + sin(t * 4 + i * 2) * 1.2, .16); }
  function mapStatic() {
    if (MAPBG.c) return MAPBG.c; const [c, g] = mk(480, 270);
    R(g, 0, 0, 480, 270, '#22303A'); for (let i = 0; i < 260; i++) R(g, hash(i) * 480, hash(i + 5) * 270, 2, 1, i % 3 ? '#2a3b40' : '#1c2830');
    for (let y = 140; y < 270; y++) { const sx = 125 + rnd(4 * sin((y - 140) / 14)); R(g, 0, y, sx, 1, '#1B2A4A'); R(g, sx, y, 3, 1, '#7FA8C9'); R(g, sx + 3, y, 2, 1, '#2f4a66'); }
    // roads
    const S = MAP_SPOTS, road = (a, b) => { const w = 7; R(g, a.x - 3, a.y, w, 1, '#3A3F5C'); const x0 = Math.min(a.x, b.x) - 3, x1 = Math.max(a.x, b.x) + 4, y0 = Math.min(a.y, b.y) - 3, y1 = Math.max(a.y, b.y) + 4; R(g, x0, a.y - 3, x1 - x0, w, '#3A3F5C'); R(g, b.x - 3, y0, w, y1 - y0, '#3A3F5C'); R(g, x0, a.y - 3, x1 - x0, 1, '#4a5078'); R(g, x0, a.y + 3, x1 - x0, 1, '#2a2d46'); for (let x = x0; x < x1; x += 10) R(g, x, a.y, 4, 1, '#555a7a'); for (let y = y0; y < y1; y += 10) R(g, b.x, y, 1, 4, '#555a7a'); };
    road(S.hospital, S.market); road(S.market, S.grocery); road(S.market, S.stall); road(S.stall, S.harbor); road(S.stall, S.workshop); road(S.grocery, S.workshop); road(S.casino, S.workshop); road(S.grocery, S.bank);
    [[30, 60], [120, 40], [160, 60], [300, 40], [440, 50], [455, 120], [300, 130], [300, 230], [350, 245], [440, 235], [190, 245], [110, 150], [20, 20], [60, 145]].forEach(([x, y], i) => pine(g, x, y, 1 + (i % 2) * .3));
    MAPBG.c = c; return c;
  }
  function building(g, x, y, w, h, wall, roof) { R(g, x, y, w, h, wall); R(g, x + w - 3, y, 3, h, sh(wall, .78)); R(g, x - 2, y - 4, w + 4, 5, roof); R(g, x - 2, y - 4, w + 4, 1, sh(roof, 1.4)); }
  function windows(g, x, y, n, step, t, off) { for (let i = 0; i < n; i++) { const on = sin(t * .7 + i * 3 + (off || 0)) > -.8; R(g, x + i * step, y, 4, 4, on ? '#F2D79A' : '#3a3550'); R(g, x + i * step, y + 2, 4, 1, on ? '#E8B060' : '#2a2540'); } }
  function map(g, t, st) {
    st = st || {}; t = t || 0; g.save(); g.imageSmoothingEnabled = false;
    g.drawImage(mapStatic(), 0, 0);
    const S = MAP_SPOTS;
    // sea waves + moon glitter
    for (let i = 0; i < 40; i++) { const y = 145 + (i * 13) % 120, x = (hash(i + 3) * 120 + t * (6 + i % 4)) % 120; if (x < 118 - 4 * sin((y - 140) / 14)) { g.globalAlpha = .35 + .25 * sin(t * 2 + i); R(g, x, y, 6 + i % 4, 1, '#5a7fb0'); } }
    g.globalAlpha = 1;
    // harbour: pier + crates + boat
    const h = S.harbor; R(g, 30, h.y - 3, 100, 9, '#6b4a30'); for (let x = 32; x < 128; x += 6) R(g, x, h.y - 3, 1, 9, '#4a3220'); R(g, 30, h.y - 3, 100, 1, '#8a6a45'); [34, 60, 90, 118].forEach(x => { R(g, x, h.y + 6, 3, 6, '#3d2a1e'); });
    building(g, h.x - 14, h.y - 6, 30, 22, '#4a4a60', '#2E2A45'); windows(g, h.x - 10, h.y, 3, 8, t, 1); R(g, h.x + 4, h.y + 8, 6, 8, '#15182B');
    [[100, -12], [108, -10], [104, -19]].forEach(([dx, dy]) => { R(g, dx, h.y + dy + 3, 8, 7, '#8a6a45'); R(g, dx, h.y + dy + 3, 8, 1, '#b08a55'); R(g, dx + 3, h.y + dy + 3, 1, 7, '#5a4030'); });
    for (let i = 0; i < 3; i++) R(g, 78 + i * 5, h.y - 7 - (i % 2), 4, 2, '#7FB7FF');
    const bb = rnd(sin(t * 2) * 2), bx = 52; R(g, bx - 14, h.y + 22 + bb, 28, 3, '#B8692E'); R(g, bx - 12, h.y + 25 + bb, 24, 3, '#8a4a20'); R(g, bx - 9, h.y + 28 + bb, 18, 1, '#6a3a18'); R(g, bx - 4, h.y + 14 + bb, 9, 8, '#F7EFE0'); R(g, bx, h.y + 6 + bb, 1, 8, '#15182B'); R(g, bx + 1, h.y + 6 + bb, 5, 4, '#E2574C'); R(g, bx + 8, h.y + 19 + bb, 3, 3, '#F2A33A'); glowAt(g, bx + 9, h.y + 20 + bb, 9, .25);
    // market street: 3 striped awnings
    const mk0 = S.market, cols = [['#E2574C', '#4FC1B0', '#F2A33A']];
    for (let i = 0; i < 3; i++) { const x = mk0.x - 30 + i * 21, y = mk0.y - 4; R(g, x, y + 8, 18, 12, '#3d2a1e'); R(g, x, y + 8, 18, 3, '#6b4a30'); for (let j = 0; j < 18; j += 3) R(g, x + j, y + 8 + 9, 2, 3, ['#E2574C', '#8FD06A', '#F2A33A', '#9b4fa8'][(i + j / 3 | 0) % 4]); for (let j = 0; j < 18; j += 3) R(g, x + j, y, 3, 8, (j / 3 | 0) % 2 ? '#F7EFE0' : cols[0][i]); R(g, x - 1, y + 7, 20, 1, '#15182B'); R(g, x, y, 1, 20, '#5a4030'); R(g, x + 17, y, 1, 20, '#5a4030'); }
    for (let x = mk0.x - 32; x < mk0.x + 34; x += 6) { R(g, x, mk0.y - 8 + rnd(sin(x) * 1), 2, 2, ['#F2A33A', '#E2574C', '#4FC1B0'][(x / 6 | 0) % 3]); }
    // grocery
    const gr = S.grocery; building(g, gr.x - 18, gr.y - 6, 36, 24, '#6a4a3a', '#2E2A45'); windows(g, gr.x - 14, gr.y + 2, 2, 8, t, 3); R(g, gr.x + 4, gr.y + 6, 8, 12, '#15182B'); R(g, gr.x - 16, gr.y - 12, 32, 6, '#F7EFE0'); R(g, gr.x - 16, gr.y - 12, 32, 1, '#cfc6b0'); for (let i = 0; i < 6; i++) R(g, gr.x - 14 + i * 5, gr.y - 10, 3, 3, ['#E2574C', '#4FC1B0', '#F2A33A'][i % 3]);
    for (let i = 0; i < 6; i++) R(g, gr.x - 18 + i * 6, gr.y + 18, 5, 3, i % 2 ? '#4FC1B0' : '#F7EFE0');
    // workshop + chimney smoke + anvil
    const w = S.workshop; building(g, w.x - 20, w.y - 8, 40, 26, '#4a4038', '#2a2430'); R(g, w.x + 8, w.y - 24, 7, 16, '#2a2430'); R(g, w.x + 8, w.y - 24, 7, 2, '#555a6a'); R(g, w.x - 12, w.y + 2, 14, 16, '#15182B'); glowAt(g, w.x - 5, w.y + 10, 12, .22 + .06 * sin(t * 9), '#E2574C'); R(g, w.x - 9, w.y + 12, 8, 6, '#F2A33A');
    puffs(g, w.x + 11, w.y - 26, t, 6, '#8d8a99', 10, .3, 30, 6);
    const ax = w.x + 14, ay = w.y + 17; R(g, ax, ay + 4, 8, 2, '#2a2a34'); R(g, ax - 2, ay, 12, 4, '#555a6a'); R(g, ax - 4, ay, 3, 2, '#555a6a'); R(g, ax, ay, 8, 1, '#8d96a3'); if (sin(t * 6) > .6) { R(g, ax + 3, ay - 3, 1, 1, '#FFE98A'); R(g, ax + 6, ay - 4, 1, 1, '#F2A33A'); }
    // hospital
    const hp = S.hospital; building(g, hp.x - 22, hp.y - 8, 44, 28, '#E7EAF2', '#9aa3b8'); windows(g, hp.x - 18, hp.y - 2, 4, 9, t, 5); windows(g, hp.x - 18, hp.y + 7, 4, 9, t, 9); R(g, hp.x - 3, hp.y + 11, 6, 9, '#6a7388');
    const bl = (t % 1.4) < .9; R(g, hp.x - 4, hp.y - 20, 9, 9, bl ? '#E2574C' : '#7a3a3a'); R(g, hp.x - 1, hp.y - 20, 3, 9, bl ? '#FFB0A8' : '#7a3a3a'); R(g, hp.x - 4, hp.y - 17, 9, 3, bl ? '#FFB0A8' : '#7a3a3a'); R(g, hp.x - 4, hp.y - 20, 9, 9, bl ? '#E2574C' : '#7a3a3a'); R(g, hp.x - 1, hp.y - 20, 3, 9, bl ? '#F7EFE0' : '#8a5a5a'); R(g, hp.x - 4, hp.y - 17, 9, 3, bl ? '#F7EFE0' : '#8a5a5a'); if (bl) glowAt(g, hp.x, hp.y - 15, 16, .2, '#E2574C');
    // casino: neon frame, gold doors, dice
    const cs = S.casino; building(g, cs.x - 24, cs.y - 8, 48, 26, '#3a1f4a', '#1a0f24'); R(g, cs.x - 8, cs.y + 4, 16, 14, '#15182B'); R(g, cs.x - 7, cs.y + 5, 6, 13, '#D9A520'); R(g, cs.x + 1, cs.y + 5, 6, 13, '#D9A520');
    const neon = sin(t * 7) > -.3; R(g, cs.x - 22, cs.y - 16, 44, 7, '#15182B'); for (let i = 0; i < 11; i++) R(g, cs.x - 20 + i * 4, cs.y - 14, 2, 3, neon ? ['#FF6FD8', '#6FF0FF', '#FFE98A'][(i + (t * 4 | 0)) % 3] : '#3a2a4a');
    if (neon) glowAt(g, cs.x, cs.y - 12, 26, .22, '#FF6FD8');
    [[-19, 8], [13, 8]].forEach(([dx, dy]) => { R(g, cs.x + dx, cs.y + dy, 6, 6, '#F7EFE0'); R(g, cs.x + dx + 1, cs.y + dy + 1, 1, 1, '#E2574C'); R(g, cs.x + dx + 4, cs.y + dy + 4, 1, 1, '#E2574C'); R(g, cs.x + dx + 2, cs.y + dy + 2, 2, 2, '#15182B'); });
    // bank: columns + coin sign; a shady alley door beside it
    const bk = S.bank; building(g, bk.x - 20, bk.y - 6, 34, 24, '#C9C2B0', '#7a6f5a'); for (let i = 0; i < 4; i++) R(g, bk.x - 17 + i * 8, bk.y - 2, 3, 20, '#EDE6D3');
    R(g, bk.x - 5, bk.y - 16, 10, 10, '#D9A520'); R(g, bk.x - 3, bk.y - 14, 6, 6, '#FFE98A'); R(g, bk.x - 1, bk.y - 14, 2, 6, '#B8862E');
    R(g, bk.x + 16, bk.y + 4, 10, 14, '#1a1a22'); R(g, bk.x + 18, bk.y + 6, 6, 12, '#0c0c12'); if (sin(t * 3) > .2) { R(g, bk.x + 19, bk.y + 1, 4, 2, '#E2574C'); glowAt(g, bk.x + 21, bk.y + 2, 7, .25, '#E2574C'); }
    // player's stall
    const sp = S.stall, slv = st.lv || 1; R(g, sp.x - 16, sp.y - 2, 32, 18, '#5a4030'); R(g, sp.x - 16, sp.y + 8, 32, 8, '#3d2a1e'); R(g, sp.x - 18, sp.y - 8, 36, 7, slv > 1 ? '#E2574C' : '#5C6B73'); for (let i = 0; i < 36; i += 6) R(g, sp.x - 18 + i, sp.y - 8, 3, 7, slv > 1 ? '#F7EFE0' : '#7A5A3A'); R(g, sp.x - 18, sp.y - 1, 36, 1, '#15182B'); R(g, sp.x - 16, sp.y - 2, 2, 18, '#7a5638'); R(g, sp.x + 14, sp.y - 2, 2, 18, '#7a5638');
    [-12, 12].forEach((dx, i) => { const f = .18 + .06 * sin(t * 5 + i * 2); glowAt(g, sp.x + dx, sp.y + 3, 13, f); R(g, sp.x + dx - 2, sp.y, 5, 6, '#E2574C'); R(g, sp.x + dx - 1, sp.y + 1, 3, 4, '#F2A33A'); });
    R(g, sp.x - 5, sp.y + 17, 4, 3, '#D8483E'); R(g, sp.x + 3, sp.y + 17, 4, 3, '#D8483E');
    // lamps + sky corner moon
    [[180, 150], [290, 110], [370, 140], [110, 120], [250, 160], [330, 205], [60, 175]].forEach(([x, y], i) => lamp(g, x, y, t, i));
    glowAt(g, 452, 22, 20, .1, '#F7EFE0'); for (let y = -8; y <= 8; y++) { const ww = rnd(Math.sqrt(64 - y * y)); R(g, 452 - ww, 22 + y, ww * 2, 1, '#F7EFE0'); }
    g.restore();
  }

  return { person, portrait, SEATS, ENTRY, EXIT_X, scene, cook, toolIcon, stallPreview, MAP_SPOTS, map };
})();
