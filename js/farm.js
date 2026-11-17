/* 草地种植与后厨加工
 * v0.3：收获、播种、浇水、施肥、制作都需要时间。园丁与厨师按自己的速度填充进度条，
 * 玩家可以按住对应的按钮亲自加快进度。 */

/* ========== 草地 ========== */
function cropsKnown() { return CROPS.filter(function (c) { return cropKnown(c, G.s); }); }
function reclaimCost() {
  var n = G.s.farm.plots.length, m = Math.pow(1.2, n);
  return { firewood: Math.round(20 * m), coins: Math.round(150 * m) };
}
function canReclaim() { return !!G.s.tech.agronomy && canAfford(reclaimCost()); }
function reclaimPlot() {
  var s = G.s;
  if (!canReclaim()) return;
  spendCost(reclaimCost());
  s.farm.plots.push({ crop: null, plan: null, prog: 0, water: 50, fert: 60 });
  if (s.farm.plots.length === 1) logC('farm', TXT.farm.reclaim);
}
function greenhouseCovered(i) { return i < Math.floor(eff('greenhouse')); }
function waterFactor(w) {
  if (w < 10) return 0.15;
  return Math.max(0.25, 1 - Math.pow((w - 65) / 70, 2));
}
function fertFactor(f) { return 0.6 + f / 250; }
function seasonFactor(c, i) {
  var m = curMonth();
  if (m.cold && !greenhouseCovered(i)) return m.frozen ? 0.2 : 0.4;
  if (c.pref.indexOf(monthIdx()) >= 0) return 1.5;
  return 1;
}
/* 每天的生长进度（0 到 1） */
function growthPerDay(p, i) {
  if (!p.crop) return 0;
  var c = CROP_MAP[p.crop];
  return seasonFactor(c, i) * waterFactor(p.water) * fertFactor(p.fert) * (1 + eff('farmGrowth')) / c.days;
}
/* 讨厌的月份：在这个月收获只有四分之一的产量，温室可以抵消 */
var HATE_YIELD = 0.25;
function cropHatesNow(c) { return !!c.hate && c.hate.indexOf(monthIdx()) >= 0; }
function hateFactor(c, i) { return cropHatesNow(c) && !greenhouseCovered(i) ? HATE_YIELD : 1; }
/* 当前条件下预计的收获量（不含随机波动） */
function expectedYield(p, i) {
  var c = CROP_MAP[p.crop];
  return c.yld * (0.6 + p.fert * 0.008) * (1 + eff('cropYield')) * hateFactor(c, i);
}
function plotRipe(p) { return !!p.crop && p.prog >= 1; }
function canPlant(p) {
  var c = p && p.plan && CROP_MAP[p.plan];
  return !!c && !p.crop && cropKnown(c, G.s) && G.s.res.coins >= c.seed;
}
function plantPlot(i) {
  var s = G.s, p = s.farm.plots[i];
  if (!canPlant(p)) return false;
  var c = CROP_MAP[p.plan];
  addRes('coins', -c.seed);
  p.crop = c.id;
  p.prog = 0;
  return true;
}
function setPlan(i, cropId) {
  var p = G.s.farm.plots[i];
  if (!p) return;
  p.plan = cropId || null;
}
function harvestPlot(i) {
  var s = G.s, p = s.farm.plots[i];
  if (!p || !plotRipe(p)) return false;
  var c = CROP_MAP[p.crop];
  var amt = expectedYield(p, i) * rand(0.85, 1.15);
  addRes(c.res, Math.max(1, Math.round(amt)));
  p.fert = Math.max(0, p.fert - 12);
  p.crop = null;
  p.prog = 0;
  s.stats.harvests++;
  return true;
}
function clearPlot(i) {
  var p = G.s.farm.plots[i];
  if (!p) return;
  p.crop = null;
  p.prog = 0;
}
function plantAll(cropId) { G.s.farm.plots.forEach(function (p, i) { setPlan(i, cropId); }); }
function compostImpurities() {
  var s = G.s, n = s.inv.impurity || 0;
  if (!n || !s.bld.compost) return;
  removeItem('impurity', n);
  addRes('fertilizer', n * 5);
  s.stats.composted += n;
  logC('farm', TXT.farm.compost, n, n * 5);
}

/* ---------- 草地的工作 ----------
 * 收获与播种：进度条走满后完成一块地。浇水与施肥：水分和地力随工作量逐点上升。
 * 每次只做一件事，所以园丁在浇水时不会同时施肥。 */
function firstRipe() { var ps = G.s.farm.plots; for (var i = 0; i < ps.length; i++) if (plotRipe(ps[i])) return i; return -1; }
function firstPlantable() { var ps = G.s.farm.plots; for (var i = 0; i < ps.length; i++) if (canPlant(ps[i])) return i; return -1; }
/* 找水分（或地力）最低、且低于 limit 的地块 */
function lowestPlot(key, limit, needCrop) {
  var ps = G.s.farm.plots, low = -1;
  for (var i = 0; i < ps.length; i++) {
    if (needCrop && !ps[i].crop) continue;
    if (ps[i][key] < limit - 1e-6 && (low < 0 || ps[i][key] < ps[low][key])) low = i;
  }
  return low;
}
function canFertilize() { return G.s.res.fertilizer >= FERT_PER_POINT; }
/* 对一项工作投入 w 份工作量，返回用掉的工作量 */
function farmApply(task, w) {
  var s = G.s, p = s.farm.plots[task.plot];
  if (!p) return 0;
  if (task.type === 'harvest' || task.type === 'plant') {
    var cost = FARM_WORK[task.type];
    var need = (1 - task.prog) * cost, use = Math.min(w, need);
    task.prog += use / cost;
    if (task.prog >= 1 - 1e-9) {
      if (task.type === 'harvest') harvestPlot(task.plot); else plantPlot(task.plot);
      task.done = true;
    }
    return use;
  }
  var key = task.type === 'water' ? 'water' : 'fert';
  var room = task.to - p[key];
  if (room <= 0) { task.done = true; return 0; }
  var per = FARM_WORK[task.type];
  var pts = Math.min(room, w * per);
  if (task.type === 'fert') {
    pts = Math.min(pts, s.res.fertilizer / FERT_PER_POINT);
    if (pts <= 1e-6) { task.done = true; return 0; }
    addRes('fertilizer', -pts * FERT_PER_POINT);
  }
  p[key] = Math.min(100, p[key] + pts);
  if (p[key] >= task.to - 1e-6) task.done = true;
  return pts / per;
}
/* 园丁挑选下一件事：收获 > 播种 > 浇水（低于 45 时浇到 80）> 施肥（低于 45 时施到 80） */
function gardenerPick() {
  var s = G.s, i = firstRipe();
  if (i >= 0) return { type: 'harvest', plot: i, prog: 0 };
  i = firstPlantable();
  if (i >= 0) return { type: 'plant', plot: i, prog: 0 };
  i = lowestPlot('water', 45, true);
  if (i >= 0) return { type: 'water', plot: i, to: 80 };
  if (s.farm.autoFert && canFertilize()) {
    i = lowestPlot('fert', 45, false);
    if (i >= 0) return { type: 'fert', plot: i, to: 80 };
  }
  return null;
}
/* 检查一项进行中的工作是否还成立（比如地块被手动收获了） */
function taskValid(t) {
  var p = G.s.farm.plots[t.plot];
  if (!p || t.done) return false;
  if (t.type === 'harvest') return plotRipe(p);
  if (t.type === 'plant') return canPlant(p);
  if (t.type === 'fert') return canFertilize() && p.fert < t.to;
  return p.water < t.to;
}
function farmTick(dt) {
  var s = G.s, plots = s.farm.plots;
  if (!plots.length) return;
  var days = dt / DAY_SEC;
  plots.forEach(function (p, i) {
    if (p.crop && p.prog < 1) p.prog = Math.min(1, p.prog + growthPerDay(p, i) * days);
  });
  var w = workForce('gardener') * GARDEN_SPEED * dt, guard = 0;
  if (w <= 0) return;
  while (w > 1e-9 && guard++ < 30) {
    if (!s.farm.task || !taskValid(s.farm.task)) s.farm.task = gardenerPick();
    if (!s.farm.task) break;
    w -= farmApply(s.farm.task, w);
    if (s.farm.task.done) s.farm.task = null;
  }
}
/* 按住草地按钮：kind 为 water、fert、harvest、plant。
 * 浇水与施肥会一块一块地提高到 80，所有地块都到 80 以后继续按，会提高到 100 */
function manualFarmPick(kind) {
  var i;
  if (kind === 'harvest') { i = firstRipe(); return i >= 0 ? { type: 'harvest', plot: i, prog: 0 } : null; }
  if (kind === 'plant') { i = firstPlantable(); return i >= 0 ? { type: 'plant', plot: i, prog: 0 } : null; }
  if (kind === 'fert' && !canFertilize()) return null;
  var key = kind === 'water' ? 'water' : 'fert';
  i = lowestPlot(key, 80, false);
  if (i >= 0) return { type: kind, plot: i, to: 80 };
  i = lowestPlot(key, 100, false);
  return i >= 0 ? { type: kind, plot: i, to: 100 } : null;
}
function canManualFarm(kind) {
  if (tripAway()) return false;
  var m = G.s.farm.manual;
  if (m && m.type === kind && taskValid(m)) return true;
  return !!manualFarmPick(kind);
}
function manualFarmWork(kind, dt) {
  var s = G.s;
  if (tripAway()) return;
  var w = MANUAL_FARM * dt, guard = 0;
  while (w > 1e-9 && guard++ < 20) {
    var m = s.farm.manual;
    if (!m || m.type !== kind || !taskValid(m)) m = s.farm.manual = manualFarmPick(kind);
    if (!m) break;
    w -= farmApply(m, w);
    if (m.done) s.farm.manual = null;
  }
}
/* 水分每天蒸发：水越多蒸发越快，越热蒸发越快；水井、引水渠、甘霖每天补水 */
function farmDaily() {
  var s = G.s, heat = curMonth().heat, regen = eff('waterRegen');
  s.farm.plots.forEach(function (p) {
    var loss = (1.5 + p.water * 0.04) * heat;
    p.water = clamp(p.water - loss, 0, 100);
    /* 自动补水只补到 70，不会把地泡烂 */
    if (p.water < 70) p.water = Math.min(70, p.water + regen);
  });
}

/* ========== 后厨 ========== */
function stationCount(st) { return st === 'torch' ? (G.s.rhasari.joined ? 1 : 0) : (G.s.bld[st] || 0); }
function stationSpeed(st) { return 1 + 0.25 * Math.max(0, stationCount(st) - 1) + eff('kitchenSpeed'); }
function foodTarget(id) { var t = G.s.kitchen.targets[id]; return t == null ? 10 : t; }
function setTarget(id, v) { G.s.kitchen.targets[id] = clamp(Math.round(v) || 0, 0, 9999); }
/* 是否有足够的原料开工（n 份），库存是否还放得下 */
/* 优先制作：玩家指定一样东西为优先，它的原料不会被其他配方用掉；库存达到目标后自动取消 */
function priorityFood() { var p = G.s.kitchen.priority; return p && FOOD_MAP[p] ? FOOD_MAP[p] : null; }
/* 这一样是否因为要和优先物品抢原料而暂时不能做 */
function blockedByPriority(id) {
  var pf = priorityFood(), f = FOOD_MAP[id];
  if (!pf || !f || pf.id === id) return false;
  for (var k in f.inp) if (pf.inp[k] != null) return true;
  return false;
}
function canSetPriority(id) { return (G.s.res[id] || 0) < foodTarget(id); }
function setPriority(id) {
  var s = G.s;
  if (s.kitchen.priority === id) { s.kitchen.priority = null; return; }
  if (!canSetPriority(id)) return;
  s.kitchen.priority = id;
}
function checkPriorityDone() {
  var s = G.s, pf = priorityFood();
  if (!pf) { s.kitchen.priority = null; return; }
  if ((s.res[pf.id] || 0) >= foodTarget(pf.id)) {
    s.kitchen.priority = null;
    logC('shop', TXT.kitchen.priDone, pf);
  }
}
function canMake(id, n) {
  var s = G.s, f = FOOD_MAP[id];
  n = n || 1;
  if (!f || !foodUnlocked(f, s)) return false;
  if (blockedByPriority(id)) return false;
  if (s.res[id] + n > capOf(id) + 1e-9) return false;
  if (f.flame && s.rhasari.flame < f.flame * n) return false;
  for (var k in f.inp) if ((s.res[k] || 0) < f.inp[k] * n - 1e-9) return false;
  return true;
}
/* 开工时先把原料放上灶台 */
function startFood(id) {
  var s = G.s, f = FOOD_MAP[id];
  if (!canMake(id, 1)) return false;
  for (var k in f.inp) addRes(k, -f.inp[k]);
  if (f.flame) s.rhasari.flame -= f.flame;
  return true;
}
function finishFood(id) {
  var s = G.s;
  addRes(id, 1);
  if (s.kitchen.priority === id) checkPriorityDone();
  if (id === 'caramel') s.stats.caramel++;
  s.stats.crafted++;
}
/* 中途换了别的配方时，把已经放上去的原料退回 */
function refundFood(id) {
  var s = G.s, f = FOOD_MAP[id];
  for (var k in f.inp) s.res[k] = (s.res[k] || 0) + f.inp[k];
  if (f.flame) s.rhasari.flame += f.flame;
}
/* 厨师挑选最缺货的配方：库存低于目标库存且原料齐全 */
function cookPick() {
  var s = G.s, best = null, bestScore = 0;
  var pf = priorityFood();
  if (pf && canMake(pf.id, 1) && !(pf.flame && s.rhasari.flame < pf.flame)) return pf;
  for (var i = 0; i < FOODS.length; i++) {
    var f = FOODS[i], t = foodTarget(f.id);
    if (t <= 0) continue;
    var stock = s.res[f.id] || 0;
    if (stock >= t) continue;
    if (!canMake(f.id, 1)) continue;
    if (f.flame && s.rhasari.flame < f.flame + 1) continue;
    var score = (t - stock) / t + (f.kind === 'proc' ? 0.2 : 0);
    if (score > bestScore) { bestScore = score; best = f; }
  }
  return best;
}
/* 对一份制作投入 w 份工作量（按工位速度折算），返回用掉的工作量 */
function cookApply(task, w) {
  var f = FOOD_MAP[task.id], sp = stationSpeed(f.st);
  var need = (1 - task.prog) * f.work / sp, use = Math.min(w, need);
  task.prog += use * sp / f.work;
  if (task.prog >= 1 - 1e-9) { finishFood(task.id); task.done = true; }
  return use;
}
function kitchenTick(dt) {
  var s = G.s;
  if (!s.bld.workshop) return;
  if (s.kitchen.priority) checkPriorityDone();
  var w = workForce('cook') * COOK_SPEED * dt, guard = 0;
  if (w <= 0) return;
  while (w > 1e-9 && guard++ < 30) {
    if (!s.kitchen.task) {
      var f = cookPick();
      if (!f || !startFood(f.id)) break;
      s.kitchen.task = { id: f.id, prog: 0 };
    }
    w -= cookApply(s.kitchen.task, w);
    if (s.kitchen.task.done) s.kitchen.task = null;
  }
}
/* 按住某一行的“制作”：亲自动手做这一样 */
function canManualCook(id) {
  var m = G.s.kitchen.manual;
  return (m && m.id === id) || canMake(id, 1);
}
function manualCookWork(id, dt) {
  var s = G.s, w = MANUAL_COOK * dt, guard = 0;
  if (s.kitchen.manual && s.kitchen.manual.id !== id) { refundFood(s.kitchen.manual.id); s.kitchen.manual = null; }
  while (w > 1e-9 && guard++ < 10) {
    if (!s.kitchen.manual) {
      if (!startFood(id)) break;
      s.kitchen.manual = { id: id, prog: 0 };
    }
    w -= cookApply(s.kitchen.manual, w);
    if (s.kitchen.manual.done) s.kitchen.manual = null;
  }
}
function manualCookProg(id) { var m = G.s.kitchen.manual; return m && m.id === id ? m.prog : 0; }
