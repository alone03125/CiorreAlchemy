/* 茶会、贸易、观星、成就 */

/* ========== 茶会（参照原版的节日） ========== */
var PARTY_COINS = 2500, PARTY_GOODS = 15, PARTY_DAYS = 60;
function canHoldParty() {
  var s = G.s;
  return !!s.tech.tea_party && s.res.coins >= PARTY_COINS && pickGoods('any', PARTY_GOODS).n >= PARTY_GOODS;
}
function holdParty() {
  var s = G.s;
  if (!canHoldParty()) return;
  addRes('coins', -PARTY_COINS);
  var pk = pickGoods('any', PARTY_GOODS).picked;
  for (var id in pk) addRes(id, -pk[id]);
  var extending = s.party.days > 0;
  s.party.days += PARTY_DAYS;
  s.stats.parties++;
  if (extending) logC('dragon', TXT.party.extend);
  else logC('dragon', TXT.party.start, PARTY_DAYS);
}

/* ========== 贸易（参照原版的外交贸易） ========== */
function partnerUnlocked(p) {
  var s = G.s;
  if (!s.tech.commerce) return false;
  return !p.unlockDest || !!s.trade.unlocked[p.id];
}
function partnerOpen(p) { return p.closed.indexOf(monthIdx()) < 0; }
function tradeMult(p) {
  var rel = G.s.trade.rel[p.id] || 0;
  return (1 + rel / 200 + eff('tradeRatio')) * (p.best.indexOf(monthIdx()) >= 0 ? 1.25 : 1);
}
function tradeWants(p) { return pickGoods(p.wants.kind, p.wants.n); }
function canTrade(p) {
  return partnerUnlocked(p) && partnerOpen(p) && canAfford(p.cost) && tradeWants(p).n >= p.wants.n;
}
function doTrade(id) {
  var s = G.s, p = PARTNER_MAP[id];
  if (!p || !canTrade(p)) return;
  spendCost(p.cost);
  var pk = tradeWants(p).picked;
  for (var g in pk) addRes(g, -pk[g]);
  var mult = tradeMult(p), got = [];
  p.gives.forEach(function (gv) {
    if (gv.seed) {
      if (!s.farm.known[gv.seed] && !cropKnown(CROP_MAP[gv.seed], s)) {
        s.farm.known[gv.seed] = true;
        logC('trade', TXT.trade.seed, CROP_MAP[gv.seed]);
      }
      return;
    }
    if (gv.ch != null && Math.random() > gv.ch) return;
    var n = Math.max(1, Math.round(randInt(gv.min, gv.max) * mult));
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
  s.trade.rel[id] = Math.min(100, (s.trade.rel[id] || 0) + 3);
  s.trade.count[id] = (s.trade.count[id] || 0) + 1;
  s.stats.trades++;
  logC('trade', TXT.trade.done, p, goodsPair(pk), joinPairs(got));
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
