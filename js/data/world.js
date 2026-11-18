/* 世界与系统数据：资源、元素、稀有度、月份、职业、建筑、研究、派遣地点、青睐升级、小龙名字
 * 数值骨架参照猫国建设者原版：硬币对应猫薄荷，柴薪对应木材，矿石对应矿物，学识对应科学。
 * 原版按 tick 计算（每秒 5 tick），这里统一换算成每秒。 */

var DAY_SEC = 8;          // 1 游戏日 = 8 现实秒（v0.3 起放慢一倍）
var MONTH_DAYS = 30;      // 1 月 = 30 日，前 15 日为上弦，后 15 日为下弦
var PHASE_DAYS = 15;
var START_MONTH = 1;      // 开局月份：信风月

/* 翎鸾：龙巢的贸易硬通货，相当于原版的黄金。存档里一律按铜翎记，1 金翎 = 12 银翎 = 144 铜翎 */
var QUILL_SILVER = 12, QUILL_GOLD = 144;
var COIN_PER_COPPER = 20;  // 选择收硬币时，每 1 铜翎的货款只换 20 硬币

/* 元素 */
var ELEMENTS = {
  n: { zh: '无', en: 'Neutral', color: '#777' },
  s: { zh: '灼燃', en: 'Scorch', color: '#d2551e' },
  f: { zh: '冰封', en: 'Freeze', color: '#3a8fc4' },
  p: { zh: '麻痹', en: 'Paralyze', color: '#b59a00' },
  d: { zh: '沉沦', en: 'Drown', color: '#2c5aa0' },
  c: { zh: '腐蚀', en: 'Corrode', color: '#5d8a2a' },
  t: { zh: '震颤', en: 'Tremor', color: '#8a5a2b' },
  e: { zh: '侵蚀', en: 'Erode', color: '#7a4a9c' }
};
var ELEMENT_KEYS = ['s', 'f', 'p', 'd', 'c', 't', 'e'];
var CRYSTAL_OF = { s: 'scorch_crystal', f: 'freeze_crystal', p: 'paralyze_crystal', d: 'drown_crystal', c: 'corrode_crystal', t: 'tremor_crystal', e: 'erode_crystal' };

/* 物品类别 */
var CATS = {
  min: { zh: '矿物', en: 'Mineral' },
  flo: { zh: '植物', en: 'Flora' },
  bst: { zh: '兽材', en: 'Beast part' },
  rel: { zh: '旧物', en: 'Relic' },
  cry: { zh: '结晶', en: 'Crystal' },
  pot: { zh: '药剂', en: 'Potion' },
  cha: { zh: '护符', en: 'Charm' },
  con: { zh: '甜品', en: 'Confection' },
  too: { zh: '器具', en: 'Device' },
  cur: { zh: '奇物', en: 'Curio' }
};

/* 稀有度 */
var RARITY = {
  weight: { 1: 60, 2: 30, 3: 15, 4: 8, 5: 4, 6: 2 },
  /* 价值倍率：v0.4.1 起高稀有度更值钱 */
  valueMult: { 1: 1, 2: 1.6, 3: 2.6, 4: 4.5, 5: 8, 6: 15 },
  /* 炼金点数倍率：一件材料提供“等级的立方 × 倍率”点 */
  points: { 1: 0.4, 2: 0.6, 3: 0.9, 4: 1.0, 5: 1.2, 6: 1.5 },
  fail: { 1: 0.35, 2: 0.20, 3: 0.10, 4: 0.05, 5: 0, 6: 0 },
  color: { 1: '#888', 2: '#3f8f3f', 3: '#2f6fb5', 4: '#8a3fb5', 5: '#d07a00', 6: '#c8283c' }
};

/* 炼金加成（v0.4.8）。所有加成之间都是加算。数组下标 0 到 4 对应 3 到 7 件（种） */
var ALCH_EL_BONUS = [0.05, 0.12, 0.20, 0.28, 0.40];    // 同一种元素的材料有 3 到 7 件：额外点数
var ALCH_EL_SWAY = [0.16, 0.24, 0.32, 0.40, 0.50];     // 产物不是放得最多的元素时，改投这种元素的概率
var ALCH_CAT_BONUS = [0.02, 0.07, 0.13, 0.20, 0.28];   // 有 3 到 7 种不同类别的材料：额外点数
/* 火力滑块：0 为最小，50 为中等（不调整），100 为最大，中间线性插值。
 * points 为额外点数，minLv 为最低等级的变化，fail 为失败率的变化（直接加减，Rare 5 与 Rare 6 也会受大火影响） */
var HEAT_LOW = { points: -0.3, minLv: 6, fail: -0.4 };
var HEAT_HIGH = { points: 0.4, minLv: -6, fail: 0.4 };
/* 这些效果在 computeEffects 里取所有来源中的最小值，而不是相加 */
var EFF_MIN = { alchGap: true };

/* 等级与稀有度区间（原设定中 31~37 与 37~41 在 37 级重叠、42 级缺失，此处按 31~36 / 37~42 实现） */
var LEVEL_BANDS = [
  { from: 1, to: 10, rmin: 1, rmax: 3 },
  { from: 11, to: 20, rmin: 1, rmax: 4 },
  { from: 21, to: 30, rmin: 1, rmax: 5 },
  { from: 31, to: 36, rmin: 2, rmax: 6 },
  { from: 37, to: 42, rmin: 3, rmax: 6 },
  { from: 43, to: 46, rmin: 4, rmax: 6 },
  { from: 47, to: 50, rmin: 5, rmax: 6 }
];

/* 资源分组（资源栏中可折叠） */
var RES_GROUPS = [
  { id: 'basic', zh: '基础', en: 'Basics' },
  { id: 'ingredient', zh: '食材', en: 'Ingredients' },
  { id: 'processed', zh: '半成品', en: 'Prepared' },
  { id: 'goods', zh: '商品', en: 'Menu' },
  { id: 'luxury', zh: '贵重品', en: 'Treasures' },
  { id: 'special', zh: '特殊', en: 'Special' }
];

/* 基础资源。食材、半成品、商品由 kitchen.js 追加 */
var RESOURCES = [
  { id: 'coins', zh: '硬币', en: 'Coins', cap: 5000, group: 'basic', unlocked: function (s) { return true; } },
  { id: 'quill', zh: '翎鸾', en: 'Luan Quills', cap: 720, group: 'basic', quill: true, unlocked: function (s) { return s.bld.workshop > 0; } },
  { id: 'firewood', zh: '柴薪', en: 'Firewood', cap: 200, group: 'basic', unlocked: function (s) { return !!s.flags.firewood; } },
  { id: 'ore', zh: '矿石', en: 'Ore', cap: 250, group: 'basic', unlocked: function (s) { return !!s.tech.mining; } },
  { id: 'lore', zh: '学识', en: 'Lore', cap: 0, group: 'basic', unlocked: function (s) { return s.bld.nook > 0; } },
  { id: 'fertilizer', zh: '肥料', en: 'Fertilizer', cap: 100, group: 'basic', unlocked: function (s) { return !!s.tech.agronomy; } },
  { id: 'intel', zh: '情报', en: 'Intel', cap: 50, group: 'special', unlocked: function (s) { return s.bld.workshop > 0; } },
  { id: 'renown', zh: '声望', en: 'Renown', cap: Infinity, group: 'special', unlocked: function (s) { return s.bld.workshop > 0; } },
  { id: 'favor', zh: 'Ayrelia 的青睐', en: 'Ayrelia\'s Favor', cap: Infinity, group: 'special', unlocked: function (s) { return s.comm.everGot; } }
];

/* 火翼双弦历的十二个月。heat 影响草地的水分蒸发 */
var MONTHS = [
  { zh: '蛛痕月', en: 'Fissuary', ab: 'Fis.', heat: 0.6, cold: true,
    desc: { zh: '冬末霜层裂出细密纹路，如蛛丝盘结而得名。此月气温仍低，龙族活动范围收缩，多留居协内。',
      en: 'Late-winter frost cracks into fine lines like spider silk. Still cold; dragons stay close to their districts.' },
    eff: { custMult: 0.1, dispSpeed: -0.15 } },
  { zh: '信风月', en: 'Ventuary', ab: 'Ven.', heat: 0.8,
    desc: { zh: '稳定信风自南向北而起，“信”取其可靠之意。此月风向稳定、通行条件改善，跨协往来与通商逐渐恢复。',
      en: 'Steady trade winds rise from south to north. Travel between districts and trade slowly resume.' },
    eff: { dispSpeed: 0.15, custMult: 0.05, tradeRatio: 0.1 } },
  { zh: '裂土月', en: 'Terrilis', ab: 'Ter.', heat: 1,
    desc: { zh: '冻土消融，地表龟裂重启生机，岚砂协植被开始复苏。此月土壤松动、植被返青，是筑巢与修整栖地的高频期。',
      en: 'Frozen soil thaws and cracks; Lansha turns green again. The busiest season for nest building.' },
    eff: { buildCost: -0.1, farmGrowth: 0.15 } },
  { zh: '鸦羽月', en: 'Corvane', ab: 'Cor.', heat: 1,
    desc: { zh: '候鸟北归，墨色鸦群掠过龙巢上空，是春季物候的重要标志。此月迁徙种群密集，物种活动范围明显扩大。',
      en: 'Migrating birds return north and ink-black ravens sweep over Dragonest. Creatures roam far and wide.' },
    eff: { rakuIntel: 1, dispTypes: 1 } },
  { zh: '星誓月', en: 'Astriel', ab: 'Ast.', heat: 1.1,
    desc: { zh: '夜空最为澄澈的月份，古时龙族多在此月立下重要誓约。此月大气透明度高，夜间星象观测条件最佳。',
      en: 'The clearest night skies of the year. In old times, dragons swore their oaths in this month.' },
    eff: { 'mult.lore': 0.2, commReward: 0.25, starChance: 0.01 } },
  { zh: '狼嗥月', en: 'Lupuary', ab: 'Lup.', heat: 1.4, hot: true,
    desc: { zh: '东部岚砂一带狼群此月夜嗥频繁，标志盛夏将至。此月气温升高、湿度增大，天气潮湿闷热。',
      en: 'Wolves howl through the nights of eastern Lansha. Hot and humid; midsummer is near.' },
    eff: { 'mult.firewood': -0.1 } },
  { zh: '龙焰月', en: 'Ignust', ab: 'Ign.', heat: 1.8, hot: true,
    desc: { zh: '一年中最炎热的月份，烬痕协地热活动达到顶峰。此月高温持续，地热活动强烈，年轻龙族多在此阶段完成成年礼。',
      en: 'The hottest month; geothermal activity in Jinhen peaks. Many young dragons complete their coming-of-age rites.' },
    eff: { flameRegen: 1, growth: 0.5, 'dispEl.s': 1, happiness: 5 } },
  { zh: '烁光月', en: 'Lumenary', ab: 'Lum.', heat: 1.4, hot: true,
    desc: { zh: '盛夏尾声，阳光折射愈发刺目，苍阙协浮冰也会反射出细碎光斑。此月光照强烈、能见度高，远距离飞行条件良好。',
      en: 'The tail of summer. Sunlight glares off the floating ice of Cangque. Perfect weather for long flights.' },
    eff: { dispSpeed: 0.25 } },
  { zh: '丰砧月', en: 'Incudary', ab: 'Inc.', heat: 1,
    desc: { zh: '秋收将至，造物纲的锻造类龙族最为繁忙，以“砧”喻积累与打磨。此月物资集中储备，狩猎与储粮活动频繁。',
      en: 'Harvest approaches and forging dragons are at their busiest. Supplies are gathered and stored.' },
    eff: { 'mult.ore': 0.2, 'mult.coins': 0.1, cropYield: 0.15 } },
  { zh: '橡实月', en: 'Quercen', ab: 'Que.', heat: 0.9,
    desc: { zh: '西部与北部林地橡实成熟坠落，许多幻兽与偏好友好种族在此时最为活跃。此月林地食物资源丰富，物种间接触频率升高。',
      en: 'Acorns ripen and fall in the western and northern woods. Friendly creatures are at their most active.' },
    eff: { custMult: 0.2, 'dispCat.flo': 1 } },
  { zh: '冥纱月', en: 'Umbrile', ab: 'Umb.', heat: 0.8, cold: true,
    desc: { zh: '昼短夜长，暮色如纱笼罩大地，嶂渊协言灵扰动尤为频繁。此月光照时间缩短，言灵活动增强，适宜静修内省。',
      en: 'Short days, long nights; dusk drapes the land like a veil. Spellword activity surges. A time for reflection.' },
    eff: { alchFail: 0.2, 'mult.lore': 0.2 } },
  { zh: '永霜月', en: 'Brucemar', ab: 'Bru.', heat: 0.5, cold: true, frozen: true,
    desc: { zh: '一年中最寒冷的月份，与“永霜冻土”同名，正是那片土地气候统御全局之时。此月气温降至最低，多数龙族归巢冬眠。',
      en: 'The coldest month, named after the Everfrost lands. Most dragons return to their nests to hibernate.' },
    eff: { custMult: -0.3, dispSpeed: -0.1, 'mult.coins': 0.15, happiness: -5 } }
];

/* 月相：火翼双弦历每月分上弦、下弦两段，各 15 天。
 * 数值为炼金时额外产出杂质的概率（负数表示更稳），范围 -10% 到 +25%，只影响 Rare 1 到 4 的产物 */
var MOON_MOD = [
  [0.05, 0.10],   // 蛛痕月：霜纹未消，炉温忽冷忽热
  [0.00, 0.05],   // 信风月
  [-0.05, 0.05],  // 裂土月
  [0.00, 0.10],   // 鸦羽月：鸦群扰乱了月光
  [-0.10, -0.05], // 星誓月：一年里最澄澈的夜空
  [0.05, 0.15],   // 狼嗥月：潮湿闷热
  [-0.05, 0.10],  // 龙焰月
  [-0.10, 0.00],  // 烁光月：光照充足，看得清炉中的颜色
  [-0.05, 0.05],  // 丰砧月
  [0.00, 0.10],   // 橡实月
  [-0.05, 0.25],  // 冥纱月：上弦宜静修，下弦言灵扰动最剧烈
  [0.10, 0.20]    // 永霜月：炉子冻得发脆
];

/* 小龙的职业。prod 为每只小龙每秒的基础产出；els 为擅长的元素，属性相符时效率 +30% */
var JOBS = [
  { id: 'smelterhand', zh: '熔铸工', en: 'Smelter Hand', prod: { coins: 5 }, els: ['s'],
    desc: { zh: '守着熔铸炉，把碎金属敲成硬币。灼燃属性的小龙不怕烫。', en: 'Tends the smelters and hammers scrap into coins. Scorch dragonlings do not mind the heat.' },
    req: function (s) { return !!s.tech.smelting; } },
  { id: 'woodcutter', zh: '樵夫', en: 'Woodcutter', prod: { firewood: 0.09 }, els: ['t'],
    desc: { zh: '用尾巴把枯枝扫成一堆。震颤属性的小龙跺一跺脚，树枝自己就掉下来了。', en: 'Sweeps dead branches into piles. A Tremor dragonling just stomps and the branches fall by themselves.' },
    req: function (s) { return !!s.flags.firewood; } },
  { id: 'miner', zh: '矿工', en: 'Miner', prod: { ore: 0.25 }, els: ['c', 't'],
    desc: { zh: '小龙天生喜欢挖洞。腐蚀和震颤属性的小龙挖得格外快。', en: 'Dragonlings are born diggers. Corrode and Tremor dragonlings dig especially fast.' },
    req: function (s) { return s.bld.orepit > 0; } },
  { id: 'apprentice', zh: '学徒', en: 'Apprentice', prod: { lore: 0.175 }, els: ['e'],
    desc: { zh: '趴在书角里看书，偶尔会看睡着。侵蚀属性的小龙读得懂风化的碑文。', en: 'Reads in the nook and sometimes dozes off. Erode dragonlings can read weathered inscriptions.' },
    req: function (s) { return s.bld.nook > 0; } },
  { id: 'gardener', zh: '园丁', en: 'Gardener', prod: {}, els: ['d'],
    desc: { zh: '在草地上收获、补种、浇水、施肥。沉沦属性的小龙浇水从来不用水桶。', en: 'Harvests, replants, waters and fertilizes the meadow, one chore at a time. Drown dragonlings never need a bucket.' },
    req: function (s) { return !!s.tech.agronomy; } },
  { id: 'cook', zh: '厨师', en: 'Cook', prod: {}, els: ['s', 'f'],
    desc: { zh: '在后厨推进制作进度，按目标库存补货。灼燃管烤，冰封管冻。', en: 'Pushes the kitchen\'s progress bar forward and restocks up to target. Scorch bakes, Freeze chills.' },
    req: function (s) { return s.bld.workshop > 0 && !!s.tech.roasting; } },
  { id: 'clerk', zh: '店员', en: 'Clerk', prod: {}, els: ['f', 'p'],
    desc: { zh: '推进招待进度。冰封属性的小龙笑容很冷静，麻痹属性的小龙动作快得冒火花。', en: 'Pushes the serving progress bar. Freeze dragonlings keep cool smiles; Paralyze ones move so fast they spark.' },
    req: function (s) { return s.bld.workshop > 0; } },
  { id: 'courier', zh: '信使', en: 'Courier', prod: { intel: 0.012 }, els: ['p'],
    desc: { zh: '在各协之间飞来飞去，打听消息。', en: 'Flies between districts, listening for news.' },
    req: function (s) { return s.bld.archive > 0; } },
  { id: 'caretaker', zh: '保育员', en: 'Caretaker', prod: {}, els: ['d', 'e'],
    desc: { zh: '给其他小龙讲睡前故事、梳鳞片、调解吵架。每位让幸福度 +1.5%。', en: 'Tells bedtime stories, brushes scales and settles squabbles. Each gives +1.5% happiness.' },
    req: function (s) { return !!s.tech.customs; } }
];
/* 进度条式的工作：店员、厨师、园丁按速度填充进度条，玩家可以按住按钮亲自加速 */
var CLERK_SERVE = 0.08;     // 每位店员每秒填充的招待进度（1 = 招待完一位顾客）；v0.4 从 0.2 大幅下调
var COOK_SPEED = 0.1;       // 每位厨师每秒提供的后厨工作量；v0.4 从 0.25 大幅下调
var GARDEN_SPEED = 0.2;     // 每位园丁每秒提供的草地工作量；v0.4 从 0.5 大幅下调
var MANUAL_SERVE = 0.5;     // 按住“招待顾客”时每秒的招待进度
var MANUAL_COOK = 0.8;      // 按住“制作”时每秒的后厨工作量
var MANUAL_FARM = 1.2;      // 按住草地按钮时每秒的工作量
var FARM_WORK = { harvest: 0.6, plant: 0.4, water: 25, fert: 20 }; // 收获与播种所需工作量；每单位工作量浇水与施肥的点数
var FERT_PER_POINT = 0.15;   // 每点地力消耗的肥料
var BASE_CUSTOMERS = 1;     // 每个游戏日的基础客流（位）
var BASE_QUEUE = 5;         // 基础等候上限
var CARETAKER_HAPPY = 1.5;  // 每位保育员提供的幸福度
var DRAGON_UPKEEP = 4.25;   // 每只小龙每秒消耗的硬币（原版小猫每 tick 0.85 猫薄荷）
var ELEMENT_MATCH = 0.3;    // 属性相符的效率加成
var WELLFED_BONUS = 0.2;    // 饱足状态的效率加成
var DRAGON_ARRIVAL = 0.05;  // 每秒到来进度（原版每 tick 0.01，即 20 秒一只）

/* 熟练度：阈值取自原版，加成为原版的两倍 */
var SKILL_TIERS = [
  { min: 0, zh: '生手', en: 'Dabbling', bonus: 0 },
  { min: 100, zh: '新手', en: 'Novice', bonus: 0.025 },
  { min: 500, zh: '熟手', en: 'Adequate', bonus: 0.05 },
  { min: 1200, zh: '能手', en: 'Competent', bonus: 0.09 },
  { min: 2500, zh: '好手', en: 'Skilled', bonus: 0.15 },
  { min: 5000, zh: '行家', en: 'Proficient', bonus: 0.25 },
  { min: 9000, zh: '大师', en: 'Master', bonus: 0.375 }
];
var SKILL_CAP = 20000;
var SKILL_XP = 0.05;          // 每秒熟练度经验（原版每 tick 0.01）
var SKILL_FORGET = 0.005;     // 其他职业的熟练度每秒遗忘

/* 领头龙：按属性提供全局加成，随成长等级提高 */
var LEADER_BONUS = {
  s: { 'mult.coins': 0.1 },
  f: { priceAll: 0.08 },
  p: { dispSpeed: 0.1, 'mult.intel': 0.1 },
  d: { farmGrowth: 0.1 },
  c: { 'mult.ore': 0.1 },
  t: { 'mult.firewood': 0.1 },
  e: { 'mult.lore': 0.1 }
};

/* 建筑分类（龙巢页的筛选） */
var BLD_CATS = [
  { id: 'all', zh: '全部', en: 'All' },
  { id: 'avail', zh: '可建造', en: 'Available' },
  { id: 'life', zh: '生活', en: 'Living' },
  { id: 'prod', zh: '生产', en: 'Production' },
  { id: 'lore', zh: '学识', en: 'Lore' },
  { id: 'store', zh: '仓储', en: 'Storage' },
  { id: 'shop', zh: '工坊', en: 'Workshop' },
  { id: 'kitchen', zh: '后厨', en: 'Kitchen' },
  { id: 'farm', zh: '草地', en: 'Meadow' },
  { id: 'exp', zh: '派遣', en: 'Expeditions' }
];

/* 建筑。cost 为第一座的价格，ratio 为每多一座的价格倍率，eff 为每座提供的效果 */
var BUILDINGS = [
  /* 生产 */
  { id: 'smelter', cat: 'prod', zh: '硬币熔铸炉', en: 'Coin Smelter', cost: { coins: 10 }, ratio: 1.12,
    eff: { 'prod.coins': 0.625 },
    desc: { zh: '把捡来的碎金属熔成硬币。', en: 'Melts down scavenged scrap into coins.' },
    flavor: { zh: '叮当，叮当。', en: 'Clink, clink.' },
    req: function (s) { return true; } },
  { id: 'orepit', cat: 'prod', zh: '矿坑', en: 'Ore Pit', cost: { firewood: 100 }, ratio: 1.15,
    eff: { 'mult.ore': 0.2 },
    desc: { zh: '解锁矿工。每座让矿石产量 +20%。', en: 'Unlocks Miners. Each pit gives +20% ore.' },
    flavor: { zh: '挖着挖着，偶尔会挖到别的龙藏起来的零食。', en: 'Sometimes you dig up snacks other dragons buried.' },
    req: function (s) { return !!s.tech.mining; } },
  { id: 'woodshed', cat: 'prod', zh: '锯木棚', en: 'Sawmill', cost: { firewood: 100, ore: 250 }, ratio: 1.15,
    eff: { 'mult.firewood': 0.1 },
    desc: { zh: '柴薪产量提高。', en: 'Firewood production increased.' },
    flavor: { zh: '锯子是用旧龙鳞磨的，非常锋利，也非常吵。', en: 'The saw is ground from an old dragon scale. Very sharp, very loud.' },
    req: function (s) { return !!s.tech.carpentry; } },
  { id: 'bellows', cat: 'prod', zh: '鼓风炉', en: 'Bellows', cost: { ore: 75 }, ratio: 1.12,
    eff: { 'mult.coins': 0.03 },
    desc: { zh: '让所有熔铸炉烧得更旺，硬币产量提高。', en: 'Makes every smelter burn hotter. Coin production increased.' },
    flavor: { zh: '呼哧，呼哧。', en: 'Whoosh, whoosh.' },
    req: function (s) { return !!s.tech.engineering; } },
  { id: 'kiln', cat: 'prod', elem: 's', zh: '元素窑', en: 'Elemental Kiln', cost: { ore: 500, scorch_crystal: 3 }, ratio: 1.35,
    eff: { 'mult.coins': 0.08, flameMax: 1 },
    desc: { zh: '灼燃结晶让熔铸炉更旺。', en: 'Scorch crystals make the smelters burn hotter.' },
    flavor: { zh: 'Rhasari 很喜欢在窑顶上睡午觉。', en: 'Rhasari loves napping on top of the kiln.' },
    req: function (s) { return !!s.tech.elementology; } },
  { id: 'etchvat', cat: 'prod', elem: 'c', zh: '蚀刻池', en: 'Etching Vat', cost: { ore: 600, corrode_crystal: 3 }, ratio: 1.35,
    eff: { 'mult.ore': 0.12 },
    desc: { zh: '用腐蚀结晶从岩石中剥出矿石。', en: 'Corrode crystals strip ore out of rock.' },
    flavor: { zh: '请勿把爪子伸进去。', en: 'Do not put your paws in.' },
    req: function (s) { return !!s.tech.elementology; } },

  /* 生活 */
  /* 价格曲线在中期前拉伸 1.2 倍左右：原版第 10 次购买的单价，这里第 12 次才达到；此后保持原版往后推 2 次 */
  { id: 'nest', cat: 'life', zh: '幼龙窝', en: 'Dragonling Nest', cost: { firewood: 5 }, ratio: 2.5,
    stretch: { until: 11, k: 9 / 11, shift: 2 },
    eff: { housing: 2 },
    desc: { zh: '铺满干草的小窝，能住下两只小龙。', en: 'A straw-lined nook with room for two dragonlings.' },
    flavor: { zh: '只要有零花钱，小龙们什么活都愿意干。', en: 'As long as there is pocket money, dragonlings will do any job.' },
    req: function (s) { return !!s.flags.firewood; } },
  { id: 'den', cat: 'life', zh: '龙穴', en: 'Dragon Den', cost: { firewood: 200, ore: 250 }, ratio: 1.15,
    eff: { housing: 1 },
    desc: { zh: '凿进山壁里的单间，住下一只小龙。', en: 'A private room carved into the cliff, for one dragonling.' },
    flavor: { zh: '每只小龙都坚持自己的单间朝向最好。', en: 'Every dragonling insists its room has the best view.' },
    req: function (s) { return !!s.tech.carpentry; } },
  { id: 'hoard', cat: 'life', zh: '公共小宝藏堆', en: 'Shared Mini Hoard', cost: { coins: 100, firewood: 10 }, ratio: 1.15,
    eff: { upkeepRelief: 0.005 },
    desc: { zh: '小龙们可以一起趴在上面欣赏，就不必每只都攒自己的了。零花钱消耗 -0.5%。', en: 'Dragonlings can admire it together instead of each keeping their own. Pocket money -0.5%.' },
    flavor: { zh: '上面那枚最亮的硬币归谁，至今仍有争议。', en: 'Who owns the shiniest coin on top is still disputed.' },
    req: function (s) { return !!s.tech.customs; } },
  { id: 'hotspring', cat: 'life', zh: '温泉池', en: 'Hot Spring', cost: { firewood: 200, ore: 1200 }, ratio: 1.15,
    eff: { crowdRelief: 0.048 },
    desc: { zh: '泡过温泉的小龙就不那么在意挤了。人口拥挤带来的不满 -4.8%。', en: 'After a soak, dragonlings mind the crowd less. Crowding unhappiness -4.8%.' },
    flavor: { zh: '池边贴着告示：灼燃属性请勿把水烧开。', en: 'A sign by the pool: Scorch dragonlings, please do not boil the water.' },
    req: function (s) { return !!s.tech.balneology; } },
  { id: 'tearoom', cat: 'life', zh: '茶室', en: 'Tea Room', cost: { firewood: 300, ore: 300, coins: 2000 }, ratio: 1.15,
    eff: { happiness: 2 },
    desc: { zh: '小龙们下班后喝茶的地方。幸福度 +2%。', en: 'Where dragonlings have tea after work. Happiness +2%.' },
    flavor: { zh: '茶杯是按小龙的爪子尺寸订做的，所以 Kirro 只能用碟子喝。', en: 'The cups fit dragonling claws, so you drink from the saucer.' },
    req: function (s) { return !!s.tech.tea_party; } },
  { id: 'snackshelf', cat: 'life', zh: '员工零食柜', en: 'Staff Snack Shelf', cost: { firewood: 80, ore: 40 }, ratio: 1, max: 1,
    eff: {},
    desc: { zh: '允许小龙在工作间隙吃商品当零食。每种被允许、且有库存的零食让幸福度 +5%，最多 +40%，会慢慢消耗库存。', en: 'Lets dragonlings snack on goods during breaks. Each allowed snack in stock gives +5% happiness (up to +40%), slowly using up stock.' },
    flavor: { zh: '柜门上第二张告示：Rhasari 也不许偷吃。', en: 'Second note on the door: No snacking, Rhasari. That includes you.' },
    req: function (s) { return !!s.tech.staff_welfare; } },
  { id: 'training', cat: 'life', zh: '演武场', en: 'Training Ground', cost: { firewood: 300, ore: 500 }, ratio: 1.3,
    eff: { trainXp: 0.04 },
    desc: { zh: '留在龙巢的小龙会持续获得战斗经验。', en: 'Dragonlings at home slowly gain combat experience.' },
    flavor: { zh: '主要项目是扑咬稻草人。', en: 'The main event is pouncing on scarecrows.' },
    req: function (s) { return !!s.tech.drills; } },

  /* 学识 */
  { id: 'nook', cat: 'lore', zh: '书角', en: 'Reading Nook', cost: { firewood: 25 }, ratio: 1.15,
    eff: { 'cap.lore': 250, 'mult.lore': 0.1 },
    desc: { zh: '一个可以安静看书的角落。解锁学徒。', en: 'A quiet corner to read in. Unlocks Apprentices.' },
    flavor: { zh: '书是从各个宝藏堆的底层翻出来的。', en: 'The books were dug out from the bottom of various hoards.' },
    req: function (s) { return !!s.flags.firewood; } },
  { id: 'hall', cat: 'lore', zh: '学堂', en: 'Study Hall', cost: { firewood: 50, ore: 70, lore: 100 }, ratio: 1.15,
    eff: { 'cap.lore': 500, 'mult.lore': 0.2, skillXP: 0.0025 },
    desc: { zh: '更大的学习空间。所有小龙的熟练度增长略微加快。', en: 'A larger place of study. All dragonlings learn their jobs a little faster.' },
    flavor: { zh: '黑板上画满了龙爪印。', en: 'The blackboard is covered in claw prints.' },
    req: function (s) { return !!s.tech.pedagogy; } },
  { id: 'archive', cat: 'lore', zh: '情报档案室', en: 'Intel Archive', cost: { firewood: 300, ore: 100 }, ratio: 1.25,
    eff: { 'cap.intel': 30 },
    desc: { zh: '提高情报上限。解锁信使。', en: 'Raises the Intel limit. Unlocks Couriers.' },
    flavor: { zh: '每份情报都按 Rakuakira 喜欢的样子归档，整整齐齐。', en: 'Every report is filed the way Rakuakira likes it, neat and tidy.' },
    req: function (s) { return !!s.tech.intelligence; } },
  { id: 'observatory', cat: 'lore', zh: '观星台', en: 'Stargazing Deck', cost: { firewood: 200, ore: 750, lore: 1000 }, ratio: 1.1,
    eff: { starChance: 0.002, 'cap.lore': 250 },
    desc: { zh: '流星出现的概率提高，也更有可能被自动观测到。', en: 'Shooting stars appear more often and are more likely to be observed automatically.' },
    flavor: { zh: '望远镜的另一头经常是 Rakuakira 的眼睛。', en: 'The other end of the telescope is often Rakuakira\'s eye.' },
    req: function (s) { return !!s.tech.astronomy; } },
  { id: 'stele', cat: 'lore', elem: 'e', zh: '风化石碑', en: 'Weathered Stele', cost: { ore: 400, erode_crystal: 3 }, ratio: 1.35,
    eff: { 'mult.lore': 0.1, 'cap.lore': 250 },
    desc: { zh: '碑上的言灵被风慢慢读了出来。', en: 'The wind slowly reads the spellwords carved into it.' },
    flavor: { zh: '每次看，碑文都不太一样。', en: 'The inscription is slightly different every time.' },
    req: function (s) { return !!s.tech.elementology; } },

  /* 仓储 */
  { id: 'storeroom', cat: 'store', zh: '储藏室', en: 'Storeroom', cost: { firewood: 50 }, ratio: 1.75,
    eff: { 'cap.coins': 5000, 'cap.firewood': 200, 'cap.ore': 250, 'cap.ingredient': 50, 'cap.fertilizer': 50, 'cap.quill': 144 },
    desc: { zh: '提高各种资源的储存上限。', en: 'Raises storage limits.' },
    flavor: { zh: '龙族管这个叫“迷你宝藏堆”。', en: 'Dragons call it a "mini hoard".' },
    req: function (s) { return !!s.tech.smelting; } },
  { id: 'vault', cat: 'store', zh: '鳞库', en: 'Scale Vault', cost: { firewood: 250, ore: 400 }, ratio: 1.15,
    eff: { 'cap.coins': 5000, 'cap.firewood': 150, 'cap.ore': 200, 'cap.quill': 144 },
    desc: { zh: '学着龙族的样子，把东西堆成一座山。', en: 'Pile things into a mountain, the way dragons do.' },
    flavor: { zh: '门是用旧盾牌拼的。', en: 'The door is patched together from old shields.' },
    req: function (s) { return !!s.tech.vaulting; } },
  { id: 'pantry', cat: 'store', zh: '储物柜', en: 'Pantry', cost: { firewood: 100, ore: 50 }, ratio: 1.2,
    eff: { 'cap.ingredient': 60, 'cap.processed': 30, 'cap.goods': 10 },
    desc: { zh: '提高食材、半成品和商品的存放上限。', en: 'Raises ingredient, prepared and goods limits.' },
    flavor: { zh: '柜门上贴着：Rhasari 不许偷吃。', en: 'A note on the door: No snacking, Rhasari.' },
    req: function (s) { return !!s.tech.storage; } },
  { id: 'icehouse', cat: 'store', elem: 'f', zh: '冰窖', en: 'Icehouse', cost: { ore: 400, freeze_crystal: 3 }, ratio: 1.35,
    eff: { 'cap.goods': 15, 'cap.processed': 15 },
    desc: { zh: '冰镇保存，商品和半成品放得更久。', en: 'Chilled storage for goods and prepared ingredients.' },
    flavor: { zh: '离 Rhasari 越远越好。', en: 'Kept as far from Rhasari as possible.' },
    req: function (s) { return !!s.tech.elementology; } },
  { id: 'coffer', cat: 'store', zh: '翎匣', en: 'Quill Coffer', cost: { firewood: 150, ore: 300 }, ratio: 1.3,
    eff: { 'cap.quill': 576 },
    desc: { zh: '带锁的小匣子，专门放翎鸾。翎鸾上限 +4 金翎。', en: 'A small locked box just for quills. Quill limit +4 gold.' },
    flavor: { zh: '钥匙由 Rakuakira 保管，她每晚睡前都会轻轻清点一遍。', en: 'Rakuakira keeps the key and quietly counts everything before bed.' },
    req: function (s) { return !!s.tech.storage; } },

  /* 工坊 */
  { id: 'workshop', cat: 'shop', zh: 'Kirro 的炼金工坊', en: 'Kirro\'s Alchemy Workshop', cost: { firewood: 100, ore: 400 }, ratio: 1,
    allCoins: 2000, max: 1,
    eff: {},
    desc: { zh: '花光全部积蓄（至少 2000 硬币），在龙巢里开一家炼金工坊。解锁工坊、店员、情报与委托。', en: 'Spend ALL your coins (at least 2000) to open an alchemy workshop in Dragonest. Unlocks the Workshop, Clerks, Intel and Commissions.' },
    flavor: { zh: '招牌上写着：只接待小型龙族。', en: 'The sign reads: Small dragons only.' },
    req: function (s) { return !!s.tech.alchemy_basics; } },
  { id: 'seats', cat: 'shop', zh: '咖啡座', en: 'Café Table', cost: { coins: 300, firewood: 60 }, ratio: 1.2,
    eff: { custRate: 0.15, queueCap: 2 },
    desc: { zh: '让更多顾客愿意停下来。', en: 'More customers are willing to stop by.' },
    flavor: { zh: '椅子按小型龙族的尺寸订做。', en: 'Chairs are made to fit small dragons.' },
    req: function (s) { return !!s.tech.hospitality; } },
  { id: 'display', cat: 'shop', zh: '展柜', en: 'Display Case', cost: { firewood: 150, ore: 300 }, ratio: 1.35,
    eff: { displaySlots: 1 },
    desc: { zh: '每个展柜可陈列一种炼金物品。每位上门的顾客都有一定概率按全价买走一件。', en: 'Each case displays one kind of alchemy item. Every arriving customer has a chance to buy one at full value.' },
    flavor: { zh: '玻璃擦得能照出龙鳞。', en: 'Polished until it reflects dragon scales.' },
    req: function (s) { return !!s.tech.showcase; } },
  { id: 'shelf', cat: 'shop', zh: '橱窗架', en: 'Window Shelf', cost: { firewood: 80, ore: 60 }, ratio: 1.3,
    eff: { windowSlots: 1 },
    desc: { zh: '橱窗多一格陈列位，可以多摆一种半成品。', en: 'One more window slot for another kind of prepared goods.' },
    flavor: { zh: '最上面那层总有一只小龙趴着，假装自己也是商品。', en: 'There is always a dragonling lying on the top shelf, pretending to be merchandise.' },
    req: function (s) { return (s.bld.stove || 0) > 0; } },
  { id: 'signboard', cat: 'shop', zh: '广告牌', en: 'Signboard', cost: { firewood: 120, coins: 800 }, ratio: 1.25,
    eff: { windowChance: 0.02, displayChance: 0.005, custRate: 0.05 },
    desc: { zh: '让路过的龙多看橱窗和展柜一眼。', en: 'Makes passing dragons take a second look at the window and the display case.' },
    flavor: { zh: '上面画着 Kirro 的笑脸。画得不太像，但很有精神。', en: 'It shows your smiling face. Not a good likeness, but full of spirit.' },
    req: function (s) { return !!s.tech.advertising; } },
  { id: 'tradepost', cat: 'shop', zh: '商栈', en: 'Trading Post', cost: { firewood: 500, ore: 200, coins: 1000 }, ratio: 1.15,
    eff: { tradeRatio: 0.015 },
    desc: { zh: '每次贸易换回的东西更多。', en: 'Every trade brings back more.' },
    flavor: { zh: '门口总有一只打瞌睡的猫头鹰。', en: 'There is always an owl dozing at the door.' },
    req: function (s) { return !!s.tech.commerce; } },
  { id: 'chime', cat: 'shop', elem: 'p', zh: '雷鸣风铃', en: 'Static Chime', cost: { ore: 400, paralyze_crystal: 3 }, ratio: 1.35,
    eff: { custMult: 0.08 },
    desc: { zh: '叮铃声会把路过的小龙吸引进来。', en: 'Its ringing draws in passing dragonlings.' },
    flavor: { zh: '摸一下会有点麻。', en: 'Tingles a bit when you touch it.' },
    req: function (s) { return !!s.tech.elementology; } },

  /* 后厨工位 */
  { id: 'stove', cat: 'kitchen', station: 'stove', zh: '土灶', en: 'Clay Stove', cost: { firewood: 40, ore: 20 }, ratio: 1.25,
    eff: {},
    desc: { zh: '把作物简单地烤一烤、熬一熬，做成可以摆进橱窗的半成品。每多一座，土灶类配方速度 +25%。', en: 'Roasts and boils crops into simple prepared goods for the shop window. Each extra one makes stove recipes 25% faster.' },
    flavor: { zh: 'Rhasari 每次路过都会往灶膛里吐一口火，说是在帮忙。', en: 'Rhasari spits a little fire into it every time she passes. She calls this helping.' },
    req: function (s) { return !!s.tech.agronomy; } },
  { id: 'bar', cat: 'kitchen', station: 'bar', zh: '咖啡吧台', en: 'Coffee Bar', cost: { firewood: 60, ore: 30 }, ratio: 1.25,
    eff: {},
    desc: { zh: '冲煮咖啡和茶。每多一座，吧台类商品的制作速度 +25%。', en: 'Brews coffee and tea. Each extra one makes bar recipes 25% faster.' },
    flavor: { zh: '磨豆机的声音像一只打呼噜的小龙。', en: 'The grinder sounds like a snoring dragonling.' },
    req: function (s) { return !!s.tech.roasting; } },
  { id: 'pot', cat: 'kitchen', station: 'pot', zh: '小铜锅', en: 'Copper Pot', cost: { ore: 60, firewood: 20 }, ratio: 1.25,
    eff: {},
    desc: { zh: '熬酱、煮布丁。每多一座，铜锅类配方速度 +25%。', en: 'For sauces and puddings. Each extra one makes pot recipes 25% faster.' },
    flavor: { zh: '锅底有一块洗不掉的焦痕，形状像一只凤凰。', en: 'There is a scorch mark that will not wash off. It is shaped like a phoenix.' },
    req: function (s) { return !!s.tech.confection; } },
  { id: 'churn', cat: 'kitchen', station: 'churn', zh: '搅奶桶', en: 'Butter Churn', cost: { firewood: 60 }, ratio: 1.25,
    eff: {},
    desc: { zh: '把鲜奶搅成奶油。', en: 'Churns milk into cream.' },
    flavor: { zh: '最适合让精力过剩的小龙去摇。', en: 'Perfect for dragonlings with too much energy.' },
    req: function (s) { return !!s.tech.husbandry; } },
  { id: 'mill', cat: 'kitchen', station: 'mill', zh: '石磨', en: 'Stone Mill', cost: { firewood: 80, ore: 120 }, ratio: 1.25,
    eff: {},
    desc: { zh: '磨面粉、可可粉、抹茶粉和椰奶。', en: 'Grinds flour, cocoa powder, matcha and coconut milk.' },
    flavor: { zh: '推磨的小龙转着转着就把自己转晕了。', en: 'The dragonling pushing it eventually spins itself dizzy.' },
    req: function (s) { return !!s.tech.baking; } },
  { id: 'oven', cat: 'kitchen', station: 'oven', zh: '砖烤炉', en: 'Brick Oven', cost: { firewood: 100, ore: 200 }, ratio: 1.25,
    eff: {},
    desc: { zh: '烤曲奇、蛋糕和派。', en: 'Bakes cookies, cakes and pies.' },
    flavor: { zh: 'Rhasari 认为它是自己的竞争对手。', en: 'Rhasari considers it a professional rival.' },
    req: function (s) { return !!s.tech.baking; } },
  { id: 'jar', cat: 'kitchen', station: 'jar', zh: '腌渍罐', en: 'Preserving Jar', cost: { ore: 50, coins: 200 }, ratio: 1.25,
    eff: {},
    desc: { zh: '用糖和蜂蜜腌渍水果。', en: 'Preserves fruit in sugar and honey.' },
    flavor: { zh: '标签上写着日期，以及“别打开”。', en: 'The label has a date, and the words "do not open".' },
    req: function (s) { return !!s.tech.preserving; } },
  { id: 'frost', cat: 'kitchen', station: 'frost', zh: '霜柜', en: 'Frost Cabinet', cost: { ore: 200, freeze_crystal: 2 }, ratio: 1.3,
    eff: {},
    desc: { zh: '冻冰淇淋、打冰沙。', en: 'For ice cream and slushes.' },
    flavor: { zh: '冰封结晶在里面嗡嗡作响，像在哼歌。', en: 'The freeze crystal hums inside, as if singing.' },
    req: function (s) { return !!s.tech.frost_craft; } },

  /* 草地 */
  { id: 'well', cat: 'farm', zh: '水井', en: 'Well', cost: { firewood: 60, ore: 100 }, ratio: 1.2,
    eff: { waterRegen: 1.5 },
    desc: { zh: '草地上所有地块每天自动补水。', en: 'Every plot regains some water each day.' },
    flavor: { zh: '往里扔硬币许愿的人很多，捞硬币的龙更多。', en: 'Many toss coins in to make a wish. Even more dragons fish them out.' },
    req: function (s) { return !!s.tech.agronomy; } },
  { id: 'compost', cat: 'farm', zh: '堆肥箱', en: 'Compost Bin', cost: { firewood: 40 }, ratio: 1.15,
    eff: { 'prod.fertilizer': 0.04 },
    desc: { zh: '把咖啡渣和果皮变成肥料。炼金失败的杂质也可以扔进来。', en: 'Turns coffee grounds and peels into fertilizer. Alchemy impurities can go in too.' },
    flavor: { zh: '气味很有层次。', en: 'The smell is complex.' },
    req: function (s) { return !!s.tech.agronomy; } },
  { id: 'scarecrow', cat: 'farm', zh: '稻草龙', en: 'Scare-dragon', cost: { firewood: 30, coins: 200 }, ratio: 1.2,
    eff: { cropYield: 0.04 },
    desc: { zh: '吓跑偷吃的鸟。作物产量提高。', en: 'Scares off thieving birds. Crop yield increased.' },
    flavor: { zh: 'Rakuakira 对此表示强烈抗议，并提交了书面意见。', en: 'Rakuakira has filed a formal written objection.' },
    req: function (s) { return !!s.tech.agronomy; } },
  { id: 'greenhouse', cat: 'farm', zh: '温室', en: 'Greenhouse', cost: { firewood: 200, ore: 300 }, ratio: 1.3,
    eff: { greenhouse: 2, farmGrowth: 0.05 },
    desc: { zh: '每座为两块地挡住寒冬，冬月里也能正常生长。', en: 'Each shelters two plots from winter so they grow normally in cold months.' },
    flavor: { zh: '冬天里最受欢迎的午睡地点。', en: 'The most popular nap spot in winter.' },
    req: function (s) { return !!s.tech.agronomy && !!s.tech.engineering; } },
  { id: 'channel', cat: 'farm', elem: 'd', zh: '引水渠', en: 'Water Channel', cost: { ore: 300, drown_crystal: 2 }, ratio: 1.3,
    eff: { waterRegen: 3 },
    desc: { zh: '沉沦结晶把水从地底引上来。', en: 'Drown crystals draw water up from deep below.' },
    flavor: { zh: '水声潺潺，园丁们都在旁边睡着了。', en: 'The trickling water lulls every gardener to sleep.' },
    req: function (s) { return !!s.tech.irrigation; } },
  { id: 'pen', cat: 'farm', zh: '云羊圈', en: 'Cloudsheep Pen', cost: { coins: 500, firewood: 100 }, ratio: 1.2,
    eff: { 'prod.milk': 0.06 },
    desc: { zh: '养几只云羊，产鲜奶。', en: 'Keeps a few cloudsheep for milk.' },
    flavor: { zh: '云羊下雨天会变重，需要拴好。', en: 'Cloudsheep get heavier when it rains. Keep them tied down.' },
    req: function (s) { return !!s.tech.husbandry; } },
  { id: 'henhouse', cat: 'farm', zh: '灰羽鸡舍', en: 'Hen House', cost: { coins: 300, firewood: 80 }, ratio: 1.2,
    eff: { 'prod.eggs': 0.05 },
    desc: { zh: '产鸡蛋。', en: 'Produces eggs.' },
    flavor: { zh: '鸡们坚信小龙也是从蛋里出来的，所以对它们很亲切。', en: 'The hens know dragonlings come from eggs too, and treat them like family.' },
    req: function (s) { return !!s.tech.husbandry; } },
  { id: 'beehive', cat: 'farm', zh: '蜂箱', en: 'Beehive', cost: { firewood: 50, coins: 200 }, ratio: 1.2,
    eff: { 'prod.honey': 0.03 },
    desc: { zh: '产蜂蜜。', en: 'Produces honey.' },
    flavor: { zh: '蜜蜂蜇不穿龙鳞，于是它们改为蜇 Kirro。', en: 'The bees cannot sting through dragon scales, so they sting you instead.' },
    req: function (s) { return !!s.tech.apiculture; } },

  /* 派遣 */
  { id: 'waystation', cat: 'exp', zh: '驿站', en: 'Waystation', cost: { firewood: 400, ore: 300 }, ratio: 1.6,
    eff: { dispSlots: 1 },
    desc: { zh: '每座驿站提供一个派遣名额。', en: 'Each waystation provides one expedition slot.' },
    flavor: { zh: '出发前记得带上便当。', en: 'Remember to pack a lunch.' },
    req: function (s) { return !!s.tech.courier; } },
  { id: 'tideclock', cat: 'exp', elem: 'd', zh: '潮汐钟', en: 'Tide Clock', cost: { ore: 400, drown_crystal: 3 }, ratio: 1.35,
    eff: { dispSpeed: 0.06, waterRegen: 1 },
    desc: { zh: '让派遣的小龙算准出发的时机，顺便给草地带来一点潮气。', en: 'Helps expeditions leave at the right moment, and brings a little moisture to the meadow.' },
    flavor: { zh: '滴答声像是远处的海浪。', en: 'Its ticking sounds like distant waves.' },
    req: function (s) { return !!s.tech.elementology; } },
  { id: 'sieve', cat: 'exp', elem: 't', zh: '震颤筛', en: 'Tremor Sieve', cost: { ore: 400, tremor_crystal: 3 }, ratio: 1.35,
    eff: { dispLoot: 0.06 },
    desc: { zh: '帮派遣归来的小龙把战利品筛得更干净。', en: 'Sifts returning expedition loot more thoroughly.' },
    flavor: { zh: '整个工坊都在轻轻发抖。', en: 'The whole workshop shivers gently.' },
    req: function (s) { return !!s.tech.elementology; } }
];

/* 研究。学识价格参照原版科技树的量级。
 * v0.3：工坊建成后的中期研究大多要消耗情报，少数消耗矿石；信使航线之后的研究要消耗翎鸾（按铜翎记）。 */
var TECHS = [
  { id: 'calendar', zh: '龙巢历法', en: 'Dragonest Calendar', cost: { lore: 30 },
    desc: { zh: '读懂火翼双弦历，显示每个月份与月相的效果。', en: 'Learn the Flamewing calendar. Shows the effects of each month and moon phase.' },
    req: function (s) { return true; } },
  { id: 'smelting', zh: '熔铸术', en: 'Smelting', cost: { lore: 100 },
    desc: { zh: '解锁熔铸工与储藏室。', en: 'Unlocks Smelter Hands and the Storeroom.' },
    req: function (s) { return !!s.tech.calendar; } },
  { id: 'mining', zh: '采掘', en: 'Mining', cost: { lore: 500 },
    desc: { zh: '解锁矿石、矿坑与矿工。', en: 'Unlocks Ore, the Ore Pit and Miners.' },
    req: function (s) { return !!s.tech.smelting; } },
  { id: 'customs', zh: '龙族风俗', en: 'Dragon Customs', cost: { lore: 500 },
    desc: { zh: '了解小龙们的习性。解锁公共小宝藏堆与保育员。', en: 'Learn how dragonlings live. Unlocks the Shared Mini Hoard and Caretakers.' },
    req: function (s) { return !!s.tech.smelting; } },
  { id: 'firewood_contract', zh: '柴薪契约', en: 'Firewood Contract', cost: { lore: 1200 },
    desc: { zh: '和路过的樵夫签约：硬币快满时，自动把一部分换成柴薪。可在龙巢页开关。', en: 'A deal with passing woodcutters: when coins are nearly full, some are exchanged for firewood automatically. Toggle it on the Dragonest tab.' },
    req: function (s) { return !!s.tech.smelting; } },
  { id: 'alchemy_basics', zh: '炼金入门', en: 'Alchemy Basics', cost: { lore: 900, ore: 100 },
    desc: { zh: '你终于想起来自己是个炼金术士。解锁工坊的建造。', en: 'You finally remember you are an alchemist. Unlocks building the Workshop.' },
    req: function (s) { return !!s.tech.mining; } },
  { id: 'pedagogy', zh: '授业', en: 'Pedagogy', cost: { lore: 1000, ore: 50 },
    desc: { zh: '解锁学堂。', en: 'Unlocks the Study Hall.' },
    req: function (s) { return !!s.tech.mining && !!s.tech.customs; } },
  { id: 'carpentry', zh: '木工', en: 'Carpentry', cost: { lore: 1300, ore: 120 },
    desc: { zh: '解锁龙穴与锯木棚。', en: 'Unlocks the Dragon Den and the Sawmill.' },
    req: function (s) { return !!s.tech.customs; } },
  { id: 'engineering', zh: '工程学', en: 'Engineering', cost: { lore: 1500, ore: 250 },
    desc: { zh: '解锁鼓风炉。', en: 'Unlocks the Bellows.' },
    req: function (s) { return !!s.tech.carpentry; } },
  { id: 'roasting', zh: '咖啡烘焙', en: 'Coffee Roasting', cost: { lore: 1000 },
    desc: { zh: '解锁咖啡吧台、厨师与黑咖啡。顾客开始上门。', en: 'Unlocks the Coffee Bar, Cooks and Black Coffee. Customers start to arrive.' },
    req: function (s) { return s.bld.workshop > 0; } },
  { id: 'agronomy', zh: '农艺', en: 'Agronomy', cost: { lore: 1200, intel: 2 },
    desc: { zh: '开垦工坊旁边的草地。解锁园丁、土灶、咖啡树、甘蔗与小麦。', en: 'Open up the meadow beside the workshop. Unlocks Gardeners, the Clay Stove, coffee, sugarcane and wheat.' },
    req: function (s) { return s.bld.workshop > 0; } },
  { id: 'storage', zh: '仓储学', en: 'Warehousing', cost: { lore: 1500, ore: 300 },
    desc: { zh: '解锁储物柜与翎匣。', en: 'Unlocks the Pantry and the Quill Coffer.' },
    req: function (s) { return s.bld.workshop > 0; } },
  { id: 'husbandry', zh: '畜牧', en: 'Husbandry', cost: { lore: 1500, intel: 4 },
    desc: { zh: '解锁云羊圈、灰羽鸡舍与搅奶桶。', en: 'Unlocks the Cloudsheep Pen, Hen House and Butter Churn.' },
    req: function (s) { return !!s.tech.agronomy; } },
  { id: 'apiculture', zh: '养蜂', en: 'Apiculture', cost: { lore: 1800, intel: 4 },
    desc: { zh: '解锁蜂箱。', en: 'Unlocks the Beehive.' },
    req: function (s) { return !!s.tech.agronomy; } },
  { id: 'confection', zh: '甜品学', en: 'Confectionery', cost: { lore: 1600, intel: 5 },
    desc: { zh: '解锁小铜锅与布丁。', en: 'Unlocks the Copper Pot and Pudding.' },
    req: function (s) { return !!s.tech.husbandry; } },
  { id: 'hospitality', zh: '待客之道', en: 'Hospitality', cost: { lore: 2000, intel: 6 },
    desc: { zh: '解锁咖啡座。', en: 'Unlocks the Café Table.' },
    req: function (s) { return !!s.tech.roasting; } },
  { id: 'staff_welfare', zh: '员工福利', en: 'Staff Welfare', cost: { lore: 2000, intel: 6 },
    desc: { zh: '解锁员工零食柜。', en: 'Unlocks the Staff Snack Shelf.' },
    req: function (s) { return !!s.tech.confection; } },
  { id: 'advertising', zh: '广告学', en: 'Advertising', cost: { lore: 2200, intel: 6 },
    desc: { zh: '解锁广告牌，让橱窗和展柜更容易成交。', en: 'Unlocks the Signboard, making window and display sales more likely.' },
    req: function (s) { return !!s.tech.hospitality; } },
  { id: 'intelligence', zh: '情报学', en: 'Intelligence', cost: { lore: 2200, intel: 5 },
    desc: { zh: '解锁情报档案室与信使。', en: 'Unlocks the Intel Archive and Couriers.' },
    req: function (s) { return !!s.tech.roasting; } },
  { id: 'courier', zh: '信使航线', en: 'Courier Routes', cost: { lore: 2500, intel: 10 },
    desc: { zh: '解锁驿站与派遣。', en: 'Unlocks the Waystation and Expeditions.' },
    req: function (s) { return !!s.tech.roasting; } },
  { id: 'baking', zh: '烘焙', en: 'Baking', cost: { lore: 2400, intel: 8 },
    desc: { zh: '解锁石磨、砖烤炉、草莓与南瓜。', en: 'Unlocks the Stone Mill, Brick Oven, strawberries and pumpkins.' },
    req: function (s) { return !!s.tech.confection; } },
  { id: 'vaulting', zh: '鳞库学', en: 'Scale Vaulting', cost: { lore: 2000, ore: 600 },
    desc: { zh: '解锁鳞库。', en: 'Unlocks the Scale Vault.' },
    req: function (s) { return !!s.tech.carpentry && s.bld.workshop > 0; } },
  { id: 'latte_art', zh: '拉花', en: 'Latte Art', cost: { lore: 2500, intel: 8 }, eff: { 'priceSt.bar': 0.25 },
    desc: { zh: '吧台类商品售价提高。画的是猫，顾客坚持说是龙。', en: 'Bar goods sell for more. You draw a cat; customers insist it is a dragon.' },
    req: function (s) { return !!s.tech.hospitality && !!s.tech.husbandry; } },
  { id: 'preserving', zh: '腌渍', en: 'Preserving', cost: { lore: 2800, intel: 10 },
    desc: { zh: '解锁腌渍罐与橙树。', en: 'Unlocks the Preserving Jar and orange trees.' },
    req: function (s) { return !!s.tech.confection; } },
  { id: 'tea_culture', zh: '茶道', en: 'Tea Culture', cost: { lore: 3000, intel: 10 },
    desc: { zh: '解锁茶树与茶饮。', en: 'Unlocks tea bushes and tea drinks.' },
    req: function (s) { return !!s.tech.agronomy && !!s.tech.hospitality; } },
  { id: 'window_art', zh: '陈列艺术', en: 'Window Dressing', cost: { lore: 3000, intel: 10 }, eff: { windowChance: 0.04, windowSlots: 1 },
    desc: { zh: '学会把半成品摆得好看。橱窗成交率提高，陈列位 +1。', en: 'Learn to arrange prepared goods nicely. Better window sales and one more slot.' },
    req: function (s) { return !!s.tech.advertising; } },
  { id: 'market_savvy', zh: '淘宝门道', en: 'Market Savvy', cost: { lore: 3200, intel: 12 }, eff: { marketLux: 14 },
    desc: { zh: '摸清了摊主们把好东西藏在哪一层箱子底下。在集市淘宝时，有机会淘到贵重品。', en: 'You learn which crate bottom the stallholders hide the good stuff under. Market rummaging can now turn up treasures.' },
    req: function (s) { return !!s.flags.market && !!s.tech.hospitality; } },
  /* v0.5.1：拿到过任何贵重品后出现。研究后小龙页多一个开关，决定小龙能不能拿贵重品来玩 */
  { id: 'lux_ledger', zh: '珍藏清单', en: 'Treasure Ledger', cost: { lore: 3000, quill: 576 },
    desc: { zh: '给每件贵重品登记造册，锁进柜子。研究后可以在小龙页决定小龙们能不能拿贵重品来玩。小龙们一致认为，被登记过的宝藏失去了灵魂。', en: 'Every treasure gets a catalogue entry and a place in a locked cabinet. Afterwards, the Dragonlings tab lets you decide whether the dragonlings may play with treasures. The dragonlings agree that a catalogued treasure has lost its soul.' },
    req: function (s) { return Object.keys(s.luxSeen || {}).length > 0; } },
  { id: 'wanderlust', zh: '旅行癖', en: 'Wanderlust', cost: { lore: 3000, quill: 576 },
    desc: { zh: '承认吧，你就是想出去玩。解锁 Kirro 的旅行。', en: 'Admit it, you just want to go out. Unlocks Kirro\'s trips.' },
    req: function (s) { return !!s.tech.courier; } },
  { id: 'drills', zh: '演武', en: 'Martial Drills', cost: { lore: 3000, ore: 1500 },
    desc: { zh: '解锁演武场。', en: 'Unlocks the Training Ground.' },
    req: function (s) { return !!s.tech.courier; } },
  { id: 'balneology', zh: '温泉疗养', en: 'Balneology', cost: { lore: 3600, ore: 1000 },
    desc: { zh: '解锁温泉池。', en: 'Unlocks the Hot Spring.' },
    req: function (s) { return !!s.tech.carpentry && !!s.tech.customs; } },
  { id: 'tea_party', zh: '茶会', en: 'Tea Parties', cost: { lore: 3600, quill: 288 },
    desc: { zh: '解锁茶室，并可以举办茶会。', en: 'Unlocks the Tea Room and lets you hold tea parties.' },
    req: function (s) { return !!s.tech.staff_welfare; } },
  { id: 'commerce', zh: '通商', en: 'Commerce', cost: { lore: 4000, quill: 864 },
    desc: { zh: '解锁商栈与贸易。', en: 'Unlocks the Trading Post and Trade.' },
    req: function (s) { return !!s.tech.courier; } },
  { id: 'elementology', zh: '元素学', en: 'Elementology', cost: { lore: 4500, scorch_crystal: 1, freeze_crystal: 1, quill: 1152 },
    desc: { zh: '研究七属性元素结晶。解锁元素建筑。', en: 'Study the seven elemental crystals. Unlocks elemental buildings.' },
    req: function (s) { return !!s.tech.courier; } },
  { id: 'frost_craft', zh: '冰点工艺', en: 'Frost Craft', cost: { lore: 4000, freeze_crystal: 2, quill: 576 },
    desc: { zh: '解锁霜柜、薄荷与冷饮冰品。', en: 'Unlocks the Frost Cabinet, mint, cold drinks and ice cream.' },
    req: function (s) { return !!s.tech.elementology; } },
  { id: 'irrigation', zh: '引水术', en: 'Irrigation', cost: { lore: 5000, drown_crystal: 2, quill: 576 },
    desc: { zh: '解锁引水渠。', en: 'Unlocks the Water Channel.' },
    req: function (s) { return !!s.tech.elementology && !!s.tech.agronomy; } },
  { id: 'cartography', zh: '地图测绘', en: 'Cartography', cost: { lore: 5000, intel: 30, quill: 1152 },
    desc: { zh: '发现更远的派遣地点。', en: 'Reveals more distant destinations.' },
    req: function (s) { return !!s.tech.courier; } },
  { id: 'caramel_art', zh: '焦糖艺术', en: 'Caramel Mastery', cost: { lore: 5000, quill: 864 }, eff: { 'priceSt.torch': 0.5, showMult: 0.25 },
    desc: { zh: 'Rhasari 喷火制作的商品售价提高，解锁炙烤布蕾与凤凰焰芭菲。', en: 'Goods torched by Rhasari sell for more. Unlocks Crème Brûlée and the Phoenix Flambé.' },
    req: function (s) { return !!s.rhasari.joined; } },
  { id: 'astronomy', zh: '天文观测', en: 'Astronomy', cost: { lore: 6000, quill: 1152 },
    desc: { zh: '解锁观星台。流星出现时观测的收获更多。', en: 'Unlocks the Stargazing Deck. Observing shooting stars yields more.' },
    req: function (s) { return !!s.tech.calendar && !!s.tech.courier; } },
  { id: 'mentoring', zh: '带教', en: 'Mentoring', cost: { lore: 6000, quill: 1152 }, eff: { growth: 0.5, trainXp: 0.02, skillXP: 0.01 },
    desc: { zh: '小龙成长得更快，熟练度也涨得更快。', en: 'Dragonlings grow up and learn their jobs faster.' },
    req: function (s) { return !!s.tech.drills; } },
  { id: 'transmutation', zh: '嬗变理论', en: 'Transmutation Theory',
    cost: { lore: 7000, intel: 25, quill: 2304, paralyze_crystal: 1, drown_crystal: 1, corrode_crystal: 1, tremor_crystal: 1, erode_crystal: 1 },
    desc: { zh: '理解元素之间的嬗变。解锁自由炼金。', en: 'Understand how elements transmute into one another. Unlocks Free Alchemy.' },
    req: function (s) { return !!s.tech.elementology; } },
  { id: 'showcase', zh: '展柜陈列', en: 'Showcase', cost: { lore: 6000, quill: 1728 },
    desc: { zh: '解锁展柜，把炼金产物卖给顾客。', en: 'Unlocks Display Cases to sell alchemy products to customers.' },
    req: function (s) { return !!s.tech.transmutation; } },
  { id: 'velvet', zh: '丝绒衬垫', en: 'Velvet Lining', cost: { lore: 7000, quill: 1728 }, eff: { displayChance: 0.012 },
    desc: { zh: '给展柜铺上丝绒。顾客买走展品的概率提高。', en: 'Line the display cases with velvet. Customers are more likely to buy.' },
    req: function (s) { return !!s.tech.showcase; } },
  { id: 'tea_time', zh: '下午茶', en: 'Afternoon Tea', cost: { lore: 8000, quill: 2304 }, eff: { custMult: 0.15 },
    desc: { zh: '顾客更多了。', en: 'More customers.' },
    req: function (s) { return !!s.tech.hospitality && !!s.tech.confection; } },
  { id: 'appraisal', zh: '鉴定术', en: 'Appraisal', cost: { lore: 9000, quill: 2880 }, eff: { itemValue: 0.25 },
    desc: { zh: '物品价值提高。', en: 'Items are worth more.' },
    req: function (s) { return !!s.tech.showcase; } },
  { id: 'steady1', zh: '稳定火候', en: 'Steady Flame', cost: { lore: 10000, scorch_crystal: 5, quill: 3456 }, eff: { alchGap: 15 },
    desc: { zh: '炉温稳住了。炼金产物的最低等级不会低于最高等级以下 15 级。', en: 'The furnace holds steady. The minimum product level is never more than 15 below the maximum.' },
    req: function (s) { return !!s.tech.transmutation; } },
  { id: 'grand_patisserie', zh: '甜点大师', en: 'Grand Pâtisserie', cost: { lore: 12000, quill: 4032 },
    desc: { zh: '解锁星屑舒芙蕾、千层鳞派与宝藏堆蛋糕。', en: 'Unlocks the Stardust Soufflé, Thousand-Scale Pastry and Hoard Cake.' },
    req: function (s) { return !!s.tech.baking && !!s.tech.caramel_art; } },
  { id: 'precision', zh: '精密天平', en: 'Precision Scale', cost: { lore: 12000, tremor_crystal: 5, quill: 4032 }, eff: { alchFail: 0.2 },
    desc: { zh: '炼金失败率降低 20%。', en: 'Alchemy failure chance reduced by 20%.' },
    req: function (s) { return !!s.tech.transmutation; } },
  { id: 'star_chart', zh: '星图', en: 'Star Chart', cost: { lore: 15000, intel: 100, quill: 5760 },
    desc: { zh: '发现龙巢最远处的派遣地点。', en: 'Reveals the farthest destinations of Dragonest.' },
    req: function (s) { return !!s.tech.cartography; } },
  { id: 'steady2', zh: '恒温炉心', en: 'Constant Hearth', cost: { lore: 20000, pure_scorch: 2, quill: 8640 }, eff: { alchGap: 10 },
    desc: { zh: '炉心的温度恒定下来。炼金产物的最低等级不会低于最高等级以下 10 级。', en: 'The heart of the furnace keeps an even heat. The minimum product level is never more than 10 below the maximum.' },
    req: function (s) { return !!s.tech.steady1; } },
  { id: 'precision2', zh: '言灵校准', en: 'Spellword Calibration', cost: { lore: 25000, pure_tremor: 2, quill: 11520 }, eff: { alchFail: 0.2 },
    desc: { zh: '炼金失败率再降低 20%。', en: 'Alchemy failure chance reduced by another 20%.' },
    req: function (s) { return !!s.tech.precision; } }
];

/* 派遣地点。v0.4 起天数为原来的 3 倍。el 为元素偏好权重，cat 为类别偏好权重，lv 为基础物品等级，rec 为推荐战斗等级 */
var DESTS = [
  { id: 'lunavite', zh: '邀月', en: 'Lunavite', area: { zh: '中部岚砂3协', en: 'Central Lansha, District 3' },
    tier: 1, rec: 5, days: 12, intel: 0, dispIntel: 5, lv: 2, clan: 'thorn',
    el: { p: 3, t: 2, e: 1 }, cat: { flo: 3, min: 2, bst: 1, rel: 1, con: 0.5 },
    desc: { zh: '离天穹最近的岚砂协。夜里的百合会朝着月亮开。', en: 'The Lansha district closest to Aethorf. Its lilies open toward the moon at night.' } },
  { id: 'noctflame', zh: '燃夜', en: 'Noctflame', area: { zh: '中部烬痕4协', en: 'Central Jinhen, District 4' },
    tier: 1, rec: 13, days: 15, intel: 8, dispIntel: 6, lv: 3, clan: 'ember',
    el: { s: 4, t: 2 }, cat: { min: 3, rel: 2, bst: 1, flo: 1 },
    desc: { zh: '地热让这里的夜晚也是暖的。', en: 'Geothermal heat keeps the nights warm here.' } },
  { id: 'abysweald', zh: '沧麓', en: 'Abysweald', area: { zh: '中部苍阙6协', en: 'Central Cangque, District 6' },
    tier: 1, rec: 22, days: 15, intel: 10, dispIntel: 7, lv: 4, clan: 'frost',
    el: { d: 4, f: 2 }, cat: { flo: 2, bst: 2, min: 1, rel: 1 },
    desc: { zh: '山脚下的湖泊群，雾气终年不散。', en: 'Lakes at the foot of the mountains, wrapped in mist all year.' } },
  { id: 'vacuumyth', zh: '虚传', en: 'Vacuumyth', area: { zh: '中部嶂渊5协', en: 'Central Zhangyuan, District 5' },
    tier: 2, rec: 36, days: 21, intel: 20, dispIntel: 10, lv: 6, clan: 'necro',
    el: { c: 3, e: 3 }, cat: { rel: 3, min: 2, flo: 1, bst: 1 },
    desc: { zh: '据说这里的一切都只存在于传闻中。小龙们回来时总说不清自己去过哪里。', en: 'They say everything here exists only in rumor. Dragonlings never quite remember where they went.' } },
  { id: 'monifern', zh: '山薇', en: 'Monifern', area: { zh: '东部岚砂2协', en: 'Eastern Lansha, District 2' },
    tier: 2, rec: 46, days: 24, intel: 30, dispIntel: 10, lv: 8, clan: 'thorn',
    el: { p: 3, t: 3, e: 1 }, cat: { flo: 4, bst: 2, min: 1, con: 0.5 },
    desc: { zh: '长满野蔷薇的山坡，风里有花粉，也有雷声。', en: 'Hillsides covered in wild roses. The wind carries pollen, and thunder.' } },
  { id: 'ardorhine', zh: '灼明', en: 'Ardorhine', area: { zh: '南部烬痕1协', en: 'Southern Jinhen, District 1' },
    tier: 3, rec: 55, days: 30, intel: 50, dispIntel: 16, lv: 11, clan: 'ember',
    el: { s: 5, t: 2 }, cat: { min: 3, bst: 2, rel: 1, cry: 0.3 },
    desc: { zh: '火山口附近的石头都是烫的。烬翼氏族的领地。', en: 'Even the stones near the crater are hot. Emberthrone territory.' } },
  { id: 'frostfang', zh: '苍牙', en: 'Frostfang', area: { zh: '北部苍阙1协', en: 'Northern Cangque, District 1' },
    tier: 3, rec: 67, days: 36, intel: 60, dispIntel: 17, lv: 13, clan: 'frost',
    el: { f: 5, d: 2 }, cat: { min: 2, bst: 2, flo: 1, rel: 1, cry: 0.3 },
    desc: { zh: '冰山像獠牙一样刺向天空。霜息氏族的领地。', en: 'Icebergs pierce the sky like fangs. Frostshroud territory.' } },
  { id: 'crimtwlit', zh: '绯暗', en: 'Crimtwlit', area: { zh: '西部嶂渊1协', en: 'Western Zhangyuan, District 1' },
    tier: 3, rec: 78, days: 36, intel: 70, dispIntel: 18, lv: 15, clan: 'necro',
    el: { c: 4, e: 3 }, cat: { rel: 3, bst: 2, flo: 1, min: 1, cry: 0.3 },
    desc: { zh: '这里的暮色永远是红的。冥骸氏族的领地。', en: 'Dusk here is always red. Necroclave territory.' } },
  { id: 'aetholith', zh: '星屿', en: 'Aetholith', area: { zh: '中部极夜2协', en: 'Central Jiye, District 2' },
    tier: 4, rec: 90, days: 45, intel: 120, dispIntel: 23, lv: 19,
    el: { s: 1, f: 1, p: 1, d: 1, c: 1, t: 1, e: 1 }, cat: { min: 2, rel: 2, bst: 1, flo: 1, cry: 0.6 },
    desc: { zh: '极夜协的星之岛，七种元素在这里交汇。', en: 'The star isle of Jiye, where all seven elements meet.' } },
  { id: 'uttermark', zh: '外缘', en: 'Uttermark', area: { zh: '北部苍阙5协', en: 'Northern Cangque, District 5' },
    tier: 5, rec: 150, days: 60, intel: 200, dispIntel: 28, lv: 24,
    el: { f: 3, d: 3, e: 2, s: 1, p: 1, c: 1, t: 1 }, cat: { min: 2, bst: 2, rel: 2, flo: 1, cry: 0.8 },
    desc: { zh: '龙巢的北方尽头，再往外就是巨海 Zylmorak。', en: 'The northern edge of Dragonest. Beyond lies the great sea, Zylmorak.' } }
];

/* Ayrelia 的青睐可兑换的升级。
 * max 为可兑换的级数（默认 1），growth 为每级的价格倍率；repeat 为可无限兑换、每次加价的数值；need 为前置升级 */
var FAVOR_UPS = [
  { id: 'letter2', zh: '第二封信', en: 'A Second Letter', cost: 6, eff: { commSlots: 1 },
    desc: { zh: '“哼，反正我闲着也是闲着。”每季度多一份委托。', en: '"Hmph. I have nothing better to do anyway." One more commission each quarter.' } },
  { id: 'chat', zh: '炉边闲谈', en: 'Fireside Chats', cost: 5, growth: 1.8, max: 7, eff: { 'mult.lore': 0.1 },
    desc: { zh: '她偶尔也会来找你说话，不只是找 Rakuakira。“哼，只是顺路。”每级学识产量 +10%，最多 7 级，价格逐级翻涨。', en: 'Sometimes she comes to talk to you too, not just Rakuakira. "Hmph. I was passing by." Lore +10% per level, up to 7 levels; each level costs much more.' } },
  { id: 'warmth', zh: '余温', en: 'Lingering Warmth', cost: 12, eff: { flameMax: 2, 'mult.coins': 0.1 },
    desc: { zh: '“哼，炉子那么冷，像什么样子。”Rhasari 的火力上限 +2，硬币产量 +10%。', en: '"Hmph. A furnace that cold is an embarrassment." Rhasari\'s max flame +2, coin production +10%.' } },
  { id: 'escort', zh: '烈焰护航', en: 'Flamewing Escort', cost: 18, eff: { dispSpeed: 0.2 },
    desc: { zh: '一道火影偶尔掠过派遣路线的上空。“我才不是在保护它们，只是刚好在那边散步。”派遣速度 +20%。', en: 'A shadow of flame sometimes passes over the expedition routes. "I am not protecting them. I just happened to be taking a walk there." Expedition speed +20%.' } },
  { id: 'field', zh: '防御反击式力场', en: 'Retaliation Field', cost: 25, eff: { noInjury: 1 },
    desc: { zh: 'Ayrelia 为派遣的小龙架起和 Rakuakira 身上一样的力场。“哼，受了伤还得我操心，麻烦。”派遣不再受伤。', en: 'Ayrelia casts the same field she keeps on Rakuakira over your expeditions. "Hmph. If they get hurt I have to worry about it. Tiresome." No more injuries.' } },
  { id: 'letter3', zh: '第三封信', en: 'A Third Letter', cost: 30, need: 'letter2', eff: { commSlots: 1 },
    desc: { zh: '“你别得寸进尺。……就这一封。”每季度再多一份委托。', en: '"Do not push your luck. ...Just this one." Another commission each quarter.' } },
  { id: 'letter4', zh: '第四封信', en: 'A Fourth Letter', cost: 90, need: 'letter3', eff: { commSlots: 1 },
    desc: { zh: '“哼，写信又不费什么力气。”每季度的委托达到 4 份。', en: '"Hmph. Writing letters takes no effort at all." Commissions reach 4 per quarter.' } },
  /* v0.4.11 后期升级：基础资源（硬币、翎鸾、柴薪、矿石、学识、肥料）的储量上限翻倍，独立乘区，在其他加成都算完之后再乘 */
  { id: 'amber', zh: '琥珀枝', en: 'Amber Branch', cost: 240, need: 'letter4', eff: { capMultBasic: 1 },
    desc: { zh: '散发着不会消失的温度，残留着龙族的言灵（kotodama）气息，似乎直接与Ayrelia本龙所处的空间相通。', en: 'It gives off a warmth that never fades and still carries a trace of draconic kotodama, the power of spoken words. It seems to open straight onto the space where Ayrelia, in person, resides.' } },
  { id: 'plume', zh: '求一片落羽', en: 'Ask for a Fallen Plume', cost: 60, repeat: 30, item: 'ayrelia_plume',
    desc: { zh: '“掉下来的羽毛而已，你要就拿去。哼。”获得一片 Ayrelia 的落羽（Lv 48，Rare 6）。每次兑换后价格 +30。', en: '"It is only a feather that fell off. Take it if you want. Hmph." Receive one of Ayrelia\'s Fallen Plumes (Lv 48, Rare 6). Price +30 each time.' } }
];

/* 派遣的路费（铜翎），按地点的远近分级 */
var DEST_COST = { 1: 60, 2: 180, 3: 480, 4: 1440, 5: 3600 };

/* Kirro 每次旅行留下的“旅行见闻”带来的永久效果（每层） */
var MEMORY_EFF = { 'mult.coins': 0.05, custMult: 0.03, itemValue: 0.02 };

/* 小龙名字 */
var DRAGON_NAMES = ('Ember Pip Sorrel Quill Bramble Cinder Tansy Moss Flint Wren Juniper Pebble Sage Thistle Clove Briar ' +
  'Fennel Ash Rowan Nettle Saffron Basil Kestrel Tinder Spark Drizzle Mallow Hazel Cobble Ripple Rune Vesper ' +
  'Lark Marlo Nim Orrin Pallas Quin Rook Sable Tamsin Umber Vale Wick Yarrow Zephyr Alder Bryn Corin Dusk ' +
  'Elm Fig Gale Holly Ivo Jasper Kip Lumen Mica Nox Opal Perry Rill Slate Tuck Brisk Cress Dune Fable ' +
  'Glint Hollis Inky Jolt Knot Loam Murk Nettie Oriel Puck Quartz Rusk Smudge Thorn Ursa Velvet Wisp ' +
  'Brindle Cobalt Dapple Ferrous Gorse Heath Isle Jinx Kindle Lichen Mote Noodle Ochre Plume Rascal ' +
  'Soot Tumble Umbra Vellum Whisker Zinnia Acorn Biscuit Crumpet Dumpling Ginger Muffin Pudding Toffee').split(' ');

/* 顾客种类（用于文案） */
var CUSTOMERS = [
  { zh: '小地龙', en: 'a little drake' },
  { zh: '小飞龙', en: 'a young wyvern' },
  { zh: '刚破壳的雏龙', en: 'a freshly hatched dragonling' },
  { zh: '水蛇龙宝宝', en: 'a baby water serpent' },
  { zh: '苔背小龙', en: 'a mossback dragonling' },
  { zh: '蕨叶小龙', en: 'a fernwing dragonling' },
  { zh: '烬痕协来的小火龙', en: 'a little fire dragon from Jinhen' },
  { zh: '苍阙协来的小冰龙', en: 'a little ice dragon from Cangque' },
  { zh: '迷路的猫头鹰商人', en: 'a lost owl merchant' }
];
