/* 自由炼金的七芒星：七个角放材料，中心揭晓产物，下方是炼金点数的能量条。
 * 放入材料时：材料位弹一下，连向中心的光线亮起，中心外圈的能量环和下方的能量条随点数涨上去。
 * 揭晓时：材料化作光点流向中心，产物的等级与稀有度从 1 平滑上涨；40 级以上或 Rare 4 以上时，每涨一次都会抖动、迸出火花，
 * 稀有度跳上 Rare 4 以上时还会闪光；最后按结果放出光环、火花或黑烟，Rare 6 还有一段流光溢彩的特写。 */

const HEPTA_N = 7;
const CORE_R = 76, CORE_C = 2 * Math.PI * 76;   // 中心能量环的半径与周长（SVG 坐标，画布 400）
/* 七个角的位置（百分比，从正上方开始顺时针） */
function heptaPoint(i, rad) {
  const a = -Math.PI / 2 + i * 2 * Math.PI / HEPTA_N;
  return { x: 50 + rad * Math.cos(a), y: 50 + rad * Math.sin(a) };
}
function heptaSvg() {
  const pts = [];
  for (let i = 0; i < HEPTA_N; i++) pts.push(heptaPoint(i, 38));
  const path = step => {
    let d = '', j = 0;
    for (let k = 0; k <= HEPTA_N; k++) { const p = pts[j]; d += (k ? 'L' : 'M') + (p.x * 4).toFixed(1) + ' ' + (p.y * 4).toFixed(1) + ' '; j = (j + step) % HEPTA_N; }
    return d + 'Z';
  };
  let spokes = '';
  pts.forEach((p, i) => { spokes += '<line class="spoke" data-i="' + i + '" x1="200" y1="200" x2="' + (p.x * 4).toFixed(1) + '" y2="' + (p.y * 4).toFixed(1) + '"/>'; });
  return '<svg class="hepta-svg" viewBox="0 0 400 400" aria-hidden="true">' +
    '<defs><radialGradient id="heptaGlow"><stop offset="0%" stop-color="var(--glow)" stop-opacity=".55"/><stop offset="100%" stop-color="var(--glow)" stop-opacity="0"/></radialGradient></defs>' +
    '<circle class="aura" cx="200" cy="200" r="190" fill="url(#heptaGlow)"/>' +
    '<g class="spin"><circle class="ring dash" cx="200" cy="200" r="184"/></g>' +
    '<g class="spin rev"><circle class="ring dash2" cx="200" cy="200" r="160"/></g>' +
    '<circle class="ring" cx="200" cy="200" r="168"/>' +
    '<path class="star2" d="' + path(2) + '"/><path class="star" d="' + path(3) + '"/>' + spokes +
    '<circle class="cring-bg" cx="200" cy="200" r="' + CORE_R + '"/>' +
    '<circle class="cring" cx="200" cy="200" r="' + CORE_R + '" stroke-dasharray="' + CORE_C.toFixed(1) + '" stroke-dashoffset="' + CORE_C.toFixed(1) + '" transform="rotate(-90 200 200)"/>' +
    '</svg>';
}
function rarityStars(r) { return '★'.repeat(r) + '☆'.repeat(Math.max(0, 6 - r)); }
/* 等级所在区间的最高稀有度颜色，用来给能量条和能量环上色 */
function bandColor(lv) {
  const b = LEVEL_BANDS.find(x => lv >= x.from && lv <= x.to) || LEVEL_BANDS[0];
  return RARITY.color[b.rmax];
}
/* 当前材料的能量：总点数、点数换算成的等级（带小数）、最高等级 */
function alchEnergy(ids) {
  const p = alchPoints(ids);
  const lvf = Math.min(50, Math.cbrt(p));
  return { p: p, lvf: lvf, max: ids.length ? alchRange(ids).max : 1, frac: lvf / 50 };
}

function buildHepta() {
  const s = G.s;
  const box = h('div', { class: 'hepta-box' });
  const wrap = h('div', { class: 'hepta' });
  wrap.innerHTML = heptaSvg();
  const svg = wrap.querySelector('svg');
  const spokes = Array.from(svg.querySelectorAll('.spoke'));
  const cring = svg.querySelector('.cring');
  for (let i = 0; i < HEPTA_N; i++) {
    const p = heptaPoint(i, 38);
    const slot = h('div', { class: 'hslot', style: 'left:' + p.x + '%;top:' + p.y + '%',
      tip: () => s.alch.slots[i] ? tipItem(s.alch.slots[i]) + '<div class="tt-note">' + esc(T('al_click_remove')) + '</div>' : '' });
    const nm = h('div', { class: 'hs-n' }), lv = h('div', { class: 'hs-l' });
    slot.appendChild(nm);
    slot.appendChild(lv);
    slot.addEventListener('click', () => { if (!UI.alchAnim && s.alch.slots[i]) { slotRemove(i); UI.refreshAll(); } });
    let last = null;
    onUpdate(() => {
      const id = s.alch.slots[i], miss = id && alchMissing()[id];
      const key = (id || '') + '|' + !!miss + '|' + LANG;
      if (key === last) return;
      const wasEmpty = !last || last.charAt(0) === '|';
      last = key;
      slot.classList.toggle('filled', !!id);
      slot.classList.toggle('missing', !!miss);
      const sp = spokes[i];
      if (id) {
        const it = ITEMS[id];
        nm.textContent = L(it);
        nm.style.color = RARITY.color[it.r];
        lv.textContent = 'Lv ' + it.lv + '  R' + it.r;
        sp.classList.add('on');
        sp.style.stroke = RARITY.color[it.r];
        if (wasEmpty) retrigger(slot, 'pop');
      } else {
        nm.textContent = T('al_empty'); nm.style.color = ''; lv.textContent = '';
        sp.classList.remove('on');
        sp.style.stroke = '';
      }
    });
    wrap.appendChild(slot);
  }
  const core = h('div', { class: 'hcore' });
  const cLv = h('div', { class: 'hc-lv' }), cR = h('div', { class: 'hc-r' }), cN = h('div', { class: 'hc-n' });
  core.appendChild(cLv);
  core.appendChild(cR);
  core.appendChild(cN);
  wrap.appendChild(core);
  UI.hepta = { wrap: wrap, core: core, lv: cLv, r: cR, n: cN, spokes: spokes };

  /* 中心外圈的能量环与整体光晕：跟着材料的点数走 */
  let lastRing = null;
  onUpdate(() => {
    const en = alchEnergy(s.alch.slots);
    const key = en.lvf.toFixed(2);
    if (key === lastRing) return;
    lastRing = key;
    const color = s.alch.slots.length ? bandColor(en.max) : 'var(--line)';
    cring.setAttribute('stroke-dashoffset', (CORE_C * (1 - en.frac)).toFixed(1));
    cring.style.stroke = color;
    if (!UI.alchAnim) wrap.style.setProperty('--glow', s.alch.slots.length ? color : 'var(--accent)');
    wrap.style.setProperty('--energy', s.alch.slots.length ? (0.15 + en.frac * 0.85).toFixed(2) : '0');
  });

  /* 没有动画时，中心显示预览或上一次的产物 */
  let lastIdle = null;
  onUpdate(() => {
    const A = UI.alchAnim;
    /* 动画帧被浏览器暂停时（例如窗口在后台），也靠界面刷新继续推进 */
    if (A && !A.done) { alchFrame(performance.now(), true); return; }
    if (A && performance.now() < A.holdUntil) return;
    if (A && A.done) { UI.alchAnim = null; wrap.classList.remove('legend', 'epic'); }
    const ids = s.alch.slots, l = s.alch.last;
    let lvT = '', rT = '', nT = '', color = '', cls = '';
    if (ids.length) {
      const rg = alchRange(ids), rec = matchRecipe(ids);
      if (rec) { lvT = '?'; nT = s.recipes[rec.id] ? L(ITEMS[rec.out]) : T('al_core_recipe'); color = RARITY.color[5]; }
      else { lvT = rg.min === rg.max ? String(rg.max) : rg.min + '~' + rg.max; nT = T('al_core_preview'); }
      cls = 'preview';
    } else if (l) {
      const it = ITEMS[l.out];
      lvT = String(it.lv); rT = rarityStars(it.r); nT = L(it); color = RARITY.color[it.r]; cls = l.failed ? 'fail' : 'done';
    } else { nT = T('al_core_empty'); cls = 'empty'; }
    const key = [lvT, rT, nT, color, cls, LANG].join('|');
    if (key === lastIdle) return;
    lastIdle = key;
    cLv.textContent = lvT; cR.textContent = rT; cN.textContent = nT;
    core.style.color = color;
    core.style.setProperty('--glc', color || 'transparent');
    core.style.setProperty('--gl', cls === 'done' ? '10px' : '0px');
    core.className = 'hcore ' + cls;
  });
  box.appendChild(h('div', { class: 'hepta-row' }, wrap, buildHeat()));
  box.appendChild(buildAlchGauge());
  return box;
}

/* 七芒星右侧竖着的火力滑块：0 为文火，50 为中火，100 为武火。拖动、方向键调整，双击回到中火 */
const HEAT_COLORS = ['#3a8fc4', '#c98a2b', '#d2391e'];
function mixHex(a, b, t) {
  const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function heatColor(v) { return v <= 50 ? mixHex(HEAT_COLORS[0], HEAT_COLORS[1], v / 50) : mixHex(HEAT_COLORS[1], HEAT_COLORS[2], (v - 50) / 50); }
function heatName(v) { return v === 50 ? T('heat_mid') : String(v); }
function heatTip() {
  const v = heatLevel(), m = heatMinShift(), f = heatMod('fail');
  return tipSimple(T('heat') + ' ' + v, T('heat_d')) + '<div class="tt-sep"></div>' +
    ttRow(T('heat_pts'), pct(heatMod('points'))) +
    ttRow(T('heat_min'), (m > 0 ? '+' : '') + m) +
    ttRow(T('heat_fail'), (f > 0 ? '+' : f < 0 ? '-' : '') + pctAbs(f));
}
function buildHeat() {
  const track = h('div', { class: 'heat-track', role: 'slider', tabindex: '0', 'aria-orientation': 'vertical',
    'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': T('heat') });
  const fill = h('div', { class: 'heat-fill' }), thumb = h('div', { class: 'heat-thumb' });
  track.appendChild(fill);
  track.appendChild(h('div', { class: 'heat-mid' }));
  track.appendChild(thumb);
  const val = h('div', { class: 'heat-v' });
  const box = h('div', { class: 'heat', tip: heatTip },
    h('div', { class: 'heat-l', text: T('heat_hi') }), track, h('div', { class: 'heat-l', text: T('heat_lo') }), val);
  const setFromY = y => {
    const rc = track.getBoundingClientRect();
    let v = (rc.bottom - y) / rc.height * 100;
    if (Math.abs(v - 50) < 3) v = 50;   // 中火附近吸附一下，方便拨回不调整的位置
    setHeat(clamp(v, 0, 100));
    UI.refreshAll();
  };
  let drag = false;
  track.addEventListener('pointerdown', e => {
    drag = true;
    track.setPointerCapture(e.pointerId);
    track.focus();
    setFromY(e.clientY);
    e.preventDefault();
  });
  track.addEventListener('pointermove', e => { if (drag) setFromY(e.clientY); });
  track.addEventListener('pointerup', () => { drag = false; });
  track.addEventListener('pointercancel', () => { drag = false; });
  track.addEventListener('dblclick', () => { setHeat(50); UI.refreshAll(); });
  track.addEventListener('keydown', e => {
    const v = heatLevel(), st = e.shiftKey ? 10 : 1;
    const to = { ArrowUp: v + st, ArrowRight: v + st, ArrowDown: v - st, ArrowLeft: v - st, PageUp: v + 10, PageDown: v - 10, Home: 0, End: 100 }[e.key];
    if (to == null) return;
    e.preventDefault();
    setHeat(to);
    UI.refreshAll();
  });
  let last = null;
  onUpdate(() => {
    const v = heatLevel(), key = v + '|' + LANG;
    if (key === last) return;
    last = key;
    const c = heatColor(v);
    thumb.style.bottom = v + '%';
    thumb.style.setProperty('--hc', c);
    thumb.style.setProperty('--hg', (3 + Math.abs(v - 50) / 4).toFixed(0) + 'px');
    /* 从中间往滑块位置涂一段颜色，看得出偏向哪一边 */
    fill.style.bottom = Math.min(v, 50) + '%';
    fill.style.height = Math.abs(v - 50) + '%';
    fill.style.background = c;
    track.setAttribute('aria-valuenow', String(v));
    track.setAttribute('aria-valuetext', T('heat') + ' ' + heatName(v));
    val.textContent = heatName(v);
    val.style.color = v === 50 ? '' : c;
  });
  return box;
}

/* 能量条下方的加成说明：同元素、多类别、火力，以及同元素改投的概率 */
function alchBonusText(ids) {
  if (!ids.length || matchRecipe(ids)) return '';
  const b = alchBonus(ids), parts = [], out = [];
  b.groups.forEach(g => parts.push(g.neutral ? T('ab_el_n', L(ELEMENTS[g.el]), g.n, g.neutral, pct(g.b)) : T('ab_el', L(ELEMENTS[g.el]), g.n, pct(g.b))));
  if (b.cat) parts.push(T('ab_cat', b.cats, pct(b.cat)));
  if (b.heat) parts.push(T('ab_heat', pct(b.heat)));
  if (parts.length) out.push(T('ab_head') + parts.join(T('list_sep')) + (parts.length > 1 ? T('list_sep') + T('ab_total', pct(b.total)) : ''));
  if (b.dom.length) out.push(T('ab_sway', b.dom.map(e => L(ELEMENTS[e])).join(T('or')), pctAbs(b.sway)));
  if (!out.length) return '';
  return out.map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(T('ab_gap')) + T('ab_gap').trim();
}

/* 炼金点数的能量条：长度按“点数的立方根 / 50”，刻度是各个等级区间的分界；
 * 点数上涨时数字会滚动，并飘出增加的点数；减少时能量条慢慢退下去 */
function buildAlchGauge() {
  const s = G.s;
  const g = h('div', { class: 'agauge' });
  const val = h('span', { class: 'ag-v' }), maxT = h('span', { class: 'ag-m' });
  const head = h('div', { class: 'ag-head' }, h('span', { class: 'ag-l', text: T('ag_points') }), val, maxT);
  const fill = h('div', { class: 'ag-fill' });
  const barEl = h('div', { class: 'ag-bar' }, fill);
  [10, 20, 30, 36, 42, 46].forEach(lv => {
    barEl.appendChild(h('span', { class: 'ag-tick', style: 'left:' + (lv / 50 * 100) + '%' }));
    barEl.appendChild(h('span', { class: 'ag-tl', style: 'left:' + (lv / 50 * 100) + '%', text: String(lv) }));
  });
  const sub = h('div', { class: 'ag-sub' }), bon = h('div', { class: 'ag-bonus' });
  g.appendChild(head);
  g.appendChild(barEl);
  g.appendChild(sub);
  g.appendChild(bon);
  let shown = 0, lastP = null, lastSub = null, lastBon = null, lastHeat = heatLevel();
  onUpdate(() => {
    const ids = s.alch.slots, en = alchEnergy(ids), hv = heatLevel();
    if (lastP === null) { shown = en.p; lastP = en.p; }
    if (en.p !== lastP) {
      /* 只是拨了火力时不飘数字，免得拖动滑块时数字刷屏 */
      if (en.p > lastP + 0.5 && hv === lastHeat) {
        const d = h('span', { class: 'ag-delta', text: '+' + fmt(en.p - lastP, 0) });
        head.appendChild(d);
        setTimeout(() => d.remove(), 1200);
      }
      lastP = en.p;
    }
    /* 数字向目标值滚动 */
    shown += (en.p - shown) * 0.45;
    if (Math.abs(en.p - shown) < 0.5) shown = en.p;
    setText(val, fmt(shown, 0));
    setText(maxT, ids.length ? T('ag_max', en.max) : '');
    const color = ids.length ? bandColor(en.max) : 'var(--line)';
    fill.style.width = (en.frac * 100).toFixed(2) + '%';
    fill.style.background = color;
    g.classList.toggle('full', en.lvf >= 50);
    let st;
    if (!ids.length) st = T('ag_empty');
    else {
      const rec = matchRecipe(ids), rg = alchRange(ids);
      if (rec) st = s.recipes[rec.id] ? T('al_recipe_known', L(ITEMS[rec.out])) : T('al_recipe_unknown');
      else {
        const band = LEVEL_BANDS.filter(b => b.to >= rg.min && b.from <= rg.max);
        const next = en.max >= 50 ? T('ag_full') : T('ag_next', fmt(Math.ceil(levelPoints(en.max + 1) - en.p), 0));
        st = T('ag_sub', rg.min, rg.max, Math.min(...band.map(b => b.rmin)), Math.max(...band.map(b => b.rmax))) + T('list_sep') + next;
      }
    }
    if (st !== lastSub) { lastSub = st; sub.textContent = st; }
    lastHeat = hv;
    const bt = alchBonusText(ids);
    if (bt !== lastBon) { lastBon = bt; bon.textContent = bt; }
  });
  return g;
}

/* 点击“开始炼金” */
function startTransmute() {
  if (UI.alchAnim || !canTransmute()) return;
  const snap = G.s.alch.slots.map((id, i) => ({ i: i, color: RARITY.color[ITEMS[id].r] }));
  const res = transmute(true);
  if (!res) return;
  const target = res.recipe ? res.out : (res.failed ? res.intended : res.out);
  const it = ITEMS[target];
  const A = UI.alchAnim = {
    res: res, lv: it.lv, r: it.r, recipe: !!res.recipe, snap: snap,
    t0: performance.now(), dur: 1100 + it.lv * 50 + (it.r >= 5 ? 700 : 0),
    lastLv: 0, lastR: 0, lastFlow: 0, done: false, holdUntil: 0
  };
  if (UI.hepta) {
    const H = UI.hepta;
    H.wrap.classList.add('active');
    H.wrap.classList.remove('legend', 'epic');
    H.core.className = 'hcore rolling';
    H.n.textContent = '';
    snap.forEach(x => { const sp = H.spokes[x.i]; sp.classList.add('on', 'flow'); sp.style.stroke = x.color; });
  }
  /* 窗口被最小化时浏览器不画动画帧，用计时器保证结果一定会揭晓 */
  A.timer = setTimeout(() => finishAlchAnim(), A.dur + 1500);
  requestAnimationFrame(alchFrame);
}
function alchFrame(now, noLoop) {
  const A = UI.alchAnim;
  if (!A || A.done) return;
  const t = Math.min(1, (now - A.t0) / A.dur);
  const e = 1 - Math.pow(1 - t, 2.4);
  const lv = t >= 1 ? A.lv : Math.max(1, Math.floor(1 + (A.lv - 1) * e));
  const r = t >= 1 ? A.r : Math.min(A.r, 1 + Math.floor((A.r - 1) * Math.min(1, e * 1.08)));
  const H = UI.hepta;
  /* 材料化作光点流向中心，前半段最密 */
  if (H && t < 0.85 && now - A.lastFlow > 70 + t * 160 && A.snap.length) {
    A.lastFlow = now;
    const x = A.snap[Math.floor(Math.random() * A.snap.length)];
    heptaFlow(H.wrap, x.i, x.color);
  }
  if (lv !== A.lastLv || r !== A.lastR) {
    const color = A.recipe ? RARITY.color[5] : RARITY.color[r];
    if (H) {
      H.lv.textContent = String(lv);
      H.r.textContent = rarityStars(r);
      H.core.style.color = color;
      H.core.style.setProperty('--glc', color);
      H.core.style.setProperty('--gl', (4 + r * 3 + lv / 5).toFixed(0) + 'px');
      H.wrap.style.setProperty('--glow', color);
      if (lv >= 40 || r >= 4) {
        retrigger(H.core, r >= 5 || lv >= 46 ? 'big-shake' : 'shake');
        heptaSparks(H.wrap, color, r >= 5 ? 6 : 3, 60);
      }
      if (r !== A.lastR && r >= 4) { retrigger(H.core, 'flash'); retrigger(H.wrap, 'pulse'); }
    }
    A.lastLv = lv;
    A.lastR = r;
  }
  if (t >= 1) finishAlchAnim();
  else if (!noLoop) requestAnimationFrame(alchFrame);
}
/* 揭晓结果，然后补写日志 */
function finishAlchAnim() {
  const A = UI.alchAnim;
  if (!A || A.done) return;
  A.done = true;
  clearTimeout(A.timer);
  const H = UI.hepta, res = A.res, it = ITEMS[res.out];
  A.holdUntil = performance.now() + (it.r >= 6 && !res.failed ? 3200 : 1800);
  if (H) {
    H.wrap.classList.remove('active');
    H.spokes.forEach(sp => sp.classList.remove('flow'));
    H.lv.textContent = String(it.lv);
    H.r.textContent = rarityStars(it.r);
    H.n.textContent = L(it);
    const color = res.failed ? '' : RARITY.color[it.r];
    H.core.style.color = color;
    H.core.style.setProperty('--glc', color || 'transparent');
    H.core.style.setProperty('--gl', res.failed ? '0px' : '10px');
    if (res.failed) {
      H.core.className = 'hcore fail';
      retrigger(H.core, 'smoke');
      heptaSmoke(H.wrap);
    } else {
      H.core.className = 'hcore done';
      retrigger(H.core, 'reveal');
      heptaBurst(H.wrap, color, it.r >= 6 ? 4 : it.r >= 5 ? 3 : 1);
      /* 同元素改投：迸出一圈这种元素颜色的火花 */
      if (res.swayed && ELEMENTS[res.swayed]) heptaSparks(H.wrap, ELEMENTS[res.swayed].color, 12, 110);
      if (it.r >= 4 || res.recipe) heptaSparks(H.wrap, color, it.r >= 6 ? 36 : it.r >= 5 ? 22 : 14, it.r >= 6 ? 170 : 120);
      if (it.r >= 6) H.wrap.classList.add('legend');
      else if (it.r >= 5) H.wrap.classList.add('epic');
    }
  }
  res.flush();
  UI.refreshAll();
}
/* 让一个 CSS 动画类重新播放 */
function retrigger(el, cls) {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
function heptaSparks(wrap, color, n, dist) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, d = dist * (0.5 + Math.random() * 0.8);
    const sp = h('span', { class: 'hspark' });
    sp.style.setProperty('--dx', (Math.cos(a) * d).toFixed(0) + 'px');
    sp.style.setProperty('--dy', (Math.sin(a) * d).toFixed(0) + 'px');
    sp.style.background = color;
    wrap.appendChild(sp);
    setTimeout(() => sp.remove(), 900);
  }
}
/* 一颗光点从第 i 个材料位飞向中心 */
function heptaFlow(wrap, i, color) {
  const p = heptaPoint(i, 38);
  const dot = h('span', { class: 'hflow' });
  dot.style.left = p.x + '%';
  dot.style.top = p.y + '%';
  dot.style.background = color;
  dot.style.boxShadow = '0 0 6px ' + color;
  wrap.appendChild(dot);
  void dot.offsetWidth;
  dot.style.left = '50%';
  dot.style.top = '50%';
  dot.style.opacity = '0';
  setTimeout(() => dot.remove(), 700);
}
function heptaBurst(wrap, color, n) {
  for (let i = 0; i < n; i++) {
    const b = h('span', { class: 'hburst' });
    b.style.borderColor = color;
    b.style.animationDelay = (i * 0.18) + 's';
    wrap.appendChild(b);
    setTimeout(() => b.remove(), 1400 + i * 200);
  }
}
function heptaSmoke(wrap) {
  for (let i = 0; i < 5; i++) {
    const p = h('span', { class: 'hsmoke' });
    p.style.setProperty('--dx', ((Math.random() - 0.5) * 60).toFixed(0) + 'px');
    p.style.animationDelay = (i * 0.08) + 's';
    wrap.appendChild(p);
    setTimeout(() => p.remove(), 1600);
  }
}
