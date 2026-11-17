/* 贵重品、贸易伙伴、成就、日志分类 */

/* 贵重品：参照原版的毛皮、象牙、香料。派遣时随机带回，有库存时每种都能提高幸福度，小龙们会持续把玩消耗。
 * happy 为提供的幸福度（%），use 为每只小龙每秒的消耗，w 为掉落权重，els 为偏好的地点元素，tier 为最低地点等级 */
var LUXURIES = [
  { id: 'shiny_coin', zh: '更闪亮的硬币', en: 'Shinier Coin', happy: 5, use: 0.003, w: 5, els: null, tier: 1,
    desc: { zh: '和普通硬币一模一样，只是更闪亮一点点。龙族认为这一点点就是全部。', en: 'Exactly like a normal coin, only a tiny bit shinier. Dragons consider that tiny bit to be everything.' } },
  { id: 'candy_wrappers', zh: '彩虹糖纸', en: 'Rainbow Candy Wrappers', happy: 4, use: 0.003, w: 4, els: null, tier: 1,
    desc: { zh: '糖早就被吃掉了，但糖纸实在太好看。小龙们把它们一张张抚平，夹在翅膀底下收藏。', en: 'The sweets are long gone, but the wrappers are too pretty to throw away. The dragonlings smooth them flat and keep them tucked under their wings.' } },
  { id: 'marbles', zh: '玻璃弹珠', en: 'Glass Marbles', happy: 6, use: 0.0025, w: 3, els: ['p', 't'], tier: 1,
    desc: { zh: '滚到哪里，小龙就追到哪里。目前已经有三颗滚进了熔铸炉，再也没有出来。', en: 'Wherever they roll, a dragonling follows. Three have rolled into the smelter so far and never came back out.' } },
  { id: 'lava_tear', zh: '熔岩泪珠', en: 'Lava Teardrops', happy: 6, use: 0.0025, w: 3, els: ['s'], tier: 1,
    desc: { zh: '火山冷却时凝成的小珠子，握在爪心里还是温的。烬翼氏族管它叫“火山的眼泪”，火山本人没有回应。', en: 'Little beads left behind when lava cools, still warm in your paw. Emberthrone calls them "the volcano\'s tears". The volcano has not commented.' } },
  { id: 'snow_globe', zh: '霜花雪景球', en: 'Frostbloom Snow Globe', happy: 6, use: 0.0025, w: 3, els: ['f', 'd'], tier: 1,
    desc: { zh: '摇一摇，里面就下雪。小火龙会盯着看一整个下午，然后问能不能搬进去住。', en: 'Shake it and it snows inside. Little fire dragons stare at it all afternoon, then ask if they can move in.' } },
  { id: 'fluorite', zh: '萤石原矿', en: 'Raw Fluorite', happy: 6, use: 0.0025, w: 3, els: ['e', 'c'], tier: 1,
    desc: { zh: '晚上会发光，小龙们终于能在夜里数清自己的宝藏了。然后它们就睡不着了。', en: 'It glows at night, so dragonlings can finally count their hoard in the dark. Then they cannot sleep.' } },
  { id: 'music_box', zh: '小八音盒', en: 'Tiny Music Box', happy: 8, use: 0.0015, w: 1.2, els: null, tier: 2,
    desc: { zh: '只会放一首曲子，还总是放到一半卡住。小龙们一致认为卡住的那一下才是精华。', en: 'It only plays one tune, and always gets stuck halfway. The dragonlings agree the stuck part is the best bit.' } },
  { id: 'pocket_watch', zh: '古董怀表', en: 'Antique Pocket Watch', happy: 8, use: 0.0012, w: 1, els: ['t', 'd'], tier: 3,
    desc: { zh: '早就不走了，不过龙族本来也不太在意时间。它们喜欢的是打开表盖时“咔”的那一声。', en: 'It stopped ages ago, but dragons never cared much about time anyway. What they love is the click when the lid opens.' } },
  { id: 'tiny_crown', zh: '一顶歪掉的小王冠', en: 'A Lopsided Little Crown', happy: 10, use: 0.0008, w: 0.5, els: null, tier: 4,
    desc: { zh: '不知道是哪位小国王落下的。戴上它的小龙会立刻开始用第三人称说话。', en: 'Some little king must have dropped it. Any dragonling who puts it on immediately starts speaking in the third person.' } }
];
/* v0.3.0 的旧 id 到新 id，读档时改名 */
var LUX_RENAME = { glimmer_coin: 'shiny_coin', ember_coin: 'lava_tear', frost_coin: 'snow_globe', humming_coin: 'marbles',
  glow_coin: 'fluorite', twohead_coin: 'music_box', crown_coin: 'tiny_crown' };
var LUX_MAP = {};
LUXURIES.forEach(function (l) {
  LUX_MAP[l.id] = l;
  RESOURCES.push({ id: l.id, zh: l.zh, en: l.en, cap: Infinity, group: 'luxury', desc: l.desc, lux: true,
    unlocked: function (s) { return !!(s.luxSeen && s.luxSeen[l.id]); } });
});

/* 贸易伙伴。wants：交付的商品种类与数量；gives：换回的东西。
 * res 为资源，item 为物品，crystal 为元素结晶，seed 为作物种子（首次贸易必定获得）。
 * best 为最佳月份（收获 +25%），closed 为不营业的月份。unlockDest 为解锁该伙伴所需的派遣地点之一。 */
var TRADE_PARTNERS = [
  { id: 'owls', zh: '猫头鹰王国', en: 'Vohrkthal', color: '#8a6d3b',
    wants: { kind: 'dessert', n: 8 }, cost: { quill: 24 },
    gives: [
      { res: 'lore', min: 300, max: 700 },
      { res: 'honey', min: 5, max: 15, ch: 0.6 },
      { item: 'owl_feather', min: 1, max: 2, ch: 0.5 },
      { res: 'shiny_coin', min: 4, max: 10, ch: 0.5 },
      { res: 'music_box', min: 1, max: 3, ch: 0.12 },
      { seed: 'vanilla' }
    ],
    best: [4], closed: [],
    desc: { zh: '东边的猫头鹰们爱读书、爱讲价，更爱甜品。用学识和香草种子换你的点心。', en: 'The owls to the east love books, haggling and, above all, desserts. They pay in lore and vanilla seeds.' } },
  { id: 'ember', zh: '烬翼氏族', en: 'Emberthrone Ascendancy', color: '#c8501e', unlockDest: ['noctflame', 'ardorhine'],
    wants: { kind: 'drink', n: 10 }, cost: { quill: 24 },
    gives: [
      { crystal: 's', min: 1, max: 3 },
      { res: 'ore', min: 150, max: 400 },
      { item: 'molten_scale', min: 1, max: 1, ch: 0.25 },
      { res: 'lava_tear', min: 5, max: 15, ch: 0.5 },
      { seed: 'coconut' }
    ],
    best: [6], closed: [11],
    desc: { zh: '南方火山脚下的氏族，住得太热，所以什么饮料都要。永霜月冬眠不营业。', en: 'A clan at the foot of southern volcanoes. It is so hot there they will take any drink. Closed in Brucemar for hibernation.' } },
  { id: 'frost', zh: '霜息氏族', en: 'Frostshroud Covenent', color: '#3a8fc4', unlockDest: ['abysweald', 'frostfang'],
    wants: { kind: 'drink', n: 10 }, cost: { quill: 24 },
    gives: [
      { crystal: 'f', min: 1, max: 3 },
      { res: 'firewood', min: 100, max: 250 },
      { item: 'frost_lichen', min: 1, max: 3, ch: 0.4 },
      { res: 'snow_globe', min: 5, max: 15, ch: 0.5 },
      { seed: 'mint' }
    ],
    best: [11], closed: [6],
    desc: { zh: '北方永霜冻土的氏族，最想要热饮。龙焰月太热，他们不下山。', en: 'The clan of the northern Everfrost, desperate for hot drinks. In Ignust it is too hot for them to come down.' } },
  { id: 'thorn', zh: '棘语氏族', en: 'Thornspire Conklave', color: '#3f8f3f', unlockDest: ['lunavite', 'monifern'],
    wants: { kind: 'dessert', n: 8 }, cost: { quill: 24 },
    gives: [
      { res: 'tea', min: 5, max: 15, ch: 0.7 },
      { res: 'strawberry', min: 5, max: 15, ch: 0.5 },
      { crystal: 'p', min: 1, max: 2, ch: 0.6 },
      { crystal: 't', min: 1, max: 2, ch: 0.6 },
      { res: 'marbles', min: 5, max: 15, ch: 0.5 },
      { res: 'candy_wrappers', min: 5, max: 15, ch: 0.4 },
      { seed: 'cocoa' }
    ],
    best: [9], closed: [],
    desc: { zh: '东南林地的氏族，说话带刺，心很软。用茶叶、草莓和可可种子换甜品。', en: 'The south-eastern woodland clan. Thorny words, soft hearts. They trade tea, strawberries and cocoa seeds for desserts.' } },
  { id: 'necro', zh: '冥骸氏族', en: 'Necroclave Syndicate', color: '#7a4a9c', unlockDest: ['vacuumyth', 'crimtwlit'],
    wants: { kind: 'any', n: 12 }, cost: { quill: 24 },
    gives: [
      { crystal: 'c', min: 1, max: 2 },
      { crystal: 'e', min: 1, max: 2 },
      { res: 'intel', min: 3, max: 8 },
      { item: 'ancient_coin', min: 1, max: 1, ch: 0.3 },
      { res: 'fluorite', min: 5, max: 15, ch: 0.5 },
      { seed: 'blueberry' }
    ],
    best: [10], closed: [7],
    desc: { zh: '西方的冥骸氏族什么都收，尤其是秘密。烁光月太亮，他们闭门谢客。', en: 'The western Necroclave buys anything, especially secrets. Lumenary is too bright; they shut their doors.' } }
];

/* 成就。check 返回是否达成 */
var ACHIEVEMENTS = [
  { id: 'first_coin', zh: '第一枚硬币', en: 'First Coin', desc: { zh: '捡起第一枚零钱。', en: 'Pick up your first loose coin.' }, check: function (s) { return s.stats.clicks >= 1; } },
  { id: 'coin_hill', zh: '硬币小山', en: 'A Hill of Coins', desc: { zh: '同时拥有 10000 硬币。', en: 'Hold 10000 coins at once.' }, check: function (s) { return s.res.coins >= 10000; } },
  { id: 'dragons10', zh: '有点热闹', en: 'Getting Lively', desc: { zh: '拥有 10 只小龙。', en: 'Have 10 dragonlings.' }, check: function (s) { return s.dragons.length >= 10; } },
  { id: 'dragons30', zh: '龙满为患', en: 'Dragon-packed', desc: { zh: '拥有 30 只小龙。', en: 'Have 30 dragonlings.' }, check: function (s) { return s.dragons.length >= 30; } },
  { id: 'dragons60', zh: '龙巢的半边天', en: 'Half the Nest', desc: { zh: '拥有 60 只小龙。', en: 'Have 60 dragonlings.' }, check: function (s) { return s.dragons.length >= 60; } },
  { id: 'workshop', zh: '开张大吉', en: 'Grand Opening', desc: { zh: '建成工坊。', en: 'Build the workshop.' }, check: function (s) { return s.bld.workshop > 0; } },
  { id: 'served100', zh: '百位客人', en: 'A Hundred Guests', desc: { zh: '招待 100 位顾客。', en: 'Serve 100 customers.' }, check: function (s) { return s.stats.served >= 100; } },
  { id: 'served1000', zh: '门庭若市', en: 'Bustling', desc: { zh: '招待 1000 位顾客。', en: 'Serve 1000 customers.' }, check: function (s) { return s.stats.served >= 1000; } },
  { id: 'served10000', zh: '龙巢名店', en: 'Famous Across Dragonest', desc: { zh: '招待 10000 位顾客。', en: 'Serve 10000 customers.' }, check: function (s) { return s.stats.served >= 10000; } },
  { id: 'menu10', zh: '菜单变厚了', en: 'A Thicker Menu', desc: { zh: '解锁 10 种商品。', en: 'Unlock 10 goods.' }, check: function (s) { return GOODS_LIST.filter(function (f) { return foodUnlocked(f, s); }).length >= 10; } },
  { id: 'menu25', zh: '翻不完的菜单', en: 'Endless Menu', desc: { zh: '解锁 25 种商品。', en: 'Unlock 25 goods.' }, check: function (s) { return GOODS_LIST.filter(function (f) { return foodUnlocked(f, s); }).length >= 25; } },
  { id: 'stoker', zh: '烧火鸟', en: 'Stoker Bird', desc: { zh: '叫 Rhasari“烧火鸟”10 次。她都记着呢。', en: 'Call Rhasari a stoker bird 10 times. She remembers every one.' }, check: function (s) { return s.stats.insults >= 10; } },
  { id: 'sister', zh: '姐姐来了', en: 'Big Sister Is Here', desc: { zh: 'Lysari 第一次来访。', en: 'Lysari visits for the first time.' }, check: function (s) { return s.lysari.visits >= 1; } },
  { id: 'raku12', zh: '按规定签收', en: 'Signed for, as Required', desc: { zh: '让 Rakuakira 在窗台吃到 12 次零食。', en: 'Let Rakuakira have a windowsill snack 12 times.' }, check: function (s) { return s.stats.rakuFed >= 12; } },
  { id: 'harvest100', zh: '丰收', en: 'Bountiful', desc: { zh: '收获 100 次作物。', en: 'Harvest crops 100 times.' }, check: function (s) { return s.stats.harvests >= 100; } },
  { id: 'compost', zh: '杂质也是资源', en: 'Waste Not', desc: { zh: '把一份杂质扔进堆肥箱。', en: 'Compost an impurity.' }, check: function (s) { return s.stats.composted >= 1; } },
  { id: 'first_alch', zh: '第一缕炉烟', en: 'First Wisp of Smoke', desc: { zh: '完成第一次自由炼金。', en: 'Complete your first free transmutation.' }, check: function (s) { return s.stats.alch >= 1; } },
  { id: 'brick', zh: '失败是成功之母', en: 'Failure Is a Teacher', desc: { zh: '用七份杂质炼出一块还算像样的砖。', en: 'Turn seven impurities into a passable brick.' }, check: function (s) { return !!s.recipes.r_brick; } },
  { id: 'prism', zh: '七曜', en: 'Seven Lights', desc: { zh: '炼出七曜棱镜。', en: 'Create the Heptachrome Prism.' }, check: function (s) { return !!s.recipes.r_prism; } },
  { id: 'codex100', zh: '收藏家', en: 'Collector', desc: { zh: '图鉴收录 100 种物品。', en: 'Record 100 items in the codex.' }, check: function (s) { return Object.keys(s.seen).length >= 100; } },
  { id: 'codex250', zh: '博物学家', en: 'Naturalist', desc: { zh: '图鉴收录 250 种物品。', en: 'Record 250 items in the codex.' }, check: function (s) { return Object.keys(s.seen).length >= 250; } },
  { id: 'uttermark', zh: '世界尽头', en: 'World\'s Edge', desc: { zh: '完成一次前往外缘的派遣。', en: 'Complete an expedition to Uttermark.' }, check: function (s) { return (s.stats.dispDone.uttermark || 0) >= 1; } },
  { id: 'master', zh: '大师傅', en: 'Old Hand', desc: { zh: '有一只小龙在某项工作上达到大师。', en: 'A dragonling reaches Master in a job.' }, check: function (s) { return s.dragons.some(function (d) { for (var k in d.skills) if (d.skills[k] >= 9000) return true; return false; }); } },
  { id: 'happy150', zh: '幸福满溢', en: 'Overflowing Joy', desc: { zh: '幸福度达到 150%。', en: 'Reach 150% happiness.' }, check: function (s) { return (G.happy || 0) >= 150; } },
  { id: 'party', zh: '茶会开始了', en: 'Let the Party Begin', desc: { zh: '举办第一场茶会。', en: 'Hold your first tea party.' }, check: function (s) { return s.stats.parties >= 1; } },
  { id: 'star', zh: '看见流星', en: 'A Shooting Star', desc: { zh: '观测到一次流星。', en: 'Observe a shooting star.' }, check: function (s) { return s.stats.stars >= 1; } },
  { id: 'trader', zh: '五方来客', en: 'Friends in Five Places', desc: { zh: '与全部五个贸易伙伴各交易一次。', en: 'Trade with all five partners.' }, check: function (s) { return TRADE_PARTNERS.every(function (p) { return (s.trade.count[p.id] || 0) >= 1; }); } },
  { id: 'traveler', zh: '旅行家', en: 'Globetrotter', desc: { zh: '完成 5 次旅行。', en: 'Complete 5 trips.' }, check: function (s) { return s.trip.count >= 5; } },
  { id: 'release', zh: '有缘再见', en: 'Until We Meet Again', desc: { zh: '放生一只小龙。', en: 'Release a dragonling.' }, check: function (s) { return s.stats.released >= 1; } },
  { id: 'comm20', zh: '可靠的工坊', en: 'Reliable Workshop', desc: { zh: '完成 20 份委托。', en: 'Complete 20 commissions.' }, check: function (s) { return s.comm.done >= 20; } },
  { id: 'gold1', zh: '第一枚金翎', en: 'First Gold Quill', desc: { zh: '同时持有 1 金翎。', en: 'Hold 1 gold quill at once.' }, check: function (s) { return (s.res.quill || 0) >= QUILL_GOLD; } },
  { id: 'window10', zh: '橱窗里的风景', en: 'Window Shopping', desc: { zh: '橱窗卖出 10 件半成品。', en: 'Sell 10 prepared goods from the window.' }, check: function (s) { return (s.stats.windowSold || 0) >= 10; } },
  { id: 'lux7', zh: '闪闪发光收藏家', en: 'Collector of Shiny Things', desc: { zh: '集齐全部贵重品。', en: 'Collect every kind of treasure.' }, check: function (s) { return LUXURIES.every(function (l) { return s.luxSeen && s.luxSeen[l.id]; }); } }
];

/* 日志分类，用于日志筛选 */
var LOG_CATS = [
  { id: 'story', zh: '剧情', en: 'Story' },
  { id: 'month', zh: '月份', en: 'Months' },
  { id: 'shop', zh: '营业', en: 'Shop' },
  { id: 'dragon', zh: '小龙', en: 'Dragonlings' },
  { id: 'oc', zh: '来客', en: 'Visitors' },
  { id: 'disp', zh: '派遣', en: 'Expeditions' },
  { id: 'alch', zh: '炼金', en: 'Alchemy' },
  { id: 'farm', zh: '草地', en: 'Meadow' },
  { id: 'trade', zh: '贸易', en: 'Trade' },
  { id: 'sys', zh: '系统', en: 'System' }
];
