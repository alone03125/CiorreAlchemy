/* 茶会、贸易商队、观星、成就 */

/* ========== 茶会（参照原版的节日） ==========
 * v0.4：举办茶会时要亲自挑选饮品和点心。基准是 12 种、共 60 件：幸福度和客流各 +30%，持续 90 天。
 * 种类或数量不足时持续时间按比例缩短；种类和数量更多时，加成比率更高。茶会结束前不能续办。 */
var PARTY_COINS = 2500, PARTY_DAYS = 90, PARTY_BONUS = 30;
var PARTY_KINDS = 12, PARTY_ITEMS = 60, PARTY_MIN_KINDS = 3, PARTY_MIN_ITEMS = 10;
function partyGoodsOk(id) { var f = FOOD_MAP[id]; return !!f && (f.kind === 'drink' || f.kind === 'dessert'); }
/* 统计一份挑选：种类、件数 */
function selStats(sel) {
  var k = 0, n = 0, v = 0;
  for (var id in sel) {
    var c = Math.floor(sel[id] || 0);
    if (c <= 0) continue;
    k++;
    n += c;
    v += c * basePrice(id);
  }
  return { kinds: k, items: n, value: v };
}
/* 按挑选算出茶会的效果 */
function partyPlan(sel) {
  var st = selStats(sel);
  var days = PARTY_DAYS * Math.min(1, st.kinds / PARTY_KINDS) * Math.min(1, st.items / PARTY_ITEMS);
  var bonus = PARTY_BONUS * Math.sqrt(Math.max(1, st.kinds / PARTY_KINDS)) * Math.pow(Math.max(1, st.items / PARTY_ITEMS), 0.3);
  return { kinds: st.kinds, items: st.items, days: Math.round(days * 10) / 10, bonus: Math.round(bonus * 10) / 10,
    ok: st.kinds >= PARTY_MIN_KINDS && st.items >= PARTY_MIN_ITEMS };
}
/* 挑选是否还有效：每样都要有足够的库存 */
function selInStock(sel) {
  for (var id in sel) if ((sel[id] || 0) > 0 && (G.s.res[id] || 0) < sel[id] - 1e-9) return false;
  return true;
}
function partyRunning() { return G.s.party.days > 0; }
function canHoldParty(sel) {
  var s = G.s;
  if (!s.tech.tea_party || partyRunning() || s.res.coins < PARTY_COINS) return false;
  if (!sel) return true;
  for (var id in sel) if (sel[id] > 0 && !partyGoodsOk(id)) return false;
  return partyPlan(sel).ok && selInStock(sel);
}
function holdParty(sel) {
  var s = G.s;
  if (!sel || !canHoldParty(sel)) return false;
  var plan = partyPlan(sel);
  addRes('coins', -PARTY_COINS);
  for (var id in sel) if (sel[id] > 0) addRes(id, -Math.floor(sel[id]));
  s.party.days = plan.days;
  s.party.total = plan.days;
  s.party.bonus = plan.bonus;
  s.stats.parties++;
  logC('dragon', TXT.party.start, Math.round(plan.bonus), Math.round(plan.days));
  return true;
}
function partyBonus() { return partyRunning() ? (G.s.party.bonus || PARTY_BONUS) : 0; }

/* ========== 贸易商队（参照原版的外交贸易） ==========
 * 每次贸易：付 4 金翎路费，挑选最多 200 件该地区收的商品，组织 5 到 15 只小龙的商队，过很久才回来。
 * 收获倍率 = 货物倍率 × 商队倍率 × 关系与月份倍率。
 * 货物倍率：8 种、总值 3 金翎为 1 倍，种类越多、价值越高越大，不会因为多带而变少。
 * 商队倍率：属性相符与成长等级让每只小龙多带一些货，成长等级越高，增加得越慢。
 * 损耗：路上可能丢掉一部分货物，商队平均战斗等级越高，丢的概率和数量越少。 */
var TRADE_GOODS_MAX = 200, TRADE_BASE_KINDS = 8, TRADE_BASE_VALUE = 3 * QUILL_GOLD;
var CARAVAN_MIN = 5, CARAVAN_MAX = 15, CARAVAN_BASE = 10;
function partnerUnlocked(p) {
  var s = G.s;
  if (!s.tech.commerce) return false;
  return !p.unlockDest || !!s.trade.unlocked[p.id];
}
function partnerOpen(p) { return p.closed.indexOf(monthIdx()) < 0; }
/* 关系与月份倍率 */
function tradeMult(p) {
  var rel = G.s.trade.rel[p.id] || 0;
  return (1 + rel / 200 + eff('tradeRatio')) * (p.best.indexOf(monthIdx()) >= 0 ? 1.25 : 1);
}
function tradeGoodsOk(p, id) {
  var f = FOOD_MAP[id];
  if (!f || f.kind === 'proc') return false;
  return p.wants.kind === 'any' || f.kind === p.wants.kind;
}
/* 货物倍率：8 种、总值 3 金翎为 1 倍 */
function goodsMult(st) {
  if (st.items <= 0) return 0;
  return Math.pow(st.value / TRADE_BASE_VALUE, 0.75) * Math.sqrt(st.kinds / TRADE_BASE_KINDS);
}
/* 单只小龙能带多少货：属性相符多带三成；成长等级的加成逐渐饱和 */
function dragonCarry(d, p) {
  return (p.el.indexOf(d.el) >= 0 ? 1.3 : 1) * (0.8 + 0.6 * d.gl / (d.gl + 20));
}
function caravanStats(p, ids) {
  var s = G.s, carry = 0, cl = 0, n = 0;
  ids.forEach(function (id) {
    var d = s.dragons.find(function (x) { return x.id === id; });
    if (!d) return;
    carry += dragonCarry(d, p);
    cl += d.cl;
    n++;
  });
  var avgCl = n ? cl / n : 0;
  return {
    n: n, carry: carry, avgCl: avgCl,
    mult: n ? Math.pow(carry / CARAVAN_BASE, 0.7) : 0,
    lossChance: 0.45 * 60 / (60 + avgCl),
    lossMax: 0.45 * 50 / (50 + avgCl)
  };
}
/* 给商队挑选小龙：属性相符的优先，其次看成长等级与战斗等级 */
function caravanFit(d, p) { return (p.el.indexOf(d.el) >= 0 ? 100 : 0) + d.gl + d.cl * 0.5; }
function suggestCaravan(p, n) {
  return homeDragons().filter(function (d) { return d.id !== G.s.leader; })
    .sort(function (a, b) { return caravanFit(b, p) - caravanFit(a, p); }).slice(0, n || CARAVAN_BASE).map(function (d) { return d.id; });
}
function caravanTo(p) { return G.s.trade.caravans.find(function (c) { return c.partner === p.id; }); }
/* 商队出发前的检查，返回出错原因的键名，没有问题时返回空字符串 */
function caravanProblem(p, sel, ids) {
  var s = G.s;
  if (!partnerUnlocked(p)) return 'tr_err_locked';
  if (!partnerOpen(p)) return 'trade_closed';
  if (caravanTo(p)) return 'tr_err_busy';
  if (!canAfford(p.cost)) return 'tr_err_cost';
  var st = selStats(sel);
  if (st.items < 1) return 'tr_err_goods';
  if (st.items > TRADE_GOODS_MAX) return 'tr_err_too_many';
  for (var id in sel) if (sel[id] > 0 && !tradeGoodsOk(p, id)) return 'tr_err_goods';
  if (!selInStock(sel)) return 'tr_err_stock';
  var home = ids.filter(function (id) { var d = s.dragons.find(function (x) { return x.id === id; }); return d && !d.away; });
  if (home.length < CARAVAN_MIN || home.length > CARAVAN_MAX) return 'tr_err_dragons';
  return '';
}
/* 是否有条件组织商队（用于按钮与标签提示） */
function canTrade(p) {
  return partnerUnlocked(p) && partnerOpen(p) && !caravanTo(p) && canAfford(p.cost) &&
    homeDragons().length >= CARAVAN_MIN && GOODS_LIST.some(function (f) { return tradeGoodsOk(p, f.id) && G.s.res[f.id] >= 1; });
}
function sendCaravan(pid, sel, ids) {
  var s = G.s, p = PARTNER_MAP[pid];
  if (!p || caravanProblem(p, sel, ids)) return false;
  var st = selStats(sel), cs = caravanStats(p, ids);
  spendCost(p.cost);
  var goods = {};
  for (var id in sel) if (sel[id] > 0) { goods[id] = Math.floor(sel[id]); addRes(id, -goods[id]); }
  ids.forEach(function (id) { var d = s.dragons.find(function (x) { return x.id === id; }); if (d) d.away = true; });
  s.trade.caravans.push({ partner: pid, dragons: ids.slice(), goods: goods, kinds: st.kinds, items: st.items, value: st.value,
    gm: goodsMult(st), cm: cs.mult, avgCl: cs.avgCl, left: p.days, total: p.days });
  logC('trade', TXT.trade.depart, p, ids.length, st.items);
  return true;
}
function caravanTick(dt) {
  var s = G.s;
  if (!s.trade.caravans.length) return;
  var done = [];
  s.trade.caravans.forEach(function (c) {
    c.left -= dt / DAY_SEC;
    if (c.left <= 0) done.push(c);
  });
  done.forEach(finishCaravan);
}
/* 商队归来：结算货物、损耗、种子与关系 */
function finishCaravan(c) {
  var s = G.s, p = PARTNER_MAP[c.partner];
  s.trade.caravans = s.trade.caravans.filter(function (x) { return x !== c; });
  c.dragons.forEach(function (id) {
    var d = s.dragons.find(function (x) { return x.id === id; });
    if (d) { d.away = false; gainXp(d, c.total * 0.5, false); }
  });
  if (!p) return;
  var mult = c.gm * c.cm * tradeMult(p);
  var lost = Math.random() < 0.45 * 60 / (60 + c.avgCl) ? rand(0.33, 1) * 0.45 * 50 / (50 + c.avgCl) : 0;
  var got = [];
  p.gives.forEach(function (gv) {
    if (gv.seed) {
      if (!s.farm.known[gv.seed] && !cropKnown(CROP_MAP[gv.seed], s)) {
        s.farm.known[gv.seed] = true;
        logC('trade', TXT.trade.seed, CROP_MAP[gv.seed]);
      }
      return;
    }
    /* 带去的货越多，掉落概率也越高：相当于多掷几次骰子 */
    if (gv.ch != null && Math.random() > 1 - Math.pow(1 - gv.ch, Math.max(0.2, mult))) return;
    var n = Math.floor(randInt(gv.min, gv.max) * mult * (1 - lost));
    if (n < 1) return;
    if (gv.res) {
      var added = LUX_MAP[gv.res] ? addLux(gv.res, n) : addRes(gv.res, n);
      if (added > 0) got.push(resAmtPair(gv.res, Math.floor(added)));
    } else if (gv.item) {
      addItem(gv.item, n);
      got.push(itemPair(gv.item, n));
    } else if (gv.crystal) {
      addItem(CRYSTAL_OF[gv.crystal], n);
      got.push(itemPair(CRYSTAL_OF[gv.crystal], n));
    }
  });
  s.trade.rel[p.id] = Math.min(100, (s.trade.rel[p.id] || 0) + 3);
  s.trade.count[p.id] = (s.trade.count[p.id] || 0) + 1;
  s.stats.trades++;
  if (lost > 0) logC('trade', TXT.trade.loss, p, Math.round(lost * 100) + '%');
  logC('trade', TXT.trade.back, p, goodsPair(c.goods), joinPairs(got));
}
/* 关系超过 60 时，每个季度略微下降 */
function tradeQuarterly() {
  var s = G.s;
  for (var id in s.trade.rel) if (s.trade.rel[id] > 60) s.trade.rel[id] = Math.max(60, s.trade.rel[id] - 2);
}
/* 预计换回：基准数量乘以倍率（未计损耗） */
function tradePreview(p, mult) {
  return p.gives.filter(function (gv) { return !gv.seed; }).map(function (gv) {
    var name = gv.res ? L(RES_MAP[gv.res]) : gv.item ? L(ITEMS[gv.item]) : L(ITEMS[CRYSTAL_OF[gv.crystal]]);
    var ch = gv.ch != null ? 1 - Math.pow(1 - gv.ch, Math.max(0.2, mult)) : 1;
    return name + ' ' + fmt(Math.floor(gv.min * mult)) + '~' + fmt(Math.floor(gv.max * mult)) + (ch < 1 ? ' (' + Math.round(ch * 100) + '%)' : '');
  });
}

/* ========== 观星（参照原版的天文事件） ========== */
var SKY_EVENT_DAYS = 6;
function skyDaily() {
  var s = G.s;
  if (s.sky.event > 0) {
    s.sky.event--;
    if (s.sky.event === 0) logC('sys', TXT.sky.missed);
    return;
  }
  var chance = 0.004 + eff('starChance');
  if (Math.random() >= chance) return;
  var auto = Math.min(0.6, 0.05 * (s.bld.observatory || 0));
  if (Math.random() < auto) observeSky(true);
  else {
    s.sky.event = SKY_EVENT_DAYS;
    logC('sys', TXT.sky.appear);
  }
}
function observeSky(auto) {
  var s = G.s;
  if (!auto && !(s.sky.event > 0)) return;
  s.sky.event = 0;
  var astro = s.tech.astronomy ? 2 : 1;
  var lore = Math.round((25 + 0.02 * Math.max(0, capOf('lore'))) * (1 + eff('mult.lore')) * astro);
  var gotLore = addRes('lore', lore);
  addRes('intel', 2);
  s.stats.stars++;
  logC('sys', auto ? TXT.sky.auto : TXT.sky.observe, Math.round(gotLore), 2);
  var r = Math.random();
  var item = s.tech.astronomy && r < 0.1 ? 'stardust' : r < 0.35 ? 'star_dew' : null;
  if (item) {
    addItem(item, 1);
    logC('sys', TXT.sky.item, itemPair(item));
  }
}

/* ========== 成就 ========== */
function checkAchievements() {
  var s = G.s;
  ACHIEVEMENTS.forEach(function (a) {
    if (s.ach[a.id]) return;
    var ok = false;
    try { ok = a.check(s); } catch (e) { ok = false; }
    if (ok) {
      s.ach[a.id] = Date.now();
      logC('sys', TXT.ach, a);
    }
  });
}
