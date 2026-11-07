'use strict';
/* ---------- helpers ---------- */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const TOOLS = Object.keys(METHODS);
try { LANG = +localStorage.getItem('weiyi-lang') || 0; } catch (e) {}

/* ---------- state & save ---------- */
const SAVE_KEY = 'weiyi-night-market-v2', OLD_KEY = 'weiyi-night-market-v1';
let S = null;          // saved state
let N = null;          // tonight's runtime (not saved)
let muted = false, view = 'title', redraw = null, T = 0, pendingBill = false;

function newState(){
  return { v:2, day:1, zone:0, zoneNights:0, lv:1, exp:0, points:0, stats:{ knife:1, heat:1, memory:1, charm:1 },
    stamina:100, money:800, rep:2, frags:Array(15).fill(0), inv:{}, tools:{ wok:1, pan:1, pot:1, grill:1, fryer:1, steamer:1 },
    shop:1, gear:{ fridge:0, sign:0, fan:0 }, ended:false, served:0, visited:0, loans:[] };
}
function valid(o){
  try {
    return !!o && o.v === 2 &&
      ['day','zone','zoneNights','lv','exp','points','stamina','money','rep','served','shop','visited'].every(k => Number.isFinite(o[k])) &&
      o.zone >= 0 && o.zone <= 4 && o.day >= 1 && o.lv >= 1 && o.shop >= 1 && o.shop <= 4 &&
      o.stats && Object.keys(STATS).every(k => Number.isFinite(o.stats[k]) && o.stats[k] >= 1 && o.stats[k] <= 10) &&
      Array.isArray(o.frags) && o.frags.length === 15 && o.frags.every(f => Number.isFinite(f) && f >= 0 && f <= 3) &&
      o.inv && typeof o.inv === 'object' && Object.entries(o.inv).every(([k, a]) => ING[k] && Array.isArray(a) && a.every(Number.isFinite)) &&
      o.tools && TOOLS.every(k => Number.isFinite(o.tools[k]) && o.tools[k] >= 1 && o.tools[k] <= 5) &&
      o.gear && Object.keys(GEAR).every(k => Number.isFinite(o.gear[k]) && o.gear[k] >= 0 && o.gear[k] <= GEAR[k].max) &&
      Array.isArray(o.loans) && o.loans.every(l => (l.t === 'bank' || l.t === 'shark') && Number.isFinite(l.owed) && Number.isFinite(l.day));
  } catch (e) { return false; }
}
// Old v1 saves (single-file version): keep progress, start fresh on the new systems.
function migrate(o){
  if (!o || o.v !== 1 || !Array.isArray(o.frags) || o.frags.length !== 15) return null;
  const s = newState();
  ['zone','zoneNights','lv','exp','points','money','rep','served','ended'].forEach(k => { if (o[k] !== undefined) s[k] = o[k]; });
  s.day = o.night || 1; s.frags = o.frags.slice(); if (o.stats) s.stats = Object.assign(s.stats, o.stats);
  s.money = Math.max(s.money, 800); starterStock(s);
  return valid(s) ? s : null;
}
function patch(o){ if (o && o.v === 2 && !Array.isArray(o.loans)) o.loans = []; return o; } // older v2 saves had no loans
function save(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function loadSave(){
  try {
    const r = localStorage.getItem(SAVE_KEY);
    if (r) { const o = patch(JSON.parse(r)); return valid(o) ? o : null; }
    const old = localStorage.getItem(OLD_KEY); return old ? migrate(JSON.parse(old)) : null;
  } catch (e) { return null; }
}

/* ---------- derived rules ---------- */
const expNeed = lv => 80 + 40 * (lv - 1);
const staminaMax = () => 100 + (S.shop - 1) * 30;
const patienceMax = () => 30 + S.stats.charm * 3 + (S.gear.fan ? 6 : 0);
const prepMax = () => 7 + S.stats.knife * 1.5;
const zoneW = m => 7 + S.stats.heat * 1.5 + (S.tools[m] - 1) * 4;          // starts narrow, widens with heat stat + tool tier
const ptrSpeed = (m, z) => (100 + z * 8) * (1 - (S.tools[m] - 1) * 0.12);  // pointer slows down with tool tier
const warmTime = m => 3 - (S.tools[m] - 1) * 0.6;                           // better tools cook faster
const toolBonus = m => (S.tools[m] - 1) * 5;                                // quality bonus → higher rank
const freshDays = () => 2 + S.gear.fridge;
const seats = () => SHOP_LV[S.shop - 1].seats;
const customersTonight = () => 2 + Math.floor(S.rep) + Math.floor(seats() / 2) + (S.gear.sign ? 2 : 0);
const dishPrice = i => 90 + DISHES[i].zone * 20;
const unlocked = () => DISHES.map((d, i) => i).filter(i => DISHES[i].zone <= S.zone);
const cardsDone = () => S.frags.filter(f => f >= 3).length;
const zoneCards = z => DISHES.filter((d, i) => d.zone === z && S.frags[i] >= 3).length;
const zoneDone = z => zoneCards(z) === 3;
const stars = r => '★'.repeat(Math.floor(r)) + '☆'.repeat(5 - Math.floor(r));
const weekday = () => (S.day - 1) % 7;
const bills = () => ({ rent: SHOP_LV[S.shop - 1].rent,
  power: 80 + 20 * (TOOLS.reduce((n, k) => n + S.tools[k], 0) - 6) + 40 * (S.shop - 1) + 50 * S.gear.sign + 30 * S.gear.fridge + 20 * S.gear.fan,
  hosp: S.ended ? 0 : 600, bank: S.loans.filter(l => l.t === 'bank').reduce((n, l) => n + l.owed, 0) });
const billTotal = () => { const b = bills(); return b.rent + b.power + b.hosp + b.bank; };
const debtOf = t => S.loans.filter(l => !t || l.t === t).reduce((n, l) => n + l.owed, 0);
const sharkLate = () => S.loans.some(l => l.t === 'shark' && S.day - l.day >= LOAN.shark.days);
function payDebt(t, amt){ for (const l of S.loans) if (l.t === t && amt > 0) { const x = Math.min(amt, l.owed); l.owed -= x; amt -= x; S.money -= x; } S.loans = S.loans.filter(l => l.owed > 0); }
const rankOf = q => RANKS.find(r => q >= r.min);
const dName = i => L(DISHES[i].name);

/* ---------- inventory ---------- */
const have = k => (S.inv[k] || []).length;
const lacking = i => DISHES[i].steps.filter(k => have(k) < 1);
const servings = i => Math.min(...DISHES[i].steps.map(have));
function addInv(k, units, s = S){ s.inv[k] = s.inv[k] || []; for (let u = 0; u < units; u++) s.inv[k].push(ING[k].f ? s.day : 0); }
function take(k){ const a = S.inv[k]; if (!a || !a.length) return false; a.sort((x, y) => x - y); a.shift(); return true; }
function starterStock(s){
  DISHES.forEach((d, i) => { if (d.zone <= s.zone) d.steps.forEach(k => { if ((s.inv[k] || []).length < 2) addInv(k, 2, s); }); });
  addInv('鹽', 10, s); addInv('糖', 5, s);
}
function shopItems(shop){
  const used = new Set(EXTRAS.map(e => e[0])); unlocked().forEach(i => DISHES[i].steps.forEach(k => used.add(k)));
  return Object.keys(ING).filter(k => ING[k].s === shop && (used.has(k) || ING[k].seas));
}
function targetUnits(k){
  if (k === '鹽') return 10;
  if (k === '糖') return unlocked().some(i => DISHES[i].sweet) ? 5 : 0;
  return Math.max(EXTRAS.some(e => e[0] === k) ? 2 : 0, 2 * unlocked().filter(i => DISHES[i].steps.includes(k)).length);
}

/* ---------- audio (Web Audio API, synthesized) ---------- */
let AC = null;
function ac(){
  if (muted) return null;
  try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; }
  return AC;
}
function tone(f, d, type = 'sine', vol = .12, when = 0, f2){
  const a = ac(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t0 = a.currentTime + when;
  o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + d);
  o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + d + .05);
}
function noise(d = .6, vol = .08, hp = 2400){
  const a = ac(); if (!a) return;
  const len = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, len, a.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (Math.random() < .05 ? 1 : .35);
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t0 = a.currentTime;
  f.type = hp > 0 ? 'highpass' : 'lowpass'; f.frequency.value = Math.abs(hp); src.buffer = buf;
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + d);
  src.connect(f).connect(g).connect(a.destination); src.start(t0);
}
const sfx = {
  tap: () => tone(700, .06, 'square', .04),
  ok: () => { tone(523, .12, 'triangle'); tone(784, .18, 'triangle', .12, .09); },
  bad: () => tone(150, .25, 'sawtooth', .07),
  perfect: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, .22, 'triangle', .11, i * .08)),
  lantern: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, .4, 'sine', .09, i * .12)),
  coin: () => { tone(1320, .08, 'square', .05); tone(1760, .14, 'square', .05, .07); },
  door: () => { tone(880, .25, 'sine', .07); tone(660, .35, 'sine', .07, .18); },
  ghost: () => { tone(220, 1.4, 'sawtooth', .04, 0, 110); tone(233, 1.4, 'sine', .05, 0, 117); },
  thud: () => noise(.35, .2, -300),
  cook: m => m === 'pot' || m === 'steamer' ? [0, .15, .3].forEach(w => tone(300 + rnd(200), .12, 'sine', .04, w, 600)) : noise(m === 'grill' ? .5 : .7, .07, m === 'grill' ? 900 : 2400)
};

/* ---------- stage, UI plumbing ---------- */
const stage = $('#stage'), layer = $('#layer'), sceneCv = $('#scene'), G = sceneCv.getContext('2d');
G.imageSmoothingEnabled = false;
let rotDismissed = false;
function fit(){
  const s = Math.min(innerWidth / 960, innerHeight / 540);
  stage.style.transform = `translate(${(innerWidth - 960 * s) / 2}px,${(innerHeight - 540 * s) / 2}px) scale(${s})`;
  const portrait = innerHeight > innerWidth && innerWidth < 820 && !rotDismissed;
  const r = $('#rotate'); r.hidden = !portrait;
  if (portrait) r.innerHTML = `<div class="ph">📱</div><h2>${t('rotate')}</h2><p class="muted">${t('rotateSub')}</p><button class="btn" data-act="anyway">${t('anyway')}</button>`;
}
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 200));
let toastTimer = 0;
function toast(msg, ms = 2400){ const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, ms); }
let modalOnClose = null;
function openModal(html, onClose){ $('#sheet').className = 'sheet frame'; $('#sheet').innerHTML = html; $('#modal').hidden = false; modalOnClose = onClose || null; }
function closeModal(){ $('#modal').hidden = true; $('#sheet').innerHTML = ''; const cb = modalOnClose; modalOnClose = null; if (cb) cb(); }
function floatText(txt, x, y, color){ // x,y in scene pixels
  const d = document.createElement('div'); d.className = 'float'; d.textContent = txt; d.style.left = (x * 2 - 20) + 'px'; d.style.top = (y * 2 - 60) + 'px';
  if (color) d.style.color = color; stage.appendChild(d); setTimeout(() => d.remove(), 1300);
}
function portraitHTML(look, name){ return `<div class="pframe"><canvas width="24" height="24" data-look='${esc(JSON.stringify(look))}'></canvas><span class="nm">${esc(name)}</span></div>`; }
function paintPortraits(root = layer){ root.querySelectorAll('canvas[data-look]').forEach(c => { try { ART.portrait(c, JSON.parse(c.dataset.look)); } catch (e) {} }); }
function lanterns(n){ let h = '<div class="lans">'; for (let i = 0; i < 15; i++) h += `<span class="lan ${i < n ? 'on' : ''}"></span>`; return h + '</div>'; }

function renderHud(){
  const hud = $('#hud');
  if (!S || !['day','night','map','summary'].includes(view)) { hud.hidden = true; return; }
  hud.hidden = false; hud.className = 'frame';
  const need = expNeed(S.lv), sm = staminaMax(), wd = weekday();
  const bill = wd === 6 ? t('billTonight', billTotal()) : t('billIn', billTotal(), 6 - wd);
  hud.innerHTML = `
    <div class="hchip"><span class="hday">${t('day', S.day)}・${L(STR.wd)[wd]}<small>${esc(L(ZONES[S.zone].name))}</small></span></div>
    ${lanterns(cardsDone())}
    <div class="hchip"><span class="k">${t('money')}</span><span class="v num" style="color:${S.money < billTotal() ? 'var(--red)' : 'var(--gold)'}">$${S.money}</span></div>
    <div class="hchip"><span class="k">${t('rep')} ${S.rep.toFixed(1)}</span><span class="v" style="font-size:12px;color:var(--lantern);letter-spacing:-1px">${stars(S.rep)}</span></div>
    <div class="hchip"><span class="k">${t('stamina')} ${Math.round(S.stamina)}/${sm}</span><div class="meter"><i style="width:${S.stamina / sm * 100}%"></i></div></div>
    <div class="hchip"><span class="k">Lv ${S.lv}${S.points ? ` <b style="color:var(--lantern)">+${S.points}</b>` : ''}</span><div class="meter"><i style="width:${clamp(S.exp / need * 100, 0, 100)}%;background:var(--lantern)"></i></div></div>
    ${S.loans.length ? `<div class="hchip"><span class="k">${t('debt')}</span><span class="v num" style="color:var(--red)">$${debtOf()}</span></div>` : ''}
    <div class="hspace"></div>
    <div class="hbill">${wd === 6 ? `<b>${esc(bill)}</b>` : esc(bill)}</div>
    <button class="hbtn" data-act="lang">${LANG ? '中文' : 'VI'}</button>
    <button class="hbtn" data-act="mute">${t('sound')} ${muted ? 'OFF' : 'ON'}</button>
    <button class="hbtn" data-act="fs" aria-label="${t('fullscreen')}">⛶</button>`;
}
function renderDock(){
  const d = $('#dock'); let h = '';
  if (view === 'day') h = `
    <button class="btn" data-act="map"><span class="i">🗺️</span>${t('map')}</button>
    <button class="btn" data-act="stats"><span class="i">📜</span>${t('stats')}${S.points ? `<span class="badge">${S.points}</span>` : ''}</button>
    <button class="btn" data-act="recipes"><span class="i">📖</span>${t('recipes')}</button>
    <button class="btn" data-act="album"><span class="i">🏮</span>${t('album')}</button>
    <button class="btn" data-act="saves"><span class="i">💾</span>${t('saves')}</button>
    <button class="btn primary big" data-act="open"><span class="i">🍜</span>${t('open')}</button>`;
  else if (view === 'night' && N && N.phase === 'idle') {
    const w = N.people.some(p => p.state === 'wait');
    h = `<button class="btn" data-act="closeearly"><span class="i">🌙</span>${t('closeEarly')}</button>
      <button class="btn primary big" data-act="servenext" ${w ? '' : 'disabled'}><span class="i">🙋</span>${t('serveNext')}</button>`;
  } else if (view === 'map') h = `<button class="btn primary big" data-act="tostall"><span class="i">🏮</span>${t('toStall')}</button>`;
  d.hidden = !h; d.innerHTML = h;
}
function go(v){ view = v; renderHud(); renderDock(); }

/* ---------- title ---------- */
function langSwitch(){ return `<div class="langsw"><button class="hbtn ${LANG ? '' : 'on'}" data-act="setlang" data-l="0">中文</button><button class="hbtn ${LANG ? 'on' : ''}" data-act="setlang" data-l="1">Tiếng Việt</button></div>`; }
function showTitle(){
  go('title'); redraw = showTitle;
  const has = !!loadSave();
  layer.innerHTML = `<div class="full clear">${langSwitch()}
    <p class="eyebrow">KAOHSIUNG HARBOR ・ MIDNIGHT</p>
    <div class="logo">味憶夜市</div>
    <div class="logo-sub">${LANG ? `${t('title')} ・ ${t('sub')}` : t('sub')}</div>
    <p class="tagline">${t('tagline')}</p>
    <div class="row" style="justify-content:center;margin-top:6px">
      ${has ? `<button class="btn primary big" data-act="continue">${t('cont')}</button>` : ''}
      <button class="btn ${has ? '' : 'primary'} big" data-act="newgame">${has ? t('restart') : t('newgame')}</button>
      <button class="btn ghost" data-act="saves">${t('importSave')}</button>
    </div>
    <p class="credit">${t('credit')}</p></div>`;
}

/* ---------- story panels ---------- */
let storyNext = null, storySkip = null;
function showStory(panels, done){
  go('story'); let i = 0;
  const draw = () => {
    redraw = draw;
    const p = panels[i], sp = p.who ? SPECIAL[p.who] : null;
    layer.innerHTML = `<div class="full">${langSwitch()}
      ${sp ? '' : lanterns(panels === ENDING ? 15 : Math.min(15, i * 3 + 1)).replace('lans', 'lans" style="transform:scale(2.2);margin-bottom:60px')}
      <div class="story-box frame gold">${sp ? portraitHTML(sp.look, L(sp.name)) : ''}
        <div class="dbody"><p class="dtext">${sp ? `<span class="who">${esc(L(sp.name))}</span>` : ''}${esc(L(p.text))}</p>
        <div class="row" style="justify-content:flex-end"><span class="muted" style="flex:1;font-size:12px">${i + 1} / ${panels.length}</span>
          <button class="btn ghost" data-act="skip">${t('skip')}</button><button class="btn primary" data-act="next">${i < panels.length - 1 ? t('next') : t('start')}</button></div></div></div></div>`;
    paintPortraits();
  };
  storyNext = () => { sfx.tap(); if (++i >= panels.length) done(); else draw(); };
  storySkip = () => done();
  draw();
}

/* ---------- day (stall, closed) ---------- */
function showHub(){
  go('day'); redraw = showHub; N = null;
  const z = S.zone, short = unlocked().filter(i => lacking(i).length).length;
  const goal = z < 4 ? t('goalZone', S.rep.toFixed(1), zoneCards(z), Math.min(S.zoneNights, 3)) : t('goalEnd', cardsDone());
  layer.innerHTML = `<div class="tip frame"><b>${esc(L(SHOP_LV[S.shop - 1].name))}</b> ・ ${esc(L(ZONES[z].cuisine))}<br>${esc(goal)}
    ${short ? `<br><span class="warn">${t('lowStock', short)}</span>` : `<br>${t('dayHint')}`}
    ${S.ended ? `<br><span class="good">${t('keepPlaying')}</span>` : ''}</div>`;
}

/* ---------- map ---------- */
function showMap(){
  go('map'); redraw = showMap;
  const spots = Object.entries(ART.MAP_SPOTS).map(([k, p]) =>
    `<button class="spot" data-act="spot" data-k="${k}" style="left:${p.x * 2}px;top:${p.y * 2 - 40}px">${esc(L(SHOPS[k].name))}<small>${esc(L(SHOPS[k].desc))}</small></button>`).join('');
  layer.innerHTML = `<div class="maptitle frame"><b>${t('map')}</b> ・ ${t('day', S.day)} ${L(STR.wd)[weekday()]}</div>${spots}`;
}
let cart = {}, shopKey = '';
function showShop(k){
  shopKey = k;
  const items = shopItems(k), total = items.reduce((n, x) => n + (cart[x] || 0) * ING[x].p, 0);
  const rows = items.map(x => {
    const g = ING[x], q = cart[x] || 0, uses = unlocked().filter(i => DISHES[i].steps.includes(x)).map(dName).join('、');
    return `<div class="item"><span class="e">${g.e}</span><div class="grow"><b>${esc(ingName(x))} <span class="muted" style="font-weight:400">$${g.p}・${t('pack', g.n)}</span></b>
      <small>${t('have', have(x))}・${g.f ? t('fresh', freshDays()) : t('dry')}${uses ? '・' + esc(t('usedBy', uses)) : ''}</small></div>
      <div class="qty"><button data-act="cart" data-k="${esc(x)}" data-d="-1">−</button><span class="num">${q}</span><button data-act="cart" data-k="${esc(x)}" data-d="1">＋</button></div></div>`;
  }).join('');
  openModal(`<div class="shead"><h2>${esc(L(SHOPS[k].name))}</h2><span class="num" style="font-size:24px;color:var(--gold)">$${S.money}</span><button class="btn small ghost" data-act="close">${t('close')}</button></div>
    <p class="muted" style="font-size:13px">${esc(L(SHOPS[k].desc))}</p>
    ${recipeBoard(k)}
    <h3 style="font-size:16px">${t('shopList')}</h3><div class="grid2">${rows}</div>
    <div class="row" style="justify-content:flex-end"><button class="btn" data-act="cartfill">${t('fill')}</button>
      <button class="btn primary" data-act="buy" ${total === 0 || total > S.money ? 'disabled' : ''}>${t('shopBuy', total)}</button></div>
    ${total > S.money ? `<p class="bad">${t('notEnough')}</p>` : ''}`);
}
function recipeBoard(shop){
  const chip = k => { const g = ING[k], here = g.s === shop, q = cart[k] || 0;
    return `<${here ? `button data-act="cart" data-k="${esc(k)}" data-d="1"` : 'span'} class="chip ${here ? 'here' : ''} ${have(k) ? '' : 'none'}">${g.e} ${esc(ingName(k))} <b>${have(k)}</b>${q ? `<i>+${q * g.n}</i>` : ''}<small>${esc(L(SHOPS[g.s].name))}</small></${here ? 'button' : 'span'}>`; };
  return `<div class="recipes"><p class="eyebrow">📖 ${t('recipeT')}</p><p class="muted" style="font-size:11px">${t('recipeHint')}</p>
    ${unlocked().map(i => { const d = DISHES[i]; return `<div class="rrow"><div class="rname">${d.emoji} <b>${esc(dName(i))}</b><small>${METHODS[d.m].icon} ${esc(L(METHODS[d.m].name))}・${t('stockN', servings(i))}</small></div>
      <div class="rchips">${d.steps.map((k, j) => `<span class="rno">${j + 1}</span>${chip(k)}`).join('')}<span class="rno">+</span>${chip('鹽')}${d.sweet ? chip('糖') : ''}</div></div>`; }).join('')}</div>`;
}
function showRecipes(){ cart = {}; openModal(`<div class="shead"><h2>${t('recipeT')}</h2><button class="btn small ghost" data-act="close">${t('close')}</button></div>${recipeBoard('')}`); }
let wsTab = 'tools';
function showWorkshop(){
  const tierChip = lv => `<span class="tierchip" style="background:${TOOL_TIERS[lv - 1].l}">${esc(L(TOOL_TIERS[lv - 1].name))}</span>`;
  let body = '';
  if (wsTab === 'tools') body = TOOLS.map(m => {
    const lv = S.tools[m], dishes = unlocked().filter(i => DISHES[i].m === m).map(dName).join('、') || '—';
    const nx = lv < 5 ? `<img src="${ART.toolIcon(m, lv + 1)}" alt="" style="width:32px;height:32px;opacity:.85">` : '';
    return `<div class="item"><img src="${ART.toolIcon(m, lv)}" alt=""><div class="grow"><b>${esc(L(METHODS[m].name))} ${tierChip(lv)}</b>
      <small>${t('toolEff', ((lv - 1) * 4).toFixed(0), ((lv - 1) * 12).toFixed(0), warmTime(m).toFixed(1), toolBonus(m))}<br>${esc(t('usedBy', dishes))}</small></div>${nx}
      ${lv < 5 ? `<button class="btn small ${S.money >= TOOL_COST[lv] ? 'primary' : ''}" data-act="uptool" data-k="${m}" ${S.money < TOOL_COST[lv] ? 'disabled' : ''}>${t('upgrade', TOOL_COST[lv])}</button>` : `<span class="good" style="font-size:12px">${t('maxed')}</span>`}</div>`;
  }).join('');
  else if (wsTab === 'shop') body = SHOP_LV.map((s, i) => `<div class="item"><img class="wide" src="${ART.stallPreview(i + 1)}" alt="">
      <div class="grow"><b>${esc(L(s.name))}</b><small>${t('shopLv', i + 1, s.seats, s.rent)}</small></div>
      ${i + 1 <= S.shop ? `<span class="good" style="font-size:12px">${t('owned')}</span>` : i === S.shop ? `<button class="btn small primary" data-act="upshop" ${S.money < s.cost ? 'disabled' : ''}>${t('upgrade', s.cost)}</button>` : `<span class="muted">$${s.cost}</span>`}</div>`).join('');
  else body = Object.entries(GEAR).map(([k, g]) => { const lv = S.gear[k];
    return `<div class="item"><div class="grow"><b>${esc(L(g.name))} ${g.max > 1 ? `Lv ${lv}/${g.max}` : ''}</b><small>${esc(L(g.desc))}</small></div>
      ${lv >= g.max ? `<span class="good" style="font-size:12px">${t(g.max > 1 ? 'maxed' : 'owned')}</span>` : `<button class="btn small" data-act="upgear" data-k="${k}" ${S.money < g.cost[lv] ? 'disabled' : ''}>${t('buyFor', g.cost[lv])}</button>`}</div>`; }).join('');
  openModal(`<div class="shead"><h2>${esc(L(SHOPS.workshop.name))}</h2><span class="num" style="font-size:24px;color:var(--gold)">$${S.money}</span><button class="btn small ghost" data-act="close">${t('close')}</button></div>
    <div class="tabs">${['tools','shop','gear'].map(k => `<button class="btn small ${wsTab === k ? 'on' : ''}" data-act="wstab" data-k="${k}">${t(k === 'tools' ? 'wsTools' : k === 'shop' ? 'wsShop' : 'wsGear')}</button>`).join('')}</div>
    <div class="list">${body}</div>`);
}
function showHospital(){
  const lines = [['小燈，攤子還好嗎？別太累了。','Tiểu Đăng, quán vẫn ổn chứ? Đừng làm quá sức nhé.'],
    ['聽說夜市的燈籠一盞一盞亮了，外婆好開心。','Nghe nói lồng đèn chợ đêm sáng lại từng chiếc, bà vui lắm.'],
    ['醫生說我快可以出院了。最後那幾道菜，就靠你了。','Bác sĩ bảo bà sắp được xuất viện rồi. Mấy món cuối trông cả vào cháu.']];
  const g = SPECIAL.grandma, b = bills(), line = S.ended ? ['我已經出院啦！','Bà xuất viện rồi!'] : lines[Math.min(2, Math.floor(cardsDone() / 5))];
  openModal(`<div class="shead"><h2>${t('hospT')}</h2><button class="btn small ghost" data-act="close">${t('close')}</button></div>
    <div class="row" style="align-items:flex-start;flex-wrap:nowrap">${portraitHTML(g.look, L(g.name))}<p class="dtext">「${esc(L(line))}」</p></div>
    <div class="score"><span>${t('rent')}</span><span class="num">$${b.rent}</span><span>${t('power')}</span><span class="num">$${b.power}</span><span>${t('hospital')}</span><span class="num">$${b.hosp}</span></div>
    <div class="total"><span>${t('billT')}</span><span class="num">$${billTotal()}</span></div>
    <button class="btn primary" data-act="visit" ${S.visited === S.day ? 'disabled' : ''}>${S.visited === S.day ? t('visited') : t('visit')}</button>`);
  paintPortraits($('#sheet'));
}

/* ---------- casino ---------- */
let casTab = 'dice', casBet = 100;
const CAS = { busy: false, dice: [1, 1, 1], reels: ['🏮', '💰', '7️⃣'], card: 1 + rnd(13), msg: '', ok: 0 };
const SLOT_SYM = ['🍜', '🥟', '🍢', '🥭', '🏮', '💰', '7️⃣'], CARD_N = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const PIPS = { 1:[4], 2:[0,8], 3:[0,4,8], 4:[0,2,6,8], 5:[0,2,4,6,8], 6:[0,2,3,5,6,8] };
const dieHTML = n => `<div class="die">${Array.from({ length: 9 }, (_, k) => `<i class="${PIPS[n].includes(k) ? 'on' : ''}"></i>`).join('')}</div>`;
function showCasino(){
  const can = !CAS.busy && S.money >= casBet;
  let game = '';
  if (casTab === 'dice') game = `<div class="row" style="justify-content:center;gap:14px" id="casview">${CAS.dice.map(dieHTML).join('')}</div>
    <div class="row"><button class="btn primary big" style="flex:1" data-act="casdice" data-k="big" ${can ? '' : 'disabled'}>${t('big')}</button><button class="btn jade big" style="flex:1" data-act="casdice" data-k="small" ${can ? '' : 'disabled'}>${t('small')}</button></div>`;
  else if (casTab === 'slots') game = `<div class="reels" id="casview">${CAS.reels.map(x => `<span>${x}</span>`).join('')}</div><p class="muted" style="font-size:11px;text-align:center">${t('payTable')}</p>
    <button class="btn primary big" data-act="casslot" ${can ? '' : 'disabled'}>🎰 ${t('spin')}</button>`;
  else game = `<div class="row" style="justify-content:center;gap:14px" id="casview"><div class="pcard">${CARD_N[CAS.card]}</div><div class="pcard back">?</div></div><p class="muted" style="font-size:11px;text-align:center">${t('cardRule')}</p>
    <div class="row"><button class="btn primary big" style="flex:1" data-act="cascard" data-k="hi" ${can ? '' : 'disabled'}>▲ ${t('higher')}</button><button class="btn jade big" style="flex:1" data-act="cascard" data-k="lo" ${can ? '' : 'disabled'}>▼ ${t('lower')}</button></div>`;
  openModal(`<div class="shead"><h2>🎲 ${t('casT')}</h2><span class="num" style="font-size:24px;color:var(--gold)">$${S.money}</span><button class="btn small ghost" data-act="close">${t('close')}</button></div>
    <p class="warn" style="font-size:12px">${t('casWarn')}</p>
    <div class="tabs">${['dice','slots','cards'].map(k => `<button class="btn small ${casTab === k ? 'on' : ''}" data-act="castab" data-k="${k}">${t(k)}</button>`).join('')}</div>
    <div class="row"><span class="muted">${t('bet')}</span>${[50, 100, 500, 1000].map(v => `<button class="btn small ${casBet === v ? 'on primary' : ''}" data-act="casbet" data-k="${v}">$${v}</button>`).join('')}</div>
    <div class="casino frame">${game}<p class="casmsg ${CAS.ok > 0 ? 'good' : CAS.ok < 0 ? 'bad' : 'muted'}" id="casmsg">${esc(CAS.msg)}</p></div>`);
}
function casSettle(net, msg){ S.money += net; CAS.ok = Math.sign(net); CAS.msg = msg || (net > 0 ? t('win', net) : net < 0 ? t('lose', -net) : t('push')); CAS.busy = false;
  net > 0 ? (sfx.coin(), sfx.perfect()) : net < 0 ? sfx.bad() : sfx.tap(); save(); renderHud(); showCasino(); }
function casAnimate(ms, frame, done){ CAS.busy = true; CAS.msg = ''; CAS.ok = 0; showCasino(); const t0 = performance.now();
  const iv = setInterval(() => { const v = $('#casview'); if (v) frame(v); sfx.tap(); if (performance.now() - t0 > ms) { clearInterval(iv); done(); } }, 90); }
function casDice(k){
  const bet = casBet; if (CAS.busy || S.money < bet) return;
  casAnimate(1000, v => v.innerHTML = [1, 2, 3].map(() => dieHTML(1 + rnd(6))).join(''), () => {
    CAS.dice = [1 + rnd(6), 1 + rnd(6), 1 + rnd(6)]; const sum = CAS.dice.reduce((a, b) => a + b, 0), tri = CAS.dice[0] === CAS.dice[1] && CAS.dice[1] === CAS.dice[2];
    if (tri) return casSettle(-bet, t('triple'));
    casSettle((k === 'big') === (sum >= 11) ? bet : -bet, null);
  });
}
function casSlot(){
  const bet = casBet; if (CAS.busy || S.money < bet) return;
  const fin = [pick(SLOT_SYM), pick(SLOT_SYM), pick(SLOT_SYM)];
  casAnimate(1300, v => { const el = v.querySelectorAll('span'); const el2 = performance.now(); el.forEach((x, j) => { if (!x.dataset.stop) x.textContent = pick(SLOT_SYM); }); }, () => {
    CAS.reels = fin; const [a, b, c] = fin;
    const mult = a === b && b === c ? ({ '7️⃣': 30, '💰': 15, '🏮': 8 }[a] || 4) : (a === b || b === c || a === c) ? 1.5 : 0;
    casSettle(Math.round(bet * mult) - bet, null);
  });
}
function casCard(k){
  const bet = casBet; if (CAS.busy || S.money < bet) return;
  const cur = CAS.card, nx = 1 + rnd(13);
  casAnimate(700, v => { const b = v.querySelector('.back'); if (b) b.textContent = CARD_N[1 + rnd(13)]; }, () => {
    CAS.card = nx; const ok = k === 'hi' ? nx > cur : nx < cur;
    casSettle(ok ? Math.round(bet * .9) : -bet, `${CARD_N[cur]} → ${CARD_N[nx]}・` + (ok ? t('win', Math.round(bet * .9)) : t('lose', bet)));
  });
}
/* ---------- bank & loan shark ---------- */
let bankTab = 'bank';
function showBank(){
  const bl = S.loans.find(l => l.t === 'bank'), sh = debtOf('shark'), late = S.loans.filter(l => l.t === 'shark').map(l => S.day - l.day);
  const body = bankTab === 'bank'
    ? `<p class="muted" style="font-size:13px">${t('bankInfo')}</p>${bl ? `<p class="warn">${t('owe', bl.owed)}</p><button class="btn" data-act="repay" data-k="bank" ${S.money < bl.owed ? 'disabled' : ''}>${t('repayAll', bl.owed)}</button>`
      : `<div class="row">${LOAN.bank.opts.map(a => `<button class="btn primary" data-act="borrow" data-k="bank" data-a="${a}" ${a > 1000 && S.rep < 3 ? 'disabled' : ''}>${t('borrow', a)} → $${Math.round(a * (1 + LOAN.bank.rate))}</button>`).join('')}</div>`}`
    : `<div class="row" style="flex-wrap:nowrap;align-items:flex-start">${portraitHTML(SPECIAL.gang.look, L(['虎哥','Anh Hổ']))}<div class="col"><p class="muted" style="font-size:13px">${t('sharkInfo')}</p>
      ${sh ? `<p class="bad">${t('owe', sh)}・${t('daysLeft', Math.max(...late))}</p><div class="row"><button class="btn" data-act="repay" data-k="shark" data-a="500" ${S.money < Math.min(500, sh) ? 'disabled' : ''}>${t('repay500')}</button><button class="btn primary" data-act="repay" data-k="shark" ${S.money < sh ? 'disabled' : ''}>${t('repayAll', sh)}</button></div>` : `<p class="good">${t('noDebt')}</p>`}
      <div class="row">${LOAN.shark.opts.map(a => `<button class="btn danger" data-act="borrow" data-k="shark" data-a="${a}">${t('borrow', a)}</button>`).join('')}</div></div></div>`;
  openModal(`<div class="shead"><h2>${esc(L(SHOPS.bank.name))}</h2><span class="num" style="font-size:24px;color:var(--gold)">$${S.money}</span><button class="btn small ghost" data-act="close">${t('close')}</button></div>
    <div class="tabs"><button class="btn small ${bankTab === 'bank' ? 'on' : ''}" data-act="banktab" data-k="bank">🏦 ${t('bankTab')}</button><button class="btn small ${bankTab === 'shark' ? 'on' : ''}" data-act="banktab" data-k="shark">🐯 ${t('sharkTab')}</button></div>${body}`);
  paintPortraits($('#sheet'));
}

/* ---------- stats / album / saves ---------- */
function showStats(){
  const rows = Object.entries(STATS).map(([k, s]) => { let pips = ''; for (let j = 1; j <= 10; j++) pips += `<i class="${j <= S.stats[k] ? 'on' : ''}"></i>`;
    return `<div class="stat"><b>${esc(L(s.name))} <span class="num" style="font-size:20px">${S.stats[k]}</span></b><div class="pips">${pips}</div>
      <button class="btn small" data-act="addstat" data-k="${k}" ${S.points < 1 || S.stats[k] >= 10 ? 'disabled' : ''}>＋1</button><small>${esc(L(s.desc))}</small></div>`; }).join('');
  openModal(`<div class="shead"><h2>${t('statT')}</h2><button class="btn small ghost" data-act="close">${t('close')}</button></div>
    <p class="muted" style="font-size:13px">${t('statPts', S.lv, S.points)}</p><div class="list">${rows}</div>
    <p class="muted" style="font-size:12px">${t('statInfo', patienceMax(), prepMax().toFixed(1), (7 + S.stats.heat * 1.5).toFixed(1))}</p>`);
}
function showAlbum(){
  const cards = DISHES.map((d, i) => { const f = S.frags[i], done = f >= 3, seen = d.zone <= S.zone;
    return `<button class="card ${done ? 'done' : 'lock'}" ${done ? `data-act="card" data-i="${i}"` : 'disabled'}><span class="e">${seen ? d.emoji : '？'}</span><b>${seen ? esc(dName(i)) : '？？？'}</b><small>${done ? t('unlocked') : t('fragN', f)}</small></button>`; }).join('');
  openModal(`<div class="shead"><h2>${t('albumT', cardsDone())}</h2><button class="btn small ghost" data-act="close">${t('close')}</button></div>
    <p class="muted" style="font-size:13px">${t('albumHint')}</p><div class="cards">${cards}</div>`);
}
function recipeCard(i){
  const d = DISHES[i];
  return `<div class="recipe"><p class="eyebrow">${t('cardNo', String(i + 1).padStart(2, '0'), esc(L(ZONES[d.zone].cuisine)))}</p>
    <h3>${d.emoji} ${esc(dName(i))}</h3><p class="muted" style="font-size:13px">${esc(t('guest', L(d.who)))}・${esc(t('method', L(METHODS[d.m].name)))}</p>
    <p class="quote">「${esc(L(d.memory))}」</p><p class="quote">${esc(L(d.story))}</p>
    <p class="muted" style="font-size:13px">${esc(t('recipe', d.steps.map(ingName).join(' → ')))}</p><p class="fact">${esc(t('fact', L(d.fact)))}</p></div>`;
}
function showSaves(msg = ''){
  openModal(`<div class="shead"><h2>${t('saveT')}</h2><button class="btn small ghost" data-act="close">${t('close')}</button></div>
    <p class="muted" style="font-size:13px">${t('saveHint')}</p>
    ${S ? `<label class="muted" for="exportBox" style="font-size:12px">${t('saveCode')}</label><textarea id="exportBox" readonly>${esc(JSON.stringify(S))}</textarea><button class="btn" data-act="copy">${t('copy')}</button>` : ''}
    <label class="muted" for="importBox" style="font-size:12px">${t('pasteHere')}</label><textarea id="importBox" placeholder='{"v":2, ...}'></textarea>
    <input id="importFile" type="file" accept=".json,application/json,text/plain" class="muted">
    <button class="btn primary" data-act="import">${t('load')}</button><p id="saveMsg" class="warn" role="status">${esc(msg)}</p>`);
  const f = $('#importFile');
  f.addEventListener('change', () => { const file = f.files && f.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => { $('#importBox').value = String(r.result || ''); }; r.readAsText(file); });
}
function doImport(){
  let o = null; try { o = patch(JSON.parse(($('#importBox').value || '').trim())); } catch (e) {}
  const s = valid(o) ? o : migrate(o);
  if (!s) { $('#saveMsg').textContent = t('badSave'); sfx.bad(); return; }
  S = s; save(); N = null; closeModal(); toast(t('loaded')); sfx.ok(); showHub();
}

/* ---------- night: customers ---------- */
const HAIRS = ['#1C1C28','#2B2420','#4A3426','#3A2A1E','#5B3A29','#8A5A3A'];
const TOPS = ['#4FC1B0','#E2574C','#7C8BD6','#C98BB9','#E8C547','#6FA36B','#D98E48','#5A6A8A','#B04A6A'];
const BOTS = ['#2A2F3A','#3B5BA5','#4A4560','#5A4636','#2E2A26'];
function randomLook(){ return { skin:pick(SK), hair:pick(HAIRS), hs:pick(['short','long','bun','bob','pony','spiky','short']), top:pick(TOPS), bot:pick(BOTS),
  hat: Math.random() < .12 ? 'cap' : undefined, acc: Math.random() < .2 ? ['glasses'] : [] }; }
function pickDishes(n){
  const pool = unlocked(), out = [];
  for (let k = 0; k < n; k++) {
    const w = pool.map(i => (DISHES[i].zone === S.zone ? 3 : 1) * (S.frags[i] < 3 ? 2 : 1));
    let r = Math.random() * w.reduce((a, b) => a + b, 0), j = 0; while (r > w[j]) { r -= w[j]; j++; }
    out.push(pool[Math.min(j, pool.length - 1)]);
  }
  return out;
}
function makeCustomer(i){
  let type = 'normal', look = randomLook(), name = LANG ? 'Khách' : '客人';
  const storyHere = N.people.some(p => p.type === 'story' && p.dish === i);
  if (S.frags[i] < 3 && !storyHere && Math.random() < .5) { type = 'story'; look = DISHES[i].look; name = L(DISHES[i].who); }
  else if (S.day >= 4 && Math.random() < .14) { type = Math.random() < .55 ? 'boss' : 'critic'; look = SPECIAL[type].look; name = L(SPECIAL[type].name); }
  return { id: Math.random(), type, dish: i, look, name, x: ART.ENTRY.x, by: ART.ENTRY.by, seat: -1, state: 'in', pat: 0, max: patienceMax(), t: 0, mood: null, showDish: null, line: pick(NORMAL_LINES) };
}
function freeSeat(){
  const taken = new Set(N.people.filter(p => p.seat >= 0 && p.state !== 'out').map(p => p.seat));
  const list = ART.SEATS[S.shop - 1].map((s, k) => k).filter(k => !taken.has(k));
  return list.length ? pick(list) : -1;
}
function spawn(p, seat){ p.seat = seat; const s = ART.SEATS[S.shop - 1][seat]; p.tx = s.x; p.tby = s.by; N.people.push(p); N.spawned++; sfx.door(); }
function goOut(p, mood){ p.state = 'out'; p.seat = -1; p.mood = mood; p.showDish = null; p.tx = ART.EXIT_X; p.tby = ART.ENTRY.by; }
function moveTo(p, dt){
  const dx = p.tx - p.x, dy = p.tby - p.by, d = Math.hypot(dx, dy), sp = 55 * dt;
  if (d <= sp) { p.x = p.tx; p.by = p.tby; return true; }
  p.x += dx / d * sp; p.by += dy / d * sp; p.flip = dx < 0; return false;
}
function personView(p){
  const seated = ['wait','order','eat'].includes(p.state) && p.seat >= 0;
  return { x: Math.round(p.x), by: Math.round(p.by), look: p.look, walk: ['in','out','stand'].includes(p.state) && !p.arrived, seated,
    mood: p.state === 'wait' ? 'wait' : p.mood, flip: seated ? ART.SEATS[S.shop - 1][p.seat].flip : p.flip, eat: p.state === 'eat', dish: p.showDish, alpha: p.look.ghost ? .7 : 1 };
}
function sceneState(){
  const ok = !!S;
  return { lv: ok ? S.shop : 1, sign: ok ? S.gear.sign : 0, fan: ok ? S.gear.fan : 0, lit: ok ? cardsDone() : 3, open: view === 'night' || view === 'title',
    dark: !!(N && N.dark), candles: !!(N && N.candles), cooking: N && N.c && ['warm','heat'].includes(N.phase) ? DISHES[N.c.i].m : null,
    tools: ok ? S.tools : { wok:1, pan:1, pot:1, grill:1, fryer:1, steamer:1 }, people: N ? N.people.map(personView) : AMB.map(personView) };
}
// a few ambient walkers on the title screen
const AMB = [];
function ambient(dt){
  if (AMB.length < 3 && Math.random() < dt * .4) { const l = Math.random() < .5; AMB.push({ look: randomLook(), x: l ? -14 : 494, by: 244 + rnd(14), tx: l ? 494 : -14, tby: 0, state: 'out', seat: -1, mood: null }); AMB[AMB.length - 1].tby = AMB[AMB.length - 1].by; }
  for (const p of AMB) if (moveTo(p, dt * .6)) p.done = 1;
  for (let k = AMB.length - 1; k >= 0; k--) if (AMB[k].done) AMB.splice(k, 1);
}

/* ---------- night: open / simulate ---------- */
function openStall(){
  const n = customersTonight();
  N = { people: [], queue: pickDishes(n), spawned: 0, spawnT: 1, phase: 'idle', c: null, active: null, secret: 1, dark: false, candles: false, reason: '', stopSpawn: false,
    event: null, eventAt: 99, evDone: false, ev: null,
    log: { income: 0, tips: 0, perfect: 0, normal: 0, fail: 0, left: 0, frags: 0, cards: [], repStart: S.rep, lvStart: S.lv, best: -1 } };
  if (S.day >= 3 && Math.random() < .32) {
    const opts = ['gang']; if (S.day >= 4) opts.push('blackout'); if (S.day >= 5) opts.push('ghost', 'ghost');
    N.event = pick(opts); N.eventAt = 1 + rnd(Math.max(1, n - 2)) + 1;
  }
  if (sharkLate()) { N.event = 'shark'; N.eventAt = 1; }
  sfx.ok(); go('night'); renderNightUI();
}
function simNight(dt){
  const n = N, frozen = n.phase === 'event' || n.phase === 'evout';
  if (!n.stopSpawn && n.queue.length && !frozen && n.phase !== 'result') {
    n.spawnT -= dt;
    if (n.spawnT <= 0) { const s = freeSeat(); if (s >= 0) { spawn(makeCustomer(n.queue.shift()), s); n.spawnT = 5 + Math.random() * 4; } else n.spawnT = 1.2; }
  }
  let dockDirty = false;
  for (const p of n.people) {
    p.t += dt;
    if (p.state === 'in') { if (moveTo(p, dt)) { p.state = 'wait'; p.pat = p.max; dockDirty = true; } }
    else if (p.state === 'out') moveTo(p, dt);
    else if (p.state === 'stand') p.arrived = moveTo(p, dt);
    else if (p.state === 'wait') { if (!frozen) p.pat -= dt * .5; if (p.pat <= 0) { leaveAngry(p); dockDirty = true; } }
    else if (p.state === 'order') { if (['order','prep','warm','heat'].includes(n.phase)) p.pat -= dt; if (p.pat <= 0) activeTimeout(); }
    else if (p.state === 'eat') { p.eatT -= dt; if (p.eatT <= 0) goOut(p, 'happy'); }
  }
  n.people = n.people.filter(p => !(p.state === 'out' && Math.abs(p.x - ART.EXIT_X) < 1));
  if (dockDirty && n.phase === 'idle') renderDock();
  if (n.phase === 'prep') { n.c.prep -= dt; if (n.c.prep <= 0) { toast(t('timeUp')); startWarm(); } }
  else if (n.phase === 'warm') { n.c.warm -= dt; if (n.c.warm <= 0) startHeat(); }
  else if (n.phase === 'heat') stepHeat(dt);
  if (n.event && !n.evDone && n.spawned >= n.eventAt && n.phase === 'idle') startEvent();
  if (n.phase === 'idle' && !n.stopSpawn && S.stamina < 12) {
    n.stopSpawn = true; n.queue = []; n.reason = t('staminaOut');
    n.people.forEach(p => { if (p.state === 'wait' || p.state === 'in') goOut(p, null); }); renderDock();
  }
  if (n.phase === 'idle' && !n.queue.length && !n.people.length) endNight(n.reason || t('allServed'));
}
function leaveAngry(p, msg){
  goOut(p, 'angry'); S.rep = clamp(S.rep - .4, 1, 5); N.log.left++; sfx.bad(); renderHud();
  floatText(t('leftRep'), p.x, p.by - 26, 'var(--red)'); if (msg) toast(msg);
}
function activeTimeout(){
  const p = N.active; N.active = null; N.c = null; N.phase = 'idle';
  if (p.type === 'gang' || p.type === 'ghost') { evOutcome(p.type === 'gang' ? 'feedBad' : 'ghostBad'); return; }
  leaveAngry(p, t('leftAngry')); renderNightUI();
}

/* ---------- night: ordering ---------- */
function beginOrder(p){
  if (!N || N.phase !== 'idle' || p.state !== 'wait') return;
  N.active = p; p.state = 'order'; p.mood = null; sfx.tap();
  if (p.extra === undefined) { const ex = EXTRAS.filter(e => !DISHES[p.dish].steps.includes(e[0])); p.extra = Math.random() < .45 && ex.length ? pick(ex) : null; }
  N.phase = 'order'; renderNightUI();
}
const missPen = () => clamp(.14 - S.stats.memory * .008, .05, .14);
function miss(){ const p = N.active; if (p) p.pat -= p.max * missPen(); N.c.misses = (N.c.misses || 0) + 1; sfx.bad(); flash('miss'); }
function confirmCook(){
  const p = N.active, i = p.dish, miss = lacking(i);
  if (miss.length) { N.active = null; N.phase = 'idle';
    if (p.type === 'gang' || p.type === 'ghost') return evOutcome(p.type === 'gang' ? 'feedBad' : 'ghostBad');
    leaveAngry(p, t('noIng', miss.map(ingName).join('、'))); return renderNightUI(); }
  DISHES[i].steps.forEach(take);
  let noSeason = !take('鹽'); if (DISHES[i].sweet && !take('糖')) noSeason = true;
  S.stamina = Math.max(0, S.stamina - 12);
  N.c = { i, m: DISHES[i].m, noSeason, extra: p.extra ? p.extra[0] : null }; sfx.ok(); renderHud(); startPrep();
}

/* ---------- night: cooking minigames ---------- */
function startPrep(){
  const c = N.c, d = DISHES[c.i];
  c.steps = d.steps.concat(c.extra ? [c.extra] : []);
  c.pool = shuffle(c.steps.concat(shuffle(Object.keys(ING).filter(s => !c.steps.includes(s) && !ING[s].seas)).slice(0, 8 - c.steps.length)));
  c.extraDone = false; c.step = 0; c.mistakes = 0; c.correct = 0; c.pmax = prepMax(); c.prep = c.pmax;
  N.phase = 'prep'; renderNightUI();
}
function onIng(s, el){
  const c = N.c;
  if (s === c.steps[c.step]) {
    if (c.step === 4) { if (!take(s)) return; c.extraDone = true; } else c.correct++;
    c.step++; sfx.tap(); if (c.step >= c.steps.length) return startWarm(); renderNightUI(); }
  else { c.mistakes++; sfx.bad(); if (el) { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    const m = $('#misses'); if (m) m.textContent = t('miss', c.mistakes); }
}
function startWarm(){ const c = N.c; c.warm = c.wmax = warmTime(c.m); c.pos = 0; N.phase = 'warm'; sfx.cook(c.m); renderNightUI(); }
/* Each cookware has its own minigame. Result q (0..1) → heat score 30 / 15 / 0. */
const ARW = ['←','↑','→','↓'], ARK = { ArrowLeft:0, ArrowUp:1, ArrowRight:2, ArrowDown:3 };
const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
function startHeat(){
  const c = N.c, lv = S.tools[c.m], g = METHODS[c.m].game;
  Object.assign(c, { game: g, pos: 0, dir: 1, prog: 0, hold: false, hits: [], burnt: false, q: 0,
    zw: zoneW(c.m), speed: ptrSpeed(c.m, DISHES[c.i].zone), hmax: 7 + (lv - 1) * .8 });
  c.zc = 10 + c.zw / 2 + Math.random() * (80 - c.zw); c.pass = 0; c.maxPass = lv >= 4 ? 4 : 3;
  if (g === 'hold') { c.zw = Math.min(60, c.zw * 1.8); c.zc = 30 + Math.random() * 40; c.pos = 10; }
  if (g === 'arrows') { c.seq = Array.from({ length: 6 - Math.floor((lv - 1) / 2) }, () => rnd(4)); c.idx = 0; }
  if (g === 'rhythm') { const gap = 1 - (lv - 1) * .05; c.notes = Array.from({ length: 5 }, (_, k) => ({ at: 1.4 + k * gap + (k % 2 ? .15 : 0), r: -1 }));
    c.clock = 0; c.win = .13 + (lv - 1) * .03; c.hmax = c.notes[4].at + 1; }
  c.ht = c.hmax; N.phase = 'heat'; renderNightUI();
}
function stepHeat(dt){
  const c = N.c, g = c.game, sp = c.speed;
  if (g !== 'sweep') { c.ht -= dt; if (c.ht <= 0) return timeoutHeat(); }
  if (g === 'sweep') { c.pos += c.dir * sp * (.55 + c.pass * .2) * dt;
    if (c.pos >= 100 || c.pos <= 0) { c.pos = clamp(c.pos, 0, 100); c.dir *= -1; if (++c.pass >= c.maxPass) { c.burnt = true; finishHeat(0); } } }
  else if (g === 'mash') { c.prog = Math.max(0, c.prog - 14 * dt); c.pos = c.prog; }
  else if (g === 'hold') {
    c.pos = clamp(c.pos + (c.hold ? 60 : -48) * dt * (sp / 110) + Math.sin(T * 2.7) * 14 * dt, 0, 100);
    if (Math.abs(c.pos - c.zc) <= c.zw / 2) { c.prog += 22 * dt; if (c.prog >= 100) finishHeat(1); }
  }
  else if (g === 'multi') { c.pos += c.dir * sp * dt; if (c.pos >= 100) { c.pos = 100; c.dir = -1; } if (c.pos <= 0) { c.pos = 0; c.dir = 1; } }
  else if (g === 'arrows') c.pos = c.idx / c.seq.length * 100;
  else if (g === 'rhythm') {
    c.clock += dt; c.pos = clamp(c.clock / c.hmax * 100, 0, 100);
    c.notes.forEach(nn => { if (nn.r < 0 && c.clock - nn.at > c.win * 2) { nn.r = 0; flash('miss'); } });
    if (c.notes.every(nn => nn.r >= 0)) finishHeat(avg(c.notes.map(nn => nn.r)));
  }
}
function timeoutHeat(){
  const c = N.c, g = c.game;
  if (g === 'mash' || g === 'hold') return finishHeat(c.prog / 100 * .7);
  if (g === 'arrows') return finishHeat(c.idx / c.seq.length * .6);
  if (g === 'multi') return finishHeat(c.hits.reduce((x, y) => x + y, 0) / 3);
  finishHeat(avg(c.notes.map(nn => Math.max(0, nn.r))));
}
const zoneQ = () => { const c = N.c, d = Math.abs(c.pos - c.zc), g = c.zw / 2; return d <= g ? 1 : d <= g + 8 ? .5 : 0; };
function heatAction(k){ // k = 'tap' or an arrow index
  const c = N && N.c; if (!c || N.phase !== 'heat') return;
  const g = c.game;
  if (g === 'mash') { c.prog += 8 + (S.tools[c.m] - 1) * 2.5 + S.stats.heat * .6; sfx.tap(); if (c.prog >= 100) finishHeat(1); }
  else if (g === 'sweep') { const q = zoneQ(); if (q > 0) finishHeat(q); else miss(); }
  else if (g === 'multi') {
    const q = zoneQ(); if (!q) return miss(); c.hits.push(q); q >= 1 ? sfx.ok() : sfx.tap(); flash(q >= 1 ? 'perfect' : 'good');
    if (c.hits.length >= 3) return finishHeat(avg(c.hits));
    c.zc = 10 + c.zw / 2 + Math.random() * (80 - c.zw);
  }
  else if (g === 'arrows') {
    if (typeof k !== 'number') return;
    if (k === c.seq[c.idx]) { c.idx++; sfx.tap(); if (c.idx >= c.seq.length) return finishHeat(1); }
    else { c.idx = 0; miss(); }
    const el = $('#arrows'); if (el) el.innerHTML = arrowsHTML();
  }
  else if (g === 'rhythm') {
    const nn = c.notes.filter(x => x.r < 0).sort((x, y) => Math.abs(x.at - c.clock) - Math.abs(y.at - c.clock))[0]; if (!nn) return;
    const d = Math.abs(nn.at - c.clock);
    if (d <= c.win) { nn.r = 1; sfx.ok(); flash('perfect'); } else if (d <= c.win * 2) { nn.r = .6; sfx.tap(); flash('good'); } else miss();
  }
}
function finishHeat(q){ if (!N || N.phase !== 'heat') return; N.c.q = q; onStop(); }
function flash(k){
  const el = $('#hflash'); if (!el) return;
  el.textContent = k === 'miss' ? 'MISS' : L(k === 'perfect' ? ['完美！','Hoàn hảo!'] : ['不錯！','Khá!']);
  el.className = 'hflash ' + k; void el.offsetWidth; el.classList.add('go');
}
function arrowsHTML(){ const c = N.c; if (!c.seq) return ""; return c.seq.map((a, k) => `<span class="${k < c.idx ? 'ok' : k === c.idx ? 'cur' : ''}">${ARW[a]}</span>`).join(''); }
function onStop(){
  const c = N.c, p = N.active, q = c.q || 0;
  const heat = c.burnt ? 0 : q >= .8 ? 30 : q >= .45 ? 15 : 0;
  const ing = Math.round(50 * Math.min(4, c.correct) / (4 + c.mistakes));
  const speed = Math.round(20 * clamp(p.pat / p.max, 0, 1));
  const total = Math.max(0, ing + heat + speed - (c.noSeason ? 15 : 0));
  const tier = total >= 80 ? 1 : total >= 50 ? 2 : 3;
  const bonus = toolBonus(c.m), rank = tier < 3 ? rankOf(total + bonus) : null;
  c.res = { ing, heat, speed, total, tier, bonus, rank, hl: heat === 30 ? 0 : heat === 15 ? 1 : 2 };
  tier === 1 ? sfx.perfect() : tier === 2 ? sfx.ok() : sfx.bad(); sfx.cook(c.m);
  if (c.noSeason) toast(t('noSalt'));
  N.phase = 'result'; renderNightUI();
}
function onRedo(){ N.secret--; const p = N.active; p.pat = Math.max(p.pat, p.max * .6); toast(t('redoToast')); startPrep(); }
function addExp(n){
  S.exp += n;
  while (S.exp >= expNeed(S.lv)) { S.exp -= expNeed(S.lv); S.lv++; S.points += 2; toast(t('lvUp', S.lv)); sfx.lantern(); }
}
function onServe(){
  const p = N.active, c = N.c, r = c.res, i = c.i, z = DISHES[i].zone;
  const mult = r.rank ? r.rank.mult : 0, price = Math.round(dishPrice(i) * mult);
  let got = 0, card = -1; S.served++;
  if (r.rank) N.log.best = Math.max(N.log.best, RANKS.length - 1 - RANKS.indexOf(r.rank));
  if (p.type === 'gang' || p.type === 'ghost') {
    N.active = null; N.c = null; N.phase = 'idle';
    if (r.tier < 3) { p.state = 'eat'; p.eatT = 3; p.showDish = DISHES[i].emoji; }
    evOutcome(p.type === 'gang' ? (r.tier < 3 ? 'feedOk' : 'feedBad') : (r.tier < 3 ? 'ghostOk' : 'ghostBad')); return;
  }
  if (r.tier === 3) { S.rep = clamp(S.rep - .4, 1, 5); N.log.fail++; addExp(5); if (p.type === 'critic') S.rep = clamp(S.rep - .6, 1, 5); goOut(p, 'angry'); }
  else {
    got = price; N.log[r.tier === 1 ? 'perfect' : 'normal']++; addExp((r.tier === 1 ? 30 : 15) + z * 5);
    if (r.tier === 1) { const tip = 10 + S.stats.charm * 5; got += tip; N.log.tips += tip; }
    if (c.extra && c.extraDone) { const xt = 25 + S.stats.memory * 8; got += xt; N.log.tips += xt; S.rep = clamp(S.rep + .1, 1, 5); toast(t('extraOk', xt)); }
    else if (c.extra) { S.rep = clamp(S.rep - .1, 1, 5); toast(t('extraMiss')); }
    if (p.type === 'boss') {
      if (['SR','SSR','UR'].includes(r.rank.id)) { const bonus = price * 2 + 200; got += bonus; N.log.tips += bonus; S.rep = clamp(S.rep + .3, 1, 5); toast(t('bossOk')); }
      else { S.rep = clamp(S.rep - .6, 1, 5); toast(t('bossBad')); }
    } else if (p.type === 'critic') {
      const id = r.rank.id, dr = id === 'SSR' || id === 'UR' ? 1 : id === 'SR' ? .3 : -.5;
      S.rep = clamp(S.rep + dr, 1, 5); toast(t(dr > .5 ? 'criticGood' : dr > 0 ? 'criticMeh' : 'criticBad'));
    } else S.rep = clamp(S.rep + (r.tier === 1 ? (p.type === 'story' ? .3 : .15) : 0), 1, 5);
    if (p.type === 'story' && r.tier === 1 && S.frags[i] < 3) { S.frags[i]++; N.log.frags++; if (S.frags[i] === 3) { card = i; N.log.cards.push(i); } }
    S.money += got; N.log.income += got; p.state = 'eat'; p.eatT = 3.5; p.showDish = DISHES[i].emoji; p.mood = 'happy';
    floatText('+$' + got, p.x, p.by - 24); sfx.coin();
  }
  N.active = null; N.c = null; N.phase = 'idle'; renderHud();
  if (card >= 0) { sfx.lantern(); openModal(`<div class="shead"><h2>${t('lantern', cardsDone())}</h2></div>${lanterns(cardsDone())}${recipeCard(card)}<button class="btn primary" data-act="close">${t('keepGoing')}</button>`, renderNightUI); }
  else renderNightUI();
}

/* ---------- night: events ---------- */
function startEvent(){
  const n = N, k = n.event; n.evDone = true; n.phase = 'event';
  n.ev = { k, amt: Math.round((300 + S.day * 15) / 10) * 10, people: [] };
  if (k === 'shark') n.ev.amt = debtOf('shark');
  if (k === 'gang' || k === 'shark') {
    [['gang', 300, 232], ['gang2', 318, 240]].forEach(([s, x, y]) => { const p = { id: Math.random(), type: 'gangX', look: SPECIAL[s].look, name: L(SPECIAL[s].name), x: ART.ENTRY.x, by: ART.ENTRY.by, tx: x, tby: y, seat: -1, state: 'stand', t: 0, mood: 'angry' }; n.people.push(p); n.ev.people.push(p); });
    sfx.thud();
  } else if (k === 'ghost') {
    const s = freeSeat(), p = { id: Math.random(), type: 'ghostX', look: SPECIAL.ghost.look, name: L(SPECIAL.ghost.name), x: 250, by: 232, tx: 250, tby: 232, seat: -1, state: 'stand', t: 0 };
    if (s >= 0) { const st = ART.SEATS[S.shop - 1][s]; Object.assign(p, { seat: s, x: st.x, by: st.by, state: 'wait', pat: 999, max: 999 }); }
    n.people.push(p); n.ev.people.push(p); sfx.ghost();
  } else { n.dark = true; sfx.thud(); }
  renderNightUI();
}
function evChoice(k){
  const ev = N.ev, D = ev.amt;
  const payOr = amt => { if (S.money >= amt) { S.money -= amt; return true; } smash(); return false; };
  if (k === 'pay') { S.money -= D; evOutcome('pay'); }
  else if (k === 'haggle') { if (Math.random() < .25 + S.stats.charm * .07) evOutcome(payOr(Math.ceil(D / 2)) ? 'haggleOk' : 'smash'); else evOutcome(payOr(Math.round(D * 1.5)) ? 'haggleBad' : 'smash'); }
  else if (k === 'police') { if (Math.random() < .5) { S.rep = clamp(S.rep + .3, 1, 5); evOutcome('policeOk'); } else { S.money -= Math.min(S.money, Math.round(D * .3)); evOutcome('policeBad'); } }
  else if (k === 'feed' || k === 'ghostfeed') {
    const pool = unlocked().filter(i => !lacking(i).length), i = pool.length ? pick(pool) : pick(unlocked());
    const host = ev.people[0]; host.type = k === 'feed' ? 'gang' : 'ghost'; host.dish = i; host.max = patienceMax(); host.pat = host.max; host.state = 'order';
    N.active = host; N.phase = 'order'; renderNightUI(); return;
  }
  else if (k === 'salt') { for (let u = 0; u < 3; u++) take('鹽'); evOutcome('salt'); }
  else if (k === 'ignore') evOutcome(Math.random() < .5 ? 'ignoreOk' : 'ignoreBad');
  else if (k === 'candle') { S.money -= 60; N.candles = true; N.queue.push(...pickDishes(2)); evOutcome('candle'); }
  else if (k === 'closeup') evOutcome('closeup');
  else if (k === 'sharkpay') { payDebt('shark', D); evOutcome('sharkpay'); }
  else if (k === 'sharkhalf') { payDebt('shark', Math.ceil(D / 2)); evOutcome('sharkhalf'); }
  else if (k === 'sharkrun') { if (Math.random() < .4) evOutcome('sharkrunOk'); else { smash(); S.stamina = Math.max(0, S.stamina - 40); N.people.forEach(p => { if (p.state === 'wait') goOut(p, 'angry'); }); evOutcome('sharkrunBad'); } }
}
function smash(){ Object.keys(S.inv).forEach(k => { if (ING[k].f) S.inv[k] = []; }); S.rep = clamp(S.rep - .3, 1, 5); sfx.thud(); }
function evOutcome(o){
  const ev = N.ev, D = ev.amt;
  if (o === 'feedBad') { if (S.money >= Math.round(D * 1.5)) S.money -= Math.round(D * 1.5); else { smash(); o = 'smash'; } }
  if (o === 'feedOk') S.rep = clamp(S.rep + .2, 1, 5);
  if (o === 'ghostOk') { S.money += 300; S.rep = clamp(S.rep + .5, 1, 5); floatText('+$300', 250, 200); sfx.lantern(); }
  if (o === 'ghostBad' || o === 'ignoreBad') { S.rep = clamp(S.rep - .3, 1, 5); N.people.forEach(p => { if (p.state === 'wait') goOut(p, 'angry'); }); }
  if (o === 'closeup') { N.queue = []; N.stopSpawn = true; N.reason = t('closedEarly'); N.people.forEach(p => { if (p.state === 'wait' || p.state === 'in') goOut(p, null); }); }
  ev.out = o; N.phase = 'evout'; N.c = null; N.active = null; renderHud(); renderNightUI();
}
function evDone(){
  const ev = N.ev;
  ev.people.forEach(p => { if (p.state !== 'eat') goOut(p, ev.out === 'feedOk' || ev.out === 'ghostOk' ? 'happy' : null); else { p.eatT = Math.min(p.eatT, 2); } });
  if (ev.k === 'blackout' && ev.out === 'closeup') N.dark = true;
  N.phase = 'idle'; renderNightUI();
}

/* ---------- night: UI ---------- */
function patBar(p){ return `<div class="pat"><span>${t('patience')}</span><div class="bar"><i id="patbar"></i></div><span id="patnum" class="num" style="font-size:16px">${Math.ceil(p.pat)}</span></div>`; }
function renderNightUI(){
  if (view !== 'night' || !N) return;
  redraw = renderNightUI; renderDock();
  const n = N, p = n.active; let h = '';
  if (n.phase === 'idle') {
    const waiting = n.people.filter(q => q.state === 'wait').length;
    h = `<div class="tip frame">${waiting ? t('tapCustomer') : `<b>${esc(L(SHOP_LV[S.shop - 1].name))}</b>`} ・ ${n.queue.length + n.people.filter(q => q.state === 'in').length + waiting} 🙋${n.secret ? ` ・ ${t('secretLeft', n.secret)}` : ''}</div>`;
  } else if (n.phase === 'order') {
    const d = DISHES[p.dish];
    const lines = { normal: L(p.line) + ' ' + t('order', dName(p.dish)), boss: t('vipBoss', dName(p.dish)), critic: t('vipCritic', dName(p.dish)),
      story: `「${L(d.memory)}」 ${t('wantDish', dName(p.dish))}`,
      gang: L(['「先煮一碗{0}來，吃得爽再說。」','"Nấu tao bát {0} trước đã, ăn sướng rồi tính."']).replace('{0}', dName(p.dish)),
      ghost: L(['「……{0}……好冷……」','"...{0}... lạnh quá..."']).replace('{0}', dName(p.dish)) };
    const text = esc(lines[p.type] || lines.normal) + (p.extra ? `<br><b class="warn">✦ ${esc(t('extraReq', L(p.extra[1])))}</b>` : '');
    const need = d.steps.concat(p.extra ? [p.extra[0]] : []).map((k, j) => `<span class="chip ${have(k) ? '' : 'none'} ${j === 4 ? 'here' : ''}">${ING[k].e} ${esc(ingName(k))} <b>${have(k)}</b></span>`).join('');
    const miss = lacking(p.dish);
    const act = `<div class="rchips"><span class="muted" style="font-size:12px">${t('needIng')}</span>${need}</div><div class="row">${p.type === 'boss' ? `<span class="warn" style="font-size:13px">${t('rankNeed', 'SR')}</span>` : ''}
        ${miss.length ? `<span class="bad" style="font-size:13px">${esc(miss.map(ingName).join('、'))} ✕</span>` : ''}<span style="flex:1"></span>
        <button class="btn primary" data-act="cookit">${DISHES[p.dish].emoji} ${t('cookIt')} ・ ${esc(L(METHODS[d.m].name))}</button></div>`;
    const tag = p.type === 'story' ? `<span class="tag story">STORY</span>` : p.type === 'boss' || p.type === 'critic' ? `<span class="tag vip">VIP</span>` : p.type === 'gang' || p.type === 'ghost' ? `<span class="tag ev">EVENT</span>` : '';
    h = `<div class="dlg frame ${p.type === 'story' || tag ? 'gold' : ''}">${portraitHTML(p.look, p.name)}<div class="dbody">
      <p class="dtext"><span class="who">${esc(p.name)}${tag}</span>${text}</p>${act}${patBar(p)}</div></div>`;
  } else if (['prep','warm','heat','result'].includes(n.phase)) h = cookPanel();
  else if (n.phase === 'event') {
    const ev = EVENTS[n.ev.k], who = ev.who ? SPECIAL[ev.who] : null, D = n.ev.amt;
    const dis = k => ((k === 'pay' || k === 'sharkpay') && S.money < D) || (k === 'sharkhalf' && S.money < Math.ceil(D / 2)) || (k === 'salt' && have('鹽') < 3) || (k === 'candle' && S.money < 60);
    h = `<div class="dlg frame gold">${who ? portraitHTML(who.look, L(who.name)) : ''}<div class="dbody">
      <p class="dtext"><span class="who">${who ? esc(L(who.name)) : '⚡'}<span class="tag ev">EVENT</span></span>${esc(L(ev.text).replace('{0}', D))}</p>
      <div class="opts">${ev.choices.map(([k, lab]) => `<button class="opt" data-act="ev" data-k="${k}" ${dis(k) ? 'disabled style="opacity:.35"' : ''}><span>${esc(L(lab).replace('{0}', D))}</span></button>`).join('')}</div></div></div>`;
  } else if (n.phase === 'evout') {
    const o = n.ev.out, good = ['sharkpay','sharkhalf','sharkrunOk','pay','haggleOk','feedOk','policeOk','ghostOk','salt','ignoreOk','candle','closeup'].includes(o);
    h = `<div class="dlg frame"><div class="dbody"><p class="tier ${good ? 't1' : 't3'}">${esc(L(EV_OUT[o]))}</p>
      <div class="row" style="justify-content:flex-end"><button class="btn primary" data-act="evdone">${t('confirm')}</button></div></div></div>`;
  }
  const had = layer.querySelector('.cook') ? '.cook' : layer.querySelector('.dlg') ? '.dlg' : '';
  layer.innerHTML = h; paintPortraits();
  if (had) { const el = layer.querySelector(had); if (el) el.classList.add('noanim'); }
  N.cv = layer.querySelector('#cookcv'); if (N.cv) N.cv.getContext('2d').imageSmoothingEnabled = false;
  updateBars();
}
function cookPanel(){
  const n = N, c = n.c, d = DISHES[c.i], lv = S.tools[c.m], tier = TOOL_TIERS[lv - 1];
  let side = '';
  if (n.phase === 'prep') {
    side = `<div class="row"><b>${t('prepT')}</b><span class="muted" id="misses" style="margin-left:auto;font-size:13px">${t('miss', c.mistakes)}</span></div>
      <p class="muted" style="font-size:12px">${t('prepHint')}</p>
      <div class="timer"><i id="prepbar"></i></div>
      <div class="slots" style="grid-template-columns:repeat(${c.steps.length},1fr)">${c.steps.map((s, k) => `<div class="slot ${k < c.step ? 'done' : k === c.step ? 'next' : ''}"><span>${ING[s].e}</span><small>${k < 4 ? k + 1 + '.' : '✦'} ${esc(ingName(s))}</small></div>`).join('')}</div>
      <div class="ings">${c.pool.map(s => { const used = c.steps.indexOf(s) > -1 && c.steps.indexOf(s) < c.step, glow = !used && s === c.steps[c.step];
        return `<button class="ing ${used ? 'used' : ''} ${glow ? 'glow' : ''}" data-act="ing" data-s="${esc(s)}"><span class="e">${ING[s].e}</span>${esc(ingName(s))}</button>`; }).join('')}</div>
      ${c.extra && c.step === 4 ? `<button class="btn small" data-act="skipextra">${have(c.extra) ? '' : `${esc(ingName(c.extra))} ✕・`}${t('skipExtra')}</button>` : ''}`;
  } else if (n.phase === 'warm') {
    side = `<p class="tier t2">${t('heating')}</p><p class="muted" style="font-size:13px">${esc(L(METHODS[c.m].verb))}</p><div class="timer"><i id="warmbar"></i></div>`;
  } else if (n.phase === 'heat') {
    const g = c.game, zone = '<div class="zy" id="zy"></div><div class="zg" id="zg"></div>', h = 26 + lv * 9;
    const bar = inner => `<div class="heat" style="height:${h}px">${inner}<div class="ptr" id="ptr"></div></div>`;
    const btn = (act = 'stop') => `<button class="btn primary big" data-act="${act}" style="font-size:22px;touch-action:none">${esc(L(METHODS[c.m].stop))}</button>`;
    const game = {
      mash: `<div class="heat" style="height:${h}px"><div class="hfill" id="hprog"></div></div>${btn()}`,
      sweep: bar(zone + '<div class="burn"></div>') + btn(),
      hold: bar(zone) + `<div class="timer"><i id="hprog" style="background:var(--jade)"></i></div>${btn('hold')}`,
      multi: bar(zone) + `<p class="muted" style="font-size:13px" id="hhits"></p>${btn()}`,
      arrows: `<div class="arrows" id="arrows">${arrowsHTML()}</div><div class="row arrowpad">${ARW.map((a, k) => `<button class="btn big" data-act="arrow" data-k="${k}">${a}</button>`).join('')}</div>`,
      rhythm: `<div class="heat rhythm" style="height:${h + 8}px"><div class="hitline"></div>${(c.notes || []).map((x, k) => `<div class="note" id="note${k}">♨</div>`).join('')}</div>${btn()}`
    }[g];
    side = `<div class="row"><b>${esc(L(METHODS[c.m].verb))}</b><span class="muted num" style="margin-left:auto;font-size:18px" id="htime"></span></div>
      <p class="muted" style="font-size:12px">${t('hw_' + g)}</p>${game}<div id="hflash" class="hflash"></div>
      <p class="muted" style="font-size:11px;text-align:center">${g === 'arrows' ? '← ↑ → ↓' : g === 'hold' ? t('holdKey') : 'Space / Enter'}</p>`;
  } else {
    const r = c.res, p = n.active;
    const fragLine = p.type === 'story' && r.tier === 1 ? `<p class="good" style="font-size:13px">${S.frags[c.i] < 3 ? t('frag', S.frags[c.i] + 1) : t('fragFull')}</p>` : '';
    side = `<div class="rankbox">${r.rank ? `<span class="rank ${r.rank.id}" style="color:${r.rank.c}">${r.rank.id}</span>` : ''}<p class="tier t${r.tier}">${t('tier' + r.tier)}</p></div>
      <div class="score"><span>${t('sIng')}</span><span class="num">${r.ing}/50</span><span>${t('sHeat')}（${L(STR.hLabel)[r.hl]}）</span><span class="num">${r.heat}/30</span>
        <span>${t('sSpeed')}</span><span class="num">${r.speed}/20</span>${c.noSeason ? `<span class="bad">🧂</span><span class="num bad">-15</span>` : ''}<span>${t('sBonus')}</span><span class="num">+${r.bonus}</span></div>
      <div class="total"><span>${t('sTotal')} → ${t('sQual')} ${r.total + r.bonus}</span><span class="num">${r.total}</span></div>${fragLine}
      <div class="row" style="justify-content:flex-end">${r.tier > 1 && n.secret > 0 && p.type !== 'gang' && p.type !== 'ghost' ? `<button class="btn" data-act="redo">${t('redo')}</button>` : ''}
        <button class="btn primary big" data-act="serve">${t('serve')}</button></div>`;
  }
  const p = n.active;
  return `<div class="cook frame gold"><div class="chead"><span style="font-size:34px">${d.emoji}</span><div class="grow"><h3>${esc(dName(c.i))}</h3>
      <span class="muted" style="font-size:12px">${esc(p.name)}</span></div>${n.phase !== 'result' ? `<div style="width:220px">${patBar(p)}</div>` : ''}</div>
    <div class="cmain"><div class="cview"><canvas id="cookcv" width="160" height="90"></canvas>
      <div class="toolname"><span>${METHODS[c.m].icon} ${esc(L(METHODS[c.m].name))} <span class="tierchip" style="background:${tier.l}">${esc(L(tier.name))}</span></span><span>Lv ${lv}/5</span></div></div>
      <div class="cside">${side}</div></div></div>`;
}
function updateBars(){
  if (!N) return;
  const p = N.active, c = N.c;
  if (p) { const pb = $('#patbar'), pn = $('#patnum');
    if (pb) { const r = clamp(p.pat / p.max, 0, 1); pb.style.width = (r * 100) + '%'; pb.style.background = r < .3 ? 'var(--red)' : r < .6 ? 'var(--lantern)' : 'var(--jade)'; }
    if (pn) pn.textContent = Math.max(0, Math.ceil(p.pat)); }
  if (!c) return;
  const pr = $('#prepbar'); if (pr) pr.style.width = clamp(c.prep / c.pmax, 0, 1) * 100 + '%';
  const wb = $('#warmbar'); if (wb) wb.style.width = (1 - clamp(c.warm / c.wmax, 0, 1)) * 100 + '%';
  const ptr = $('#ptr'); if (ptr) ptr.style.left = c.pos + '%';
  const zg = $('#zg'), zy = $('#zy');
  if (zg) { zg.style.left = (c.zc - c.zw / 2) + '%'; zg.style.width = c.zw + '%'; }
  if (zy) { zy.style.left = (c.zc - c.zw / 2 - 8) + '%'; zy.style.width = (c.zw + 16) + '%'; }
  if (N.phase !== 'heat') return;
  const hp = $('#hprog'); if (hp) hp.style.width = clamp(c.prog, 0, 100) + '%';
  const ht = $('#htime'); if (ht) ht.textContent = c.game === 'sweep' ? t('passes', c.maxPass - c.pass) : t('timeLeft', Math.max(0, c.ht).toFixed(1));
  const hh = $('#hhits'); if (hh) hh.textContent = t('hits', c.hits.length);
  if (c.notes) c.notes.forEach((x, k) => { const el = $('#note' + k); if (!el) return; const px = 12 + (x.at - c.clock) * 45;
    el.style.left = px + '%'; el.style.opacity = x.r < 0 ? (px < 104 ? 1 : 0) : .25; el.className = 'note' + (x.r === 1 ? ' hit' : x.r === 0 ? ' miss' : ''); });
}

/* ---------- night end, bills, game over ---------- */
function endNight(reason){
  const fresh = freshDays(); let spoiled = 0;
  for (const k of Object.keys(S.inv)) { if (!ING[k].f) continue; const b = S.inv[k].length; S.inv[k] = S.inv[k].filter(d => S.day - d + 1 < fresh); spoiled += b - S.inv[k].length; }
  S.loans.forEach(l => { if (l.t === 'shark') l.owed = Math.round(l.owed * (1 + LOAN.shark.rate)); });
  S.zoneNights++;
  let newZone = -1;
  if (S.zone < 4 && S.zoneNights >= 3 && S.rep >= 3 && zoneDone(S.zone)) { S.zone++; S.zoneNights = 0; newZone = S.zone; }
  const ending = !S.ended && cardsDone() === 15, L0 = N.log, day = S.day;
  pendingBill = weekday() === 6;
  S.day++; S.stamina = staminaMax(); save(); N = null;
  const draw = () => {
    go('summary'); redraw = draw;
    const repDiff = S.rep - L0.repStart;
    layer.innerHTML = `<div class="full"><div class="summary frame gold"><p class="eyebrow">${t('sumT', day)}</p><h2 style="font-size:24px">${esc(reason)}</h2>
      <div class="score"><span>${t('sPerfect')}</span><span class="num">${L0.perfect}</span><span>${t('sNormal')}</span><span class="num">${L0.normal}</span>
        <span>${t('sFail')}</span><span class="num">${L0.fail + L0.left}</span><span>${t('sIncome')}</span><span class="num">$${L0.income}</span>
        <span>${t('sRep')}</span><span class="num">${repDiff >= 0 ? '+' : ''}${repDiff.toFixed(1)}</span><span>${t('sFrag')}</span><span class="num">+${L0.frags}</span>
        <span>${t('sSpoil')}</span><span class="num">${spoiled}</span><span>${t('sBest')}</span><span class="num">${L0.best >= 0 ? RANKS[RANKS.length - 1 - L0.best].id : '—'}</span></div>
      ${L0.cards.length ? `<p>${esc(t('litTonight', L0.cards.map(dName).join('、')))}</p>` : ''}
      ${newZone > 0 ? `<p class="warn">${esc(t('newZone', L(ZONES[newZone].name)))}</p>` : ''}
      ${S.lv > L0.lvStart ? `<p class="warn">${t('lvNote')}</p>` : ''}<p class="muted" style="font-size:12px">${t('autoSaved')}</p>
      <button class="btn primary big" data-act="${ending ? 'ending' : 'aftersum'}">${ending ? t('endingBtn') : t('goHome')}</button></div></div>`;
  };
  draw();
}
function afterSummary(){ if (pendingBill) showBills(); else showHub(); }
function showBills(){
  go('summary'); redraw = showBills;
  const b = bills(), tot = billTotal(), ok = S.money >= tot;
  layer.innerHTML = `<div class="full"><div class="summary frame gold"><p class="eyebrow">${t('billT')}</p><h2>${t('day', S.day - 1)}・${L(STR.wd)[6]}</h2>
    <div class="score"><span>${t('rent')}（${esc(L(SHOP_LV[S.shop - 1].name))}）</span><span class="num">$${b.rent}</span><span>${t('power')}</span><span class="num">$${b.power}</span>
      <span>${t('hospital')}</span><span class="num">$${b.hosp}</span>${b.bank ? `<span>${t('bankLoanBill')}</span><span class="num">$${b.bank}</span>` : ''}</div>
    <div class="total"><span>${t('total')}</span><span class="num">$${tot}</span></div>
    <p class="${ok ? 'muted' : 'bad'}">${ok ? t('afterPay', S.money - tot) : t('overMsg')}</p>
    <button class="btn ${ok ? 'primary' : 'danger'} big" data-act="${ok ? 'paybill' : 'gameover'}">${ok ? t('pay') : t('confirm')}</button></div></div>`;
}
function payBill(){ S.money -= billTotal(); S.loans = S.loans.filter(l => l.t !== 'bank'); pendingBill = false; save(); sfx.coin(); showHub(); }
function showOver(){
  const st = S ? [S.day - 1, S.served, cardsDone()] : [0, 0, 0];
  try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem(OLD_KEY); } catch (e) {}
  S = null; N = null; go('over');
  const draw = () => { redraw = draw; layer.innerHTML = `<div class="full"><div class="logo" style="font-size:56px;color:var(--red);text-shadow:0 4px 0 #3A0E12">${t('overT')}</div>
    <p class="tagline">${t('overMsg')}</p><p class="muted">${t('overStats', ...st)}</p><button class="btn primary big" data-act="title">${t('tryAgain')}</button></div>`; };
  sfx.bad(); draw();
}
function showCredits(){
  go('story'); redraw = showCredits;
  layer.innerHTML = `<div class="full">${lanterns(15).replace('lans', 'lans" style="transform:scale(2.2);margin-bottom:30px')}<div class="logo" style="font-size:60px">${t('thanks')}</div>
    <p class="logo-sub">味憶夜市 ・ ${t('sub')}</p><p class="tagline">${t('creditsLine', S.served, S.day - 1)}</p><p class="tagline">${t('keepPlaying')}</p>
    <button class="btn primary big" data-act="aftersum">${t('backToStall')}</button><p class="credit">${t('credit')}</p></div>`;
}

/* ---------- main loop ---------- */
let last = 0;
function loop(ts){
  const dt = Math.min(.05, last ? (ts - last) / 1000 : 0); last = ts; T += dt;
  try {
    if (view === 'night' && N && $('#modal').hidden) { simNight(dt); updateBars(); }
    if (view === 'title') ambient(dt);
    if (view === 'map') ART.map(G, T, {});
    else ART.scene(G, sceneState(), T);
    if (N && N.cv && N.c) ART.cook(N.cv.getContext('2d'), N.c.m, S.tools[N.c.m], T,
      { phase: N.phase === 'result' ? 'done' : N.phase === 'prep' ? 'idle' : N.phase, pos: N.c.pos || 0, food: DISHES[N.c.i].emoji });
  } catch (e) { console.error(e); }
  requestAnimationFrame(loop);
}

/* ---------- events ---------- */
sceneCv.addEventListener('click', e => {
  if (view !== 'night' || !N || N.phase !== 'idle') return;
  const r = sceneCv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 480, y = (e.clientY - r.top) / r.height * 270;
  const hit = N.people.filter(p => p.state === 'wait' && p.type !== 'ghostX' && Math.abs(p.x - x) < 10 && y > p.by - 30 && y < p.by + 6).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0];
  if (hit) beginOrder(hit);
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  const a = b.dataset.act; ac();
  switch (a) {
    case 'newgame':
      if (loadSave()) openModal(`<div class="shead"><h2>${t('restartQ')}</h2></div><p>${t('restartWarn')}</p><div class="row"><button class="btn" data-act="close">${t('cancel')}</button><button class="btn primary" data-act="newconfirm">${t('confirm')}</button></div>`);
      else startNew(); break;
    case 'newconfirm': closeModal(); startNew(); break;
    case 'continue': S = loadSave(); if (S) showHub(); else showTitle(); break;
    case 'title': showTitle(); break;
    case 'next': storyNext && storyNext(); break;
    case 'skip': storySkip && storySkip(); break;
    case 'lang': case 'setlang':
      LANG = a === 'lang' ? 1 - LANG : +b.dataset.l; try { localStorage.setItem('weiyi-lang', LANG); } catch (e) {}
      document.documentElement.lang = LANG ? 'vi' : 'zh-Hant-TW'; if (!$('#modal').hidden) closeModal(); renderHud(); renderDock(); if (redraw) redraw(); fit(); break;
    case 'mute': muted = !muted; renderHud(); break;
    case 'fs': try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').catch(() => {})).catch(() => {}); } catch (err) {} break;
    case 'anyway': rotDismissed = true; fit(); break;
    case 'map': showMap(); break;
    case 'tostall': showHub(); break;
    case 'spot': { const k = b.dataset.k; sfx.tap(); cart = {};
      if (k === 'stall') showHub(); else if (k === 'workshop') showWorkshop(); else if (k === 'hospital') showHospital(); else if (k === 'casino') showCasino(); else if (k === 'bank') showBank(); else showShop(k); break; }
    case 'cart': { const k = b.dataset.k; if (!shopKey) break; const sc = $('#sheet').scrollTop; cart[k] = clamp((cart[k] || 0) + (+b.dataset.d), 0, 30); sfx.tap(); showShop(shopKey); $('#sheet').scrollTop = sc; break; }
    case 'recipes': shopKey = ''; showRecipes(); break;
    case 'castab': casTab = b.dataset.k; CAS.msg = ''; CAS.ok = 0; showCasino(); break;
    case 'casbet': casBet = +b.dataset.k; showCasino(); break;
    case 'casdice': casDice(b.dataset.k); break;
    case 'casslot': casSlot(); break;
    case 'cascard': casCard(b.dataset.k); break;
    case 'banktab': bankTab = b.dataset.k; showBank(); break;
    case 'borrow': { const a = +b.dataset.a, k = b.dataset.k; if (k === 'bank' && S.loans.some(l => l.t === 'bank')) break;
      S.money += a; S.loans.push({ t: k, owed: k === 'bank' ? Math.round(a * (1 + LOAN.bank.rate)) : a, day: S.day }); save(); sfx.coin(); toast(t('borrowed', a)); renderHud(); showBank(); break; }
    case 'repay': { const k = b.dataset.k, amt = b.dataset.a ? Math.min(+b.dataset.a, debtOf(k)) : debtOf(k); if (S.money < amt) break; payDebt(k, amt); save(); sfx.coin(); toast(t('repaid')); renderHud(); showBank(); break; }
    case 'skipextra': if (N && N.c && N.phase === 'prep') { N.c.step = N.c.steps.length; startWarm(); } break;
    case 'cartfill': { cart = {}; let any = 0; shopItems(shopKey).forEach(k => { const need = targetUnits(k) - have(k); if (need > 0) { cart[k] = Math.ceil(need / ING[k].n); any = 1; } });
      if (!any) toast(t('needNothing')); sfx.tap(); showShop(shopKey); break; }
    case 'buy': { if (!shopKey) break; const total = Object.entries(cart).reduce((n, [k, q]) => n + ING[k].p * q, 0); if (!total || total > S.money) break;
      S.money -= total; Object.entries(cart).forEach(([k, q]) => addInv(k, q * ING[k].n)); cart = {}; save(); sfx.coin(); toast(t('bought')); showShop(shopKey); renderHud(); break; }
    case 'wstab': wsTab = b.dataset.k; showWorkshop(); break;
    case 'uptool': { const m = b.dataset.k, c = TOOL_COST[S.tools[m]]; if (S.tools[m] < 5 && S.money >= c) { S.money -= c; S.tools[m]++; save(); sfx.lantern(); toast(`${L(METHODS[m].name)} → ${L(TOOL_TIERS[S.tools[m] - 1].name)}`); showWorkshop(); renderHud(); } break; }
    case 'upshop': { const s = SHOP_LV[S.shop]; if (s && S.money >= s.cost) { S.money -= s.cost; S.shop++; S.stamina = staminaMax(); save(); sfx.lantern(); toast(L(s.name)); showWorkshop(); renderHud(); } break; }
    case 'upgear': { const k = b.dataset.k, g = GEAR[k], c = g.cost[S.gear[k]]; if (S.gear[k] < g.max && S.money >= c) { S.money -= c; S.gear[k]++; save(); sfx.lantern(); showWorkshop(); renderHud(); } break; }
    case 'visit': S.visited = S.day; S.stamina = staminaMax(); save(); sfx.ok(); showHospital(); renderHud(); break;
    case 'stats': showStats(); break;
    case 'addstat': { const k = b.dataset.k; if (S.points > 0 && S.stats[k] < 10) { S.points--; S.stats[k]++; save(); sfx.tap(); showStats(); renderHud(); renderDock(); } break; }
    case 'album': showAlbum(); break;
    case 'card': openModal(`<div class="shead"><h2>${t('album')}</h2><button class="btn small ghost" data-act="album">${t('back')}</button></div>${recipeCard(+b.dataset.i)}`); break;
    case 'saves': showSaves(); break;
    case 'copy': { const box = $('#exportBox'), txt = box ? box.value : '';
      const fb = () => { if (box) { box.focus(); box.select(); } $('#saveMsg').textContent = t('selected'); };
      try { navigator.clipboard.writeText(txt).then(() => { $('#saveMsg').textContent = t('copied'); }, fb); } catch (err) { fb(); } break; }
    case 'import': doImport(); break;
    case 'close': closeModal(); break;
    case 'open': openStall(); break;
    case 'servenext': { const w = N && N.people.filter(p => p.state === 'wait' && p.type !== 'ghostX').sort((x, y) => x.pat - y.pat)[0]; if (w) beginOrder(w); break; }
    case 'closeearly': if (N && N.phase === 'idle') { N.queue = []; N.stopSpawn = true; N.reason = t('closedEarly'); N.people.forEach(p => { if (p.state === 'wait' || p.state === 'in') goOut(p, null); }); renderDock(); } break;
    case 'cookit': confirmCook(); break;
    case 'ing': onIng(b.dataset.s, b); break;
    case 'stop': heatAction('tap'); break;
    case 'arrow': heatAction(+b.dataset.k); break;
    case 'redo': onRedo(); break;
    case 'serve': onServe(); break;
    case 'ev': evChoice(b.dataset.k); break;
    case 'evdone': evDone(); break;
    case 'aftersum': afterSummary(); break;
    case 'paybill': payBill(); break;
    case 'gameover': showOver(); break;
    case 'ending': showStory(ENDING, () => { S.ended = true; save(); showCredits(); }); break;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#modal').hidden && !modalOnClose) closeModal();
  if (N && N.phase === 'heat' && $('#modal').hidden) {
    if (e.key in ARK) { e.preventDefault(); heatAction(ARK[e.key]); }
    else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (N.c.game === 'hold') N.c.hold = true; else if (!e.repeat) heatAction('tap'); }
  }
});
document.addEventListener('keyup', e => { if ((e.key === ' ' || e.key === 'Enter') && N && N.c) N.c.hold = false; });
document.addEventListener('pointerdown', e => { if (e.target.closest('[data-act=hold]') && N && N.c) { N.c.hold = true; e.preventDefault(); } });
['pointerup','pointercancel','pointerleave'].forEach(ev => document.addEventListener(ev, () => { if (N && N.c) N.c.hold = false; }));
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal' && !modalOnClose) closeModal(); });
function startNew(){
  S = newState(); starterStock(S); save();
  showStory(INTRO, () => { showHub(); toast(t('firstTip'), 3500); });
}

/* ---------- boot (keeps progress across live updates) ---------- */
function boot(data){
  document.documentElement.lang = LANG ? 'vi' : 'zh-Hant-TW'; fit();
  const st = data && data.state;
  if (st && valid(st)) { S = st; showHub(); } else showTitle();
  requestAnimationFrame(loop);
}
try { window.claude?.hot?.snapshot?.(() => ({ state: S })); } catch (e) {}
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
