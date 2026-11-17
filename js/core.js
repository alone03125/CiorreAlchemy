/* 核心：状态、效果汇总、幸福度、产出计算、时间推进、存档、日志与通用工具 */

var G = {
  version: '0.4.1',
  s: null,          // 当前存档状态
  E: {},            // 当前生效的效果汇总
  happy: 100,       // 幸福度（百分数）
  happyParts: {},   // 幸福度明细
  rates: {},        // 各资源每秒净变化（建筑与职业的持续产出）
  rateDetail: {},   // 产出明细（用于悬浮提示）
  flow: {},         // 最近一段时间的实际变化速度（含营业、后厨等离散收支）
  logs: [],
  logVer: 0,
  invVer: 0,
  silent: false,
  notice: null
};

var SAVE_KEY = 'ciorre_alchemy_workshop_v1';
var SAVE_VERSION = 3;
var RES_MAP = {};
RESOURCES.forEach(function (r) { RES_MAP[r.id] = r; });
var BLD_MAP = {};
BUILDINGS.forEach(function (b) { BLD_MAP[b.id] = b; });
var TECH_MAP = {};
TECHS.forEach(function (t) { TECH_MAP[t.id] = t; });
var JOB_MAP = {};
JOBS.forEach(function (j) { JOB_MAP[j.id] = j; });
var DEST_MAP = {};
DESTS.forEach(function (d) { DEST_MAP[d.id] = d; });
var PARTNER_MAP = {};
TRADE_PARTNERS.forEach(function (p) { PARTNER_MAP[p.id] = p; });

/* ---------- 通用工具 ---------- */
function rand(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
/* 加权随机：pairs 的每一项依次为“值”和“权重” */
function wpick(pairs) {
  var total = 0, i;
  for (i = 0; i < pairs.length; i++) total += Math.max(0, pairs[i][1]);
  if (total <= 0) return pairs.length ? pairs[0][0] : null;
  var r = Math.random() * total;
  for (i = 0; i < pairs.length; i++) {
    r -= Math.max(0, pairs[i][1]);
    if (r < 0) return pairs[i][0];
  }
  return pairs[pairs.length - 1][0];
}
function tally(ids) {
  var c = {};
  ids.forEach(function (id) { c[id] = (c[id] || 0) + 1; });
  return c;
}

/* ---------- 新存档 ---------- */
function newState() {
  var s = {
    v: SAVE_VERSION,
    lang: 'zh',
    theme: 'light',
    time: { days: START_MONTH * MONTH_DAYS, lastMonthAbs: START_MONTH, lastDay: START_MONTH * MONTH_DAYS },
    res: {}, bld: {}, tech: {}, flags: {}, seen: {}, recipes: {}, inv: {},
    dragons: [], nextDragonId: 1, dragonProg: 0, starve: 0, leader: null,
    shop: { queue: 0, serveProg: 0, display: [], window: [], lost: 0, noStock: 0, snack: true, showCount: 0,
      demand: {}, sale: {}, staffSnack: {}, autoRefine: false, payIn: 'quill' },
    kitchen: { targets: {}, task: null, manual: null, priority: null },
    farm: { plots: [], known: {}, autoFert: true, task: null, manual: null },
    luxSeen: {}, luxHave: {},
    market: { prog: 0, last: [] },
    rhasari: { joined: false, flame: 0, mood: 50, insultCd: 0, hinted: false },
    lysari: { visits: 0, rain: 0 },
    raku: { visits: 0, last: null },
    trip: { count: 0, away: 0, place: null, memories: 0 },
    party: { days: 0, bonus: 30, total: 0 },
    sky: { event: 0 },
    trade: { count: {}, rel: {}, unlocked: {}, caravans: [] },
    disp: { unlocked: { lunavite: true }, active: [], history: [], selDest: 'lunavite', selDragon: null },
    comm: { qkey: -1, list: [], letter: 0, ups: {}, plumeBuys: 0, everGot: false, done: 0 },
    alch: { slots: [], guard: false, last: null },
    queue: [],
    ach: {},
    stats: { served: 0, alch: 0, caramel: 0, dispDone: {}, clicks: 0, dispatches: 0, harvests: 0, insults: 0,
      rakuFed: 0, composted: 0, parties: 0, stars: 0, released: 0, crafted: 0, fed: 0, trades: 0, coinsEarned: 0,
      quillEarned: 0, windowSold: 0, displaySold: 0, arrived: 0, marketDraws: 0 },
    ui: { tab: 'nest', invView: 'items', invSort: 'lv', alchSort: 'lv', alchEl: '', showDoneTech: false,
      bldCat: 'all', resCollapsed: {}, logHide: {}, right: 'log', goodsOnlyStock: false,
      census: { sort: 'cl', job: '', el: '', page: 0 }, menuView: 'goods' },
    paused: false,
    lastSave: Date.now(),
    started: Date.now()
  };
  RESOURCES.forEach(function (r) { s.res[r.id] = 0; });
  BUILDINGS.forEach(function (b) { s.bld[b.id] = 0; });
  return s;
}

function isPlainObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
function deepMerge(base, src) {
  for (var k in src) {
    if (!Object.prototype.hasOwnProperty.call(src, k)) continue;
    if (isPlainObj(base[k]) && isPlainObj(src[k])) deepMerge(base[k], src[k]);
    else base[k] = src[k];
  }
  return base;
}

/* ---------- 日历 ---------- */
function monthAbs() { return Math.floor(G.s.time.days / MONTH_DAYS); }
function monthIdx() { return monthAbs() % 12; }
function curMonth() { return MONTHS[monthIdx()]; }
function yearNum() { return Math.floor(G.s.time.days / (MONTH_DAYS * 12)) + 1; }
function dayOfMonth() { return Math.floor(G.s.time.days % MONTH_DAYS) + 1; }
function quarterKey() { return Math.floor(monthAbs() / 3); }
function daysLeftInQuarter() {
  var qEnd = (quarterKey() + 1) * 3 * MONTH_DAYS;
  return Math.max(0, qEnd - G.s.time.days);
}
/* 月相：0 为上弦（每月第 1 到 15 日），1 为下弦（第 16 到 30 日） */
function moonPhase() { return dayOfMonth() <= PHASE_DAYS ? 0 : 1; }
/* 当前月相带来的额外杂质概率 */
function phaseMod() { return MOON_MOD[monthIdx()][moonPhase()]; }

/* ---------- 小龙效率与熟练度 ---------- */
function skillTier(xp) {
  var t = 0;
  for (var i = 0; i < SKILL_TIERS.length; i++) if (xp >= SKILL_TIERS[i].min) t = i;
  return t;
}
function skillBonus(xp) { return SKILL_TIERS[skillTier(xp || 0)].bonus; }
function skillProgress(xp) {
  var t = skillTier(xp);
  if (t >= SKILL_TIERS.length - 1) return 1;
  var a = SKILL_TIERS[t].min, b = SKILL_TIERS[t + 1].min;
  return (xp - a) / (b - a);
}
function elMatch(d, jobId) {
  var j = JOB_MAP[jobId];
  return !!j && j.els.indexOf(d.el) >= 0;
}
/* 单只小龙在某职业上的效率倍数（不含幸福度） */
function dragonEff(d, jobId) {
  var e = 1 + (d.gl - 1) * 0.015;
  e *= 1 + skillBonus((d.skills && d.skills[jobId]) || 0);
  if (elMatch(d, jobId)) e *= 1 + ELEMENT_MATCH;
  if (d.fed > 0) e *= 1 + WELLFED_BONUS;
  return e;
}
function jobEff(jobId) {
  var t = 0;
  G.s.dragons.forEach(function (d) { if (!d.away && d.job === jobId) t += dragonEff(d, jobId); });
  return t;
}
function jobCount(jobId) {
  var n = 0;
  G.s.dragons.forEach(function (d) { if (!d.away && d.job === jobId) n++; });
  return n;
}
function happyFactor() { return Math.max(0.25, G.happy / 100); }
/* 特殊职业（店员、厨师、园丁）的有效人数，已计入幸福度 */
function workForce(jobId) { return jobEff(jobId) * happyFactor() * (1 + eff('job.' + jobId)); }

/* ---------- 效果汇总 ---------- */
function computeEffects() {
  var s = G.s, E = {};
  function add(obj, mult) {
    for (var k in obj) E[k] = (E[k] || 0) + obj[k] * mult;
  }
  BUILDINGS.forEach(function (b) {
    var n = s.bld[b.id];
    if (n > 0 && b.eff) add(b.eff, n);
  });
  TECHS.forEach(function (t) { if (s.tech[t.id] && t.eff) add(t.eff, 1); });
  FAVOR_UPS.forEach(function (f) { var lv = favorLevel(f.id); if (lv > 0 && f.eff) add(f.eff, lv); });
  add(curMonth().eff, 1);
  if (s.trip.memories) add(MEMORY_EFF, s.trip.memories);
  if (s.lysari.rain > 0) add({ farmGrowth: 0.15, waterRegen: 5 }, 1);
  if (s.party.days > 0) add({ custMult: partyBonus() / 100 }, 1);
  var ld = leaderDragon();
  if (ld) add(LEADER_BONUS[ld.el], 1 + ld.gl / 50);
  G.E = E;
  computeHappiness();
}
function eff(k) { return G.E[k] || 0; }
/* 青睐升级的等级（旧存档里是 true，按 1 级算） */
function favorLevel(id) {
  var v = G.s.comm.ups[id];
  return v === true ? 1 : (+v || 0);
}

function leaderDragon() {
  var s = G.s;
  if (s.leader == null) return null;
  var d = s.dragons.find(function (x) { return x.id === s.leader; });
  if (!d) s.leader = null;
  return d || null;
}

/* 员工零食：允许且有库存的商品种类 */
function staffSnacks() {
  var s = G.s, list = [];
  if (!s.bld.snackshelf) return list;
  for (var id in s.shop.staffSnack) if (s.shop.staffSnack[id] && (s.res[id] || 0) >= 1) list.push(id);
  return list;
}

/* 幸福度：参照原版，超过 5 只后每只 -2%，温泉池按比例减轻；零食、饱足、保育员、茶会、建筑等提高 */
function computeHappiness() {
  var s = G.s, N = s.dragons.length, P = {};
  P.crowd = -Math.max(0, N - 5) * 2 * Math.max(0.25, 1 - eff('crowdRelief'));
  P.bld = eff('happiness');
  P.snack = Math.min(40, staffSnacks().length * 5);
  var fed = 0;
  s.dragons.forEach(function (d) { if (d.fed > 0) fed++; });
  P.fed = N ? 10 * fed / N : 0;
  P.care = jobEff('caretaker') * CARETAKER_HAPPY;
  P.party = partyBonus();
  /* 贵重品：每种有库存的都提高幸福度（参照原版的奢侈品） */
  P.lux = 0;
  LUXURIES.forEach(function (l) { if ((s.res[l.id] || 0) > 0) P.lux += l.happy; });
  var h = 100;
  for (var k in P) h += P[k];
  G.happy = Math.max(25, h);
  G.happyParts = P;
}

function capOf(id) {
  var r = RES_MAP[id];
  if (!r) return Infinity;
  if (r.cap === Infinity) return Infinity;
  var c = r.cap + eff('cap.' + id);
  if (r.group === 'goods') c += eff('cap.goods');
  if (r.group === 'processed') c += eff('cap.processed');
  if (r.group === 'ingredient') c += eff('cap.ingredient');
  return c;
}
function upkeepRate() { return DRAGON_UPKEEP * Math.max(0.25, 1 - eff('upkeepRelief')); }

/* ---------- 产出 ---------- */
function computeRates() {
  var s = G.s, base = {}, D = {}, R = {};
  RESOURCES.forEach(function (r) { base[r.id] = 0; D[r.id] = []; R[r.id] = 0; });
  BUILDINGS.forEach(function (b) {
    var n = s.bld[b.id];
    if (!n || !b.eff) return;
    for (var k in b.eff) {
      if (k.indexOf('prod.') !== 0) continue;
      var res = k.slice(5), v = b.eff[k] * n;
      base[res] += v;
      D[res].push([b, v]);
    }
  });
  var hf = happyFactor();
  JOBS.forEach(function (j) {
    var e = jobEff(j.id);
    if (!e) return;
    for (var res in j.prod) {
      var v = j.prod[res] * e * (1 + eff('job.' + j.id)) * hf;
      base[res] += v;
      D[res].push([j, v]);
    }
  });
  RESOURCES.forEach(function (r) {
    if (!r.unlocked(s)) { base[r.id] = 0; D[r.id] = []; return; }
    var b = base[r.id];
    if (!b) return;
    var m = 1 + eff('mult.' + r.id);
    R[r.id] = b * m;
    if (Math.abs(m - 1) > 1e-9) D[r.id].push(['bonus', b * (m - 1), m - 1]);
  });
  var n = s.dragons.length;
  if (n) {
    var up = n * upkeepRate();
    R.coins -= up;
    D.coins.push(['upkeep', -up]);
  }
  if (n) LUXURIES.forEach(function (l) {
    if ((s.res[l.id] || 0) <= 0) return;
    R[l.id] -= l.use * n;
    D[l.id].push(['luxuse', -l.use * n]);
  });
  var snacks = staffSnacks();
  if (snacks.length && n) {
    snacks.forEach(function (id) {
      R[id] -= 0.001 * n;
      D[id].push(['snack', -0.001 * n]);
    });
  }
  G.rates = R;
  G.rateDetail = D;
}

/* ---------- 资源与物品 ---------- */
function addRes(id, amt) {
  var s = G.s, v = s.res[id] || 0, cap = capOf(id);
  if (amt > 0) {
    if (v >= cap) return 0;
    var nv = Math.min(cap, v + amt);
    s.res[id] = nv;
    G.flowAcc[id] = (G.flowAcc[id] || 0) + (nv - v);
    return nv - v;
  }
  var nv2 = Math.max(0, v + amt);
  s.res[id] = nv2;
  G.flowAcc[id] = (G.flowAcc[id] || 0) + (nv2 - v);
  return nv2 - v;
}
G.flowAcc = {};
function addItem(id, n) {
  var s = G.s;
  s.inv[id] = (s.inv[id] || 0) + n;
  s.seen[id] = true;
  G.invVer++;
}
function removeItem(id, n) {
  var s = G.s;
  s.inv[id] = (s.inv[id] || 0) - n;
  if (s.inv[id] <= 0) delete s.inv[id];
  G.invVer++;
}
function getAmt(k) {
  if (RES_MAP[k]) return G.s.res[k] || 0;
  return G.s.inv[k] || 0;
}
function canAfford(cost) {
  for (var k in cost) if (getAmt(k) < cost[k] - 1e-9) return false;
  return true;
}
function spendCost(cost) {
  for (var k in cost) {
    if (RES_MAP[k]) addRes(k, -cost[k]);
    else removeItem(k, cost[k]);
  }
}
function costName(k) {
  if (RES_MAP[k]) return L(RES_MAP[k]);
  if (ITEMS[k]) return L(ITEMS[k]);
  return k;
}
/* 物品价值，按铜翎计。v0.4.1 起随等级的 2.6 次方增长，高等级、高稀有度的产物大幅升值；
 * 系数以“终焉布丁”（Lv 50，Rare 6）定为 99 金翎来反推 */
var ITEM_VALUE_POW = 2.6;
var ITEM_VALUE_K = 99 * QUILL_GOLD / (Math.pow(50, ITEM_VALUE_POW) * RARITY.valueMult[6]);
function itemValue(id) {
  var it = ITEMS[id];
  if (!it) return 0;
  if (id === 'impurity') return 1;
  return Math.max(1, Math.round(ITEM_VALUE_K * Math.pow(it.lv, ITEM_VALUE_POW) * RARITY.valueMult[it.r] * (1 + eff('itemValue'))));
}
/* 收款：按设置收翎鸾或硬币。翎鸾装满时自动改收硬币。返回 {zh, en} 形式的收入说明 */
function payout(copper) {
  var s = G.s;
  if (copper <= 0) return { zh: '无', en: 'nothing' };
  if (s.shop.payIn !== 'coins' && s.res.quill < capOf('quill') - 0.5) {
    var got = addRes('quill', copper);
    s.stats.quillEarned += got;
    return quillPair(got);
  }
  var coins = copper * COIN_PER_COPPER;
  addRes('coins', coins);
  s.stats.coinsEarned += coins;
  return { zh: fmt(coins) + ' 硬币', en: fmt(coins) + ' coins' };
}
/* 用两种语言写出一笔翎鸾 */
function quillPair(c) {
  var keep = LANG, out = {};
  ['zh', 'en'].forEach(function (lg) { LANG = lg; out[lg] = fmtQuill(c); });
  LANG = keep;
  return out;
}
function itemPair(id, n) {
  var it = ITEMS[id];
  if (n == null) return { zh: it.zh, en: it.en };
  return { zh: it.zh + ' ×' + n, en: it.en + ' x' + n };
}
function resAmtPair(id, n) {
  var r = RES_MAP[id];
  if (r.quill) { var q = quillPair(n); return { zh: r.zh + ' ' + q.zh, en: r.en + ' ' + q.en }; }
  return { zh: r.zh + ' ' + fmt(n), en: r.en + ' ' + fmt(n) };
}
function joinPairs(list) {
  return {
    zh: list.map(function (p) { return p.zh; }).join('、') || '什么也没有',
    en: list.map(function (p) { return p.en; }).join(', ') || 'nothing'
  };
}
function lootPair(loot) {
  var list = [];
  for (var id in loot) list.push(itemPair(id, loot[id]));
  return joinPairs(list);
}

/* ---------- 日志 ---------- */
function resolveArg(a, lg) {
  if (a == null) return '';
  if (typeof a === 'object' && a.zh !== undefined) return a[lg];
  if (typeof a === 'number') return fmt(a);
  return String(a);
}
function fmtPair(tpl, args) {
  var out = {};
  ['zh', 'en'].forEach(function (lg) {
    var str = (tpl[lg] || tpl.zh).replace(/\{(\d+)\}/g, function (m, i) { return resolveArg(args[i], lg); });
    if (lg === 'en' && str) str = str.charAt(0).toUpperCase() + str.slice(1);
    out[lg] = str;
  });
  return out;
}
function log(pair, cat) {
  if (G.silent) return;
  G.logs.unshift({ t: pair, cls: cat || 'sys', m: MONTHS[monthIdx()].ab, d: dayOfMonth() });
  if (G.logs.length > 200) G.logs.pop();
  G.logVer++;
}
function logC(cat, tpl) {
  var args = Array.prototype.slice.call(arguments, 2);
  log(fmtPair(tpl, args), cat);
}

/* ---------- 时间推进 ---------- */
function advanceTime(dt) {
  var s = G.s;
  s.time.days += dt / DAY_SEC;
  var mA = monthAbs();
  while (s.time.lastMonthAbs < mA) {
    s.time.lastMonthAbs++;
    onMonthStart(s.time.lastMonthAbs);
  }
  var dA = Math.floor(s.time.days);
  while (s.time.lastDay < dA) {
    s.time.lastDay++;
    onDay();
  }
}

function onDay() {
  var s = G.s;
  /* Rhasari 心情：越高跌得越快，越低跌得越慢 */
  if (s.rhasari.joined && s.rhasari.mood > 20) s.rhasari.mood = Math.max(20, s.rhasari.mood - 0.02 * (s.rhasari.mood - 20));
  if (s.lysari.rain > 0) s.lysari.rain = Math.max(0, s.lysari.rain - 1);
  /* 声望缓慢回落，越高回落越多 */
  if (s.res.renown > 0) s.res.renown = Math.max(0, s.res.renown * (1 - 0.0005));
  s.dragons.forEach(function (d) { if (d.fed > 0) d.fed = Math.max(0, d.fed - 1); });
  if (s.party.days > 0) {
    s.party.days = Math.max(0, s.party.days - 1);
    if (s.party.days === 0) logC('dragon', TXT.party.end);
  }
  demandDaily();
  farmDaily();
  skyDaily();
  /* 贵重品用光时提醒一次 */
  LUXURIES.forEach(function (l) {
    var have = (s.res[l.id] || 0) > 0;
    if (s.luxHave[l.id] && !have) logC('dragon', TXT.lux.out, l);
    s.luxHave[l.id] = have;
  });
  /* 每月第 16 日转为下弦 */
  if (s.time.lastDay % MONTH_DAYS === PHASE_DAYS && s.tech.calendar) log(phaseLine(1, monthIdx()), 'month');
}
/* 月相说明，例如“月相转为下弦，炼金时额外杂质 +10%” */
function phaseLine(ph, mi) {
  var v = MOON_MOD[mi][ph], name = ph ? { zh: '下弦', en: 'waning' } : { zh: '上弦', en: 'waxing' };
  var val = (v > 0 ? '+' : v < 0 ? '-' : '') + Math.round(Math.abs(v) * 100) + '%';
  var feel = v < 0 ? { zh: '月色安稳，炉火温顺', en: 'The moon is calm and the furnace behaves' }
    : v >= 0.15 ? { zh: '月色躁动，炉子很容易冒黑烟', en: 'The moon is restless and the furnace smokes easily' }
      : { zh: '月色平常', en: 'An ordinary moon' };
  return {
    zh: '月相转为' + name.zh + '。' + feel.zh + '，炼金时额外杂质 ' + val + '。',
    en: 'The moon turns ' + name.en + '. ' + feel.en + '; extra impurity chance ' + val + '.'
  };
}

function onMonthStart(mA) {
  var s = G.s, m = MONTHS[mA % 12];
  if (s.tech.calendar) {
    log(fmtPair({ zh: '{0}到了。{1}', en: '{0} has begun. {1}' }, [m, m.desc]), 'month');
    log(phaseLine(0, mA % 12), 'month');
  } else log(fmtPair(TXT.story.monthStart, [m]), 'month');
  dragonsGrow();
  if (s.bld.workshop > 0) rakuVisit();
  if (s.rhasari.joined) rhasariMonthly();
  if (m.frozen && s.farm.plots.length) logC('farm', TXT.farm.coldWarn);
  if (mA % 3 === 0) tradeQuarterly();
  if (mA % 3 === 0 && s.bld.workshop > 0) newQuarter();
}

/* ---------- 主循环一步 ---------- */
var _achTimer = 0;
function tick(dt) {
  var s = G.s;
  computeEffects();
  computeRates();
  RESOURCES.forEach(function (r) {
    if (!r.unlocked(s)) return;
    var v = G.rates[r.id];
    if (v) addRes(r.id, v * dt);
  });
  advanceTime(dt);
  dragonTick(dt);
  farmTick(dt);
  kitchenTick(dt);
  shopTick(dt);
  windowRestockTick();
  rhasariTick(dt);
  dispatchTick(dt);
  caravanTick(dt);
  tripTick(dt);
  autoRefineTick(dt);
  queueTick();
  checkUnlocks();
  _achTimer += dt;
  if (_achTimer >= 1) { _achTimer = 0; checkAchievements(); }
}

/* 实际变化速度：每秒统计一次，平滑后用于资源栏显示 */
var _flowTimer = 0;
function sampleFlow(dt) {
  _flowTimer += dt;
  if (_flowTimer < 1) return;
  for (var id in RES_MAP) {
    var v = (G.flowAcc[id] || 0) / _flowTimer;
    G.flow[id] = G.flow[id] == null ? v : G.flow[id] * 0.7 + v * 0.3;
  }
  G.flowAcc = {};
  _flowTimer = 0;
}

/* 较长时间的推进（离线或后台），按小步拆分 */
function simulate(sec) {
  var step = sec > 3600 ? Math.max(1, sec / 20000) : 0.5;
  while (sec > 0) {
    var d = Math.min(step, sec);
    tick(d);
    sec -= d;
  }
  G.flowAcc = {};
}

/* ---------- 存档 ---------- */
function saveGame() {
  try {
    G.s.lastSave = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(G.s));
    return true;
  } catch (e) { return false; }
}
function applyLoaded(data) {
  if (!data || !data.v || data.v < 2) {
    var s = newState();
    if (data) { s.lang = data.lang || 'zh'; s.theme = data.theme || 'light'; }
    G.s = s;
    G.notice = TXT.upgradeReset;
    return;
  }
  var migrated = data.v < SAVE_VERSION;
  G.s = deepMerge(newState(), data);
  if (migrated) { migrateV2(G.s); G.notice = TXT.migrated; }
  renameLux(G.s);
  G.s.v = SAVE_VERSION;
}
/* v0.3.1 把贵重品从“各种硬币”改成了各种闪亮的小东西，旧 id 的库存与记录搬到新 id 上 */
function renameLux(s) {
  for (var old in LUX_RENAME) {
    var nu = LUX_RENAME[old];
    if (s.res[old] != null) { s.res[nu] = (s.res[nu] || 0) + s.res[old]; delete s.res[old]; }
    if (s.luxSeen[old]) { s.luxSeen[nu] = true; delete s.luxSeen[old]; }
    if (s.luxHave[old] != null) { s.luxHave[nu] = s.luxHave[old]; delete s.luxHave[old]; }
    (s.disp.history || []).forEach(function (h) {
      if (h.lux && h.lux[old] != null) { h.lux[nu] = (h.lux[nu] || 0) + h.lux[old]; delete h.lux[old]; }
    });
  }
}
/* v0.2 存档升级到 v0.3：补上翎鸾、把青睐升级改成等级制、清理旧的累计字段 */
function migrateV2(s) {
  /* 以前的营业收入都是硬币，这里按 25 硬币折 1 铜翎补发一部分翎鸾，最多 3 金翎 */
  s.res.quill = Math.min(3 * QUILL_GOLD, Math.floor((s.stats.coinsEarned || 0) / 25));
  var ups = s.comm.ups || {}, nu = {};
  for (var k in ups) if (ups[k]) nu[k] = ups[k] === true ? 1 : +ups[k] || 1;
  if (nu.fourth) { nu.letter2 = 1; delete nu.fourth; }
  s.comm.ups = nu;
  /* 进行中的委托保留，只把旧的硬币奖励按售价比例换成翎鸾 */
  (s.comm.list || []).forEach(function (c) {
    if (c.rw && c.rw.coins) { c.rw.quill = Math.max(1, Math.round(c.rw.coins / 25)); delete c.rw.coins; }
  });
  delete s.shop.sAcc;
  delete s.kitchen.acc;
  delete s.kitchen.idx;
  delete s.farm.actAcc;
  s.shop.serveProg = 0;
  s.shop.queue = Math.floor(s.shop.queue || 0);
  s.shop.payIn = 'quill';
}
function loadGame() {
  try {
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    applyLoaded(JSON.parse(raw));
    return true;
  } catch (e) { return false; }
}
function exportSave() {
  G.s.lastSave = Date.now();
  return btoa(unescape(encodeURIComponent(JSON.stringify(G.s))));
}
function importSave(str) {
  var data = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
  if (!data || !data.res) throw new Error('bad save');
  applyLoaded(data);
  G.logs = [];
  G.logVer++;
  G.invVer++;
}
function resetGame() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
  var lang = G.s ? G.s.lang : 'zh', theme = G.s ? G.s.theme : 'light';
  G.s = newState();
  G.s.lang = lang;
  G.s.theme = theme;
  G.logs = [];
  G.logVer++;
  G.invVer++;
  logC('story', TXT.story.intro);
}
