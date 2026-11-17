/* 各标签页 */

function tabKey(id) {
  const s = G.s;
  switch (id) {
    case 'nest': return s.flags.firewood + '|' + s.tech.firewood_contract + '|' + marketUnlocked();
    case 'dragons': return JOBS.filter(j => j.req(s)).map(j => j.id).join(',') + s.tech.tea_party;
    case 'research': return TECHS.filter(techVisible).map(t => t.id).join(',') + '|' + Object.keys(s.tech).length + s.ui.showDoneTech;
    case 'workshop': return [goodsUnlocked().length > 0, s.rhasari.joined, foodUnlocked(FOOD_MAP.pudding, s), s.tech.wanderlust, displaySlots() > 0, s.lysari.visits > 0, windowUnlocked(), FOODS.some(f => foodUnlocked(f, s))].join(',');
    case 'meadow': return cropsKnown().map(c => c.id).join(',') + s.bld.compost;
    default: return '';
  }
}

/* ---------- 龙巢 ---------- */
function bldButton(b) {
  const s = G.s;
  return button({
    label: () => b.max ? L(b) + (bldMaxed(b) ? ' ' + T('built') : '') : L(b) + ' (' + s.bld[b.id] + ')',
    click: e => {
      if (e && e.shiftKey) { for (let i = 0; i < 10 && canBuy(b); i++) buyBuilding(b.id); }
      else buyBuilding(b.id);
    },
    enabled: () => canBuy(b), tip: () => tipBuilding(b) + '<div class="tt-note">' + esc(T('shift_hint')) + '</div>',
    cls: b.id === 'workshop' ? 'special' : '',
    segs: b.max ? [] : [
      { label: T('seg_queue'), click: () => queueAdd('bld', b.id), enabled: () => s.queue.length < QUEUE_MAX, tip: () => tipSimple(T('seg_queue'), T('seg_queue_d')) },
      { label: T('seg_sell'), click: () => { if (confirm(T('confirm_sell_bld', L(b)))) sellBuilding(b.id); }, enabled: () => canSell(b), tip: () => tipSimple(T('seg_sell'), T('seg_sell_d')) }
    ]
  });
}
function buildNest(el) {
  const s = G.s;
  el.appendChild(region(() => tripAway(), r => { if (tripAway()) r.appendChild(note(T('trip_nest'), 'notice')); }));
  const grid = h('div', { class: 'grid' });
  grid.appendChild(button({ label: T('act_coins'), click: gatherCoins, enabled: () => !tripAway(), tip: () => tipSimple(T('act_coins'), T('act_coins_d')) }));
  if (s.flags.firewood) grid.appendChild(button({
    label: T('act_refine'), click: () => refineFirewood(1), enabled: () => refineMax() >= 1 && !tripAway(),
    tip: () => tipSimple(T('act_refine'), T('act_refine_d', REFINE_RATE)) + '<div class="tt-sep"></div>' + costRow(L(RES_MAP.coins), s.res.coins, REFINE_RATE, 'coins'),
    segs: [
      { label: '×10', click: () => refineFirewood(10), enabled: () => refineMax() >= 10 && !tripAway() },
      { label: T('all'), click: () => refineFirewood(refineMax()), enabled: () => refineMax() >= 1 && !tripAway() }
    ]
  }));
  if (marketUnlocked()) {
    grid.appendChild(holdButton({ label: T('market'), work: dt => marketWork(dt), enabled: canMarket, progress: () => s.market.prog, cls: 'special',
      tip: () => tipSimple(T('market'), T('market_d', MARKET_MAX_LV + 1)) + '<div class="tt-sep"></div>' + costRow(L(RES_MAP.quill), s.res.quill, MARKET_COST, 'quill') }));
  }
  el.appendChild(grid);
  if (marketUnlocked()) el.appendChild(liveText('div', () => s.market.last.length ? T('market_last') + s.market.last.map(x => x.item ? L(ITEMS[x.item]) + ' Lv' + ITEMS[x.item].lv : L(RES_MAP[x.res]) + ' ' + fmt(x.n)).join(T('list_sep')) : '', 'line dim small'));
  if (s.tech.firewood_contract) el.appendChild(h('div', { class: 'line' }, checkbox(T('auto_refine'), () => s.shop.autoRefine, v => { s.shop.autoRefine = v; }, () => tipSimple(T('auto_refine'), T('auto_refine_d')))));
  el.appendChild(region(() => s.ui.bldCat + '|' + BUILDINGS.filter(bldVisible).map(b => b.id).join(','), r => {
    const vis = BUILDINGS.filter(bldVisible);
    const fr = h('div', { class: 'filters' });
    BLD_CATS.forEach(c => {
      if (c.id !== 'all' && c.id !== 'avail' && !vis.some(b => b.cat === c.id)) return;
      if (fr.childNodes.length) fr.appendChild(h('span', { class: 'sep', text: '|' }));
      const a = h('a', { class: 'tab' + (s.ui.bldCat === c.id ? ' active' : ''), text: L(c) });
      a.addEventListener('click', () => { s.ui.bldCat = c.id; UI.refreshAll(); });
      fr.appendChild(a);
    });
    r.appendChild(fr);
    const g2 = h('div', { class: 'grid' });
    vis.forEach(b => {
      if (s.ui.bldCat !== 'all' && s.ui.bldCat !== 'avail' && b.cat !== s.ui.bldCat) return;
      const btn = bldButton(b);
      if (s.ui.bldCat === 'avail') onUpdate(() => { btn.style.display = canBuy(b) ? '' : 'none'; });
      g2.appendChild(btn);
    });
    r.appendChild(g2);
  }));
}

/* ---------- 小龙 ---------- */
const CENSUS_PAGE = 24;
function buildDragons(el) {
  const s = G.s;
  el.appendChild(liveText('div', () => T('dr_summary', s.dragons.length, fmt(housing()), idleCount(), s.dragons.filter(d => d.away).length), 'line'));
  const hl = liveText('div', () => T('dr_happy', Math.round(G.happy), Math.round(happyFactor() * 100) + '%'), 'line happy-line');
  hl._tip = tipHappy;
  el.appendChild(hl);
  el.appendChild(note(T('dr_upkeep', fmt(upkeepRate()))));
  if (!s.dragons.length) el.appendChild(note(T('dr_none')));

  el.appendChild(section(T('dr_manage')));
  const mg = h('div', { class: 'grid' });
  mg.appendChild(button({ label: T('feed_all'), click: feedAll, enabled: () => canFeedAny() && s.dragons.some(d => !d.away && d.fed <= 5), tip: () => tipSimple(T('feed_all'), T('feed_all_d')) }));
  mg.appendChild(button({ label: T('optimize'), click: optimizeJobs, enabled: () => s.dragons.some(d => d.job), tip: () => tipSimple(T('optimize'), T('optimize_d')) }));
  mg.appendChild(button({ label: T('unassign_all'), click: unassignAll, enabled: () => s.dragons.some(d => d.job && !d.away), tip: () => tipSimple(T('unassign_all'), T('unassign_all_d')) }));
  if (s.tech.tea_party) mg.appendChild(button({
    label: () => T('hold_party') + (s.party.days > 0 ? ' (+' + Math.round(partyBonus()) + '%  ' + Math.ceil(s.party.days) + T('day_unit') + ')' : ''), click: openPartyPanel, enabled: () => canHoldParty(), cls: 'special',
    tip: () => tipSimple(T('hold_party'), T('hold_party_d', PARTY_KINDS, PARTY_ITEMS, PARTY_BONUS, PARTY_DAYS)) + '<div class="tt-sep"></div>' + costRow(L(RES_MAP.coins), s.res.coins, PARTY_COINS, 'coins') +
      (partyRunning() ? '<div class="tt-note">' + esc(T('party_no_extend')) + '</div>' : '')
  }));
  el.appendChild(mg);

  el.appendChild(section(T('dr_jobs')));
  const tbl = h('table', { class: 'jobs' });
  JOBS.forEach(j => {
    if (!j.req(s)) return;
    const out = () => {
      if (j.id === 'clerk') return T('clerk_out', fmt(CLERK_SERVE));
      if (j.id === 'cook') return T('cook_out', fmt(COOK_SPEED));
      if (j.id === 'gardener') return T('gardener_out', fmt(GARDEN_SPEED));
      if (j.id === 'caretaker') return T('caretaker_out', fmt(CARETAKER_HAPPY));
      return Object.keys(j.prod).map(r => costName(r) + ' ' + fmtRate(j.prod[r])).join(T('list_sep'));
    };
    tbl.appendChild(h('tr', { tip: () => tipSimple(L(j), L(j.desc)) + '<div class="tt-sep"></div><div class="tt-eff">' + esc(T('per_dragon') + out()) + '</div><div class="tt-note">' + esc(T('job_note')) + '</div>' },
      h('td', { class: 'jn', text: L(j) }),
      liveText('td', () => String(jobCount(j.id)), 'jc'),
      h('td', { class: 'jb' },
        lbtn('-5', () => unassignJob(j.id, 5), () => jobCount(j.id) > 0),
        lbtn('-', () => unassignJob(j.id, 1), () => jobCount(j.id) > 0),
        lbtn('+', () => assignJob(j.id, 1), () => idleCount() > 0),
        lbtn('+5', () => assignJob(j.id, 5), () => idleCount() > 0)),
      h('td', { class: 'jel' }, j.els.map(elTag)),
      h('td', { class: 'jo dim', text: out() })));
  });
  el.appendChild(tbl);
  el.appendChild(note(T('dr_levels_note', Math.round(ELEMENT_MATCH * 100), Math.round(WELLFED_BONUS * 100))));

  el.appendChild(section(T('dr_census')));
  const c = s.ui.census;
  const jobOpts = [['', T('all_jobs')], ['_idle', T('idle')]].concat(JOBS.filter(j => j.req(s)).map(j => [j.id, L(j)]));
  const elOpts = [['', T('all_elements')]].concat(ELEMENT_KEYS.map(e => [e, L(ELEMENTS[e])]));
  const sortOpts = ['cl', 'gl', 'skill', 'el', 'job', 'name', 'fed'].map(k => [k, T('dsort_' + k)]);
  el.appendChild(h('div', { class: 'line ctrl' },
    select(sortOpts, () => c.sort, v => { c.sort = v; c.page = 0; }), ' ',
    select(jobOpts, () => c.job, v => { c.job = v; c.page = 0; }), ' ',
    select(elOpts, () => c.el, v => { c.el = v; c.page = 0; })));
  el.appendChild(region(() => censusKey(), buildCensus));
}
function censusList() {
  const s = G.s, c = s.ui.census;
  let list = s.dragons.slice();
  if (c.job === '_idle') list = list.filter(d => !d.job);
  else if (c.job) list = list.filter(d => d.job === c.job);
  if (c.el) list = list.filter(d => d.el === c.el);
  const cmp = {
    cl: (a, b) => b.cl - a.cl, gl: (a, b) => b.gl - a.gl,
    skill: (a, b) => ((b.job && b.skills[b.job]) || 0) - ((a.job && a.skills[a.job]) || 0),
    el: (a, b) => ELEMENT_KEYS.indexOf(a.el) - ELEMENT_KEYS.indexOf(b.el) || b.cl - a.cl,
    job: (a, b) => String(a.job).localeCompare(String(b.job)) || b.cl - a.cl,
    name: (a, b) => a.name.localeCompare(b.name), fed: (a, b) => a.fed - b.fed
  }[c.sort] || ((a, b) => b.cl - a.cl);
  list.sort((a, b) => (b.id === s.leader) - (a.id === s.leader) || cmp(a, b));
  return list;
}
function censusKey() {
  const s = G.s, c = s.ui.census;
  return [c.sort, c.job, c.el, c.page, s.leader].join('|') + '|' +
    s.dragons.map(d => [d.id, d.name, d.job, d.away, d.cl, d.gl, d.el, d.lock, d.job ? skillTier(d.skills[d.job] || 0) : 0, d.fed > 0].join(':')).join(',');
}
function buildCensus(r) {
  const s = G.s, c = s.ui.census;
  const list = censusList();
  const pages = Math.max(1, Math.ceil(list.length / CENSUS_PAGE));
  if (c.page >= pages) c.page = pages - 1;
  if (pages > 1) {
    r.appendChild(h('div', { class: 'line' }, lbtn('‹', () => { c.page = Math.max(0, c.page - 1); }, () => c.page > 0), ' ',
      h('span', { text: T('page_n', c.page + 1, pages, list.length) }), ' ', lbtn('›', () => { c.page = Math.min(pages - 1, c.page + 1); }, () => c.page < pages - 1)));
  }
  if (!list.length) { r.appendChild(note(T('no_match'))); return; }
  const jobOpts = [['', T('idle')]].concat(JOBS.filter(j => j.req(s)).map(j => [j.id, L(j)]));
  list.slice(c.page * CENSUS_PAGE, (c.page + 1) * CENSUS_PAGE).forEach(d => r.appendChild(dragonCard(d, jobOpts)));
}
function dragonCard(d, jobOpts) {
  const s = G.s, isLeader = s.leader === d.id;
  const card = h('div', { class: 'dcard' + (isLeader ? ' leader' : '') + (d.away ? ' away' : '') });
  const star = h('a', { class: 'star' + (d.lock ? ' on' : ''), text: d.lock ? '★' : '☆', tip: () => tipSimple(T('lock'), T('lock_d')) });
  star.addEventListener('click', act(() => toggleLock(d.id)));
  card.appendChild(h('div', { class: 'dc-top' }, star,
    h('b', { class: 'dc-name', text: d.name }), isLeader ? h('span', { class: 'badge', text: T('leader_badge') }) : null,
    elTag(d.el), h('span', { class: 'dim', text: T('cl_short') + ' ' + d.cl + '  ' + T('gl_short') + ' ' + d.gl }),
    d.away ? h('span', { class: 'dim', text: T('away') }) : null,
    liveText('span', () => d.fed > 0 ? T('fed_days', Math.ceil(d.fed)) : T('hungry'), d.fed > 0 ? 'fed' : 'dim'),
    h('span', { class: 'dim small', tip: () => tipFood(d.fav), text: T('fav_food', L(RES_MAP[d.fav])) })));
  const jsel = select(jobOpts, () => d.job || '', v => setDragonJob(d.id, v));
  if (d.away) jsel.disabled = true;
  const line2 = h('div', { class: 'dc-job' }, jsel);
  if (d.job) {
    const xp = () => d.skills[d.job] || 0;
    line2.appendChild(liveText('span', () => L(SKILL_TIERS[skillTier(xp())]) + ' ' + Math.floor(skillProgress(xp()) * 100) + '%', 'skill'));
    line2.appendChild(bar(() => skillProgress(xp()), 'thin'));
    line2.appendChild(liveText('span', () => T('eff_x', fmt(dragonEff(d, d.job), 2)), 'dim small'));
    if (elMatch(d, d.job)) line2.appendChild(h('span', { class: 'match', text: T('el_match') }));
  }
  const others = Object.keys(d.skills).filter(k => k !== d.job && d.skills[k] >= 1 && JOB_MAP[k])
    .sort((a, b) => d.skills[b] - d.skills[a]).slice(0, 3);
  if (others.length) line2.appendChild(h('span', { class: 'dim small' }, others.map(k => L(JOB_MAP[k]) + ' ' + L(SKILL_TIERS[skillTier(d.skills[k])])).join(T('list_sep'))));
  card.appendChild(line2);
  card.appendChild(h('div', { class: 'dc-act' },
    lbtn(T('feed'), () => feedDragon(d.id), () => !!feedChoice(d), () => tipSimple(T('feed'), T('feed_d'))), ' ',
    lbtn(T('rename'), () => openModal(T('rename_t', d.name), d.name, false, v => { renameDragon(d.id, v); return true; }, true)), ' ',
    lbtn(isLeader ? T('unset_leader') : T('set_leader'), () => setLeader(d.id), null, () => tipSimple(T('set_leader'), T('leader_d', effLines(LEADER_BONUS[d.el]).join(T('list_sep'))))), ' ',
    lbtn(T('release'), () => { if (confirm(T('confirm_release', d.name))) releaseDragon(d.id); }, () => canRelease(d), () => tipSimple(T('release'), T('release_d')))));
  return card;
}

/* ---------- 研究 ---------- */
function buildResearch(el) {
  const s = G.s;
  const avail = TECHS.filter(techVisible);
  if (!avail.length) el.appendChild(note(T('rs_none')));
  const grid = h('div', { class: 'grid' });
  avail.forEach(t => grid.appendChild(button({
    label: L(t), click: () => research(t.id), enabled: () => canAfford(t.cost), tip: () => tipTech(t),
    segs: [{ label: T('seg_queue'), click: () => queueAdd('tech', t.id), enabled: () => s.queue.length < QUEUE_MAX && !s.queue.some(q => q.id === t.id), tip: () => tipSimple(T('seg_queue'), T('seg_queue_d')) }]
  })));
  el.appendChild(grid);
  const done = TECHS.filter(t => s.tech[t.id]);
  if (done.length) {
    el.appendChild(h('div', { class: 'line' }, lbtn(T(s.ui.showDoneTech ? 'rs_hide_done' : 'rs_show_done', done.length), () => { s.ui.showDoneTech = !s.ui.showDoneTech; })));
    if (s.ui.showDoneTech) el.appendChild(h('div', { class: 'done-list' }, done.map(t => h('span', { class: 'done-t', tip: () => tipSimple(L(t), L(t.desc)) + effHtml(t.eff), text: L(t) }))));
  }
}

/* ---------- 工坊 ---------- */
function buildWorkshop(el) {
  const s = G.s;
  el.appendChild(region(() => tripAway(), r => { if (tripAway()) r.appendChild(liveText('div', () => T('trip_away', L(s.trip.place), Math.ceil(s.trip.away)), 'notice')); }));

  el.appendChild(section(T('ws_business')));
  if (!goodsUnlocked().length) el.appendChild(note(T('ws_need_roasting')));
  else {
    el.appendChild(liveText('div', () => T('ws_queue', fmt(s.shop.queue, 1), fmt(queueCap()), fmt(custPerDay(), 2)), 'line'));
    el.appendChild(liveText('div', () => T('ws_stats', s.stats.served, Math.floor(s.shop.lost), s.shop.noStock, fmt(s.res.renown, 1), pct(renownBonus())), 'line dim'));
    el.appendChild(h('div', { class: 'stat-row' }, h('span', { class: 'stat-l', text: T('ws_serving') }), bar(() => s.shop.serveProg, 'serve'),
      liveText('span', () => T('ws_serve_rate', fmt(serveRate(), 2)), 'stat-v')));
    const g1 = h('div', { class: 'grid' });
    g1.appendChild(holdButton({ label: T('ws_serve'), work: dt => manualServeWork(dt), enabled: () => !tripAway() && s.shop.queue >= 1,
      progress: () => s.shop.serveProg, tip: () => tipSimple(T('ws_serve'), T('ws_serve_d')) }));
    if (s.rhasari.joined) g1.appendChild(button({
      label: T('ws_show'), click: caramelShow, enabled: canShow, cls: 'special',
      tip: () => tipSimple(T('ws_show'), T('ws_show_d', fmtQuill(showEarn()))) + '<div class="tt-sep"></div>' +
        costRow(T('customer'), s.shop.queue, 1) + costRow(L(RES_MAP.pudding), s.res.pudding, 1, 'pudding') +
        costRow(L(RES_MAP.sugar), s.res.sugar, 1, 'sugar') + costRow(T('flame'), s.rhasari.flame, 1)
    }));
    el.appendChild(g1);
    el.appendChild(h('div', { class: 'line ctrl', tip: () => tipSimple(T('pay_in'), T('pay_d', COIN_PER_COPPER)) }, T('pay_in') + T('colon'),
      select([['quill', T('pay_quill')], ['coins', T('pay_coins')]], () => s.shop.payIn, v => { s.shop.payIn = v; })));
  }

  if (FOODS.some(f => foodUnlocked(f, s))) {
    el.appendChild(section(T('ws_menu')));
    el.appendChild(note(T('ws_menu_d')));
    el.appendChild(liveText('div', () => T('ws_cooks', fmt(workForce('cook') * COOK_SPEED, 2)), 'line dim'));
    el.appendChild(h('div', { class: 'stat-row' },
      liveText('span', () => s.kitchen.task ? T('ws_cook_now', L(FOOD_MAP[s.kitchen.task.id])) : T('ws_cook_idle'), 'stat-l wide'),
      bar(() => s.kitchen.task ? s.kitchen.task.prog : 0, 'cook')));
    el.appendChild(region(() => s.ui.menuView, r => {
      const mv = h('div', { class: 'filters' });
      [['goods', T('menu_goods')], ['proc', T('menu_proc')], ['stations', T('menu_stations')]].forEach(([id, lab], i) => {
        if (i) mv.appendChild(h('span', { class: 'sep', text: '|' }));
        const a = h('a', { class: 'tab' + (s.ui.menuView === id ? ' active' : ''), text: lab });
        a.addEventListener('click', () => { s.ui.menuView = id; UI.refreshAll(); });
        mv.appendChild(a);
      });
      r.appendChild(mv);
    }));
    el.appendChild(region(() => s.ui.menuView + '|' + FOODS.filter(f => foodUnlocked(f, s)).map(f => f.id).join(',') + '|' + s.bld.snackshelf + BUILDINGS.filter(b => b.cat === 'kitchen' && bldVisible(b)).length, buildMenu));
  }

  if (windowUnlocked()) {
    el.appendChild(section(T('ws_win')));
    el.appendChild(liveText('div', () => T('ws_win_d', pctAbs(windowChance())), 'note'));
    el.appendChild(region(() => windowSlots() + '|' + s.shop.window.map(x => x.id).join(',') + '|' + FOODS.filter(f => f.kind === 'proc' && foodUnlocked(f, s)).length, buildWindow));
  }

  el.appendChild(section('Rhasari'));
  if (s.rhasari.joined) {
    const r = s.rhasari;
    el.appendChild(h('div', { class: 'stat-row' }, h('span', { class: 'stat-l', text: T('flame') }), bar(() => r.flame / flameMax(), 'flame'),
      liveText('span', () => fmt(r.flame, 1) + ' / ' + fmt(flameMax()), 'stat-v')));
    el.appendChild(h('div', { class: 'stat-row' }, h('span', { class: 'stat-l', text: T('mood') }), bar(() => r.mood / 100, 'mood'),
      liveText('span', () => Math.floor(r.mood) + ' ' + L(moodWord(r.mood)), 'stat-v')));
    const g3 = h('div', { class: 'grid' });
    g3.appendChild(button({ label: T('rh_feed_pudding'), click: () => feedRhasari('pudding'), enabled: () => s.res.pudding >= 1, tip: () => tipSimple(T('rh_feed_pudding'), T('rh_feed_d', fmt(moodGain(10), 1))) }));
    g3.appendChild(button({ label: T('rh_feed_caramel'), click: () => feedRhasari('caramel'), enabled: () => s.res.caramel >= 1, tip: () => tipSimple(T('rh_feed_caramel'), T('rh_feed_d', fmt(moodGain(20), 1))) }));
    g3.appendChild(button({
      label: () => r.insultCd > 0 ? T('rh_insult') + ' (' + Math.ceil(r.insultCd) + 's)' : T('rh_insult'),
      click: insultRhasari, enabled: () => r.insultCd <= 0, tip: () => tipSimple(T('rh_insult'), T('rh_insult_d'))
    }));
    el.appendChild(g3);
    el.appendChild(note(T('rh_note')));
  } else if (foodUnlocked(FOOD_MAP.pudding, s)) {
    el.appendChild(note(L(TXT.story.rhasariHint)));
    const g4 = h('div', { class: 'grid' });
    g4.appendChild(button({ label: T('rh_recruit'), click: recruitRhasari, enabled: canRecruitRhasari, cls: 'special',
      tip: () => tipSimple(T('rh_recruit'), T('rh_recruit_d')) + '<div class="tt-sep"></div>' + costHtml({ pudding: 3 }) }));
    el.appendChild(g4);
  } else el.appendChild(note(T('rh_unknown')));

  el.appendChild(section(T('ws_window')));
  el.appendChild(h('div', { class: 'line' }, checkbox(T('ws_snack'), () => s.shop.snack, v => { s.shop.snack = v; })));
  el.appendChild(liveText('div', () => {
    const l = s.raku.last;
    if (!l) return T('raku_never');
    return T('raku_last', L(MONTHS[l.m]), l.intel, l.snack ? T('raku_fed') : T('raku_unfed'));
  }, 'note'));

  if (s.rhasari.joined) {
    el.appendChild(section('Lysari'));
    el.appendChild(note(T('lysari_note')));
    el.appendChild(liveText('div', () => T('lysari_stat', s.lysari.visits) + (s.lysari.rain > 0 ? T('list_sep') + T('lysari_rain_left', Math.ceil(s.lysari.rain)) : ''), 'line dim'));
  }

  if (displaySlots() > 0) {
    el.appendChild(section(T('ws_display')));
    el.appendChild(liveText('div', () => T('ws_display_d', pctAbs(displayChance())), 'note'));
    el.appendChild(region(() => displaySlots() + '|' + s.shop.display.map(x => x.id + ':' + x.n).join(',') + '|' + G.invVer, r => {
      const t = h('table', { class: 'tbl' });
      s.shop.display.forEach(sl => {
        const it = ITEMS[sl.id];
        t.appendChild(h('tr', { tip: () => tipItem(sl.id) }, h('td', { style: rarityStyle(it.r), text: L(it) }), h('td', { text: '×' + sl.n }),
          h('td', { class: 'dim', text: fmtQuill(itemValue(sl.id)) + ' ' + T('each') }), h('td', null, lbtn(T('take_back'), () => takeFromDisplay(sl.id)))));
      });
      for (let i = s.shop.display.length; i < displaySlots(); i++) t.appendChild(h('tr', null, h('td', { class: 'dim', colspan: 4, text: T('empty_slot') })));
      r.appendChild(h('div', { class: 'tbl-wrap' }, t));
      const avail = Object.keys(s.inv).filter(id => id !== 'impurity').map(id => ITEMS[id]).sort((a, b) => itemValue(b.id) - itemValue(a.id));
      if (avail.length) {
        const sel = h('select', { class: 'sel' }, avail.map(it => h('option', { value: it.id, text: L(it) + ' ×' + s.inv[it.id] + ' (' + fmtQuill(itemValue(it.id)) + ')' })));
        r.appendChild(h('div', { class: 'line' }, sel, ' ', lbtn(T('put_one'), () => putOnDisplay(sel.value, 1)), ' ', lbtn(T('put_all'), () => putOnDisplay(sel.value, s.inv[sel.value] || 0))));
      }
    }));
  }

  if (s.tech.wanderlust) {
    el.appendChild(section(T('ws_trip')));
    el.appendChild(note(T('trip_d')));
    el.appendChild(liveText('div', () => T('trip_stat', s.trip.memories, pct(MEMORY_EFF['mult.coins'] * s.trip.memories), pct(MEMORY_EFF.custMult * s.trip.memories), pct(MEMORY_EFF.itemValue * s.trip.memories)), 'line'));
    const g5 = h('div', { class: 'grid' });
    g5.appendChild(button({ label: T('trip_go'), click: startTrip, enabled: canTrip,
      tip: () => tipSimple(T('trip_go'), T('trip_go_d')) + '<div class="tt-sep"></div>' + costRow(T('all_coins'), s.res.coins, tripCost(), 'coins') +
        costRow(T('trip_quill'), s.res.quill, tripQuill(), 'quill') }));
    el.appendChild(g5);
  }
}
/* 橱窗的陈列位与上架 */
function buildWindow(r) {
  const s = G.s;
  const t = h('table', { class: 'tbl' });
  s.shop.window.forEach(sl => {
    const f = FOOD_MAP[sl.id];
    t.appendChild(h('tr', { tip: () => tipFood(sl.id) },
      h('td', { text: L(f) }), liveText('td', () => '×' + sl.n, 'num'),
      h('td', { class: 'dim', text: fmtQuill(windowPrice(sl.id)) + ' ' + T('each') }),
      h('td', null, checkbox(T('win_auto'), () => !!sl.auto, v => setWindowAuto(sl.id, v))),
      h('td', null, lbtn(T('take_back'), () => takeFromWindow(sl.id)))));
  });
  for (let i = s.shop.window.length; i < windowSlots(); i++) t.appendChild(h('tr', null, h('td', { class: 'dim', colspan: 5, text: T('win_empty') })));
  r.appendChild(h('div', { class: 'tbl-wrap' }, t));
  const procs = FOODS.filter(f => f.kind === 'proc' && foodUnlocked(f, s));
  if (!procs.length) { r.appendChild(note(T('win_none'))); return; }
  if (!procs.find(f => f.id === UI.winSel)) UI.winSel = procs[0].id;
  const sel = select(procs.map(f => [f.id, L(f) + ' (' + fmtQuill(windowPrice(f.id)) + ')']), () => UI.winSel, v => { UI.winSel = v; });
  onUpdate(() => {
    for (const o of sel.options) {
      const txt = L(FOOD_MAP[o.value]) + ' ×' + Math.floor(s.res[o.value] || 0) + ' (' + fmtQuill(windowPrice(o.value)) + ')';
      if (o.textContent !== txt) o.textContent = txt;
    }
  });
  r.appendChild(h('div', { class: 'line ctrl' }, sel, ' ', lbtn(T('win_put'), () => putInWindow(UI.winSel, 1), () => canPutInWindow(UI.winSel)), ' ',
    lbtn(T('win_put5'), () => putInWindow(UI.winSel, 5), () => canPutInWindow(UI.winSel))));
}
function buildMenu(r) {
  const s = G.s, view = s.ui.menuView;
  if (view === 'stations') {
    r.appendChild(note(T('stations_d')));
    const g = h('div', { class: 'grid' });
    BUILDINGS.filter(b => b.cat === 'kitchen' && bldVisible(b)).forEach(b => g.appendChild(bldButton(b)));
    r.appendChild(g);
    if (!g.childNodes.length) r.appendChild(note(T('no_match')));
    return;
  }
  const list = FOODS.filter(f => foodUnlocked(f, s) && (view === 'proc' ? f.kind === 'proc' : f.kind !== 'proc'));
  if (!list.length) { r.appendChild(note(view === 'proc' ? T('no_proc') : T('no_match'))); return; }
  const isGoods = view !== 'proc';
  const heads = ['m_pri', 'm_name', 'm_stock', 'm_price', isGoods ? 'm_demand' : null, 'm_target', 'm_make', isGoods ? 'm_sale' : null, isGoods && s.bld.snackshelf ? 'm_snack' : null].filter(Boolean);
  r.appendChild(liveText('div', () => {
    const pf = priorityFood();
    return pf ? T('pri_now', L(pf), Math.floor(s.res[pf.id] || 0), foodTarget(pf.id)) : T('pri_none');
  }, 'line dim'));
  const t = h('table', { class: 'tbl menu' });
  t.appendChild(h('tr', null, heads.map(k => h('th', { text: T(k), tip: () => tipSimple(T(k), T(k + '_d')) }))));
  list.forEach(f => {
    const tin = h('input', { class: 'inp num', type: 'number', min: 0, max: 9999, value: foodTarget(f.id) });
    tin.addEventListener('change', () => { setTarget(f.id, +tin.value); UI.refreshAll(); });
    const star = lbtn('☆', () => setPriority(f.id), () => s.kitchen.priority === f.id || canSetPriority(f.id),
      () => tipSimple(T('m_pri'), T('m_pri_d')) + (canSetPriority(f.id) || s.kitchen.priority === f.id ? '' : '<div class="tt-note">' + esc(T('pri_full')) + '</div>'));
    star.classList.add('pri-star');
    onUpdate(() => { const on = s.kitchen.priority === f.id; setText(star, on ? '★' : '☆'); star.classList.toggle('on', on); });
    const row = h('tr', null,
      h('td', null, star),
      h('td', { tip: () => tipFood(f.id) + (blockedByPriority(f.id) ? '<div class="tt-note">' + esc(T('pri_blocked', L(priorityFood()))) + '</div>' : '') }, h('span', { text: L(f) }), h('span', { class: 'dim small', text: ' ' + L(STATIONS[f.st]) })),
      liveText('td', () => fmt(Math.floor(s.res[f.id])) + '/' + fmt(capOf(f.id)), 'num'),
      liveText('td', () => fmtQuill(isGoods ? goodPrice(f.id) : windowPrice(f.id)), 'num'),
      isGoods ? h('td', { class: 'demand' }, bar(() => (demandOf(f.id) - 0.4) / 1.2, 'thin dem'), liveText('span', () => Math.round(demandOf(f.id) * 100) + '%', 'small')) : null,
      h('td', null, tin),
      h('td', { class: 'acts' }, holdButton({ small: true, label: T('m_make'), work: dt => manualCookWork(f.id, dt),
        enabled: () => !tripAway() && canManualCook(f.id), progress: () => manualCookProg(f.id), tip: () => tipSimple(T('m_make'), T('m_make_d')) + '<div class="tt-sep"></div>' + tipFood(f.id) })),
      isGoods ? h('td', null, checkbox('', () => s.shop.sale[f.id] !== false, v => { s.shop.sale[f.id] = v; })) : null,
      isGoods && s.bld.snackshelf ? h('td', null, checkbox('', () => !!s.shop.staffSnack[f.id], v => { s.shop.staffSnack[f.id] = v; })) : null);
    onUpdate(() => row.classList.toggle('blocked', blockedByPriority(f.id)));
    t.appendChild(row);
  });
  r.appendChild(h('div', { class: 'tbl-wrap' }, t));
}

/* ---------- 草地 ---------- */
function farmTaskText(t) { return T('task_' + t.type, t.plot + 1, t.to); }
function farmTaskProg(t) {
  if (!t) return 0;
  if (t.type === 'harvest' || t.type === 'plant') return t.prog;
  const p = G.s.farm.plots[t.plot];
  return p ? p[t.type === 'water' ? 'water' : 'fert'] / 100 : 0;
}
function farmManualProg(kind) { const m = G.s.farm.manual; return m && m.type === kind ? farmTaskProg(m) : 0; }
function buildMeadow(el) {
  const s = G.s;
  el.appendChild(note(T('farm_d')));
  el.appendChild(liveText('div', () => T('farm_stat', s.farm.plots.length, fmt(workForce('gardener') * GARDEN_SPEED, 2), fmt(eff('waterRegen'), 1), fmt(curMonth().heat, 1)), 'line'));
  el.appendChild(liveText('div', () => curMonth().cold ? T('farm_cold', Math.floor(eff('greenhouse'))) : curMonth().hot ? T('farm_hot') : '', 'line dim'));
  el.appendChild(h('div', { class: 'stat-row' },
    liveText('span', () => s.farm.task ? T('farm_gardener', farmTaskText(s.farm.task)) : T('farm_idle'), 'stat-l wide'),
    bar(() => farmTaskProg(s.farm.task), 'grow')));
  const g = h('div', { class: 'grid' });
  g.appendChild(button({ label: () => T('reclaim') + ' (' + s.farm.plots.length + ')', click: reclaimPlot, enabled: canReclaim, cls: 'special',
    tip: () => tipSimple(T('reclaim'), T('reclaim_d')) + '<div class="tt-sep"></div>' + costHtml(reclaimCost()) }));
  [['harvest', 'harvest_all'], ['plant', 'plant_hold'], ['water', 'water_all'], ['fert', 'fert_all']].forEach(([kind, key]) => {
    g.appendChild(holdButton({ label: T(key), work: dt => manualFarmWork(kind, dt), enabled: () => canManualFarm(kind), progress: () => farmManualProg(kind),
      tip: () => tipSimple(T(key), T(key + '_d')) + (kind === 'fert' ? '<div class="tt-sep"></div>' + costRow(L(RES_MAP.fertilizer), s.res.fertilizer, FERT_PER_POINT, 'fertilizer') : '') +
        '<div class="tt-note">' + esc(T('hold_hint')) + '</div>' }));
  });
  if (s.bld.compost) g.appendChild(button({ label: T('compost_imp'), click: compostImpurities, enabled: () => (s.inv.impurity || 0) > 0, tip: () => tipSimple(T('compost_imp'), T('compost_imp_d')) }));
  el.appendChild(g);
  const known = cropsKnown();
  const planOpts = [['', T('no_plan')]].concat(known.map(c => [c.id, L(c)]));
  let allSel = '';
  el.appendChild(h('div', { class: 'line ctrl' }, T('plant_all') + ' ', select(planOpts, () => allSel, v => { allSel = v; }), ' ',
    lbtn(T('apply'), () => plantAll(allSel)), '  ', checkbox(T('auto_fert'), () => s.farm.autoFert, v => { s.farm.autoFert = v; })));

  el.appendChild(section(T('farm_plots')));
  el.appendChild(region(() => s.farm.plots.length + '|' + s.farm.plots.map(p => (p.crop || '') + ':' + (p.plan || '')).join(','), r => {
    if (!s.farm.plots.length) { r.appendChild(note(T('no_plots'))); return; }
    const t = h('table', { class: 'tbl plots' });
    t.appendChild(h('tr', null, ['p_no', 'p_plan', 'p_crop', 'p_grow', 'p_water', 'p_fert', 'p_act'].map(k => h('th', { text: T(k) }))));
    s.farm.plots.forEach((p, i) => {
      const tr = h('tr', null,
        h('td', { class: 'dim', text: String(i + 1) + (greenhouseCovered(i) ? ' ' + T('gh_mark') : '') }),
        h('td', null, select(planOpts, () => p.plan || '', v => setPlan(i, v))),
        h('td', { class: p.crop ? '' : 'dim' }, liveText('span', () => p.crop ? L(CROP_MAP[p.crop]) + (plotRipe(p) ? ' ' + T('ripe') : '') : T('empty_plot')),
          liveText('span', () => p.crop && hateFactor(CROP_MAP[p.crop], i) < 1 ? ' ' + T('hate_now') : '', 'hate small')),
        h('td', { tip: () => plotTip(p, i) }, bar(() => p.prog, 'thin grow'), liveText('span', () => p.crop ? (plotRipe(p) ? T('ripe') : growEta(p, i)) : '', 'small dim')),
        h('td', { tip: () => tipSimple(T('p_water'), T('water_d')) }, bar(() => p.water / 100, 'thin water'), liveText('span', () => Math.round(p.water), 'small dim')),
        h('td', { tip: () => tipSimple(T('p_fert'), T('fert_d')) }, bar(() => p.fert / 100, 'thin fert'), liveText('span', () => Math.round(p.fert), 'small dim')),
        h('td', { class: 'acts' }, lbtn(T('uproot'), () => clearPlot(i), () => !!p.crop && !plotRipe(p))));
      onUpdate(() => {
        const busy = (s.farm.task && s.farm.task.plot === i) || (s.farm.manual && s.farm.manual.plot === i && !!UI.hold);
        tr.classList.toggle('working', !!busy);
      });
      t.appendChild(tr);
    });
    r.appendChild(h('div', { class: 'tbl-wrap' }, t));
  }));

  el.appendChild(section(T('farm_bld')));
  el.appendChild(region(() => BUILDINGS.filter(b => b.cat === 'farm' && bldVisible(b)).map(b => b.id).join(','), r => {
    const g2 = h('div', { class: 'grid' });
    BUILDINGS.filter(b => b.cat === 'farm' && bldVisible(b)).forEach(b => g2.appendChild(bldButton(b)));
    r.appendChild(g2);
  }));

  el.appendChild(section(T('crop_guide')));
  el.appendChild(region(() => monthIdx() + '|' + cropsKnown().map(c => c.id).join(','), buildCropGuide));
}
/* 作物图鉴：喜欢与讨厌的月份里，当前月份用颜色标出 */
function monthList(list, cls) {
  const cur = monthIdx(), out = [];
  list.forEach((m, j) => {
    if (j) out.push(T('list_sep'));
    out.push(h('span', { class: m === cur ? 'cur-month ' + cls : '', text: L(MONTHS[m]) }));
  });
  return out;
}
function buildCropGuide(r) {
  const s = G.s;
  r.appendChild(note(T('crop_guide_d', L(curMonth()))));
  const t2 = h('table', { class: 'tbl' });
  t2.appendChild(h('tr', null, ['c_crop', 'c_out', 'c_days', 'c_yield', 'c_seed', 'c_pref', 'c_hate'].map(k => h('th', { text: T(k) }))));
  CROPS.forEach(c => {
    const k = cropKnown(c, s);
    const how = k ? T('known') : c.tech ? T('need_tech', L(TECH_MAP[c.tech])) : T('need_trade', L(TRADE_PARTNERS.find(p => p.gives.some(g => g.seed === c.id))));
    t2.appendChild(h('tr', { class: k ? '' : 'dim', tip: () => tipSimple(L(c), L(c.desc)) + '<div class="tt-note">' + esc(how) + '</div>' },
      h('td', { text: L(c) }), h('td', { text: L(RES_MAP[c.res]) }), h('td', { text: String(c.days) }), h('td', { text: String(c.yld) }),
      h('td', { text: String(c.seed) }), h('td', { class: 'small' }, monthList(c.pref, 'like')), h('td', { class: 'small' }, monthList(c.hate || [], 'hate'))));
  });
  r.appendChild(h('div', { class: 'tbl-wrap' }, t2));
}
function growEta(p, i) {
  const g = growthPerDay(p, i);
  if (g <= 0) return '';
  return Math.round(p.prog * 100) + '%  ' + fmtTime((1 - p.prog) / g * DAY_SEC);
}
function plotTip(p, i) {
  if (!p.crop) return tipSimple(T('empty_plot'), T('empty_plot_d'));
  const c = CROP_MAP[p.crop];
  return tipSimple(L(c), L(c.desc)) + '<div class="tt-sep"></div>' +
    ttRow(T('f_season'), 'x' + fmt(seasonFactor(c, i), 2)) + ttRow(T('f_water'), 'x' + fmt(waterFactor(p.water), 2)) +
    ttRow(T('f_fert'), 'x' + fmt(fertFactor(p.fert), 2)) + ttRow(T('f_bonus'), pct(eff('farmGrowth'))) +
    (hateFactor(c, i) < 1 ? ttRow(T('f_hate'), 'x' + fmt(hateFactor(c, i), 2), 'lack') : '') +
    ttRow(T('f_yield'), '~' + fmt(expectedYield(p, i), 1) + ' ' + L(RES_MAP[c.res]));
}

/* ---------- 派遣 ---------- */
function buildExpedition(el) {
  const s = G.s;
  el.appendChild(liveText('div', () => T('ex_slots', s.disp.active.length, dispSlots(), pct(dispSpeed() - 1)), 'line'));
  if (!dispSlots()) el.appendChild(note(T('ex_need_station')));
  el.appendChild(region(() => homeDragons().map(d => d.id + ':' + d.cl).join(',') + '|' + Object.keys(s.disp.unlocked).join(','), r => {
    const home = homeDragons().sort((a, b) => b.cl - a.cl);
    const dests = DESTS.filter(d => s.disp.unlocked[d.id] && destVisible(d));
    if (!home.find(d => d.id === s.disp.selDragon)) s.disp.selDragon = home.length ? home[0].id : null;
    if (!dests.find(d => d.id === s.disp.selDest)) s.disp.selDest = dests.length ? dests[0].id : null;
    if (!home.length) { r.appendChild(note(T('ex_no_dragon'))); return; }
    const selD = select(home.map(d => [d.id, d.name + '  ' + L(ELEMENTS[d.el]) + '  ' + T('cl_short') + ' ' + d.cl + '  ' + (d.job ? L(JOB_MAP[d.job]) : T('idle'))]), () => s.disp.selDragon, v => { s.disp.selDragon = +v; });
    const selT = select(dests.map(d => [d.id, L(d) + '  ' + T('rec_cl', d.rec) + '  ' + T('n_days', d.days) + '  ' + T('ex_cost', fmtQuill(destCost(d)))]), () => s.disp.selDest, v => { s.disp.selDest = v; });
    r.appendChild(h('div', { class: 'form-row' }, h('span', { class: 'fl', text: T('ex_dragon') }), selD));
    r.appendChild(h('div', { class: 'form-row' }, h('span', { class: 'fl', text: T('ex_dest') }), selT));
    r.appendChild(liveText('div', () => {
      const d = s.dragons.find(x => x.id === s.disp.selDragon), dest = DEST_MAP[s.disp.selDest];
      if (!d || !dest) return '';
      const pv = lootPreview(d.cl, dest);
      return T('ex_preview', pv.types, Math.round(pv.lvMean), pv.lvMax, pctAbs(pv.inj), fmt(dest.days / dispSpeed(), 1));
    }, 'note'));
    const g = h('div', { class: 'grid' });
    g.appendChild(button({ label: T('ex_go'), click: () => dispatch(s.disp.selDragon, s.disp.selDest), enabled: () => canDispatch(s.disp.selDragon, s.disp.selDest),
      tip: () => tipSimple(T('ex_go'), T('ex_go_d')) + (DEST_MAP[s.disp.selDest] ? '<div class="tt-sep"></div>' + costRow(L(RES_MAP.quill), s.res.quill, destCost(DEST_MAP[s.disp.selDest]), 'quill') : '') }));
    r.appendChild(g);
  }));
  el.appendChild(region(() => s.disp.active.map(a => a.dragon).join(','), r => {
    if (!s.disp.active.length) return;
    r.appendChild(section(T('ex_active')));
    s.disp.active.forEach(a => {
      const d = s.dragons.find(x => x.id === a.dragon);
      r.appendChild(h('div', { class: 'stat-row' }, h('span', { class: 'stat-l wide', text: (d ? d.name : '?') + ' → ' + L(DEST_MAP[a.dest]) }),
        bar(() => 1 - a.left / a.total), liveText('span', () => T('n_days_left', Math.max(0, Math.ceil(a.left / dispSpeed()))), 'stat-v')));
    });
  }));
  el.appendChild(section(T('ex_dests')));
  el.appendChild(region(() => Object.keys(s.disp.unlocked).join(',') + '|' + DESTS.filter(destVisible).length, r => {
    const t = h('table', { class: 'tbl dests' });
    t.appendChild(h('tr', null, ['ex_h_name', 'ex_h_area', 'ex_h_rec', 'ex_h_days', 'ex_h_el', 'ex_h_state'].map(k => h('th', { text: T(k) }))));
    DESTS.forEach(d => {
      if (!destVisible(d)) {
        if (s.tech.courier && d.tier >= 3) t.appendChild(h('tr', { class: 'dim' }, h('td', { text: '？？？' }), h('td', { colspan: 5, text: T('ex_hidden', L(destHint(d))) })));
        return;
      }
      const els = Object.keys(d.el).sort((a, b) => d.el[b] - d.el[a]);
      t.appendChild(h('tr', { tip: () => tipSimple(L(d), L(d.desc)) },
        h('td', { text: L(d) }), h('td', { class: 'dim', text: L(d.area) }), h('td', { text: String(d.rec) }), h('td', { text: String(d.days) }),
        h('td', null, els.slice(0, 3).map(elTag)),
        h('td', null, s.disp.unlocked[d.id] ? h('span', { class: 'dim', text: T('unlocked') }) :
          lbtn(T('ex_unlock', d.intel), () => unlockDest(d.id), () => s.res.intel >= d.intel))));
    });
    r.appendChild(h('div', { class: 'tbl-wrap' }, t));
    r.appendChild(note(T('ex_rules')));
  }));
  el.appendChild(region(() => s.disp.history.length + '|' + (s.disp.history[0] ? s.disp.history[0].name + s.disp.history[0].coins : ''), r => {
    if (!s.disp.history.length) return;
    r.appendChild(section(T('ex_history')));
    s.disp.history.forEach(hh => {
      const lp = lootPair(hh.loot), xp = hh.lux && Object.keys(hh.lux).length ? T('list_sep') + luxPair(hh.lux)[LANG] : '';
      r.appendChild(h('div', { class: 'hist' + (hh.injured ? ' warn' : '') }, h('b', { text: hh.name }), ' → ' + L(DEST_MAP[hh.dest]) + T('colon') + lp[LANG] + xp + T('list_sep') + fmt(hh.coins) + ' ' + L(RES_MAP.coins)));
    });
  }));
}

/* ---------- 炼金 ---------- */
function buildAlchemy(el) {
  const s = G.s;
  el.appendChild(note(T('al_rules')));
  el.appendChild(buildHepta());
  el.appendChild(liveText('div', () => {
    const g = s.alch.guard && s.rhasari.joined, v = phaseMod();
    return T('al_fail') + [1, 2, 3, 4, 5, 6].map(x => 'R' + x + ' ' + pctAbs(failChance(x, g))).join('  ') + '    ' +
      T('al_moon', T('phase_' + moonPhase()) + ' ' + (v > 0 ? '+' : v < 0 ? '-' : '') + pctAbs(v));
  }, 'line dim'));
  if (s.rhasari.joined) el.appendChild(h('div', { class: 'line' }, checkbox(T('al_guard'), () => s.alch.guard, v => { s.alch.guard = v; })));
  const g = h('div', { class: 'grid' });
  g.appendChild(button({ label: T('al_go'), click: startTransmute, enabled: () => canTransmute() && !UI.alchAnim, cls: 'special',
    tip: () => tipSimple(T('al_go'), T('al_go_d')) + '<div class="tt-sep"></div>' + costHtml(alchCost(s.alch.slots)) +
      (s.alch.guard && s.rhasari.joined ? costRow(T('flame'), s.rhasari.flame, 2) : '') }));
  g.appendChild(button({ label: T('al_clear'), click: () => { s.alch.slots = []; }, enabled: () => s.alch.slots.length > 0 && !UI.alchAnim }));
  el.appendChild(g);
  el.appendChild(liveText('div', () => {
    const l = s.alch.last;
    if (!l || (UI.alchAnim && !UI.alchAnim.done)) return '';
    if (l.failed && l.intended) return T('al_almost', L(ITEMS[l.intended]));
    if (l.recipe) return T('al_by_recipe');
    return l.lv ? T('al_rolled', l.lv) : '';
  }, 'line dim center'));
  el.appendChild(section(T('al_materials')));
  const filt = h('input', { class: 'inp', type: 'text', placeholder: T('search') });
  filt.value = UI.alchFilter;
  filt.addEventListener('input', () => { UI.alchFilter = filt.value; });
  const elOpts = [['', T('all_elements')]].concat(Object.keys(ELEMENTS).map(k => [k, L(ELEMENTS[k])]));
  el.appendChild(h('div', { class: 'line ctrl' }, filt, ' ', select(elOpts, () => s.ui.alchEl, v => { s.ui.alchEl = v; }), ' ', sortSelect(() => s.ui.alchSort, v => { s.ui.alchSort = v; })));
  el.appendChild(region(() => [G.invVer, UI.alchFilter, s.ui.alchEl, s.ui.alchSort, s.alch.slots.join(',')].join('|'), r => {
    const list = invList(UI.alchFilter, s.ui.alchEl, s.ui.alchSort);
    if (!list.length) { r.appendChild(note(T('inv_empty'))); return; }
    const t = h('table', { class: 'tbl inv' });
    list.forEach(it => {
      const used = s.alch.slots.filter(x => x === it.id).length;
      const left = (s.inv[it.id] || 0) - used;
      t.appendChild(h('tr', { tip: () => tipItem(it.id) },
        h('td', { style: rarityStyle(it.r), text: L(it) }), h('td', { text: 'Lv ' + it.lv }), h('td', { text: 'R' + it.r }),
        h('td', null, elTag(it.el)), h('td', { text: '×' + left }),
        h('td', null, left > 0 && s.alch.slots.length < 7 ? lbtn(T('al_add'), () => slotAdd(it.id)) : h('span', { class: 'dim', text: T('al_add') }))));
    });
    r.appendChild(h('div', { class: 'tbl-wrap' }, t));
  }));
  el.appendChild(section(T('al_recipes')));
  el.appendChild(region(() => Object.keys(s.recipes).length, r => {
    RECIPES.forEach(rc => {
      const known = s.recipes[rc.id];
      const mats = Object.keys(rc.mats).map(k => (known || s.seen[k] ? L(ITEMS[k]) : '？？？') + ' ×' + rc.mats[k]).join(T('list_sep'));
      r.appendChild(h('div', { class: 'recipe-row' + (known ? '' : ' dim') }, h('b', { text: known ? L(ITEMS[rc.out]) : '？？？' }), T('colon'), known ? mats : L(rc.hint)));
    });
  }));
}
function sortSelect(get, set) {
  return select(['lv', 'r', 'value', 'count', 'name'].map(k => [k, T('sort_' + k)]), get, set);
}
function invList(filter, el, sort) {
  const s = G.s, f = (filter || '').trim().toLowerCase();
  let list = Object.keys(s.inv).filter(id => s.inv[id] > 0).map(id => ITEMS[id]).filter(Boolean);
  if (el) list = list.filter(it => it.el === el);
  if (f) list = list.filter(it => it.zh.toLowerCase().indexOf(f) >= 0 || it.en.toLowerCase().indexOf(f) >= 0);
  const cmp = {
    lv: (a, b) => b.lv - a.lv || b.r - a.r, r: (a, b) => b.r - a.r || b.lv - a.lv,
    value: (a, b) => itemValue(b.id) - itemValue(a.id), count: (a, b) => (s.inv[b.id] || 0) - (s.inv[a.id] || 0),
    name: (a, b) => L(a).localeCompare(L(b))
  }[sort] || ((a, b) => b.lv - a.lv);
  return list.sort(cmp);
}

/* ---------- 贸易 ---------- */
function buildTrade(el) {
  const s = G.s;
  el.appendChild(note(T('trade_d')));
  el.appendChild(region(() => TRADE_PARTNERS.map(p => partnerUnlocked(p) + ':' + !!caravanTo(p)).join(',') + '|' + monthIdx(), r => {
    TRADE_PARTNERS.forEach(p => {
      const card = h('div', { class: 'card trade' });
      card.appendChild(h('div', { class: 'card-t', style: 'color:' + p.color, text: L(p) }));
      card.appendChild(h('div', { class: 'card-d', text: L(p.desc) }));
      if (!partnerUnlocked(p)) {
        card.appendChild(note(T('trade_locked', p.unlockDest.map(d => L(DEST_MAP[d])).join(T('or')))));
        r.appendChild(card);
        return;
      }
      const open = partnerOpen(p), best = p.best.indexOf(monthIdx()) >= 0;
      card.appendChild(h('div', { class: 'line small' + (open ? '' : ' warn') }, open ? (best ? T('trade_best') : T('trade_open')) : T('trade_closed'),
        T('list_sep') + T('trade_best_m', p.best.map(m => L(MONTHS[m])).join(T('list_sep'))) +
        (p.closed.length ? T('list_sep') + T('trade_closed_m', p.closed.map(m => L(MONTHS[m])).join(T('list_sep'))) : '')));
      card.appendChild(h('div', { class: 'stat-row', tip: () => tipSimple(T('relation'), T('relation_d')) }, h('span', { class: 'stat-l', text: T('relation') }), bar(() => (s.trade.rel[p.id] || 0) / 100),
        liveText('span', () => Math.round(s.trade.rel[p.id] || 0) + '  ' + T('trade_mult', pct(tradeMult(p) - 1)), 'stat-v')));
      card.appendChild(h('div', { class: 'line' }, T('tr_wants', T('kind_' + p.wants.kind), p.days, fmtQuill(p.cost.quill)),
        h('span', { class: 'dim small', text: '  ' + T('tr_likes', p.el.map(e => L(ELEMENTS[e])).join(T('list_sep'))) })));
      card.appendChild(h('div', { class: 'line small dim' }, T('trade_gives') + p.gives.map(gv => {
        if (gv.seed) return T('seed_of', L(CROP_MAP[gv.seed])) + (cropKnown(CROP_MAP[gv.seed], s) ? T('got_mark') : '');
        const name = gv.res ? L(RES_MAP[gv.res]) : gv.item ? L(ITEMS[gv.item]) : L(ITEMS[CRYSTAL_OF[gv.crystal]]);
        return name + ' ' + gv.min + '~' + gv.max + (gv.ch != null ? ' (' + pctAbs(gv.ch) + ')' : '');
      }).join(T('list_sep'))));
      const c = caravanTo(p);
      if (c) {
        card.appendChild(h('div', { class: 'stat-row' }, h('span', { class: 'stat-l wide', text: T('tr_on_road', c.dragons.length, c.items) }),
          bar(() => 1 - c.left / c.total), liveText('span', () => T('n_days_left', Math.max(0, Math.ceil(c.left))), 'stat-v')));
      } else {
        card.appendChild(h('div', { class: 'card-b' }, lbtn(T('tr_organize'), () => openTradePanel(p), () => canTrade(p),
          () => tipSimple(T('tr_organize'), T('tr_organize_d', CARAVAN_MIN, CARAVAN_MAX, TRADE_GOODS_MAX)) + '<div class="tt-sep"></div>' + costHtml(p.cost))));
      }
      r.appendChild(card);
    });
  }));
}

/* 商品挑选表：sel 为 { 商品 id: 数量 }，list 为可选的商品，max 为总件数上限（不限时为 Infinity） */
function buildGoodsPicker(r, sel, list, max) {
  const s = G.s;
  const total = () => selStats(sel).items;
  const room = id => Math.max(0, Math.min(Math.floor(s.res[id] || 0), max - (total() - (sel[id] || 0))));
  const setN = (id, n) => { sel[id] = clamp(Math.floor(n) || 0, 0, room(id)); if (!sel[id]) delete sel[id]; };
  if (!list.length) { r.appendChild(note(T('pick_none'))); return; }
  const t = h('table', { class: 'tbl' });
  t.appendChild(h('tr', null, ['inv_h_name', 'm_stock', 'pick_value', 'pick_take', 'inv_h_act'].map(k => h('th', { text: T(k) }))));
  list.forEach(f => {
    const inp = h('input', { class: 'inp num pick-in', type: 'number', min: 0, value: sel[f.id] || 0 });
    inp.addEventListener('change', () => { setN(f.id, +inp.value); inp.value = sel[f.id] || 0; UI.refreshAll(); });
    onUpdate(() => { if (document.activeElement !== inp && +inp.value !== (sel[f.id] || 0)) inp.value = sel[f.id] || 0; });
    t.appendChild(h('tr', { tip: () => tipFood(f.id) },
      h('td', null, h('span', { text: L(f) }), h('span', { class: 'dim small', text: ' ' + T('kind_' + f.kind) })),
      liveText('td', () => fmt(Math.floor(s.res[f.id] || 0)), 'num'),
      h('td', { class: 'num', text: fmtQuill(basePrice(f.id)) }),
      h('td', null, inp),
      h('td', { class: 'acts' }, lbtn('+1', () => setN(f.id, (sel[f.id] || 0) + 1), () => room(f.id) > (sel[f.id] || 0)), ' ',
        lbtn('+10', () => setN(f.id, (sel[f.id] || 0) + 10), () => room(f.id) > (sel[f.id] || 0)), ' ',
        lbtn(T('all'), () => setN(f.id, room(f.id)), () => room(f.id) > (sel[f.id] || 0)), ' ',
        lbtn('0', () => setN(f.id, 0), () => (sel[f.id] || 0) > 0))));
  });
  r.appendChild(h('div', { class: 'tbl-wrap' }, t));
  r.appendChild(h('div', { class: 'line' },
    lbtn(T('pick_spread'), () => {
      for (const k in sel) delete sel[k];
      let added = true;
      while (added && total() < max) {
        added = false;
        list.forEach(f => { if (total() < max && (sel[f.id] || 0) < Math.floor(s.res[f.id] || 0)) { sel[f.id] = (sel[f.id] || 0) + 1; added = true; } });
      }
    }), ' ', lbtn(T('pick_clear'), () => { for (const k in sel) delete sel[k]; })));
}

/* 组织商队的面板 */
function openTradePanel(p) {
  UI.tradeSel = { partner: p.id, goods: {}, dragons: suggestCaravan(p, CARAVAN_BASE) };
  openPanel(T('tr_panel_t', L(p)), () => p.id + '|' + homeDragons().map(d => d.id).join(','), r => buildTradePanel(r, p));
}
function buildTradePanel(r, p) {
  const s = G.s, sel = UI.tradeSel;
  sel.dragons = sel.dragons.filter(id => homeDragons().some(d => d.id === id));
  r.appendChild(note(T('tr_panel_d', TRADE_BASE_KINDS, fmtQuill(TRADE_BASE_VALUE), TRADE_GOODS_MAX)));
  r.appendChild(section(T('tr_goods', T('kind_' + p.wants.kind))));
  buildGoodsPicker(r, sel.goods, GOODS_LIST.filter(f => tradeGoodsOk(p, f.id) && foodUnlocked(f, s) && (s.res[f.id] || 0) >= 1), TRADE_GOODS_MAX);
  r.appendChild(liveText('div', () => {
    const st = selStats(sel.goods);
    return T('tr_goods_sum', st.items, TRADE_GOODS_MAX, st.kinds, fmtQuill(st.value), fmt(goodsMult(st), 2));
  }, 'panel-sum'));

  r.appendChild(section(T('tr_dragons', CARAVAN_MIN, CARAVAN_MAX)));
  const home = homeDragons().slice().sort((a, b) => caravanFit(b, p) - caravanFit(a, p));
  r.appendChild(h('div', { class: 'line' }, T('tr_auto') + ' ',
    [5, 10, 15].map(n => [lbtn(String(n), () => { sel.dragons = suggestCaravan(p, n); }), ' '])));
  const t = h('table', { class: 'tbl' });
  t.appendChild(h('tr', null, ['', 'tr_h_name', 'element', 'gl_short', 'cl_short', 'tr_h_carry'].map(k => h('th', { text: k ? T(k) : '' }))));
  home.forEach(d => {
    t.appendChild(h('tr', null,
      h('td', null, checkbox('', () => sel.dragons.indexOf(d.id) >= 0, v => {
        if (v && sel.dragons.indexOf(d.id) < 0 && sel.dragons.length < CARAVAN_MAX) sel.dragons.push(d.id);
        if (!v) sel.dragons = sel.dragons.filter(x => x !== d.id);
      })),
      h('td', { text: d.name + (d.job ? '  ' + L(JOB_MAP[d.job]) : '') }), h('td', null, elTag(d.el)),
      h('td', { text: String(d.gl) }), h('td', { text: String(d.cl) }),
      h('td', { class: p.el.indexOf(d.el) >= 0 ? 'match' : 'dim', text: '×' + fmt(dragonCarry(d, p), 2) })));
  });
  r.appendChild(h('div', { class: 'tbl-wrap' }, t));
  r.appendChild(liveText('div', () => {
    const cs = caravanStats(p, sel.dragons);
    return T('tr_car_sum', cs.n, CARAVAN_MIN, CARAVAN_MAX, fmt(cs.mult, 2), Math.round(cs.avgCl), pctAbs(cs.lossChance), pctAbs(cs.lossMax));
  }, 'panel-sum'));

  r.appendChild(section(T('tr_result')));
  r.appendChild(liveText('div', () => {
    const m = goodsMult(selStats(sel.goods)) * caravanStats(p, sel.dragons).mult * tradeMult(p);
    return T('tr_total', fmt(m, 2), p.days) + T('colon') + tradePreview(p, m).join(T('list_sep'));
  }, 'line'));
  r.appendChild(h('div', { class: 'line' }, liveText('span', () => {
    const e = caravanProblem(p, sel.goods, sel.dragons);
    return e ? T(e, CARAVAN_MIN, CARAVAN_MAX) : '';
  }, 'warn small')));
  const g = h('div', { class: 'grid' });
  g.appendChild(button({ label: T('tr_go'), cls: 'special', enabled: () => !caravanProblem(p, sel.goods, sel.dragons),
    click: () => { if (sendCaravan(p.id, sel.goods, sel.dragons) && UI.panel) UI.panel.close(); },
    tip: () => tipSimple(T('tr_go'), T('tr_go_d', p.days)) + '<div class="tt-sep"></div>' + costHtml(p.cost) }));
  r.appendChild(g);
}

/* 茶会的面板 */
function openPartyPanel() {
  UI.partySel = {};
  openPanel(T('pt_panel_t'), () => GOODS_LIST.filter(f => foodUnlocked(f, G.s)).length, buildPartyPanel);
}
function buildPartyPanel(r) {
  const s = G.s, sel = UI.partySel;
  r.appendChild(note(T('pt_panel_d', PARTY_KINDS, PARTY_ITEMS, PARTY_BONUS, PARTY_DAYS, PARTY_MIN_KINDS, PARTY_MIN_ITEMS)));
  buildGoodsPicker(r, sel, GOODS_LIST.filter(f => partyGoodsOk(f.id) && foodUnlocked(f, s) && (s.res[f.id] || 0) >= 1), Infinity);
  r.appendChild(liveText('div', () => {
    const pl = partyPlan(sel);
    return T('pt_sum', pl.kinds, pl.items, fmt(pl.bonus, 1), fmt(pl.days, 1));
  }, 'panel-sum'));
  const g = h('div', { class: 'grid' });
  g.appendChild(button({ label: T('pt_go'), cls: 'special', enabled: () => canHoldParty(sel),
    click: () => { if (holdParty(sel) && UI.panel) UI.panel.close(); },
    tip: () => tipSimple(T('pt_go'), partyPlan(sel).ok ? '' : T('pt_min', PARTY_MIN_KINDS, PARTY_MIN_ITEMS)) + '<div class="tt-sep"></div>' + costRow(L(RES_MAP.coins), s.res.coins, PARTY_COINS, 'coins') }));
  r.appendChild(g);
}

/* ---------- 仓库与图鉴 ---------- */
function buildInventory(el) {
  const s = G.s;
  el.appendChild(liveText('div', () => {
    const kinds = Object.keys(s.inv).length, total = Object.values(s.inv).reduce((a, b) => a + b, 0);
    return T('inv_summary', kinds, total, Object.keys(s.seen).length, ITEM_LIST.length);
  }, 'line'));
  el.appendChild(region(() => s.ui.invView + '|' + windowUnlocked(), r => {
    const fr = h('div', { class: 'filters' });
    const views = [['items', T('inv_items')]].concat(windowUnlocked() ? [['proc', T('inv_proc')]] : []).concat([['codex', T('inv_codex')]]);
    views.forEach(([id, lab], i) => {
      if (i) fr.appendChild(h('span', { class: 'sep', text: '|' }));
      const a = h('a', { class: 'tab' + (s.ui.invView === id ? ' active' : ''), text: lab });
      a.addEventListener('click', () => { s.ui.invView = id; UI.refreshAll(); });
      fr.appendChild(a);
    });
    r.appendChild(fr);
  }));
  el.appendChild(region(() => s.ui.invView, r => {
    if (s.ui.invView === 'codex') {
      r.appendChild(note(T('codex_d')));
      r.appendChild(region(() => Object.keys(s.seen).length, rr => {
        for (let lv = 1; lv <= 50; lv++) {
          const row = h('div', { class: 'codex-row' }, h('span', { class: 'codex-lv', text: 'Lv ' + lv }));
          ITEM_LIST.filter(it => it.lv === lv).forEach(it => {
            if (s.seen[it.id]) row.appendChild(h('span', { class: 'codex-i', style: rarityStyle(it.r), tip: () => tipItem(it.id), text: L(it) }));
            else row.appendChild(h('span', { class: 'codex-i dim', tip: () => tipSimple('？？？', 'Lv ' + it.lv + '  Rare ' + it.r) + '<div class="tt-sub">' + esc(T('sources')) + '</div>' + itemSources(it.id).map(x => '<div class="tt-li">' + esc(x) + '</div>').join(''), text: '？？？' }));
          });
          rr.appendChild(row);
        }
      }));
      return;
    }
    if (s.ui.invView === 'proc') {
      r.appendChild(note(T('inv_proc_d')));
      r.appendChild(region(() => FOODS.filter(f => f.kind === 'proc' && foodUnlocked(f, s)).map(f => f.id).join(',') + '|' + windowSlots(), rr => {
        const t = h('table', { class: 'tbl inv' });
        t.appendChild(h('tr', null, ['inv_h_name', 'm_stock', 'inv_h_wp', 'inv_h_act'].map(k => h('th', { text: T(k) }))));
        FOODS.filter(f => f.kind === 'proc' && foodUnlocked(f, s)).forEach(f => {
          t.appendChild(h('tr', { tip: () => tipFood(f.id) },
            h('td', null, h('span', { text: L(f) }), h('span', { class: 'dim small', text: ' ' + L(STATIONS[f.st]) })),
            liveText('td', () => fmt(Math.floor(s.res[f.id] || 0)) + '/' + fmt(capOf(f.id)), 'num'),
            h('td', { class: 'num', text: fmtQuill(windowPrice(f.id)) }),
            h('td', { class: 'acts' }, lbtn(T('to_window') + ' ×1', () => putInWindow(f.id, 1), () => canPutInWindow(f.id)), ' ',
              lbtn('×5', () => putInWindow(f.id, 5), () => canPutInWindow(f.id)))));
        });
        rr.appendChild(h('div', { class: 'tbl-wrap' }, t));
      }));
      return;
    }
    const filt = h('input', { class: 'inp', type: 'text', placeholder: T('search') });
    filt.value = UI.invFilter;
    filt.addEventListener('input', () => { UI.invFilter = filt.value; });
    r.appendChild(h('div', { class: 'line ctrl' }, filt, ' ', sortSelect(() => s.ui.invSort, v => { s.ui.invSort = v; })));
    r.appendChild(note(T('owl_note')));
    r.appendChild(region(() => [G.invVer, UI.invFilter, s.ui.invSort, displaySlots(), s.shop.display.length].join('|'), rr => {
      const list = invList(UI.invFilter, '', s.ui.invSort);
      if (!list.length) { rr.appendChild(note(T('inv_empty'))); return; }
      const t = h('table', { class: 'tbl inv' });
      t.appendChild(h('tr', null, ['inv_h_name', 'inv_h_lv', 'inv_h_r', 'inv_h_el', 'inv_h_cat', 'inv_h_n', 'inv_h_v', 'inv_h_act'].map(k => h('th', { text: T(k) }))));
      const canDisp = displaySlots() > 0;
      list.forEach(it => {
        const n = s.inv[it.id];
        t.appendChild(h('tr', { tip: () => tipItem(it.id) },
          h('td', { style: rarityStyle(it.r), text: L(it) }), h('td', { text: String(it.lv) }), h('td', { text: 'R' + it.r }),
          h('td', null, elTag(it.el)), h('td', { class: 'dim', text: L(CATS[it.cat]) }),
          h('td', { text: String(n) }), h('td', { text: fmtQuill(itemValue(it.id)) }),
          h('td', { class: 'acts' }, lbtn(T('sell_one', fmtQuill(owlPrice(it.id))), () => owlSell(it.id, 1)), ' ',
            lbtn(T('sell_all'), () => { if (n * owlPrice(it.id) < QUILL_GOLD || confirm(T('confirm_sell', L(it), n))) owlSell(it.id, n); }),
            canDisp ? [' ', lbtn(T('to_display'), () => putOnDisplay(it.id, s.inv[it.id] || 0), () => s.shop.display.length < displaySlots() || !!s.shop.display.find(x => x.id === it.id))] : null)));
      });
      rr.appendChild(h('div', { class: 'tbl-wrap' }, t));
    }));
  }));
}

/* ---------- 委托 ---------- */
function buildCommissions(el) {
  const s = G.s;
  el.appendChild(region(() => s.comm.qkey + ':' + s.comm.letter, r => {
    if (s.comm.qkey < 0) return;
    r.appendChild(h('div', { class: 'letter' }, h('div', { class: 'letter-h', text: T('cm_letter') }),
      h('div', { class: 'letter-b', text: L(TXT.ayrelia[s.comm.letter]) }), h('div', { class: 'letter-s', text: 'Ayrelia' })));
  }));
  el.appendChild(liveText('div', () => T('cm_left', Math.ceil(daysLeftInQuarter()), s.comm.done), 'line'));
  el.appendChild(note(T('cm_note')));
  el.appendChild(region(() => s.comm.qkey + '|' + s.comm.list.map(c => c.done).join(','), r => {
    s.comm.list.forEach((c, i) => {
      const tx = commTexts(c);
      const card = h('div', { class: 'card' + (c.done ? ' done' : '') });
      card.appendChild(h('div', { class: 'card-t', text: tx.t[LANG] }));
      card.appendChild(h('div', { class: 'card-d', text: tx.d[LANG] }));
      if (c.type === 'element' || c.type === 'rarity') card.appendChild(note(T('cm_auto_pick')));
      card.appendChild(liveText('div', () => c.done ? T('cm_done') : T('cm_progress', commProgress(c), c.need), 'card-p'));
      card.appendChild(liveText('div', () => T('cm_reward') + rewardPair(commReward(c))[LANG], 'card-r dim'));
      if (!c.done) card.appendChild(h('div', { class: 'card-b' }, lbtn(commIsSubmit(c) ? T('cm_submit') : T('cm_claim'), () => completeComm(i), () => commProgress(c) >= c.need,
        c.type === 'element' || c.type === 'rarity' ? () => {
          const pk = commPickItems(c).picked;
          return tipSimple(T('cm_will_use'), Object.keys(pk).map(id => L(ITEMS[id]) + ' ×' + pk[id]).join(T('list_sep')) || T('nothing'));
        } : null)));
      r.appendChild(card);
    });
  }));
  el.appendChild(section(T('cm_favor')));
  el.appendChild(liveText('div', () => T('cm_favor_have', fmt(s.res.favor)), 'line'));
  el.appendChild(region(() => JSON.stringify(s.comm.ups) + '|' + s.comm.plumeBuys, r => {
    const g = h('div', { class: 'grid' });
    FAVOR_UPS.forEach(f => {
      const mx = favorMax(f), multi = mx > 1 && mx !== Infinity;
      g.appendChild(button({
        label: () => L(f) + (multi ? T('favor_lv', favorLevel(f.id), mx) : '') + (favorDone(f) ? ' ' + T('owned_mark') : ' (' + favorCost(f) + ')'),
        click: () => buyFavor(f.id), enabled: () => canBuyFavor(f),
        tip: () => tipSimple(L(f), L(f.desc)) + effHtml(f.eff) +
          (!favorAvail(f) ? '<div class="tt-note">' + esc(T('favor_need', L(FAVOR_UPS.find(x => x.id === f.need)))) + '</div>' : '') +
          (favorDone(f) ? '' : '<div class="tt-sep"></div>' + costRow(L(RES_MAP.favor), s.res.favor, favorCost(f)))
      }));
    });
    r.appendChild(g);
  }));
}

/* ---------- 记录：成就与统计 ---------- */
function buildRecords(el) {
  const s = G.s;
  el.appendChild(section(T('rec_ach')));
  el.appendChild(region(() => Object.keys(s.ach).length, r => {
    r.appendChild(note(T('ach_count', Object.keys(s.ach).length, ACHIEVEMENTS.length)));
    const g = h('div', { class: 'ach-grid' });
    ACHIEVEMENTS.forEach(a => {
      const done = !!s.ach[a.id];
      g.appendChild(h('div', { class: 'ach' + (done ? ' done' : '') }, h('div', { class: 'ach-t', text: (done ? '★ ' : '☆ ') + L(a) }), h('div', { class: 'ach-d', text: L(a.desc) })));
    });
    r.appendChild(g);
  }));
  el.appendChild(section(T('rec_stats')));
  const rows = [
    ['st_time', () => fmtTime((Date.now() - s.started) / 1000)], ['st_year', () => String(yearNum())],
    ['st_clicks', () => fmt(s.stats.clicks)], ['st_dragons', () => String(s.dragons.length)],
    ['st_arrived', () => fmt(s.stats.arrived || 0)], ['st_served', () => fmt(s.stats.served)],
    ['st_window', () => fmt(s.stats.windowSold || 0)], ['st_quill', () => fmtQuill(s.stats.quillEarned || 0)], ['st_earned', () => fmt(s.stats.coinsEarned)],
    ['st_crafted', () => fmt(s.stats.crafted)], ['st_harvests', () => fmt(s.stats.harvests)],
    ['st_dispatches', () => fmt(s.stats.dispatches)], ['st_alch', () => fmt(s.stats.alch)],
    ['st_trades', () => fmt(s.stats.trades)], ['st_comm', () => fmt(s.comm.done)],
    ['st_parties', () => fmt(s.stats.parties)], ['st_stars', () => fmt(s.stats.stars)],
    ['st_fed', () => fmt(s.stats.fed)], ['st_released', () => fmt(s.stats.released)],
    ['st_insults', () => fmt(s.stats.insults)], ['st_trips', () => fmt(s.trip.count)],
    ['st_codex', () => Object.keys(s.seen).length + ' / ' + ITEM_LIST.length]
  ];
  const t = h('table', { class: 'tbl stats' });
  rows.forEach(([k, fn]) => t.appendChild(h('tr', null, h('td', { text: T(k) }), liveText('td', fn, 'num'))));
  el.appendChild(t);
}

const TAB_BUILD = {
  nest: buildNest, dragons: buildDragons, research: buildResearch, workshop: buildWorkshop, meadow: buildMeadow,
  expedition: buildExpedition, alchemy: buildAlchemy, trade: buildTrade, inventory: buildInventory,
  commissions: buildCommissions, records: buildRecords
};
