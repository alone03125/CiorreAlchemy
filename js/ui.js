/* 界面框架：区域刷新、控件、悬浮提示、顶栏、资源栏、标签栏、日历、日志与队列 */

const UI = { cur: null, roots: [], tipEl: null, tipBox: null, alchFilter: '', invFilter: '', hold: null };

/* ---------- 小工具 ---------- */
function esc(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) for (const k in props) {
    const v = props[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'tip') el._tip = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  appendKids(el, kids);
  return el;
}
function appendKids(el, kids) {
  kids.forEach(c => {
    if (c == null || c === false) return;
    if (Array.isArray(c)) appendKids(el, c);
    else el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  });
}
function pct(v) { return (v >= 0 ? '+' : '') + Math.round(v * 100) + '%'; }
function pctAbs(v) { return Math.round(Math.abs(v) * 100) + '%'; }
function fmtRate(v) { return (v >= 0 ? '+' : '') + fmt(v) + T('per_sec'); }
function fmtRateAmt(id, v) { return id === 'quill' ? (v >= 0 ? '+' : '-') + fmtQuill(Math.abs(v)) + T('per_sec') : fmtRate(v); }
function rarityStyle(r) { return 'color:' + RARITY.color[r]; }
function elTag(el) { return h('span', { class: 'el-tag', style: 'color:' + ELEMENTS[el].color, text: L(ELEMENTS[el]) }); }

/* ---------- 区域：key 变化时重建，每帧执行更新函数 ---------- */
class Region {
  constructor(keyFn, buildFn, tag, cls) {
    this.el = h(tag || 'div', { class: cls });
    this.keyFn = keyFn; this.buildFn = buildFn; this.ups = []; this.last = undefined;
  }
  refresh() {
    const k = LANG + '|' + (this.keyFn ? this.keyFn() : '');
    if (k !== this.last) {
      this.last = k;
      this.el.innerHTML = '';
      this.ups = [];
      const prev = UI.cur;
      UI.cur = this;
      try { this.buildFn(this.el); } finally { UI.cur = prev; }
    }
    for (let i = 0; i < this.ups.length; i++) this.ups[i]();
  }
}
function region(keyFn, buildFn, tag, cls) {
  const r = new Region(keyFn, buildFn, tag, cls);
  if (UI.cur) UI.cur.ups.push(() => r.refresh());
  return r.el;
}
function onUpdate(fn) { UI.cur.ups.push(fn); }
/* 把文本里数字后面的大单位（k、M 等）包成小号的 span，显示在数值右下角 */
function unitHtml(t) { return esc(t).replace(NUM_UNIT_RE, '$1<span class="unit">$2</span>'); }
/* 设置元素文字：带大单位时用 HTML，否则用纯文本；内容没变就什么也不做 */
function setText(el, t) {
  t = String(t);
  if (el._t === t) return;
  el._t = t;
  if (NUM_UNIT_TEST.test(t)) el.innerHTML = unitHtml(t);
  else el.textContent = t;
}
function liveText(tag, fn, cls) {
  const el = h(tag, { class: cls });
  onUpdate(() => setText(el, fn()));
  return el;
}
function act(fn) { return () => { fn(); UI.refreshAll(); }; }

/* 大按钮，可带若干右侧小分段 */
function button(o) {
  const el = h('div', { class: 'btn ' + (o.cls || ''), tip: o.tip });
  const lab = h('span', { class: 'btn-label' });
  el.appendChild(lab);
  const segs = (o.segs || (o.seg ? [o.seg] : [])).map(sg => {
    const sEl = h('span', { class: 'btn-seg', text: sg.label, tip: sg.tip });
    sEl.addEventListener('click', e => {
      e.stopPropagation();
      if (sEl.classList.contains('disabled')) return;
      sg.click(e); UI.refreshAll();
    });
    el.appendChild(sEl);
    return [sEl, sg];
  });
  el.addEventListener('click', e => {
    if (el.classList.contains('disabled')) return;
    o.click(e); UI.refreshAll();
  });
  onUpdate(() => {
    setText(lab, typeof o.label === 'function' ? o.label() : o.label);
    el.classList.toggle('disabled', o.enabled ? !o.enabled() : false);
    segs.forEach(([sEl, sg]) => sEl.classList.toggle('disabled', sg.enabled ? !sg.enabled() : false));
  });
  return el;
}
/* 文字链接式小按钮 */
function lbtn(text, click, enabled, tip) {
  const el = h('a', { class: 'lb', tip: tip });
  el.textContent = text;
  el.addEventListener('click', e => {
    e.stopPropagation();
    if (el.classList.contains('disabled')) return;
    click(e); UI.refreshAll();
  });
  if (enabled) onUpdate(() => el.classList.toggle('disabled', !enabled()));
  return el;
}
function checkbox(label, get, set, tip) {
  const inp = h('input', { type: 'checkbox' });
  inp.checked = !!get();
  inp.addEventListener('change', () => { set(inp.checked); UI.refreshAll(); });
  onUpdate(() => { if (inp.checked !== !!get()) inp.checked = !!get(); });
  return h('label', { class: 'chk', tip: tip }, inp, label);
}
function select(options, get, set, cls) {
  const sel = h('select', { class: 'sel ' + (cls || '') }, options.map(o => h('option', { value: o[0], text: o[1] })));
  sel.value = get();
  sel.addEventListener('change', () => { set(sel.value); UI.refreshAll(); });
  return sel;
}
/* 平滑地设置进度条宽度：上涨或小幅下降时交给 CSS 过渡，过渡时长与刷新间隔相同，看起来是连续的；
 * 明显回落（例如进度走满后归零、换了一块地）时直接跳过去，不倒着播放动画 */
function smoothWidth(el, ratio) {
  const p = clamp(ratio || 0, 0, 1) * 100;
  const prev = el._w;
  if (prev != null && Math.abs(p - prev) < 0.02) return;
  if (prev == null || p < prev - 1) {
    el.style.transition = 'none';
    el.style.width = p.toFixed(2) + '%';
    void el.offsetWidth;
    el.style.transition = '';
  } else el.style.width = p.toFixed(2) + '%';
  el._w = p;
}
function bar(fn, cls) {
  const fill = h('div', { class: 'fill' });
  const el = h('div', { class: 'bar ' + (cls || '') }, fill);
  onUpdate(() => smoothWidth(fill, fn()));
  return el;
}
/* 按住不放的按钮：按住时每帧调用 o.work(dt)，按钮底色显示 o.progress() 的进度。small 为表格里的小号样式 */
function holdButton(o) {
  const el = h(o.small ? 'a' : 'div', { class: (o.small ? 'lb hold' : 'btn hold') + ' ' + (o.cls || ''), tip: o.tip });
  const fill = h('span', { class: 'hfill' });
  const lab = h('span', { class: 'btn-label' });
  el.appendChild(fill);
  el.appendChild(lab);
  const start = e => {
    if (el.classList.contains('disabled')) return;
    e.preventDefault();
    e.stopPropagation();
    holdStop();
    UI.hold = { o: o, el: el };
    el.classList.add('holding');
    o.work(0.12);
    UI.refreshAll();
  };
  el.addEventListener('mousedown', e => { if (e.button === 0) start(e); });
  el.addEventListener('touchstart', start, { passive: false });
  el.addEventListener('mouseleave', () => { if (UI.hold && UI.hold.el === el) holdStop(); });
  el.addEventListener('click', e => e.stopPropagation());
  onUpdate(() => {
    setText(lab, typeof o.label === 'function' ? o.label() : o.label);
    const ok = o.enabled ? o.enabled() : true;
    el.classList.toggle('disabled', !ok);
    if (!ok && UI.hold && UI.hold.el === el) holdStop();
    smoothWidth(fill, o.progress ? o.progress() : 0);
  });
  return el;
}
function holdStop() {
  if (!UI.hold) return;
  UI.hold.el.classList.remove('holding');
  UI.hold = null;
}
/* 主循环每帧调用：推进正在按住的按钮 */
function holdTick(dt) {
  const hd = UI.hold;
  if (!hd) return;
  if (!document.body.contains(hd.el) || (hd.o.enabled && !hd.o.enabled())) { holdStop(); return; }
  hd.o.work(Math.min(dt, 1));
}
function section(title) { return h('div', { class: 'sec-title', text: title }); }
function note(text, cls) { return h('div', { class: 'note ' + (cls || ''), text: text }); }

/* ---------- 悬浮提示 ---------- */
function ttRow(a, b, cls) { return '<div class="tt-row ' + (cls || '') + '"><span>' + esc(a) + '</span><span>' + unitHtml(b) + '</span></div>'; }
function costRow(name, have, need, k) {
  const ok = have >= need - 1e-9;
  let extra = '';
  if (!ok && RES_MAP[k]) {
    const cap = capOf(k), rate = G.rates[k] || 0;
    if (cap < need) extra = ' ' + T('cap_short');
    else if (rate > 0) extra = ' (' + fmtTime((need - have) / rate) + ')';
  }
  return ttRow(name, fmtAmt(k, have) + ' / ' + fmtAmt(k, need) + extra, ok ? '' : 'lack');
}
function costHtml(cost) {
  let out = '';
  for (const k in cost) out += costRow(costName(k), getAmt(k), cost[k], k);
  return out;
}
const EFF_KIND = {
  housing: 'n', custRate: 'n', custMult: 'p', queueCap: 'n', windowSlots: 'n', windowChance: 'p', marketLux: 'n', dispSlots: 'n', dispSpeed: 'p', dispLoot: 'p',
  dispTypes: 'n', itemValue: 'p', alchFloor: 'pa', alchFail: 'pa', flameMax: 'n', flameRegen: 'p',
  displaySlots: 'n', displayChance: 'p', trainXp: 'r', growth: 'p', buildCost: 'p', rakuIntel: 'p',
  commReward: 'p', commSlots: 'n', noInjury: 'x', showMult: 'p', upkeepRelief: 'pa', crowdRelief: 'pa',
  happiness: 'n', priceAll: 'p', skillXP: 'r', farmGrowth: 'p', cropYield: 'p', waterRegen: 'n',
  greenhouse: 'n', tradeRatio: 'p', starChance: 'pr', kitchenSpeed: 'p'
};
function effText(k, v) {
  const p = k.split('.');
  switch (p[0]) {
    case 'prod': return T('e_prod', costName(p[1]), fmtRate(v));
    case 'cap': return T('e_cap', T('capgrp_' + p[1]) !== 'capgrp_' + p[1] ? T('capgrp_' + p[1]) : costName(p[1]), '+' + fmtAmt(p[1], v));
    case 'mult': return T('e_mult', costName(p[1]), pct(v));
    case 'job': return T('e_job', L(JOB_MAP[p[1]]), pct(v));
    case 'price': return T('e_price', costName(p[1]), pct(v));
    case 'priceSt': return T('e_priceSt', L(STATIONS[p[1]]), pct(v));
    case 'dispEl': return T('e_dispEl', L(ELEMENTS[p[1]]), pct(v));
    case 'dispCat': return T('e_dispCat', L(CATS[p[1]]), pct(v));
  }
  const kind = EFF_KIND[k];
  const val = kind === 'n' ? (v >= 0 ? '+' : '') + fmt(v) : kind === 'r' ? (v >= 0 ? '+' : '') + fmt(v, 4)
    : kind === 'p' ? pct(v) : kind === 'pa' ? pctAbs(v) : kind === 'pr' ? '+' + (v * 100).toFixed(1) + '%' : '';
  return T('e_' + k, val);
}
function effLines(effObj) { return Object.keys(effObj || {}).map(k => effText(k, effObj[k])); }
function effHtml(effObj, sub) {
  const ls = effLines(effObj);
  if (!ls.length) return '';
  return '<div class="tt-sep"></div>' + (sub ? '<div class="tt-sub">' + esc(sub) + '</div>' : '') +
    ls.map(x => '<div class="tt-eff">' + esc(x) + '</div>').join('');
}
function tipSimple(title, desc) {
  return '<div class="tt-title">' + esc(title) + '</div>' + (desc ? '<div class="tt-desc">' + esc(desc) + '</div>' : '');
}
function tipBuilding(b) {
  const s = G.s;
  let html = tipSimple(L(b), L(b.desc)) + '<div class="tt-sep"></div>';
  if (bldMaxed(b)) html += '<div class="tt-note">' + esc(T('built_done')) + '</div>';
  else {
    if (b.allCoins) html += costRow(T('all_coins'), s.res.coins, b.allCoins, 'coins');
    html += costHtml(bldCost(b));
  }
  html += effHtml(b.eff, T('per_building'));
  if (b.station) html += '<div class="tt-note">' + esc(T('station_note', foodsAt(b.station).map(f => L(f)).join(T('list_sep')) || T('nothing'))) + '</div>';
  if (b.flavor) html += '<div class="tt-flavor">' + esc(L(b.flavor)) + '</div>';
  return html;
}
function tipTech(t) {
  let html = tipSimple(L(t), L(t.desc)) + '<div class="tt-sep"></div>' + costHtml(t.cost) + effHtml(t.eff);
  const unlocks = BUILDINGS.filter(b => b.req.toString().indexOf("tech." + t.id) >= 0).map(b => L(b));
  if (unlocks.length) html += '<div class="tt-note">' + esc(T('unlocks_bld', unlocks.join(T('list_sep')))) + '</div>';
  return html;
}
function foodsAt(st) { return FOODS.filter(f => f.st === st); }
/* 物品的用途与获取途径，由数据自动推算 */
function itemSources(id) {
  const it = ITEMS[id], out = [];
  if (it.g) {
    const dests = DESTS.filter(d => {
      const catW = d.cat[it.cat] || 0;
      return catW > 0 && it.lv <= Math.min(45, d.lv + 16) && it.lv >= Math.max(1, d.lv - 3);
    });
    if (dests.length) out.push(T('src_disp', dests.map(d => L(d)).join(T('list_sep'))));
  }
  if (it.cat === 'cry' && it.lv === 14) out.push(T('src_crystal'));
  TRADE_PARTNERS.forEach(p => p.gives.forEach(gv => {
    if (gv.item === id || (gv.crystal && CRYSTAL_OF[gv.crystal] === id)) out.push(T('src_trade', L(p)));
  }));
  const rc = RECIPES.find(r => r.out === id);
  if (rc) out.push(T('src_recipe'));
  else if (!it.x) out.push(T('src_alch'));
  if (id === 'impurity') out.push(T('src_fail'));
  if (id === 'rhasari_down') out.push(T('src_rhasari'));
  if (id === 'lysari_scale') out.push(T('src_lysari'));
  if (id === 'ayrelia_plume') out.push(T('src_ayrelia'));
  if (id === 'star_dew' || id === 'stardust') out.push(T('src_star'));
  return out;
}
function itemUses(id) {
  const out = [T('use_alch')];
  const rcs = RECIPES.filter(r => r.mats[id]);
  if (rcs.length) out.push(T('use_recipe', rcs.map(r => G.s.recipes[r.id] ? L(ITEMS[r.out]) : '？？？').join(T('list_sep'))));
  if (BUILDINGS.some(b => b.cost[id]) || TECHS.some(t => t.cost[id])) out.push(T('use_build'));
  if (id === 'impurity') out.push(T('use_compost'));
  out.push(T('use_sell'));
  return out;
}
function tipItem(id) {
  const it = ITEMS[id];
  let html = '<div class="tt-title" style="' + rarityStyle(it.r) + '">' + esc(L(it)) + '</div>';
  html += ttRow(T('alch_level'), 'Lv ' + it.lv) + ttRow(T('rarity'), 'Rare ' + it.r) +
    ttRow(T('element'), L(ELEMENTS[it.el])) + ttRow(T('category'), L(CATS[it.cat])) +
    ttRow(T('value'), fmtQuill(itemValue(id))) + ttRow(T('alch_points'), fmt(itemPoints(id), 1)) +
    ttRow(T('owned'), String(G.s.inv[id] || 0));
  html += '<div class="tt-sep"></div><div class="tt-sub">' + esc(T('uses')) + '</div>' + itemUses(id).map(x => '<div class="tt-li">' + esc(x) + '</div>').join('');
  const src = itemSources(id);
  if (src.length) html += '<div class="tt-sub">' + esc(T('sources')) + '</div>' + src.map(x => '<div class="tt-li">' + esc(x) + '</div>').join('');
  return html;
}
/* 食材、半成品、商品的提示 */
function tipFood(id) {
  const r = RES_MAP[id], f = FOOD_MAP[id], ing = ING_MAP[id], s = G.s;
  let html = tipSimple(L(r), r.desc ? L(r.desc) : '');
  html += '<div class="tt-sep"></div>' + ttRow(T('stock'), fmt(s.res[id]) + ' / ' + fmt(capOf(id)));
  if (f) {
    html += ttRow(T('station'), L(STATIONS[f.st]));
    if (f.kind !== 'proc') {
      html += ttRow(T('price'), fmtQuill(goodPrice(id))) + ttRow(T('demand'), Math.round(demandOf(id) * 100) + '%');
    } else html += ttRow(T('inv_h_wp'), fmtQuill(windowPrice(id)));
    html += '<div class="tt-sub">' + esc(T('ingredients')) + '</div>' + costHtml(f.inp) + (f.flame ? costRow(T('flame'), s.rhasari.flame, f.flame) : '');
    const used = FOODS.filter(x => x.inp[id]).map(x => L(x));
    if (used.length) html += '<div class="tt-note">' + esc(T('used_in', used.join(T('list_sep')))) + '</div>';
  }
  if (ing) {
    if (ing.crop) {
      const c = CROP_MAP[ing.crop];
      html += '<div class="tt-note">' + esc(T('src_crop', L(c), c.days)) + '</div>';
    } else html += '<div class="tt-note">' + esc(T('src_bld', L(BLD_MAP[ing.bld]))) + '</div>';
    const used = FOODS.filter(x => x.inp[id]).map(x => L(x));
    if (used.length) html += '<div class="tt-note">' + esc(T('used_in', used.join(T('list_sep')))) + '</div>';
  }
  return html;
}
function tipRes(r) {
  if (r.group === 'ingredient' || r.group === 'processed' || r.group === 'goods') return tipFood(r.id) + rateBlock(r);
  if (r.lux) {
    const l = LUX_MAP[r.id];
    return tipSimple(L(r), L(r.desc)) + '<div class="tt-note">' + esc(T('lux_note', l.happy, fmt(l.use, 4))) + '</div>' + rateBlock(r);
  }
  return '<div class="tt-title">' + esc(L(r)) + '</div>' + rateBlock(r);
}
function rateBlock(r) {
  let html = '';
  const det = G.rateDetail[r.id] || [];
  det.forEach(d => {
    const src = d[0];
    const name = src === 'bonus' ? T('rate_bonus', pct(d[2])) : src === 'upkeep' ? T('rate_upkeep') : src === 'snack' ? T('rate_snack') : src === 'luxuse' ? T('rate_luxuse') : L(src);
    html += ttRow(name, fmtRateAmt(r.id, d[1]));
  });
  if (det.length) html += '<div class="tt-sep"></div>' + ttRow(T('rate_total'), fmtRateAmt(r.id, G.rates[r.id] || 0));
  const fl = G.flow[r.id];
  if (fl != null && Math.abs(fl) > 1e-4) html += ttRow(T('rate_flow'), fmtRateAmt(r.id, fl));
  const cap = capOf(r.id), v = G.s.res[r.id];
  if (cap !== Infinity && fl) {
    if (fl > 0 && v < cap) html += ttRow(T('to_full'), fmtTime((cap - v) / fl));
    if (fl < 0 && v > 0) html += ttRow(T('to_empty'), fmtTime(v / -fl));
  }
  const extra = T('resnote_' + r.id, pct(renownBonus()));
  if (extra !== 'resnote_' + r.id) html += '<div class="tt-flavor">' + esc(extra) + '</div>';
  return html;
}
function tipHappy() {
  const P = G.happyParts;
  let html = tipSimple(T('happiness'), T('happy_desc'));
  html += '<div class="tt-sep"></div>' + ttRow(T('happy_base'), '100%');
  ['crowd', 'bld', 'snack', 'lux', 'fed', 'care', 'party'].forEach(k => {
    if (Math.abs(P[k] || 0) > 0.01) html += ttRow(T('happy_' + k), (P[k] >= 0 ? '+' : '') + fmt(P[k], 1) + '%', P[k] < 0 ? 'lack' : '');
  });
  html += '<div class="tt-sep"></div>' + ttRow(T('rate_total'), Math.round(G.happy) + '%');
  html += '<div class="tt-note">' + esc(T('happy_factor', Math.round(happyFactor() * 100) + '%')) + '</div>';
  return html;
}
function initTooltip() {
  const box = UI.tipBox = document.getElementById('tooltip');
  const findTip = el => { while (el && el !== document) { if (el._tip) return el; el = el.parentNode; } return null; };
  document.addEventListener('mouseover', e => {
    const t = findTip(e.target);
    if (t !== UI.tipEl) { UI.tipEl = t; drawTip(); }
  });
  document.addEventListener('mousemove', e => {
    if (!UI.tipEl) return;
    const pad = 14, w = box.offsetWidth, hgt = box.offsetHeight;
    let x = e.clientX + pad, y = e.clientY + pad;
    if (x + w > window.innerWidth - 4) x = Math.max(4, e.clientX - w - pad);
    if (y + hgt > window.innerHeight - 4) y = Math.max(4, window.innerHeight - hgt - 4);
    box.style.left = x + 'px';
    box.style.top = y + 'px';
  });
}
function drawTip() {
  const box = UI.tipBox;
  if (UI.tipEl && !document.body.contains(UI.tipEl)) UI.tipEl = null;
  if (!UI.tipEl) { box.style.display = 'none'; return; }
  const html = typeof UI.tipEl._tip === 'function' ? UI.tipEl._tip() : UI.tipEl._tip;
  if (box._last !== html) { box.innerHTML = html; box._last = html; }
  box.style.display = 'block';
}

/* ---------- 顶栏 ---------- */
function buildTopbar(el) {
  el.appendChild(h('div', { class: 'title' },
    h('span', { class: 'game-title', text: T('game_title') }),
    h('span', { class: 'ver', text: 'v' + G.version })));
  const links = h('div', { class: 'links' });
  const add = (txt, fn) => { if (links.childNodes.length) links.appendChild(h('span', { class: 'sep', text: '|' })); links.appendChild(lbtn(txt, fn)); };
  add(T('lnk_lang'), () => { G.s.lang = LANG = (LANG === 'zh' ? 'en' : 'zh'); document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en'; document.title = T('game_title'); });
  add(T(G.s.theme === 'dark' ? 'lnk_light' : 'lnk_dark'), () => { G.s.theme = G.s.theme === 'dark' ? 'light' : 'dark'; applyTheme(); });
  add(T(G.s.paused ? 'lnk_resume' : 'lnk_pause'), () => { G.s.paused = !G.s.paused; });
  add(T('lnk_save'), () => { if (saveGame()) log({ zh: '游戏已保存。', en: 'Game saved.' }, 'sys'); });
  add(T('lnk_export'), showExport);
  add(T('lnk_import'), showImport);
  add(T('lnk_reset'), () => { if (confirm(T('confirm_reset'))) { resetGame(); LANG = G.s.lang; UI.resetRoots(); } });
  el.appendChild(links);
}
function applyTheme() { document.documentElement.setAttribute('data-theme', G.s.theme === 'dark' ? 'dark' : 'light'); }

/* ---------- 资源栏 ---------- */
function resRow(r) {
  const s = G.s;
  const amt = h('span', { class: 'ra' }), cap = h('span', { class: 'rc' }), rate = h('span', { class: 'rr' });
  const fill = h('i');
  const row = h('div', { class: 'rrow', tip: () => tipRes(r) }, h('span', { class: 'rn', text: L(r) }), amt, cap, rate, h('div', { class: 'ubar' }, fill));
  onUpdate(() => {
    const v = s.res[r.id], c = capOf(r.id);
    const rt = G.rates[r.id] || 0, fl = G.flow[r.id] || 0;
    setText(amt, r.quill ? fmtQuill(v, true) : fmt(v));
    setText(cap, c === Infinity ? '' : '/' + (r.quill ? fmtQuill(c, true) : fmt(c)));
    const showFlow = !rt && Math.abs(fl) > 0.0005;
    const shown = rt || (showFlow ? fl : 0);
    setText(rate, shown ? fmtRateAmt(r.id, shown) : '');
    rate.className = 'rr ' + (shown < 0 ? 'neg' : 'pos') + (showFlow ? ' flow' : '');
    const ratio = c === Infinity || c <= 0 ? 0 : clamp(v / c, 0, 1);
    smoothWidth(fill, ratio);
    row.classList.toggle('full', c !== Infinity && c > 0 && v >= c - 1e-6);
    row.classList.toggle('near', c !== Infinity && c > 0 && ratio >= 0.9 && ratio < 1 - 1e-9);
    row.classList.toggle('nocap', c === Infinity);
  });
  return row;
}
function buildResPanel(el) {
  const s = G.s;
  if (s.dragons.length || housing() > 0) {
    el.appendChild(h('div', { class: 'rrow nocap', tip: () => tipSimple(T('dragonlings'), T('dragonlings_tip', fmt(upkeepRate()))) },
      h('span', { class: 'rn', text: T('dragonlings') }),
      liveText('span', () => String(s.dragons.length), 'ra'),
      liveText('span', () => '/' + fmt(housing()), 'rc'),
      liveText('span', () => T('idle_n', idleCount()), 'rr')));
    el.appendChild(h('div', { class: 'rrow nocap', tip: tipHappy },
      h('span', { class: 'rn', text: T('happiness') }),
      liveText('span', () => Math.round(G.happy) + '%', 'ra'), h('span', { class: 'rc' }),
      liveText('span', () => s.party.days > 0 ? T('party_on') : '', 'rr')));
  }
  RES_GROUPS.forEach(g => {
    const list = RESOURCES.filter(r => r.group === g.id && r.unlocked(s));
    if (!list.length) return;
    const collapsed = !!s.ui.resCollapsed[g.id];
    const head = h('div', { class: 'res-head' },
      h('span', { class: 'arrow', text: collapsed ? '▸' : '▾' }), ' ' + L(g),
      h('span', { class: 'dim small', text: ' ' + list.length }));
    head.addEventListener('click', () => { s.ui.resCollapsed[g.id] = !collapsed; UI.refreshAll(); });
    el.appendChild(head);
    if (collapsed) return;
    if (g.id === 'goods') {
      el.appendChild(h('div', { class: 'res-opt' }, checkbox(T('only_stock'), () => s.ui.goodsOnlyStock, v => { s.ui.goodsOnlyStock = v; })));
    }
    const box = h('div', { class: 'res-group' });
    list.forEach(r => {
      if (g.id === 'goods' && s.ui.goodsOnlyStock) {
        const row = resRow(r);
        onUpdate(() => { row.style.display = s.res[r.id] >= 1 ? '' : 'none'; });
        box.appendChild(row);
      } else box.appendChild(resRow(r));
    });
    el.appendChild(box);
  });
  if (ELEMENT_KEYS.some(e => s.seen[CRYSTAL_OF[e]])) {
    const collapsed = !!s.ui.resCollapsed.crystals;
    const head = h('div', { class: 'res-head' }, h('span', { class: 'arrow', text: collapsed ? '▸' : '▾' }), ' ' + T('crystals'));
    head.addEventListener('click', () => { s.ui.resCollapsed.crystals = !collapsed; UI.refreshAll(); });
    el.appendChild(head);
    if (!collapsed) ELEMENT_KEYS.forEach(e => {
      const id = CRYSTAL_OF[e];
      el.appendChild(h('div', { class: 'rrow nocap', tip: () => tipItem(id) },
        h('span', { class: 'rn', style: 'color:' + ELEMENTS[e].color, text: L(ITEMS[id]) }),
        liveText('span', () => fmt(s.inv[id] || 0), 'ra'), h('span', { class: 'rc' }), h('span', { class: 'rr' })));
    });
  }
}
function resKey() {
  const s = G.s;
  return RESOURCES.filter(r => r.unlocked(s)).map(r => r.id).join(',') + '|' + (s.dragons.length > 0 || housing() > 0) +
    '|' + ELEMENT_KEYS.some(e => s.seen[CRYSTAL_OF[e]]) + '|' + JSON.stringify(s.ui.resCollapsed) + s.ui.goodsOnlyStock;
}

/* ---------- 标签栏 ---------- */
const TABS = [
  { id: 'nest', vis: s => true },
  { id: 'dragons', vis: s => s.dragons.length > 0 || housing() > 0 },
  { id: 'research', vis: s => s.bld.nook > 0 },
  { id: 'workshop', vis: s => s.bld.workshop > 0 },
  { id: 'meadow', vis: s => !!s.tech.agronomy },
  { id: 'expedition', vis: s => !!s.tech.courier },
  { id: 'alchemy', vis: s => !!s.tech.transmutation },
  { id: 'trade', vis: s => !!s.tech.commerce },
  { id: 'inventory', vis: s => Object.keys(s.seen).length > 0 || windowUnlocked() },
  { id: 'commissions', vis: s => s.bld.workshop > 0 },
  { id: 'records', vis: s => Object.keys(s.ach).length > 0 }
];
function visibleTabs() { return TABS.filter(t => t.vis(G.s)); }
function tabLabel(id) {
  if (id === 'commissions') { const n = commReady(); return T('tab_' + id) + (n ? ' (' + n + ')' : ''); }
  if (id === 'trade') { const n = TRADE_PARTNERS.filter(p => canTrade(p)).length; return T('tab_' + id) + (n ? ' (' + n + ')' : ''); }
  return T('tab_' + id);
}
function buildTabs(el) {
  const vt = visibleTabs();
  if (!vt.find(t => t.id === G.s.ui.tab)) G.s.ui.tab = 'nest';
  vt.forEach((t, i) => {
    if (i) el.appendChild(h('span', { class: 'sep', text: '|' }));
    const a = h('a', { class: 'tab' + (t.id === G.s.ui.tab ? ' active' : '') });
    a.addEventListener('click', () => { G.s.ui.tab = t.id; UI.refreshAll(); });
    onUpdate(() => { const l = tabLabel(t.id); if (a.textContent !== l) a.textContent = l; });
    el.appendChild(a);
  });
}
function buildTabBody(el) {
  const t = TABS.find(x => x.id === G.s.ui.tab) || TABS[0];
  el.appendChild(h('div', { class: 'tab-title', text: T('tab_' + t.id) }));
  el.appendChild(h('div', { class: 'tab-box' }, region(() => tabKey(t.id), TAB_BUILD[t.id], 'div', 'tab-inner')));
}

/* ---------- 日历 ---------- */
function buildCalendar(el) {
  const s = G.s, m = curMonth();
  el.appendChild(h('div', { class: 'cal-era', text: T('cal_era') }));
  el.appendChild(liveText('div', () => T('cal_date', yearNum(), L(curMonth()), dayOfMonth()), 'cal-date'));
  el.appendChild(h('div', { class: 'cal-q', text: T('cal_quarter', Math.floor(monthIdx() / 3) + 1) + (m.cold ? T('list_sep') + T('cal_cold') : m.hot ? T('list_sep') + T('cal_hot') : '') }));
  if (s.tech.calendar) {
    el.appendChild(liveText('div', () => {
      const v = phaseMod();
      return T('cal_phase', T('phase_' + moonPhase()), (v > 0 ? '+' : v < 0 ? '-' : '') + pctAbs(v));
    }, 'cal-phase'));
    el.appendChild(h('div', { class: 'cal-desc', text: L(m.desc) }));
    el.appendChild(h('div', { class: 'cal-eff' }, effLines(m.eff).map(x => h('div', { text: x }))));
  } else el.appendChild(h('div', { class: 'cal-desc dim', text: T('cal_unknown') }));
  if (s.lysari.rain > 0) el.appendChild(liveText('div', () => T('lysari_rain_left', Math.ceil(s.lysari.rain)), 'cal-buff'));
  if (s.party.days > 0) el.appendChild(liveText('div', () => T('party_left', Math.ceil(s.party.days)), 'cal-buff'));
  if (tripAway()) el.appendChild(liveText('div', () => T('trip_away', L(s.trip.place), Math.ceil(s.trip.away)), 'cal-buff'));
  if (s.sky.event > 0) {
    const g = h('div', { class: 'grid one' });
    g.appendChild(button({ label: T('observe'), click: () => observeSky(false), cls: 'special', tip: () => tipSimple(T('observe'), T('observe_d')) }));
    el.appendChild(g);
  }
  if (s.paused) el.appendChild(note(T('paused_note'), 'notice'));
}
function calKey() { const s = G.s; return [monthAbs(), s.tech.calendar, s.lysari.rain > 0, s.party.days > 0, tripAway(), s.sky.event > 0, s.paused].join(','); }

/* ---------- 日志与队列 ---------- */
function buildRightHead(el) {
  const s = G.s;
  const mk = (id, label) => {
    const a = h('a', { class: 'tab' + (s.ui.right === id ? ' active' : ''), text: label });
    a.addEventListener('click', () => { s.ui.right = id; UI.refreshAll(); });
    return a;
  };
  el.appendChild(h('div', { class: 'right-tabs' }, mk('log', T('log')), h('span', { class: 'sep', text: '|' }),
    mk('queue', T('queue') + (s.queue.length ? ' (' + s.queue.length + ')' : '')), h('span', { class: 'sep', text: '|' }), mk('filter', T('log_filter'))));
}
function buildRightBody(el) {
  const s = G.s;
  if (s.ui.right === 'queue') {
    el.appendChild(note(T('queue_d', QUEUE_MAX)));
    if (!s.queue.length) { el.appendChild(note(T('queue_empty'))); return; }
    s.queue.forEach((q, i) => {
      const obj = q.t === 'bld' ? BLD_MAP[q.id] : TECH_MAP[q.id];
      el.appendChild(h('div', { class: 'q-item' + (i === 0 ? ' first' : '') },
        h('span', { text: (i + 1) + '. ' + L(obj) + (q.t === 'tech' ? ' ' + T('q_tech') : '') }), ' ',
        lbtn(T('remove'), () => queueRemove(i))));
    });
    el.appendChild(h('div', { class: 'line' }, lbtn(T('queue_clear'), () => { s.queue = []; })));
    return;
  }
  if (s.ui.right === 'filter') {
    el.appendChild(note(T('log_filter_d')));
    LOG_CATS.forEach(c => el.appendChild(h('div', null, checkbox(L(c), () => !s.ui.logHide[c.id], v => { s.ui.logHide[c.id] = !v; }))));
    el.appendChild(h('div', { class: 'line' }, lbtn(T('clear_log'), () => { G.logs = []; G.logVer++; })));
    return;
  }
  el.appendChild(region(() => G.logVer + JSON.stringify(s.ui.logHide), r => {
    G.logs.forEach(e => {
      if (s.ui.logHide[e.cls]) return;
      r.appendChild(h('div', { class: 'log-e ' + e.cls }, h('span', { class: 'log-d', text: e.m + ' ' + e.d }), ' ', e.t[LANG]));
    });
  }));
}

/* ---------- 导出、导入与输入弹窗 ---------- */
function openModal(title, text, readonly, onOk, single) {
  const m = document.getElementById('modal');
  m.innerHTML = '';
  const ta = single ? h('input', { class: 'modal-in', type: 'text', maxlength: 20 }) : h('textarea', { class: 'modal-ta' });
  ta.value = text || '';
  if (readonly) ta.readOnly = true;
  const close = () => { m.classList.add('hidden'); };
  const ok = () => { if (onOk(ta.value) !== false) close(); UI.refreshAll(); };
  const btns = h('div', { class: 'modal-btns' });
  if (readonly) btns.appendChild(h('a', { class: 'lb', text: T('copy'), onclick: () => { ta.select(); try { navigator.clipboard.writeText(ta.value); } catch (e) { document.execCommand('copy'); } } }));
  if (onOk) btns.appendChild(h('a', { class: 'lb', text: T('confirm'), onclick: ok }));
  btns.appendChild(h('a', { class: 'lb', text: T('close'), onclick: close }));
  if (single) ta.addEventListener('keydown', e => { if (e.key === 'Enter') ok(); if (e.key === 'Escape') close(); });
  m.appendChild(h('div', { class: 'modal-box' }, h('div', { class: 'modal-t', text: title }), ta, btns));
  m.classList.remove('hidden');
  ta.focus();
  if (readonly || single) ta.select();
}
/* 挑选面板：标题加一个实时刷新的区域，用于贸易商队与茶会的挑选。按 Esc 或“关闭”退出 */
function openPanel(title, keyFn, buildFn) {
  const m = document.getElementById('modal');
  m.innerHTML = '';
  const reg = new Region(keyFn, buildFn, 'div', 'panel-body');
  const close = () => { m.classList.add('hidden'); m.innerHTML = ''; UI.panel = null; document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  m.appendChild(h('div', { class: 'modal-box panel' },
    h('div', { class: 'panel-head' }, h('span', { class: 'modal-t', text: title }), h('a', { class: 'lb', text: T('close'), onclick: close })), reg.el));
  m.classList.remove('hidden');
  UI.panel = { reg: reg, close: close };
  reg.refresh();
  return UI.panel;
}
function showExport() { openModal(T('export_t'), exportSave(), true); }
function showImport() {
  openModal(T('import_t'), '', false, txt => {
    try { importSave(txt); LANG = G.s.lang; applyTheme(); UI.resetRoots(); log({ zh: '存档已导入。', en: 'Save imported.' }, 'sys'); return true; }
    catch (e) { alert(T('import_bad')); return false; }
  });
}

/* ---------- 初始化与刷新 ---------- */
UI.resetRoots = function () { UI.roots.forEach(r => { r.last = null; }); };
UI.init = function () {
  const mount = (id, keyFn, buildFn) => {
    const r = new Region(keyFn, buildFn);
    document.getElementById(id).appendChild(r.el);
    UI.roots.push(r);
    return r;
  };
  mount('topbar', () => G.s.theme + G.s.paused, buildTopbar);
  mount('resPanel', resKey, buildResPanel);
  mount('tabs', () => visibleTabs().map(t => t.id).join(',') + '|' + G.s.ui.tab, buildTabs);
  mount('tabBody', () => G.s.ui.tab, buildTabBody);
  mount('calendar', calKey, buildCalendar);
  mount('logHead', () => G.s.ui.right + G.s.queue.length, buildRightHead);
  mount('log', () => G.s.ui.right + (G.s.ui.right === 'queue' ? JSON.stringify(G.s.queue) : ''), buildRightBody);
  initTooltip();
  ['mouseup', 'touchend', 'touchcancel'].forEach(ev => document.addEventListener(ev, holdStop));
  window.addEventListener('blur', holdStop);
  document.title = T('game_title');
  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
};
UI.refreshAll = function () {
  UI.roots.forEach(r => r.refresh());
  if (UI.panel) UI.panel.reg.refresh();
  drawTip();
};
