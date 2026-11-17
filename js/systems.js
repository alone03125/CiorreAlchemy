/* 通用玩法：解锁、手动操作、建筑与研究、建造队列、营业与需求曲线、Rhasari、Lysari、Rakuakira、旅行、派遣、炼金、委托 */

/* ========== 解锁与剧情检查 ========== */
function checkUnlocks() {
  var s = G.s;
  if (!s.flags.firewood && s.bld.smelter > 0) {
    s.flags.firewood = true;
    logC('story', TXT.story.firewood);
  }
  if (!s.flags.market && marketUnlocked()) {
    s.flags.market = true;
    logC('story', TXT.story.market);
  }
  if (foodUnlocked(FOOD_MAP.pudding, s) && !s.rhasari.joined && !s.rhasari.hinted) {
    s.rhasari.hinted = true;
    logC('story', TXT.story.rhasariHint);
  }
  if (s.tech.commerce) {
    TRADE_PARTNERS.forEach(function (p) {
      if (!p.unlockDest || s.trade.unlocked[p.id]) return;
      if (p.unlockDest.some(function (d) { return (s.stats.dispDone[d] || 0) > 0; })) {
        s.trade.unlocked[p.id] = true;
        logC('trade', TXT.trade.unlock, p);
      }
    });
  }
  if (!s.flags.crowdWarn && s.dragons.length > 12 && G.happy < 85) {
    s.flags.crowdWarn = true;
    logC('dragon', TXT.dragon.crowded);
  }
  /* 新解锁的商品默认上架，默认目标库存 10 */
  FOODS.forEach(function (f) {
    if (s.kitchen.targets[f.id] == null && foodUnlocked(f, s)) {
      s.kitchen.targets[f.id] = 10;
      if (f.kind !== 'proc' && s.shop.sale[f.id] == null) s.shop.sale[f.id] = true;
      if (f.kind !== 'proc' && s.shop.demand[f.id] == null) s.shop.demand[f.id] = 1.25;
    }
  });
}

/* ========== 手动操作 ========== */
function tripAway() { return G.s.trip.away > 0; }
function gatherCoins() {
  if (tripAway()) return;
  var s = G.s;
  s.stats.clicks++;
  addRes('coins', 1);
  if (Math.random() < 0.02) {
    var bonus = Math.max(10, Math.round(capOf('coins') * 0.01));
    addRes('coins', bonus);
    logC('sys', TXT.story.luckyCoin, bonus);
  }
}
/* 换取柴薪：100 硬币换 1 柴薪（参照原版 100 猫薄荷精炼 1 木材） */
var REFINE_RATE = 100;
function refineMax() {
  var s = G.s;
  return Math.max(0, Math.min(Math.floor(s.res.coins / REFINE_RATE), Math.floor(capOf('firewood') - s.res.firewood)));
}
function refineFirewood(n) {
  if (tripAway()) return;
  n = Math.min(n, refineMax());
  if (n <= 0) return;
  addRes('coins', -n * REFINE_RATE);
  addRes('firewood', n);
}
function autoRefineTick(dt) {
  var s = G.s;
  if (!s.tech.firewood_contract || !s.shop.autoRefine) return;
  if (s.res.coins < capOf('coins') * 0.95) return;
  var room = capOf('firewood') - s.res.firewood;
  if (room <= 0) return;
  var coins = Math.min(s.res.coins * 0.05 * dt, room * REFINE_RATE);
  addRes('coins', -coins);
  addRes('firewood', coins / REFINE_RATE);
}

/* ========== 集市淘宝 ==========
 * 工坊有了稳定的翎鸾收入（累计收入达到 1 金翎）后解锁。按住按钮，每翻找一次花 1 金翎，
 * 按权重随机得到一份基础材料，或一件 43 级以下的炼金物品，相当于抽卡 */
var MARKET_COST = QUILL_GOLD, MARKET_WORK = 1.2;   // 每翻找一次大约要按住 1.2 秒
var MARKET_POOL = [
  { res: 'coins', min: 1500, max: 4000, w: 18 },
  { res: 'firewood', min: 20, max: 60, w: 16 },
  { res: 'ore', min: 60, max: 180, w: 16 },
  { res: 'lore', min: 150, max: 500, w: 14 },
  { res: 'fertilizer', min: 10, max: 30, w: 8 },
  { res: 'intel', min: 3, max: 8, w: 6 },
  { item: true, w: 28 },
  { lux: true, w: 0 }   // 研究“淘宝门道”后才会出现，权重来自效果 marketLux
];
var MARKET_MAX_LV = 42;
function marketUnlocked() {
  var s = G.s;
  return s.bld.workshop > 0 && (!!s.flags.market || (s.stats.quillEarned || 0) >= QUILL_GOLD);
}
function canMarket() { return marketUnlocked() && !tripAway() && G.s.res.quill >= MARKET_COST - 1e-9; }
/* 物品：等级偏低（平均十几级），同一等级里按稀有度权重抽取；特殊物品不会出现 */
function marketItem() {
  var lv = 1 + Math.floor(MARKET_MAX_LV * Math.pow(Math.random(), 1.8));
  for (var d = 0; d < MARKET_MAX_LV; d++) {
    var pool = ITEM_LIST.filter(function (it) { return !it.x && it.lv <= MARKET_MAX_LV && (it.lv === lv - d || it.lv === lv + d); });
    if (pool.length) return wpick(pool.map(function (it) { return [it, RARITY.weight[it.r]]; }));
  }
  return null;
}
function marketDraw() {
  var s = G.s;
  if (!canMarket()) return null;
  addRes('quill', -MARKET_COST);
  s.stats.marketDraws = (s.stats.marketDraws || 0) + 1;
  /* 已经装满的资源不会抽到，免得白花钱 */
  var e = wpick(MARKET_POOL.filter(function (x) { return !x.res || (RES_MAP[x.res].unlocked(s) && s.res[x.res] < capOf(x.res) - x.min); })
    .map(function (x) { return [x, x.lux ? eff('marketLux') : x.w]; }));
  var got, rare = false;
  if (e.lux) {
    /* 贵重品：按掉落权重挑一种，越稀有的给得越少 */
    var l = wpick(LUXURIES.map(function (x) { return [x, x.w]; }));
    var ln = Math.max(1, Math.round(randInt(10, 30) / l.tier));
    addLux(l.id, ln);
    got = resAmtPair(l.id, ln);
    rare = l.tier >= 3;
    s.market.last.unshift({ res: l.id, n: ln });
  } else if (e.item) {
    var it = marketItem();
    addItem(it.id, 1);
    got = itemPair(it.id);
    rare = it.r >= 4 || it.lv >= 30;
    s.market.last.unshift({ item: it.id });
  } else {
    var n = randInt(e.min, e.max), added = addRes(e.res, n);
    got = resAmtPair(e.res, Math.floor(added));
    s.market.last.unshift({ res: e.res, n: Math.floor(added) });
  }
  if (s.market.last.length > 6) s.market.last.length = 6;
  logC('shop', rare ? TXT.market.rare : TXT.market.got, got);
  return got;
}
/* 按住“集市淘宝”时调用 */
function marketWork(dt) {
  var s = G.s;
  if (!canMarket()) return;
  s.market.prog += dt / MARKET_WORK;
  var guard = 0;
  while (s.market.prog >= 1 && guard++ < 5) {
    s.market.prog -= 1;
    if (!marketDraw()) { s.market.prog = 0; break; }
  }
}

/* ========== 建筑与研究 ========== */
/* 价格曲线的指数。带 stretch 的建筑（幼龙窝）在前若干次购买时涨得更慢，之后与原版相差固定的次数 */
function bldExpo(b, n) {
  var st = b.stretch;
  if (!st) return n;
  return n <= st.until ? n * st.k : n - st.shift;
}
function bldCost(b, offset) {
  var n = G.s.bld[b.id] + (offset || 0), m = Math.pow(b.ratio, bldExpo(b, n)) * Math.max(0.5, 1 + eff('buildCost')), out = {};
  for (var k in b.cost) {
    var v = b.cost[k] * m;
    out[k] = RES_MAP[k] ? Math.round(v * 100) / 100 : Math.ceil(v);
  }
  return out;
}
function bldVisible(b) { return G.s.bld[b.id] > 0 || b.req(G.s); }
function bldMaxed(b) { return !!b.max && G.s.bld[b.id] >= b.max; }
function canBuy(b) {
  var s = G.s;
  if (bldMaxed(b)) return false;
  if (b.allCoins && s.res.coins < b.allCoins) return false;
  return canAfford(bldCost(b));
}
function buyBuilding(id) {
  var s = G.s, b = BLD_MAP[id];
  if (!b || !canBuy(b)) return false;
  spendCost(bldCost(b));
  var spent = 0;
  if (b.allCoins) { spent = s.res.coins; addRes('coins', -spent); }
  s.bld[id]++;
  computeEffects();
  if (id === 'workshop') {
    logC('story', TXT.story.workshopBuilt, Math.floor(spent));
    logC('oc', TXT.story.rakuMeet);
    newQuarter(true);
  }
  if (id === 'waystation' && s.bld.waystation === 1) logC('story', TXT.story.courier);
  return true;
}
/* 拆除：返还上一座价格的一半 */
function canSell(b) { return G.s.bld[b.id] > 0 && b.id !== 'workshop'; }
function sellBuilding(id) {
  var s = G.s, b = BLD_MAP[id];
  if (!b || !canSell(b)) return;
  s.bld[id]--;
  var c = bldCost(b);
  for (var k in c) {
    if (RES_MAP[k]) addRes(k, c[k] * 0.5);
    else addItem(k, Math.floor(c[k] * 0.5));
  }
  computeEffects();
}
function techVisible(t) { return !G.s.tech[t.id] && t.req(G.s); }
function research(id) {
  var s = G.s, t = TECH_MAP[id];
  if (!t || s.tech[id] || !t.req(s) || !canAfford(t.cost)) return false;
  spendCost(t.cost);
  s.tech[id] = true;
  computeEffects();
  if (id === 'transmutation') logC('story', TXT.story.transmute);
  return true;
}

/* ========== 建造队列（参照原版的 Queue） ========== */
var QUEUE_MAX = 10;
function queueAdd(type, id) {
  var s = G.s;
  if (s.queue.length >= QUEUE_MAX) return;
  s.queue.push({ t: type, id: id });
}
function queueRemove(i) { G.s.queue.splice(i, 1); }
function queueTick() {
  var s = G.s;
  var guard = 0;
  while (s.queue.length && guard++ < 3) {
    var q = s.queue[0];
    if (q.t === 'bld') {
      var b = BLD_MAP[q.id];
      if (!b || bldMaxed(b)) { s.queue.shift(); continue; }
      if (canBuy(b)) { buyBuilding(q.id); s.queue.shift(); continue; }
    } else {
      var t = TECH_MAP[q.id];
      if (!t || s.tech[q.id]) { s.queue.shift(); continue; }
      if (t.req(s) && canAfford(t.cost)) { research(q.id); s.queue.shift(); continue; }
    }
    break;
  }
}

/* ========== 营业 ========== */
function goodsUnlocked() { return GOODS_LIST.filter(function (f) { return foodUnlocked(f, G.s); }); }
function demandOf(g) { var d = G.s.shop.demand[g]; return d == null ? 1.25 : d; }
function demandTarget(g) {
  var f = FOOD_MAP[g], m = curMonth(), t = 1;
  if (m.hot && f.st === 'frost') t += 0.3;
  if (m.cold && f.kind === 'drink' && f.st !== 'frost') t += 0.3;
  return t;
}
/* 需求曲线：每天向目标值回升 8%，卖出一份下降 0.03，范围 0.4 到 1.6 */
function demandDaily() {
  var s = G.s;
  goodsUnlocked().forEach(function (f) {
    var d = demandOf(f.id), t = demandTarget(f.id);
    s.shop.demand[f.id] = clamp(d + (t - d) * 0.08, 0.4, 1.6);
  });
}
/* 售价按铜翎计 */
function basePrice(g) {
  var f = FOOD_MAP[g];
  return f.price * (1 + eff('price.' + g) + eff('priceSt.' + f.st) + eff('priceAll'));
}
function goodPrice(g) { return basePrice(g) * demandOf(g); }
/* 声望带来的客流加成：随声望增长逐渐饱和，上限 +200% */
function renownBonus() { var r = G.s.res.renown; return 2 * r / (r + 150); }
function shopOpen() { var s = G.s; return s.bld.workshop > 0 && goodsUnlocked().length > 0; }
/* 每个游戏日上门的顾客数（期望值）。前中期大约每天 0 到 2 位 */
function custPerDay() {
  if (!shopOpen()) return 0;
  var base = BASE_CUSTOMERS + eff('custRate');
  var mult = 1 + renownBonus() + eff('custMult');
  return Math.max(0, base * Math.max(0.1, mult));
}
function queueCap() { return BASE_QUEUE + eff('queueCap'); }
/* 招待进度每秒增长多少（1 = 招待完一位顾客）。Ciorre 不在店里时，没有人会顺手招待 */
function serveRate() { return (tripAway() ? 0 : 0.03) + workForce('clerk') * CLERK_SERVE; }
/* 泊松分布：一段时间内到来的顾客数 */
function poisson(lambda) {
  if (lambda <= 0) return 0;
  if (lambda > 20) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * (Math.random() + Math.random() + Math.random() - 1.5) * 2));
  var lim = Math.exp(-lambda), k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > lim);
  return k - 1;
}
function shopTick(dt) {
  var s = G.s;
  if (!shopOpen()) return;
  var n = poisson(custPerDay() * dt / DAY_SEC);
  for (var i = 0; i < n; i++) customerArrive();
  if (s.shop.queue < 1) { s.shop.serveProg = 0; return; }
  s.shop.serveProg += serveRate() * dt;
  var guard = 0;
  while (s.shop.serveProg >= 1 && s.shop.queue >= 1 && guard++ < 50) {
    s.shop.serveProg -= 1;
    serveOne(false);
  }
  if (s.shop.queue < 1) s.shop.serveProg = 0;
}
/* 按住“招待顾客”时调用：亲自招待会加快进度条，客人也会多给一点小费 */
function manualServeWork(dt) {
  var s = G.s;
  if (tripAway() || s.shop.queue < 1) return;
  s.shop.serveProg += MANUAL_SERVE * dt;
  var guard = 0;
  while (s.shop.serveProg >= 1 && s.shop.queue >= 1 && guard++ < 10) {
    s.shop.serveProg -= 1;
    serveOne(true);
  }
  if (s.shop.queue < 1) s.shop.serveProg = 0;
}
/* 一位顾客到来：先排队，路过时还会看一眼橱窗和展柜 */
function customerArrive() {
  var s = G.s;
  s.stats.arrived++;
  s.shop.queue += 1;
  var qc = queueCap();
  if (s.shop.queue > qc) { s.shop.lost += s.shop.queue - qc; s.shop.queue = qc; }
  if (s.shop.window.length && Math.random() < windowChance()) sellFromWindow();
  if (s.shop.display.length && Math.random() < displayChance()) sellFromDisplay();
}
function onSale(g) {
  G.s.shop.demand[g] = clamp(demandOf(g) - 0.03, 0.4, 1.6);
}
function afterServe() {
  var s = G.s;
  s.stats.served++;
  s.res.renown += 0.02;
  if (Math.random() < 0.06) addRes('intel', 1);
}
function sellable() {
  var s = G.s;
  return goodsUnlocked().filter(function (f) { return s.shop.sale[f.id] !== false && s.res[f.id] >= 1; });
}
function serveOne(manual) {
  var s = G.s;
  if (s.shop.queue < 1) return null;
  s.shop.queue -= 1;
  var cust = pick(CUSTOMERS);
  var opts = sellable().map(function (f) { var d = demandOf(f.id); return [f.id, d * d]; });
  if (!opts.length) {
    s.shop.noStock++;
    if (manual) logC('shop', pick(TXT.serve.none), cust);
    return 'none';
  }
  var g = wpick(opts);
  addRes(g, -1);
  var got = payout(goodPrice(g) * (manual ? 1.25 : 1));
  onSale(g);
  afterServe();
  if (manual) {
    var f = FOOD_MAP[g];
    log(fmtPair(TXT.shop.manualServe, [fmtPair(pick(TXT.serve[f.kind]), [cust, f]), got]), 'shop');
  }
  return g;
}
function canShow() {
  var s = G.s;
  return s.rhasari.joined && !tripAway() && s.shop.queue >= 1 && s.res.pudding >= 1 && s.res.sugar >= 1 && s.rhasari.flame >= 1;
}
function showEarn() { return goodPrice('caramel') * 1.5 * (1 + eff('showMult')); }
function caramelShow() {
  var s = G.s;
  if (!canShow()) return;
  s.shop.queue -= 1;
  addRes('pudding', -1);
  addRes('sugar', -1);
  s.rhasari.flame -= 1;
  var got = payout(showEarn());
  s.res.renown += 0.3;
  s.stats.caramel++;
  s.shop.showCount++;
  onSale('caramel');
  if (Math.random() < 0.3) addRes('intel', 1);
  afterServe();
  var cust = pick(CUSTOMERS);
  log(fmtPair(TXT.shop.manualServe, [fmtPair(pick(TXT.serve.show), [cust]), got]), 'shop');
}
/* 找库存中最便宜的商品（kind 为 drink、dessert 或 any） */
function cheapestGoods(kind, n) {
  var s = G.s, list = goodsUnlocked().filter(function (f) {
    return (kind === 'any' || f.kind === kind) && s.res[f.id] >= n;
  });
  list.sort(function (a, b) { return a.price - b.price; });
  return list.length ? list[0].id : null;
}
/* 按“从便宜到贵”的顺序凑够 n 份某类商品 */
function pickGoods(kind, n) {
  var s = G.s, list = goodsUnlocked().filter(function (f) { return kind === 'any' || f.kind === kind; });
  list.sort(function (a, b) { return a.price - b.price; });
  var picked = {}, got = 0;
  for (var i = 0; i < list.length && got < n; i++) {
    var have = Math.floor(s.res[list[i].id] || 0);
    var take = Math.min(have, n - got);
    if (take > 0) { picked[list[i].id] = take; got += take; }
  }
  return { picked: picked, n: got };
}
function goodsPair(picked) {
  var list = [];
  for (var id in picked) list.push({ zh: RES_MAP[id].zh + ' ×' + picked[id], en: RES_MAP[id].en + ' x' + picked[id] });
  return joinPairs(list);
}

/* 橱窗：摆放半成品，每位路过的顾客都有一定概率买走一件 */
var WINDOW_SLOT_MAX = 20;   // 每格最多摆放的数量
var WINDOW_AUTO_KEEP = 5;   // 自动补货时每格补到多少
function windowUnlocked() { return FOODS.some(function (f) { return f.kind === 'proc' && foodUnlocked(f, G.s); }); }
function windowSlots() { return 2 + Math.floor(eff('windowSlots')); }
function windowChance() { return 0.08 + eff('windowChance'); }
function displayChance() { return 0.08 + eff('displayChance'); }
function windowPrice(id) { return FOOD_MAP[id].price * (1 + eff('priceAll')); }
function windowSlot(id) { return G.s.shop.window.find(function (x) { return x.id === id; }); }
function canPutInWindow(id) {
  var s = G.s, f = FOOD_MAP[id];
  if (!f || f.kind !== 'proc' || (s.res[id] || 0) < 1) return false;
  var sl = windowSlot(id);
  if (sl) return sl.n < WINDOW_SLOT_MAX;
  return s.shop.window.length < windowSlots();
}
function putInWindow(id, n) {
  var s = G.s;
  if (!canPutInWindow(id)) return;
  var slot = windowSlot(id);
  if (!slot) { slot = { id: id, n: 0, auto: false }; s.shop.window.push(slot); }
  n = Math.min(n, Math.floor(s.res[id] || 0), WINDOW_SLOT_MAX - slot.n);
  if (n <= 0) return;
  addRes(id, -n);
  slot.n += n;
}
function takeFromWindow(id) {
  var s = G.s, slot = windowSlot(id);
  if (!slot) return;
  s.res[id] = (s.res[id] || 0) + slot.n;
  s.shop.window = s.shop.window.filter(function (x) { return x !== slot; });
}
function setWindowAuto(id, v) { var sl = windowSlot(id); if (sl) sl.auto = !!v; }
/* 勾选了自动补货的格子，会从库存里补到 5 件 */
function windowRestockTick() {
  var s = G.s;
  s.shop.window.forEach(function (sl) {
    if (!sl.auto || sl.n >= WINDOW_AUTO_KEEP) return;
    var n = Math.min(Math.floor(s.res[sl.id] || 0), WINDOW_AUTO_KEEP - sl.n);
    if (n > 0) { addRes(sl.id, -n); sl.n += n; }
  });
}
function sellFromWindow() {
  var s = G.s;
  var slots = s.shop.window.filter(function (x) { return x.n >= 1; });
  if (!slots.length) return;
  var sl = pick(slots);
  sl.n--;
  var got = payout(windowPrice(sl.id));
  s.stats.windowSold++;
  logC('shop', TXT.shop.windowSold, pick(CUSTOMERS), RES_MAP[sl.id], got);
  s.shop.window = s.shop.window.filter(function (x) { return x.n > 0 || x.auto; });
}

/* 展柜：摆放炼金物品 */
function displaySlots() { return Math.floor(eff('displaySlots')); }
function sellFromDisplay() {
  var s = G.s;
  var slots = s.shop.display.filter(function (x) { return x.n > 0; });
  if (!slots.length) return;
  var sl = pick(slots);
  sl.n--;
  var got = payout(itemValue(sl.id));
  s.stats.displaySold++;
  logC('shop', TXT.shop.displaySold, itemPair(sl.id), got);
  s.shop.display = s.shop.display.filter(function (x) { return x.n > 0; });
}
function putOnDisplay(id, n) {
  var s = G.s;
  n = Math.min(n, s.inv[id] || 0);
  if (n <= 0) return;
  var slot = s.shop.display.find(function (x) { return x.id === id; });
  if (!slot) {
    if (s.shop.display.length >= displaySlots()) return;
    slot = { id: id, n: 0 };
    s.shop.display.push(slot);
  }
  slot.n += n;
  removeItem(id, n);
}
function takeFromDisplay(id) {
  var s = G.s;
  var slot = s.shop.display.find(function (x) { return x.id === id; });
  if (!slot) return;
  addItem(id, slot.n);
  s.shop.display = s.shop.display.filter(function (x) { return x !== slot; });
}
/* 猫头鹰商人只出四成价 */
function owlPrice(id) { return Math.max(0.5, itemValue(id) * 0.4); }
function owlSell(id, n) {
  var s = G.s;
  n = Math.min(n, s.inv[id] || 0);
  if (n <= 0) return;
  removeItem(id, n);
  var got = payout(owlPrice(id) * n);
  logC('shop', TXT.shop.owlSell, itemPair(id, n), got);
}

/* ========== Rhasari ========== */
function flameMax() { return 5 + eff('flameMax'); }
function canRecruitRhasari() {
  var s = G.s;
  return !s.rhasari.joined && foodUnlocked(FOOD_MAP.pudding, s) && s.res.pudding >= 3;
}
function recruitRhasari() {
  var s = G.s;
  if (!canRecruitRhasari()) return;
  addRes('pudding', -3);
  s.rhasari.joined = true;
  s.rhasari.flame = 3;
  s.rhasari.mood = 60;
  logC('story', TXT.story.rhasariJoin);
}
function rhasariTick(dt) {
  var r = G.s.rhasari;
  if (!r.joined) return;
  if (r.insultCd > 0) r.insultCd = Math.max(0, r.insultCd - dt);
  var fm = flameMax();
  if (r.flame < fm) {
    var regen = (1 / 30) * (0.5 + r.mood / 100) * (1 + eff('flameRegen'));
    r.flame = Math.min(fm, r.flame + regen * dt);
  }
}
function moodWord(m) {
  if (m >= 80) return { zh: '非常开心', en: 'Delighted' };
  if (m >= 60) return { zh: '开心', en: 'Happy' };
  if (m >= 40) return { zh: '还行', en: 'Okay' };
  if (m >= 20) return { zh: '闹别扭', en: 'Sulking' };
  return { zh: '气鼓鼓', en: 'Fuming' };
}
/* 心情越高，喂食的效果越小 */
function moodGain(base) { return base * Math.max(0.15, 1.2 - G.s.rhasari.mood / 100); }
function feedRhasari(g) {
  var s = G.s, r = s.rhasari;
  if (!r.joined || s.res[g] < 1) return;
  addRes(g, -1);
  r.mood = Math.min(100, r.mood + moodGain(g === 'caramel' ? 20 : 10));
  logC('oc', pick(g === 'caramel' ? TXT.rhasari.feedCaramel : TXT.rhasari.feedPudding));
}
function insultRhasari() {
  var s = G.s, r = s.rhasari;
  if (!r.joined || r.insultCd > 0) return;
  r.insultCd = 30;
  r.flame = Math.min(flameMax(), r.flame + 2);
  r.mood = Math.max(0, r.mood - 15);
  s.stats.insults++;
  log(fmtPair({ zh: '{0}{1}', en: '{0} {1}' }, [fmtPair(pick(TXT.rhasari.insult), []), fmtPair(TXT.rhasari.insultSuffix, [2, 15])]), 'oc');
}
function rhasariMonthly() {
  var s = G.s, r = s.rhasari;
  if (r.mood >= 80 && Math.random() < 0.3) {
    addItem('rhasari_down', 1);
    logC('oc', TXT.rhasari.down);
  }
  if (r.mood >= 70 && Math.random() < 0.35) lysariVisit();
}

/* ========== Lysari ========== */
function lysariVisit() {
  var s = G.s;
  s.lysari.visits++;
  s.lysari.rain = MONTH_DAYS;
  logC('oc', pick(TXT.lysari.arrive));
  var gifts = { drown_crystal: randInt(1, 3) };
  if (Math.random() < 0.5) gifts.freeze_crystal = randInt(1, 2);
  for (var k in gifts) addItem(k, gifts[k]);
  var q = Math.round(12 * (1 + s.lysari.visits * 0.3));
  var gotQ = addRes('quill', q);
  var p = lootPair(gifts), qp = quillPair(gotQ);
  logC('oc', TXT.lysari.gift, { zh: p.zh + '、翎鸾 ' + qp.zh, en: p.en + ', ' + qp.en + ' in quills' });
  logC('oc', TXT.lysari.rain);
  if (Math.random() < 0.08) {
    addItem('lysari_scale', 1);
    logC('oc', TXT.lysari.scale);
  }
  s.rhasari.mood = Math.min(100, s.rhasari.mood + 10);
}

/* ========== Rakuakira ========== */
function rakuVisit() {
  var s = G.s, mult = 1 + eff('rakuIntel'), snack = null;
  s.raku.visits++;
  if (s.shop.snack) {
    var d = cheapestGoods('dessert', 1);
    if (d) { addRes(d, -1); snack = RES_MAP[d]; }
    else {
      var dr = cheapestGoods('drink', 2);
      if (dr) { addRes(dr, -2); snack = RES_MAP[dr]; }
    }
  }
  var intel;
  if (snack) {
    intel = Math.round((3 + Math.floor(s.res.renown / 20)) * mult);
    s.stats.rakuFed++;
    logC('oc', pick(TXT.raku.snack), snack, intel);
  } else {
    intel = Math.round(1 * mult);
    logC('oc', pick(TXT.raku.noSnack), null, intel);
  }
  addRes('intel', intel);
  s.raku.last = { snack: !!snack, intel: intel, m: monthIdx() };
}

/* ========== Ciorre 的旅行 ========== */
/* v0.4 起旅行贵了很多：至少要攒够 10000 × 1.8 的 n 次方硬币，外加 2 金翎 × 1.8 的 n 次方路费 */
function tripCost() { return Math.round(10000 * Math.pow(1.8, G.s.trip.count)); }
/* 旅行还要带上翎鸾当路费 */
function tripQuill() { return Math.round(288 * Math.pow(1.8, G.s.trip.count)); }
function canTrip() {
  var s = G.s;
  return s.tech.wanderlust && !tripAway() && s.res.coins >= tripCost() && s.res.quill >= tripQuill();
}
function startTrip() {
  var s = G.s;
  if (!canTrip()) return;
  addRes('quill', -tripQuill());
  addRes('coins', -s.res.coins);
  s.trip.away = 10;
  s.trip.place = pick(TXT.trip.places);
  logC('story', TXT.trip.go, s.trip.place);
}
function tripTick(dt) {
  var s = G.s;
  if (!(s.trip.away > 0)) return;
  s.trip.away -= dt / DAY_SEC;
  if (s.trip.away > 0) return;
  s.trip.away = 0;
  s.trip.count++;
  s.trip.memories++;
  var intel = 5 * s.trip.count;
  addRes('intel', intel);
  var loot = {}, n = 1 + Math.floor(s.trip.count / 2);
  for (var i = 0; i < n; i++) {
    var lv = clamp(randInt(2, 6) + s.trip.count * 4, 1, 40);
    var pool = null;
    for (var dl = 0; dl < 10 && !pool; dl++) {
      var p = (GATHER_BY_LEVEL[lv - dl] || []).concat(GATHER_BY_LEVEL[lv + dl] || []);
      if (p.length) pool = p;
    }
    if (pool) {
      var it = pick(pool);
      loot[it.id] = (loot[it.id] || 0) + 1;
    }
  }
  for (var k in loot) addItem(k, loot[k]);
  logC('story', TXT.trip.back, intel, lootPair(loot));
}

/* ========== 派遣 ========== */
function dispSlots() { return Math.floor(eff('dispSlots')); }
function destVisible(d) {
  var s = G.s;
  if (!s.tech.courier) return false;
  if (d.tier <= 2) return true;
  if (d.tier === 3) return !!s.tech.cartography;
  return !!s.tech.star_chart;
}
function destHint(d) { return d.tier === 3 ? TECH_MAP.cartography : TECH_MAP.star_chart; }
function unlockDest(id) {
  var s = G.s, d = DEST_MAP[id];
  if (!d || s.disp.unlocked[id] || !destVisible(d) || s.res.intel < d.intel) return;
  addRes('intel', -d.intel);
  s.disp.unlocked[id] = true;
}
function dispSpeed() { return Math.max(0.2, 1 + eff('dispSpeed')); }
function homeDragons() { return G.s.dragons.filter(function (d) { return !d.away; }); }
/* 派遣的路费（铜翎） */
function destCost(dest) { return DEST_COST[dest.tier] || 0; }
function canDispatch(dragonId, destId) {
  var s = G.s;
  if (s.disp.active.length >= dispSlots()) return false;
  if (!s.disp.unlocked[destId]) return false;
  if (s.res.quill < destCost(DEST_MAP[destId]) - 1e-9) return false;
  var d = s.dragons.find(function (x) { return x.id === dragonId; });
  return !!d && !d.away;
}
function dispatch(dragonId, destId) {
  var s = G.s;
  if (!canDispatch(dragonId, destId)) return;
  var d = s.dragons.find(function (x) { return x.id === dragonId; });
  var dest = DEST_MAP[destId];
  addRes('quill', -destCost(dest));
  d.away = true;
  s.disp.active.push({ dragon: d.id, dest: destId, left: dest.days, total: dest.days });
  s.stats.dispatches++;
  logC('disp', TXT.disp.go, d.name, dest);
}
function dispatchTick(dt) {
  var s = G.s;
  if (!s.disp.active.length) return;
  var sp = dispSpeed(), done = [];
  s.disp.active.forEach(function (a) {
    a.left -= dt / DAY_SEC * sp;
    if (a.left <= 0) done.push(a);
  });
  done.forEach(function (a) { finishDispatch(a); });
}
function injuryChance(cl, dest) { return clamp((1 - cl / dest.rec) * 0.7, 0, 0.6); }
function lootPreview(cl, dest) {
  var types = Math.min(8, 1 + Math.floor(Math.sqrt(cl) / 2.2) + eff('dispTypes'));
  var lvMean = dest.lv + 3 * Math.log(1 + cl / 5);
  var lvMax = Math.min(45, dest.lv + 16);
  return { types: types, lvMean: Math.min(lvMax, lvMean), lvMax: lvMax, inj: eff('noInjury') ? 0 : injuryChance(cl, dest) };
}
function pickGather(lv, dest, cl) {
  var tried = {};
  for (var delta = 0; delta <= 12; delta++) {
    var lvls = [lv - delta, lv + delta];
    for (var i = 0; i < 2; i++) {
      var L2 = lvls[i];
      if (L2 < 1 || L2 > 50 || tried[L2]) continue;
      tried[L2] = true;
      var pool = GATHER_BY_LEVEL[L2] || [];
      var pairs = [];
      pool.forEach(function (it) {
        var catW = (dest.cat[it.cat] || 0) + (it.cat === 'flo' ? eff('dispCat.flo') : 0);
        if (catW <= 0) return;
        var elW = it.el === 'n' ? 1.2 : (dest.el[it.el] ? 0.6 + dest.el[it.el] * 0.5 : 0.35);
        if (it.el === 's') elW *= 1 + eff('dispEl.s');
        var w = RARITY.weight[it.r] * (1 + (it.r - 1) * cl / 150) * catW * elW;
        pairs.push([it, w]);
      });
      if (pairs.length) return wpick(pairs);
    }
  }
  return null;
}
function rollLoot(dest, d) {
  var cl = d.cl, R = dest.rec, power = cl / R;
  var injured = false, shielded = false;
  if (Math.random() < injuryChance(cl, dest)) {
    if (eff('noInjury')) shielded = true; else injured = true;
  }
  var pv = lootPreview(cl, dest);
  var loot = {};
  for (var i = 0; i < pv.types; i++) {
    var lv = clamp(Math.round(dest.lv + 3 * Math.log(1 + cl / 5) + (Math.random() + Math.random() + Math.random() - 1.5) * 4), 1, pv.lvMax);
    var it = pickGather(lv, dest, cl);
    if (!it) continue;
    var n = 1 + Math.floor(Math.random() * (1 + cl / 40));
    n = Math.min(6, Math.max(1, Math.round(n * (1 + eff('dispLoot')))));
    loot[it.id] = (loot[it.id] || 0) + n;
  }
  var cc = Math.floor(Math.random() * (1 + cl / 12)) + (power >= 1 ? 1 : 0);
  for (var j = 0; j < cc; j++) {
    var pairs = [];
    for (var e in dest.el) pairs.push([e, dest.el[e] * (e === 's' ? 1 + eff('dispEl.s') : 1)]);
    var cid = CRYSTAL_OF[wpick(pairs)];
    loot[cid] = (loot[cid] || 0) + 1;
  }
  var coins = Math.round(dest.lv * 50 * (1 + cl / 20) * rand(0.6, 1.4));
  var intel = 1 + Math.floor(Math.random() * (1 + dest.tier));
  var lux = rollLux(dest, cl);
  if (injured) {
    for (var k in loot) {
      loot[k] = Math.floor(loot[k] / 2);
      if (!loot[k]) delete loot[k];
    }
    for (var k2 in lux) {
      lux[k2] = Math.floor(lux[k2] / 2);
      if (!lux[k2]) delete lux[k2];
    }
    coins = Math.floor(coins / 2);
  }
  var xp = dest.days * (2 + R * 0.25) * (injured ? 0.5 : 1);
  return { loot: loot, lux: lux, coins: coins, intel: intel, xp: xp, injured: injured, shielded: shielded };
}
/* 贵重品：每次派遣带回一种（远处的地点两种），偏向地点的元素 */
function rollLux(dest, cl) {
  var out = {}, kinds = dest.tier >= 3 ? 2 : 1;
  var pool = LUXURIES.filter(function (l) { return l.tier <= dest.tier; });
  for (var i = 0; i < kinds && pool.length; i++) {
    var pairs = pool.map(function (l) {
      var w = l.w;
      if (l.els) w *= l.els.some(function (e) { return dest.el[e]; }) ? 1 + Math.max.apply(null, l.els.map(function (e) { return dest.el[e] || 0; })) * 0.5 : 0.3;
      return [l, w];
    });
    var l = wpick(pairs);
    pool = pool.filter(function (x) { return x !== l; });
    out[l.id] = Math.max(1, Math.round(3 * (2 + 2 * dest.tier) * (1 + cl / 80) * rand(0.7, 1.3)));
  }
  return out;
}
function luxPair(lux) {
  var list = [];
  for (var id in lux) if (RES_MAP[id]) list.push({ zh: RES_MAP[id].zh + ' ×' + lux[id], en: RES_MAP[id].en + ' x' + lux[id] });
  return joinPairs(list);
}
function addLux(id, n) {
  var s = G.s;
  s.luxSeen[id] = true;
  return addRes(id, n);
}
function finishDispatch(a) {
  var s = G.s;
  s.disp.active = s.disp.active.filter(function (x) { return x !== a; });
  var d = s.dragons.find(function (x) { return x.id === a.dragon; });
  var dest = DEST_MAP[a.dest];
  if (!d) return;
  d.away = false;
  var r = rollLoot(dest, d);
  for (var k in r.loot) addItem(k, r.loot[k]);
  for (var k2 in r.lux) addLux(k2, r.lux[k2]);
  addRes('coins', r.coins);
  addRes('intel', r.intel);
  s.stats.dispDone[a.dest] = (s.stats.dispDone[a.dest] || 0) + 1;
  if (r.injured) logC('disp', TXT.disp.injured, d.name);
  if (r.shielded) logC('disp', TXT.disp.shielded, d.name);
  var lp = lootPair(r.loot);
  logC('disp', TXT.disp.back, d.name, dest, {
    zh: lp.zh + '、硬币 ' + fmt(r.coins) + '、情报 ' + r.intel,
    en: lp.en + ', ' + fmt(r.coins) + ' coins, ' + r.intel + ' intel'
  });
  if (Object.keys(r.lux).length) logC('disp', TXT.lux.got, d.name, luxPair(r.lux));
  gainXp(d, r.xp, true);
  s.disp.history.unshift({ name: d.name, dest: a.dest, loot: r.loot, lux: r.lux, coins: r.coins, intel: r.intel, injured: r.injured });
  if (s.disp.history.length > 6) s.disp.history.pop();
}

/* ========== 炼金 ========== */
/* v0.4.1：炼金点数改为立方。每件材料提供“等级的立方 × 稀有度倍率”点，
 * 产物的最高等级为总点数的立方根，所以 50 级产物需要 125000 点，十几级的材料再多也凑不出来 */
function itemPoints(id) { var it = ITEMS[id]; return Math.pow(it.lv, 3) * RARITY.points[it.r]; }
function alchPoints(ids) {
  return ids.reduce(function (a, id) { return a + itemPoints(id); }, 0);
}
function levelPoints(lv) { return Math.pow(lv, 3); }
function alchRange(ids) {
  var p = alchPoints(ids);
  var max = clamp(Math.floor(Math.cbrt(p) + 1e-9), 1, 50);
  var fl = Math.min(0.6, eff('alchFloor'));
  var min = Math.max(1, Math.ceil(max * fl));
  /* 产物的最低等级不会低于材料里等级最低的那件 */
  /* 下限不会高于点数决定的上限：点数不够时，产物照样只能到上限 */
  if (ids.length) min = Math.max(min, Math.min.apply(null, ids.map(function (id) { return ITEMS[id].lv; })));
  return { p: p, max: max, min: Math.min(min, max) };
}
function matchRecipe(ids) {
  var c = tally(ids);
  for (var i = 0; i < RECIPES.length; i++) {
    var r = RECIPES[i], ok = true, k;
    for (k in r.mats) if (c[k] !== r.mats[k]) { ok = false; break; }
    if (ok) for (k in c) if (r.mats[k] !== c[k]) { ok = false; break; }
    if (ok) return r;
  }
  return null;
}
function alchCost(ids) { return { firewood: 5 * ids.length }; }
/* 失败率：稀有度决定基础值，研究按比例降低，再加上月相的额外杂质概率。Rare 5 与 Rare 6 永不失败 */
function failChance(r, guard) {
  if (RARITY.fail[r] <= 0) return 0;
  var f = RARITY.fail[r] * Math.max(0, 1 - eff('alchFail')) + phaseMod();
  return clamp(f, 0, 0.9) * (guard ? 0.5 : 1);
}
function alchMissing() {
  var s = G.s, c = tally(s.alch.slots), miss = {};
  for (var id in c) if ((s.inv[id] || 0) < c[id]) miss[id] = true;
  return miss;
}
function canTransmute() {
  var s = G.s, ids = s.alch.slots;
  if (!ids.length || ids.length > 7) return false;
  if (Object.keys(alchMissing()).length) return false;
  if (!canAfford(alchCost(ids))) return false;
  if (s.alch.guard && s.rhasari.joined && s.rhasari.flame < 2) return false;
  return true;
}
function slotAdd(id) {
  var s = G.s;
  if (s.alch.slots.length >= 7) return;
  var used = s.alch.slots.filter(function (x) { return x === id; }).length;
  if ((s.inv[id] || 0) <= used) return;
  s.alch.slots.push(id);
}
function slotRemove(i) { G.s.alch.slots.splice(i, 1); }
/* 炼金。defer 为真时先不写日志，返回的结果里带 flush()，由界面在揭晓动画结束后调用 */
function transmute(defer) {
  var s = G.s;
  if (!canTransmute()) return null;
  var ids = s.alch.slots.slice();
  var guard = s.alch.guard && s.rhasari.joined;
  spendCost(alchCost(ids));
  if (guard) s.rhasari.flame -= 2;
  ids.forEach(function (id) { removeItem(id, 1); });
  var recipe = matchRecipe(ids), out, failed = false, intended = null, lv = null;
  if (recipe) {
    out = recipe.out;
    s.recipes[recipe.id] = true;
  } else {
    var rg = alchRange(ids);
    lv = randInt(rg.min, rg.max);
    var pool = PRODUCTS_BY_LEVEL[lv];
    var it = wpick(pool.map(function (x) { return [x, RARITY.weight[x.r]]; }));
    intended = it.id;
    if (Math.random() < failChance(it.r, guard)) { out = 'impurity'; failed = true; }
    else out = it.id;
  }
  addItem(out, 1);
  s.stats.alch++;
  s.alch.last = { out: out, failed: failed, intended: intended, recipe: recipe ? recipe.id : null, lv: lv };
  var flush = function () {
    if (guard) logC('alch', TXT.rhasari.guard);
    if (recipe) logC('alch', TXT.alch.recipe, itemPair(out));
    else if (failed) logC('alch', TXT.alch.fail, itemPair(intended));
    else logC('alch', TXT.alch.ok, itemPair(out));
  };
  if (!defer) flush();
  var keep = [], c = {};
  s.alch.slots.forEach(function (id) {
    c[id] = (c[id] || 0) + 1;
    if ((s.inv[id] || 0) >= c[id]) keep.push(id);
  });
  s.alch.slots = keep;
  return { out: out, failed: failed, intended: intended, recipe: recipe ? recipe.id : null, lv: lv, flush: defer ? flush : function () {} };
}

/* ========== 委托（Ayrelia） ========== */
function progStage() {
  var s = G.s, st = 1;
  if (s.tech.roasting) st++;
  if (s.tech.agronomy) st++;
  if (s.tech.confection) st++;
  if (s.rhasari.joined) st++;
  if (s.bld.waystation) st++;
  if (s.tech.baking) st++;
  st += Math.max(0, Object.keys(s.disp.unlocked).length - 1);
  if (s.tech.transmutation) st += 2;
  return st;
}
function maxLootLevel() {
  var s = G.s, m = 3;
  for (var id in s.disp.unlocked) m = Math.max(m, DEST_MAP[id].lv + 6);
  return m;
}
/* 青睐奖励：前中期的简单委托给得少，困难的委托给得多 */
function favEasy(st) { return st < 5 ? 1 : st < 10 ? 2 : 3; }
function favMid(st) { return 3 + Math.floor(st / 4); }
function favHard(st) { return 5 + Math.floor(st / 3); }
var COMM_TYPES = {
  goods: {
    avail: function (s) { return goodsUnlocked().length > 0; },
    gen: function (s, st) {
      var f = pick(goodsUnlocked());
      var need = clamp(Math.round((4 + st * 2) * 3 / f.price), 2, 30);
      return { good: f.id, need: need, rw: { renown: 3 + st, quill: Math.round(basePrice(f.id) * need * 1.5), favor: favEasy(st) } };
    }
  },
  serve: {
    avail: function (s) { return goodsUnlocked().length > 0; },
    gen: function (s, st) { return { need: 10 + st * 6, base: s.stats.served, rw: { renown: 4 + st, intel: 3 + st, favor: favEasy(st) } }; }
  },
  firewood: {
    avail: function (s) { return true; },
    gen: function (s, st) { return { need: Math.min(Math.round(80 + st * 40), Math.floor(capOf('firewood') * 0.9)), rw: { intel: 4 + st, renown: 2, favor: favEasy(st) } }; }
  },
  harvest: {
    avail: function (s) { return !!s.tech.agronomy; },
    gen: function (s, st) { return { need: 8 + st * 2, base: s.stats.harvests, rw: { renown: 3 + st, quill: 4 + 2 * st, favor: favEasy(st) } }; }
  },
  window: {
    avail: function (s) { return windowUnlocked(); },
    gen: function (s, st) { return { need: 3 + st, base: s.stats.windowSold, rw: { renown: 3 + st, quill: 6 + 3 * st, favor: favEasy(st) } }; }
  },
  item: {
    avail: function (s) { return s.bld.waystation > 0; },
    gen: function (s, st) {
      var maxLv = maxLootLevel();
      var pool = ITEM_LIST.filter(function (it) { return it.g && it.cat !== 'cry' && it.lv <= maxLv && (s.seen[it.id] || it.lv <= maxLv - 4); });
      if (!pool.length) pool = ITEM_LIST.filter(function (it) { return it.g && it.lv <= 6; });
      var it = pick(pool);
      var need = it.lv >= 15 ? 1 : it.lv >= 8 ? 2 : 3;
      return { item: it.id, need: need, rw: { quill: itemValue(it.id) * need * 2, renown: 4 + st, favor: it.lv >= 15 ? favHard(st) : favMid(st) } };
    }
  },
  element: {
    avail: function (s) { return s.bld.waystation > 0; },
    gen: function (s, st) {
      var el = pick(ELEMENT_KEYS);
      var minLv = clamp(Math.floor(maxLootLevel() * 0.45), 1, 30);
      return { el: el, minLv: minLv, need: 2 + (st > 8 ? 1 : 0), rw: { renown: 5 + st, intel: 5, favor: favHard(st) } };
    }
  },
  rarity: {
    avail: function (s) { return s.bld.waystation > 0; },
    gen: function (s, st) {
      var r = s.tech.transmutation ? (st > 12 ? 4 : 3) : 2;
      return { minR: r, need: r >= 4 ? 1 : 2, rw: { renown: 5 + st, quill: 24 * r * r, favor: favHard(st) } };
    }
  },
  dispatch: {
    avail: function (s) { return s.bld.waystation > 0; },
    gen: function (s, st) {
      var ids = Object.keys(s.disp.unlocked);
      var far = ids.filter(function (x) { return x !== 'lunavite'; });
      var id = pick(far.length ? far : ids);
      return { dest: id, need: 1, base: s.stats.dispDone[id] || 0, rw: { intel: 6 + DEST_MAP[id].tier * 4, renown: 3 + st, favor: DEST_MAP[id].tier >= 3 ? favHard(st) : favMid(st) } };
    }
  },
  alchemy: {
    avail: function (s) { return !!s.tech.transmutation; },
    gen: function (s, st) { return { need: 5 + Math.floor(st / 2), base: s.stats.alch, rw: { renown: 5 + st, intel: 8, favor: favMid(st) } }; }
  },
  caramel: {
    avail: function (s) { return !!s.rhasari.joined; },
    gen: function (s, st) { return { need: 3 + st, base: s.stats.caramel, rw: { renown: 4 + st, quill: Math.round(basePrice('caramel') * (3 + st)), favor: favEasy(st) } }; }
  }
};
/* 每季度的委托数：开始只有 1 份，可用青睐兑换“第二封信”等升级，最多 4 份 */
function commCount() { return Math.min(4, 1 + Math.floor(eff('commSlots'))); }
function newQuarter(fromBuild) {
  var s = G.s, qk = quarterKey();
  if (s.comm.qkey === qk) return;
  if (!fromBuild && s.comm.list.some(function (c) { return !c.done; })) logC('oc', TXT.story.quarterEnd);
  s.comm.qkey = qk;
  s.comm.letter = randInt(0, TXT.ayrelia.length - 1);
  var st = progStage();
  var types = Object.keys(COMM_TYPES).filter(function (k) { return COMM_TYPES[k].avail(s); });
  var n = commCount();
  var list = [], bag = types.slice();
  for (var i = 0; i < n && types.length; i++) {
    if (!bag.length) bag = types.slice();
    var t = bag.splice(Math.floor(Math.random() * bag.length), 1)[0];
    var c = COMM_TYPES[t].gen(s, st);
    c.type = t;
    c.done = false;
    list.push(c);
  }
  s.comm.list = list;
  logC('oc', TXT.raku.letter);
}
function commTexts(c) {
  var tp = TXT.comm[c.type], t, d;
  switch (c.type) {
    case 'goods': t = fmtPair(tp.t, [RES_MAP[c.good]]); d = fmtPair(tp.d, [RES_MAP[c.good], c.need]); break;
    case 'item': t = fmtPair(tp.t, [itemPair(c.item)]); d = fmtPair(tp.d, [itemPair(c.item), c.need]); break;
    case 'element': t = fmtPair(tp.t, [ELEMENTS[c.el]]); d = fmtPair(tp.d, [ELEMENTS[c.el], c.need, c.minLv]); break;
    case 'rarity': t = fmtPair(tp.t, []); d = fmtPair(tp.d, [c.need, c.minR]); break;
    case 'dispatch': t = fmtPair(tp.t, [DEST_MAP[c.dest]]); d = fmtPair(tp.d, [DEST_MAP[c.dest]]); break;
    default: t = fmtPair(tp.t, []); d = fmtPair(tp.d, [c.need]);
  }
  return { t: t, d: d };
}
function commPickItems(c) {
  var s = G.s, list = [];
  for (var id in s.inv) {
    var it = ITEMS[id];
    if (!it || id === 'impurity') continue;
    if (c.type === 'element' && (it.el !== c.el || it.lv < c.minLv)) continue;
    if (c.type === 'rarity' && it.r < c.minR) continue;
    list.push(it);
  }
  list.sort(function (a, b) { return itemValue(a.id) - itemValue(b.id); });
  var picked = {}, n = 0;
  for (var i = 0; i < list.length && n < c.need; i++) {
    var take = Math.min(s.inv[list[i].id], c.need - n);
    picked[list[i].id] = take;
    n += take;
  }
  return { picked: picked, n: n };
}
function commProgress(c) {
  var s = G.s;
  switch (c.type) {
    case 'goods': return Math.min(c.need, Math.floor(s.res[c.good] || 0));
    case 'firewood': return Math.min(c.need, Math.floor(s.res.firewood));
    case 'item': return Math.min(c.need, s.inv[c.item] || 0);
    case 'element': case 'rarity': return commPickItems(c).n;
    case 'serve': return Math.min(c.need, s.stats.served - c.base);
    case 'harvest': return Math.min(c.need, s.stats.harvests - c.base);
    case 'window': return Math.min(c.need, (s.stats.windowSold || 0) - c.base);
    case 'dispatch': return Math.min(c.need, (s.stats.dispDone[c.dest] || 0) - c.base);
    case 'alchemy': return Math.min(c.need, s.stats.alch - c.base);
    case 'caramel': return Math.min(c.need, s.stats.caramel - c.base);
  }
  return 0;
}
function commIsSubmit(c) { return ['goods', 'firewood', 'item', 'element', 'rarity'].indexOf(c.type) >= 0; }
function commReward(c) {
  var m = 1 + eff('commReward'), out = {};
  for (var k in c.rw) out[k] = k === 'favor' ? c.rw[k] : Math.round(c.rw[k] * m);
  return out;
}
function rewardPair(rw) {
  var list = [];
  for (var k in rw) {
    if (RES_MAP[k].quill) { var q = quillPair(rw[k]); list.push({ zh: RES_MAP[k].zh + ' +' + q.zh, en: RES_MAP[k].en + ' +' + q.en }); }
    else list.push({ zh: RES_MAP[k].zh + ' +' + fmt(rw[k]), en: RES_MAP[k].en + ' +' + fmt(rw[k]) });
  }
  return { zh: list.map(function (p) { return p.zh; }).join('，'), en: list.map(function (p) { return p.en; }).join(', ') };
}
function completeComm(i) {
  var s = G.s, c = s.comm.list[i];
  if (!c || c.done || commProgress(c) < c.need) return;
  if (c.type === 'goods') addRes(c.good, -c.need);
  else if (c.type === 'firewood') addRes('firewood', -c.need);
  else if (c.type === 'item') removeItem(c.item, c.need);
  else if (c.type === 'element' || c.type === 'rarity') {
    var pk = commPickItems(c).picked;
    for (var id in pk) removeItem(id, pk[id]);
  }
  var rw = commReward(c);
  for (var k in rw) {
    if (k === 'favor' || k === 'renown') s.res[k] += rw[k];
    else addRes(k, rw[k]);
  }
  if (rw.favor) s.comm.everGot = true;
  c.done = true;
  s.comm.done++;
  logC('oc', TXT.comm.done, commTexts(c).t, rewardPair(rw));
}
function commReady() { return G.s.comm.list.filter(function (c) { return !c.done && commProgress(c) >= c.need; }).length; }
/* 青睐升级：可多级的升级按 growth 逐级加价（炉边闲谈最多 7 级）；落羽每次 +repeat */
function favorCost(f) {
  if (f.repeat) return f.cost + f.repeat * G.s.comm.plumeBuys;
  return Math.round(f.cost * Math.pow(f.growth || 1, favorLevel(f.id)));
}
function favorMax(f) { return f.repeat ? Infinity : (f.max || 1); }
function favorAvail(f) { return !f.need || favorLevel(f.need) > 0; }
function favorDone(f) { return !f.repeat && favorLevel(f.id) >= favorMax(f); }
function canBuyFavor(f) { return favorAvail(f) && !favorDone(f) && G.s.res.favor >= favorCost(f); }
function buyFavor(id) {
  var s = G.s, f = FAVOR_UPS.find(function (x) { return x.id === id; });
  if (!f || !canBuyFavor(f)) return;
  s.res.favor -= favorCost(f);
  if (f.repeat) {
    s.comm.plumeBuys++;
    addItem(f.item, 1);
  } else s.comm.ups[id] = favorLevel(id) + 1;
  computeEffects();
}
