/* 小龙：到来与离开、属性、熟练度、成长、饱足、领头龙、手动管理 */

function housing() { return eff('housing'); }
function xpNeed(cl) { return 5 + cl * 1.5; }
function findDragon(id) { return G.s.dragons.find(function (d) { return d.id === id; }); }

function addDragon() {
  var s = G.s, used = {};
  s.dragons.forEach(function (d) { used[d.name] = true; });
  var free = DRAGON_NAMES.filter(function (n) { return !used[n]; });
  var name = free.length ? pick(free) : pick(DRAGON_NAMES) + ' ' + s.nextDragonId;
  var d = {
    id: s.nextDragonId++, name: name, el: pick(ELEMENT_KEYS), job: null,
    cl: randInt(3, 10), gl: randInt(1, 5), xp: 0, skills: {}, fed: 0,
    fav: pick(GOODS_LIST).id, lock: false, away: false
  };
  s.dragons.push(d);
  if (s.dragons.length === 1 && !s.flags.firstDragon) {
    s.flags.firstDragon = true;
    logC('story', TXT.story.firstDragon, name);
  } else logC('dragon', TXT.story.dragonArrive, name);
}
function removeDragon() {
  var s = G.s;
  var home = s.dragons.filter(function (d) { return !d.away && d.id !== s.leader; });
  if (!home.length) return;
  var idle = home.filter(function (d) { return !d.job; });
  var d = idle.length ? pick(idle) : pick(home);
  s.dragons.splice(s.dragons.indexOf(d), 1);
  logC('dragon', TXT.story.dragonLeave, d.name);
}
function gainXp(d, x, loud) {
  d.xp += x;
  var up = false;
  while (d.xp >= xpNeed(d.cl)) {
    d.xp -= xpNeed(d.cl);
    d.cl++;
    up = true;
  }
  if (up && loud) logC('dragon', TXT.disp.levelUp, d.name, d.cl);
}
function dragonTick(dt) {
  var s = G.s, N = s.dragons.length;
  /* 到来：有空位、手上有硬币时累积进度，茶会期间翻倍 */
  if (N < housing() && s.res.coins > 0) {
    s.dragonProg += DRAGON_ARRIVAL * (s.party.days > 0 ? 2 : 1) * dt;
    if (s.dragonProg >= 1) { s.dragonProg -= 1; addDragon(); }
  } else s.dragonProg = 0;
  /* 硬币耗尽且入不敷出时，小龙会离开 */
  if (s.res.coins <= 0.001 && G.rates.coins < 0 && N) {
    s.starve += dt;
    if (s.starve >= 5) { s.starve = 0; removeDragon(); }
  } else s.starve = 0;
  /* 熟练度：在岗的职业增长，其他职业慢慢遗忘 */
  var xpRate = (SKILL_XP + eff('skillXP')) * dt, forget = SKILL_FORGET * dt;
  var tx = eff('trainXp');
  s.dragons.forEach(function (d) {
    if (d.away) return;
    if (tx > 0) gainXp(d, tx * dt, false);
    if (!d.job) return;
    var before = d.skills[d.job] || 0;
    if (before < SKILL_CAP) {
      var after = Math.min(SKILL_CAP, before + xpRate * (d.fed > 0 ? 1.5 : 1));
      d.skills[d.job] = after;
      var t0 = skillTier(before), t1 = skillTier(after);
      if (t1 > t0 && t1 >= 4) logC('dragon', TXT.dragon.master, d.name, JOB_MAP[d.job], SKILL_TIERS[t1]);
    }
    for (var k in d.skills) {
      if (k !== d.job && d.skills[k] > 0) d.skills[k] = Math.max(0, d.skills[k] - forget);
    }
  });
}
function dragonsGrow() {
  var s = G.s, any = false, ch = 0.4 * (1 + eff('growth'));
  s.dragons.forEach(function (d) {
    if (d.gl < 99 && Math.random() < ch) { d.gl++; any = true; }
  });
  if (any && s.dragons.length >= 3) logC('dragon', TXT.story.grow);
}
function idleCount() {
  return G.s.dragons.filter(function (d) { return !d.away && !d.job; }).length;
}

/* 适配度：属性相符最重要，其次是熟练度与成长等级 */
function fitScore(d, jobId) {
  return (elMatch(d, jobId) ? 3 : 0) + skillTier((d.skills && d.skills[jobId]) || 0) + d.gl / 30;
}
function assignJob(jobId, n) {
  var s = G.s;
  for (var i = 0; i < n; i++) {
    var idle = s.dragons.filter(function (x) { return !x.away && !x.job; });
    if (!idle.length) break;
    idle.sort(function (a, b) { return fitScore(b, jobId) - fitScore(a, jobId); });
    idle[0].job = jobId;
  }
}
function unassignJob(jobId, n) {
  var s = G.s;
  for (var i = 0; i < n; i++) {
    var list = s.dragons.filter(function (x) { return !x.away && x.job === jobId; });
    if (!list.length) break;
    list.sort(function (a, b) { return fitScore(a, jobId) - fitScore(b, jobId); });
    list[0].job = null;
  }
}
function unassignAll() { G.s.dragons.forEach(function (d) { if (!d.away) d.job = null; }); }
function setDragonJob(id, jobId) {
  var d = findDragon(id);
  if (!d || d.away) return;
  d.job = jobId || null;
}
/* 按属性优化分配：保持每个职业的人数不变，重新安排谁去做什么 */
function optimizeJobs() {
  var s = G.s, counts = {}, pool = [];
  s.dragons.forEach(function (d) {
    if (d.away || !d.job) return;
    counts[d.job] = (counts[d.job] || 0) + 1;
    pool.push(d);
  });
  pool.forEach(function (d) { d.job = null; });
  var pairs = [];
  pool.forEach(function (d) {
    for (var j in counts) pairs.push({ d: d, j: j, sc: fitScore(d, j) });
  });
  pairs.sort(function (a, b) { return b.sc - a.sc; });
  pairs.forEach(function (p) {
    if (p.d.job || counts[p.j] <= 0) return;
    p.d.job = p.j;
    counts[p.j]--;
  });
  pool.forEach(function (d) {
    if (d.job) return;
    for (var j in counts) if (counts[j] > 0) { d.job = j; counts[j]--; return; }
  });
}

/* ---------- 喂食 ---------- */
function feedDuration(goodId, fav) {
  var f = FOOD_MAP[goodId];
  return (20 + f.price * 1.5) * (fav ? 2 : 1);
}
function feedChoice(d) {
  var s = G.s;
  if (d.fav && foodUnlocked(FOOD_MAP[d.fav], s) && s.res[d.fav] >= 1) return d.fav;
  return cheapestGoods('any', 1);
}
function feedDragon(id, quiet) {
  var s = G.s, d = findDragon(id);
  if (!d) return false;
  var g = feedChoice(d);
  if (!g) return false;
  addRes(g, -1);
  var fav = g === d.fav;
  d.fed = Math.min(200, d.fed + feedDuration(g, fav));
  s.stats.fed++;
  if (!quiet) logC('dragon', pick(fav ? TXT.dragon.feedFav : TXT.dragon.feed), d.name, RES_MAP[g]);
  return g;
}
function canFeedAny() { return !!cheapestGoods('any', 1); }
function feedAll() {
  var s = G.s, used = {}, n = 0;
  s.dragons.forEach(function (d) {
    if (d.away || d.fed > 5) return;
    var g = feedDragon(d.id, true);
    if (g) { used[g] = (used[g] || 0) + 1; n++; }
  });
  if (n) logC('dragon', TXT.dragon.feedAll, n, goodsPair(used));
}

/* ---------- 放生、改名、领头、收藏 ---------- */
var FAREWELL_GIFTS = ['milk_tooth', 'shed_claw', 'scale_flake', 'eggshell_shard'];
function canRelease(d) { return !!d && !d.away && !d.lock && G.s.leader !== d.id; }
function releaseDragon(id) {
  var s = G.s, d = findDragon(id);
  if (!canRelease(d)) return false;
  s.dragons.splice(s.dragons.indexOf(d), 1);
  var gift = pick(FAREWELL_GIFTS);
  addItem(gift, 1);
  s.res.renown += 0.5;
  s.stats.released++;
  logC('dragon', pick(TXT.dragon.release), d.name, itemPair(gift));
  return true;
}
function renameDragon(id, name) {
  var d = findDragon(id);
  name = String(name || '').trim().slice(0, 20);
  if (!d || !name || name === d.name) return;
  var old = d.name;
  d.name = name;
  logC('dragon', TXT.dragon.rename, old, name);
}
function setLeader(id) {
  var s = G.s, d = findDragon(id);
  if (!d) return;
  s.leader = s.leader === id ? null : id;
  if (s.leader === id) logC('dragon', TXT.dragon.leader, d.name);
  computeEffects();
}
function toggleLock(id) {
  var d = findDragon(id);
  if (d) d.lock = !d.lock;
}
