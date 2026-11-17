/* 启动、主循环、自动存档 */

/* 开发自检：检查数据表之间的引用是否完整 */
function devCheck() {
  var problems = [];
  ITEM_LIST.forEach(function (it) {
    var band = LEVEL_BANDS.find(function (b) { return it.lv >= b.from && it.lv <= b.to; });
    if (!band) problems.push(it.id + ' 等级越界');
    else if (it.r < band.rmin || it.r > band.rmax) problems.push(it.id + ' 稀有度 ' + it.r + ' 不在 Lv' + it.lv + ' 的区间内');
    if (!ELEMENTS[it.el]) problems.push(it.id + ' 元素未知');
    if (!CATS[it.cat]) problems.push(it.id + ' 类别未知');
  });
  for (var lv = 1; lv <= 50; lv++) if (!(PRODUCTS_BY_LEVEL[lv] || []).length) problems.push('Lv' + lv + ' 没有普通产物');
  RECIPES.forEach(function (r) {
    if (!ITEMS[r.out]) problems.push('配方 ' + r.id + ' 的产物不存在');
    for (var k in r.mats) if (!ITEMS[k]) problems.push('配方 ' + r.id + ' 的材料 ' + k + ' 不存在');
  });
  var costs = BUILDINGS.map(function (b) { return b.cost; }).concat(TECHS.map(function (t) { return t.cost; }));
  costs.forEach(function (c) { for (var k in c) if (!RES_MAP[k] && !ITEMS[k]) problems.push('未知的花费 ' + k); });
  FOODS.forEach(function (f) {
    for (var k in f.inp) if (!RES_MAP[k]) problems.push('商品 ' + f.id + ' 的原料 ' + k + ' 不存在');
    if (!STATIONS[f.st]) problems.push('商品 ' + f.id + ' 的工位未知');
    if (f.tech && !TECH_MAP[f.tech]) problems.push('商品 ' + f.id + ' 的研究未知');
  });
  CROPS.forEach(function (c) {
    if (!RES_MAP[c.res]) problems.push('作物 ' + c.id + ' 的产出不存在');
    if (c.tech && !TECH_MAP[c.tech]) problems.push('作物 ' + c.id + ' 的研究未知');
  });
  TRADE_PARTNERS.forEach(function (p) {
    p.gives.forEach(function (g) {
      if (g.res && !RES_MAP[g.res]) problems.push('贸易 ' + p.id + ' 的资源 ' + g.res + ' 不存在');
      if (g.item && !ITEMS[g.item]) problems.push('贸易 ' + p.id + ' 的物品 ' + g.item + ' 不存在');
      if (g.seed && !CROP_MAP[g.seed]) problems.push('贸易 ' + p.id + ' 的种子 ' + g.seed + ' 不存在');
    });
  });
  FOODS.forEach(function (f) {
    if (!(f.price > 0)) problems.push('商品 ' + f.id + ' 没有售价');
    for (var k in f.inp) if (FOOD_MAP[k] && FOODS.indexOf(FOOD_MAP[k]) > FOODS.indexOf(f) && FOOD_MAP[k].kind !== 'proc') problems.push('商品 ' + f.id + ' 用到了排在后面的商品 ' + k);
  });
  if (MOON_MOD.length !== 12) problems.push('月相表不是 12 个月');
  var ids = {};
  RESOURCES.forEach(function (r) { if (ids[r.id]) problems.push('资源 id 重复 ' + r.id); ids[r.id] = true; });
  if (problems.length) console.warn('数据自检发现问题：\n' + problems.join('\n'));
  console.info('物品 ' + ITEM_LIST.length + '，资源 ' + RESOURCES.length + '，商品 ' + GOODS_LIST.length + '，作物 ' + CROPS.length +
    '，建筑 ' + BUILDINGS.length + '，研究 ' + TECHS.length + '，成就 ' + ACHIEVEMENTS.length);
  return problems;
}

function durationPair(sec) {
  var keep = LANG, out = {};
  ['zh', 'en'].forEach(function (lg) { LANG = lg; out[lg] = fmtTime(sec); });
  LANG = keep;
  return out;
}

(function () {
  function boot() {
    devCheck();
    var loaded = loadGame();
    if (!loaded) G.s = newState();
    LANG = G.s.lang || 'zh';
    applyTheme();
    computeEffects();
    computeRates();
    if (!loaded) logC('story', TXT.story.intro);
    else if (G.notice) {
      logC('sys', G.notice);
      if (G.notice !== TXT.migrated) logC('story', TXT.story.intro);
      G.notice = null;
      G.s.lastSave = Date.now();
    }
    else if (!G.s.paused) {
      var away = (Date.now() - (G.s.lastSave || Date.now())) / 1000;
      if (away > 30) {
        G.silent = true;
        simulate(Math.min(away, 8 * 3600));
        G.silent = false;
        logC('sys', TXT.story.offline, durationPair(away));
      }
    }
    UI.init();
    UI.refreshAll();

    var last = performance.now();
    setInterval(function () {
      var now = performance.now(), dt = (now - last) / 1000;
      last = now;
      if (G.s.paused) { computeEffects(); computeRates(); UI.refreshAll(); return; }
      if (dt > 30) {
        G.silent = true;
        simulate(Math.min(dt, 8 * 3600));
        G.silent = false;
      } else {
        holdTick(dt);
        var t = dt;
        while (t > 0) { var d = Math.min(t, 1); tick(d); t -= d; }
        sampleFlow(dt);
      }
      UI.refreshAll();
    }, 200);
    setInterval(saveGame, 30000);
    window.addEventListener('beforeunload', saveGame);
    document.addEventListener('visibilitychange', function () { if (document.hidden) saveGame(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
