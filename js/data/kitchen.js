/* 草地与后厨：作物、食材、工位、半成品与商品
 * 这个文件会把食材、半成品、商品追加进 RESOURCES。 */

/* 作物。days 为生长天数，yld 为基础产量，seed 为每次播种的硬币，pref 为喜欢的月份，hate 为讨厌的月份（都从 0 起算）。
 * 在讨厌的月份收获，产量只有四分之一；受温室保护的地块不受影响。讨厌的月份按现实中的习性挑选 */
var CROPS = [
  { id: 'coffee', res: 'beans', zh: '咖啡树', en: 'Coffee Shrub', days: 10, yld: 22, seed: 20, pref: [3, 4, 5, 6], hate: [0, 1, 10, 11], tech: 'agronomy',
    desc: { zh: '结出的豆子能让一整窝小龙熬夜。请勿让幼龙直接啃。', en: 'Its beans can keep a whole nest awake all night. Do not let hatchlings chew them raw.' } },
  { id: 'cane', res: 'sugar', zh: '甘蔗', en: 'Sugarcane', days: 8, yld: 18, seed: 15, pref: [5, 6, 7, 8], hate: [0, 1, 10, 11], tech: 'agronomy',
    desc: { zh: 'Rhasari 认为它是一种可以直接啃的焦糖原料，这个认识基本正确。', en: 'Rhasari considers it chewable raw caramel, which is basically correct.' } },
  { id: 'wheat', res: 'wheat', zh: '小麦', en: 'Wheat', days: 8, yld: 18, seed: 10, pref: [2, 3, 4, 8], hate: [5, 6, 7], tech: 'agronomy',
    desc: { zh: '风吹过时会沙沙作响，小龙们会跟着一起摇头晃脑。', en: 'It rustles in the wind, and the dragonlings sway along.' } },
  { id: 'strawberry', res: 'strawberry', zh: '草莓', en: 'Strawberry', days: 6, yld: 12, seed: 25, pref: [2, 3, 4], hate: [5, 6, 7, 11], tech: 'baking',
    desc: { zh: '长得很低，所以总是被路过的小龙先尝一口。', en: 'It grows low, so passing dragonlings always get the first bite.' } },
  { id: 'pumpkin', res: 'pumpkin', zh: '南瓜', en: 'Pumpkin', days: 12, yld: 15, seed: 20, pref: [8, 9, 10], hate: [0, 1, 11], tech: 'baking',
    desc: { zh: '长到最大时可以当小龙的床。请不要真的睡进去。', en: 'Fully grown, it could be a dragonling\'s bed. Please do not actually sleep in it.' } },
  { id: 'tea', res: 'tea', zh: '茶树', en: 'Tea Bush', days: 9, yld: 15, seed: 30, pref: [3, 4, 9], hate: [0, 6, 7, 11], tech: 'tea_culture',
    desc: { zh: '叶子要趁嫩摘。摘早了苦，摘晚了更苦。', en: 'Pick the leaves young. Too early is bitter. Too late is more bitter.' } },
  { id: 'orange', res: 'orange', zh: '橙树', en: 'Orange Tree', days: 10, yld: 15, seed: 30, pref: [8, 9, 10], hate: [0, 1, 11], tech: 'preserving',
    desc: { zh: '开花的时候整片草地都是香的，连 Rakuakira 都会多停一会儿。', en: 'When it blooms the whole meadow smells sweet. Even Rakuakira lingers.' } },
  { id: 'mint', res: 'mint', zh: '薄荷', en: 'Mint', days: 5, yld: 12, seed: 15, pref: [1, 2, 3, 4, 5], hate: [6, 7, 8, 11], tech: 'frost_craft',
    desc: { zh: '生命力顽强得可怕。种一次，它就是你的邻居了，永远。', en: 'Terrifyingly hardy. Plant it once and it is your neighbor. Forever.' } },
  { id: 'cocoa', res: 'cocoa', zh: '可可树', en: 'Cocoa Tree', days: 12, yld: 15, seed: 40, pref: [5, 6, 7], hate: [0, 1, 9, 10, 11],
    desc: { zh: '棘语氏族说可可豆曾被当作货币。龙族对此深表认同。种子只能通过贸易获得。', en: 'Thornspire says cocoa beans were once used as money. Dragons strongly approve. Seeds come only from trade.' } },
  { id: 'vanilla', res: 'vanilla', zh: '香草', en: 'Vanilla Vine', days: 14, yld: 9, seed: 60, pref: [6, 7], hate: [0, 1, 2, 10, 11],
    desc: { zh: '猫头鹰们为了它可以讨价还价一整晚。结荚慢，脾气大。种子只能通过贸易获得。', en: 'The owls will haggle all night over it. Slow to pod, short of temper. Seeds come only from trade.' } },
  { id: 'coconut', res: 'coconut', zh: '椰子树', en: 'Coconut Palm', days: 14, yld: 11, seed: 50, pref: [6, 7], hate: [0, 9, 10, 11],
    desc: { zh: '烬翼氏族的海边特产。熟透的椰子会自己掉下来，请戴好头盔。种子只能通过贸易获得。', en: 'A seaside specialty of the Emberthrone. Ripe coconuts fall on their own; wear a helmet. Seeds come only from trade.' } },
  { id: 'blueberry', res: 'blueberry', zh: '蓝莓', en: 'Blueberry', days: 7, yld: 17, seed: 25, pref: [7, 8, 9], hate: [2, 5, 6],
    desc: { zh: '冥骸氏族说它是“暮色凝成的果子”。吃多了舌头会变紫。种子只能通过贸易获得。', en: 'Necroclave calls it fruit made of condensed dusk. Too many turn your tongue purple. Seeds come only from trade.' } }
];

/* 食材资源 */
var INGREDIENTS = [
  { id: 'beans', zh: '咖啡豆', en: 'Coffee Beans', crop: 'coffee', desc: { zh: '烘过以后闻起来像清晨，尝起来像加班。', en: 'Roasted, it smells like morning and tastes like overtime.' } },
  { id: 'sugar', zh: '红糖', en: 'Brown Sugar', crop: 'cane', desc: { zh: '布丁的灵魂。', en: 'The soul of a pudding.' } },
  { id: 'wheat', zh: '小麦', en: 'Wheat', crop: 'wheat', desc: { zh: '磨成面粉才算有出息。', en: 'Only amounts to something once milled.' } },
  { id: 'strawberry', zh: '草莓', en: 'Strawberries', crop: 'strawberry', desc: { zh: '红得很认真。', en: 'Very earnestly red.' } },
  { id: 'pumpkin', zh: '南瓜', en: 'Pumpkins', crop: 'pumpkin', desc: { zh: '敲起来咚咚响，小龙们拿它当鼓。', en: 'Goes thunk when knocked. The dragonlings use it as a drum.' } },
  { id: 'tea', zh: '茶叶', en: 'Tea Leaves', crop: 'tea', desc: { zh: '晒干后卷成小小的龙尾形状。', en: 'Dries into little curls shaped like dragon tails.' } },
  { id: 'orange', zh: '橙子', en: 'Oranges', crop: 'orange', desc: { zh: '剥皮时会溅进眼睛，这是橙子唯一的武器。', en: 'Squirts you in the eye when peeled. Its only weapon.' } },
  { id: 'mint', zh: '薄荷', en: 'Mint', crop: 'mint', desc: { zh: '嚼一片，呼出来的气能结霜。', en: 'Chew a leaf and your breath frosts over.' } },
  { id: 'cocoa', zh: '可可豆', en: 'Cocoa Beans', crop: 'cocoa', desc: { zh: '苦得很有骨气。', en: 'Bitter with great dignity.' } },
  { id: 'vanilla', zh: '香草荚', en: 'Vanilla Pods', crop: 'vanilla', desc: { zh: '又贵又香，像一位矜持的贵族。', en: 'Pricey and fragrant, like a reserved aristocrat.' } },
  { id: 'coconut', zh: '椰子', en: 'Coconuts', crop: 'coconut', desc: { zh: '外壳硬到可以拿去当盾牌。', en: 'The shell is hard enough to use as a shield.' } },
  { id: 'blueberry', zh: '蓝莓', en: 'Blueberries', crop: 'blueberry', desc: { zh: '一颗一颗，像缩小的夜空。', en: 'Each one like a tiny night sky.' } },
  { id: 'milk', zh: '鲜奶', en: 'Milk', bld: 'pen', desc: { zh: '云羊产的奶，喝起来轻飘飘的。', en: 'Cloudsheep milk. It tastes weightless.' } },
  { id: 'eggs', zh: '鸡蛋', en: 'Eggs', bld: 'henhouse', desc: { zh: '灰羽鸡保证这些蛋绝对不会孵出小龙，请放心使用。', en: 'The hens promise these will never hatch into dragonlings. Use with confidence.' } },
  { id: 'honey', zh: '蜂蜜', en: 'Honey', bld: 'beehive', desc: { zh: '每一勺都是用蜜蜂对你的报复换来的。', en: 'Every spoonful was paid for in bee stings on you.' } }
];

/* 工位 */
var STATIONS = {
  stove: { zh: '土灶', en: 'Clay Stove' },
  bar: { zh: '咖啡吧台', en: 'Coffee Bar' },
  pot: { zh: '小铜锅', en: 'Copper Pot' },
  churn: { zh: '搅奶桶', en: 'Butter Churn' },
  mill: { zh: '石磨', en: 'Stone Mill' },
  oven: { zh: '砖烤炉', en: 'Brick Oven' },
  jar: { zh: '腌渍罐', en: 'Preserving Jar' },
  frost: { zh: '霜柜', en: 'Frost Cabinet' },
  torch: { zh: 'Rhasari 的火', en: 'Rhasari\'s flame' }
};

/* 半成品与商品。kind：proc 半成品，drink 饮品，dessert 甜品。
 * inp 为原料，flame 为需要的 Rhasari 火力，price 为售价（铜翎）。
 * 半成品可以摆进橱窗出售，也可以继续加工成更值钱的东西；饮品与甜品在柜台上卖给顾客。
 * work 为制作所需的工作量，不写时按原料种类和售价自动推算。 */
var FOODS = [
  /* 半成品：第一层，直接由作物加工 */
  { id: 'roasted_beans', kind: 'proc', st: 'stove', inp: { beans: 4 }, price: 2, zh: '烘焙咖啡豆', en: 'Roasted Beans',
    desc: { zh: '烘到冒油的时候，整条街的龙都会探头进来问是不是着火了。', en: 'Roasted until glossy. Every dragon on the street pokes its head in to ask if something is on fire.' } },
  { id: 'sugar_cube', kind: 'proc', st: 'stove', inp: { sugar: 4 }, price: 2, zh: '红糖块', en: 'Brown Sugar Cubes',
    desc: { zh: '熬干切块，方方正正。小龙们用它搭过一座城堡，然后把城堡吃掉了。', en: 'Boiled down and cut into neat cubes. The dragonlings once built a castle out of them, then ate the castle.' } },
  { id: 'toasted_wheat', kind: 'proc', st: 'stove', inp: { wheat: 5 }, price: 2, zh: '烤麦片', en: 'Toasted Wheat Flakes',
    desc: { zh: '咔嚓咔嚓，听起来像有人在踩落叶。', en: 'Crunch, crunch. It sounds like someone stepping on autumn leaves.' } },
  { id: 'malt_taffy', kind: 'proc', st: 'stove', inp: { wheat: 3, sugar: 3 }, price: 3, zh: '麦芽糖', en: 'Malt Taffy',
    desc: { zh: '能拉得很长很长。目前的纪录是从柜台一直拉到门口，然后粘住了 Rakuakira。', en: 'It stretches very, very far. The record is from the counter to the door, where it stuck to Rakuakira.' } },
  { id: 'pumpkin_puree', kind: 'proc', st: 'stove', inp: { pumpkin: 3 }, price: 3, zh: '南瓜泥', en: 'Pumpkin Purée',
    desc: { zh: '南瓜终于不再是一张床，而是一碗泥了。它对此不予置评。', en: 'The pumpkin is no longer a bed but a bowl of mash. It has declined to comment.' } },
  { id: 'roasted_tea', kind: 'proc', st: 'stove', inp: { tea: 4 }, price: 3, zh: '焙茶', en: 'Roasted Tea',
    desc: { zh: '把绿茶烤成褐色，苦味就变成了一种很体面的焦香。', en: 'Roast green tea until brown and the bitterness turns into a very respectable toastiness.' } },
  { id: 'flour', kind: 'proc', st: 'mill', inp: { wheat: 5 }, price: 2, zh: '面粉', en: 'Flour',
    desc: { zh: '撒得到处都是，小龙们会因此变成白色一段时间。', en: 'Gets everywhere. The dragonlings stay white for a while.' } },
  { id: 'cocoa_powder', kind: 'proc', st: 'mill', inp: { cocoa: 3 }, price: 4, zh: '可可粉', en: 'Cocoa Powder',
    desc: { zh: '打喷嚏前请远离它。', en: 'Step away from it before you sneeze.' } },
  { id: 'matcha', kind: 'proc', st: 'mill', inp: { tea: 5 }, price: 5, zh: '抹茶粉', en: 'Matcha Powder',
    desc: { zh: '绿得像春天，苦得像春天的考试。', en: 'Green as spring, bitter as spring exams.' } },
  { id: 'coconut_milk', kind: 'proc', st: 'mill', inp: { coconut: 2 }, price: 4, zh: '椰奶', en: 'Coconut Milk',
    desc: { zh: '椰子终于肯交出它的秘密了。', en: 'The coconut finally surrenders its secret.' } },
  { id: 'cream', kind: 'proc', st: 'churn', inp: { milk: 4 }, price: 3, zh: '奶油', en: 'Fresh Cream',
    desc: { zh: '搅奶桶摇了一下午的成果。负责摇桶的小龙现在爪子还在抖。', en: 'An afternoon of churning. The dragonling on duty is still shaking.' } },
  { id: 'jam', kind: 'proc', st: 'pot', inp: { strawberry: 5, sugar: 2 }, price: 6, zh: '草莓酱', en: 'Strawberry Jam',
    desc: { zh: '熬的时候整个工坊都是甜的，连铜锅都哼起了歌。', en: 'While it simmers the whole workshop smells sweet. Even the pot hums.' } },
  { id: 'mint_candy', kind: 'proc', st: 'frost', inp: { mint: 3, sugar_cube: 1 }, price: 6, zh: '薄荷糖', en: 'Mint Drops',
    desc: { zh: '含一颗，说话会冒白气。适合在龙焰月假装自己是冰龙。', en: 'Suck on one and your words come out frosty. Perfect for pretending to be an ice dragon in Ignust.' } },

  /* 半成品：第二层，由半成品再加工 */
  { id: 'butter', kind: 'proc', st: 'churn', inp: { cream: 2 }, price: 7, zh: '黄油', en: 'Butter',
    desc: { zh: '奶油再摇一下午就成了黄油。负责摇桶的那只小龙已经申请调岗了。', en: 'Churn the cream for another afternoon and you get butter. The churning dragonling has requested a transfer.' } },
  { id: 'caramel_sauce', kind: 'proc', st: 'pot', inp: { sugar_cube: 2, milk: 1 }, price: 7, zh: '焦糖酱', en: 'Caramel Sauce',
    desc: { zh: '熬到琥珀色就要立刻离火。Rhasari 认为不用离火，直接朝它喷一口就行。', en: 'Take it off the heat the moment it turns amber. Rhasari believes you can just breathe on it instead.' } },
  { id: 'cocoa_sauce', kind: 'proc', st: 'pot', inp: { cocoa_powder: 1, milk: 2, sugar: 2 }, price: 9, zh: '可可酱', en: 'Cocoa Sauce',
    desc: { zh: '浓稠得可以把勺子立住。', en: 'Thick enough to stand a spoon in.' } },
  { id: 'toffee', kind: 'proc', st: 'pot', inp: { caramel_sauce: 1, butter: 1 }, price: 18, zh: '太妃糖', en: 'Toffee',
    desc: { zh: '黏牙，非常黏牙。小龙吃完以后会安静很久，因为嘴张不开。', en: 'It sticks to your teeth. Very much so. Dragonlings go quiet for a long time afterward, because they cannot open their mouths.' } },

  /* 饮品 */
  { id: 'coffee', kind: 'drink', st: 'bar', inp: { beans: 4 }, price: 2, tech: 'roasting', zh: '黑咖啡', en: 'Black Coffee',
    desc: { zh: '苦，但诚实。喝完的小龙会精神抖擞地去挖一整晚的洞。', en: 'Bitter, but honest. Dragonlings who drink it dig holes all night.' } },
  { id: 'sugar_coffee', kind: 'drink', st: 'bar', inp: { beans: 4, sugar_cube: 1 }, price: 5, zh: '红糖咖啡', en: 'Brown Sugar Coffee',
    desc: { zh: '苦里带甜，像一句“哼，才不是特意给你做的”。', en: 'Bitter with a sweet finish, like a "hmph, it is not like I made it for you."' } },
  { id: 'latte', kind: 'drink', st: 'bar', inp: { beans: 4, milk: 2 }, price: 5, zh: '拿铁', en: 'Latte',
    desc: { zh: '拉花画的是猫，顾客坚持说是龙。双方至今没有达成共识。', en: 'The foam art is a cat. Customers insist it is a dragon. No consensus yet.' } },
  { id: 'malt_milk', kind: 'drink', st: 'bar', inp: { malt_taffy: 1, milk: 3 }, price: 7, zh: '麦芽牛奶', en: 'Malted Milk',
    desc: { zh: '喝完会犯困，所以只在打烊前卖，也只卖给不用值夜班的龙。', en: 'It makes you sleepy, so it is only sold before closing. And only to dragons not on the night shift.' } },
  { id: 'honey_tea', kind: 'drink', st: 'bar', inp: { tea: 4, honey: 2 }, price: 6, tech: 'tea_culture', zh: '蜂蜜红茶', en: 'Honey Black Tea',
    desc: { zh: '暖暖的一杯，适合在冥纱月的傍晚捧着发呆。', en: 'A warm cup for staring into space on an Umbrile evening.' } },
  { id: 'pumpkin_latte', kind: 'drink', st: 'bar', inp: { beans: 4, milk: 2, pumpkin_puree: 1 }, price: 10, zh: '南瓜拿铁', en: 'Pumpkin Latte',
    desc: { zh: '橡实月限定的味道。喝完会突然很想穿上毛衣，即使你本来就有毛。', en: 'Tastes like Quercen. It makes you want to put on a sweater, even though you already have fur.' } },
  { id: 'hojicha_latte', kind: 'drink', st: 'bar', inp: { roasted_tea: 1, milk: 3, honey: 1 }, price: 10, zh: '焙茶拿铁', en: 'Hojicha Latte',
    desc: { zh: '带着烟熏味的温柔。Rakuakira 说这是“很有分寸的一杯”。', en: 'A smoky kind of gentle. Rakuakira calls it "a very well-mannered cup".' } },
  { id: 'hot_cocoa', kind: 'drink', st: 'pot', inp: { cocoa_powder: 1, milk: 3, sugar: 2 }, price: 10, zh: '热可可', en: 'Hot Cocoa',
    desc: { zh: '冬天的硬通货。永霜月里，它比翎鸾还好用。', en: 'Winter\'s hardest currency. In Brucemar it spends better than quills.' } },
  { id: 'matcha_latte', kind: 'drink', st: 'bar', inp: { matcha: 1, milk: 3, sugar: 2 }, price: 12, zh: '抹茶拿铁', en: 'Matcha Latte',
    desc: { zh: '绿色的。小龙们第一次见到时以为是苔藓汤。', en: 'It is green. The dragonlings first thought it was moss soup.' } },
  { id: 'starlit_tea', kind: 'drink', st: 'bar', inp: { tea: 3, orange: 2, honey: 2 }, price: 12, zh: '星誓花茶', en: 'Starlit Blossom Tea',
    desc: { zh: '橙花和蜂蜜在杯底沉成一小片星空。适合许愿，不保证实现。', en: 'Blossom and honey settle into a tiny starry sky. Good for wishes. No guarantees.' } },
  { id: 'caramel_latte', kind: 'drink', st: 'bar', inp: { beans: 4, milk: 2, caramel_sauce: 1 }, price: 14, zh: '焦糖拿铁', en: 'Caramel Latte',
    desc: { zh: '焦糖在奶泡上绕了一圈。顾客说像龙鳞，Kirro 说像猫毛。', en: 'A caramel swirl on the foam. Customers say it looks like a scale. You say it looks like cat fur.' } },
  { id: 'ember_shot', kind: 'drink', st: 'torch', inp: { roasted_beans: 2 }, flame: 1, price: 15, zh: '余烬浓缩', en: 'Ember Espresso',
    desc: { zh: '由 Rhasari 亲口加热。喝下去之后，打嗝会冒烟。', en: 'Heated personally by Rhasari. Afterward, your burps come out smoking.' } },
  { id: 'mocha', kind: 'drink', st: 'bar', inp: { beans: 4, milk: 2, cocoa_sauce: 1 }, price: 16, zh: '摩卡', en: 'Mocha',
    desc: { zh: '咖啡和可可的联姻，婚礼上请了很多奶泡。', en: 'The marriage of coffee and cocoa. Lots of foam was invited to the wedding.' } },
  { id: 'mint_tea', kind: 'drink', st: 'frost', inp: { mint: 4, sugar: 2 }, price: 5, zh: '冰薄荷茶', en: 'Iced Mint Tea',
    desc: { zh: '清凉得让小火龙打了个寒颤，然后又要了一杯。', en: 'So cool it makes little fire dragons shiver. They order another anyway.' } },
  { id: 'orange_fizz', kind: 'drink', st: 'frost', inp: { orange: 4, sugar: 2 }, price: 6, zh: '橙子汽水', en: 'Orange Fizz',
    desc: { zh: '气泡是请麻痹属性的小龙对着杯子瞪出来的。', en: 'The fizz comes from a Paralyze dragonling glaring at the glass.' } },
  { id: 'berry_shake', kind: 'drink', st: 'frost', inp: { blueberry: 4, milk: 2, honey: 1 }, price: 10, zh: '蓝莓奶昔', en: 'Blueberry Shake',
    desc: { zh: '喝完舌头会变成紫色，小龙们会互相比谁更紫。', en: 'It turns your tongue purple. The dragonlings compete over whose is purplest.' } },
  { id: 'coconut_slush', kind: 'drink', st: 'frost', inp: { coconut_milk: 2, sugar: 2 }, price: 12, zh: '椰奶冰沙', en: 'Coconut Slush',
    desc: { zh: '喝太快会脑袋疼。龙族也一样。', en: 'Drink too fast and your head hurts. Dragons too.' } },

  /* 甜品 */
  { id: 'porridge', kind: 'dessert', st: 'stove', inp: { toasted_wheat: 1, sugar_cube: 1 }, price: 6, zh: '红糖麦片粥', en: 'Sugar Oat Porridge',
    desc: { zh: '热乎乎的一碗。刚破壳的雏龙最爱，吃完会打一个奶声奶气的嗝。', en: 'A warm bowl. Fresh hatchlings love it, and let out a tiny squeaky burp afterward.' } },
  { id: 'pudding', kind: 'dessert', st: 'pot', inp: { milk: 2, eggs: 2, sugar: 2 }, price: 6, tech: 'confection', zh: '布丁', en: 'Pudding',
    desc: { zh: '在盘子里抖个不停，看起来比顾客还紧张。', en: 'It wobbles on the plate, more nervous than the customer.' } },
  { id: 'paw_cookie', kind: 'dessert', st: 'oven', inp: { flour: 1, sugar: 2, eggs: 1 }, price: 6, zh: '猫爪曲奇', en: 'Paw-print Cookies',
    desc: { zh: '模具是按你的爪印做的。小龙们一直在研究为什么只有四个趾头。', en: 'The mold is your own paw print. The dragonlings keep wondering why there are only four toes.' } },
  { id: 'malt_biscuit', kind: 'dessert', st: 'oven', inp: { flour: 1, malt_taffy: 1 }, price: 7, zh: '麦芽饼干', en: 'Malt Biscuits',
    desc: { zh: '咬下去先脆后黏，像一段开局不太顺利的友谊。', en: 'Crisp first, chewy later, like a friendship off to a bumpy start.' } },
  { id: 'candied_peel', kind: 'dessert', st: 'jar', inp: { orange: 4, sugar: 4 }, price: 8, zh: '糖渍橙皮', en: 'Candied Orange Peel',
    desc: { zh: '橙子把最倔强的部分交给了糖，糖把它哄软了。', en: 'The orange gave its most stubborn part to the sugar, and the sugar sweet-talked it soft.' } },
  { id: 'honey_berries', kind: 'dessert', st: 'jar', inp: { blueberry: 5, honey: 2 }, price: 9, zh: '蜜渍蓝莓', en: 'Honeyed Blueberries',
    desc: { zh: '一罐暮色，泡在蜂蜜里。', en: 'A jar of dusk, soaked in honey.' } },
  { id: 'cocoa_cookie', kind: 'dessert', st: 'oven', inp: { flour: 1, cocoa_powder: 1, sugar: 2 }, price: 10, zh: '可可曲奇', en: 'Cocoa Cookies',
    desc: { zh: '比猫爪曲奇更黑，据说更适合在夜里偷吃。', en: 'Darker than the paw cookies. Said to be better for midnight snacking.' } },
  { id: 'coconut_pudding', kind: 'dessert', st: 'pot', inp: { coconut_milk: 1, eggs: 2, sugar: 2 }, price: 12, zh: '椰奶布丁', en: 'Coconut Pudding',
    desc: { zh: '比普通布丁更白、更抖、更有海边度假的气质。', en: 'Whiter, wobblier and more beach-holiday than a normal pudding.' } },
  { id: 'cream_puff', kind: 'dessert', st: 'oven', inp: { flour: 1, eggs: 2, cream: 1 }, price: 13, zh: '奶油泡芙', en: 'Cream Puffs',
    desc: { zh: '咬这一头，奶油会从另一头喷出来，请注意站位。', en: 'Bite one end and the cream shoots out the other. Mind where you stand.' } },
  { id: 'honey_cake', kind: 'dessert', st: 'oven', inp: { flour: 2, eggs: 3, honey: 2 }, price: 14, zh: '蜂蜜蛋糕', en: 'Honey Sponge Cake',
    desc: { zh: '松软得像云羊。请不要试图骑它。', en: 'As fluffy as a cloudsheep. Please do not try to ride it.' } },
  { id: 'vanilla_scoop', kind: 'dessert', st: 'frost', inp: { milk: 4, vanilla: 1, sugar: 2 }, price: 14, zh: '香草冰淇淋', en: 'Vanilla Ice Cream',
    desc: { zh: '朴素的经典。冰封属性的小龙捧着它不会化，其他小龙请抓紧时间。', en: 'A plain classic. It will not melt in Freeze claws. Everyone else, eat fast.' } },
  { id: 'caramel', kind: 'dessert', st: 'torch', inp: { pudding: 1, sugar: 2 }, flame: 1, price: 15, zh: '焦糖布丁', en: 'Caramel Pudding',
    desc: { zh: '撒红糖，喷火，完成。Rhasari 说这是她的代表作，不接受反驳。', en: 'Sugar, fire, done. Rhasari calls it her signature work and accepts no argument.' } },
  { id: 'croissant', kind: 'dessert', st: 'oven', inp: { flour: 2, butter: 1 }, price: 16, zh: '黄油可颂', en: 'Butter Croissant',
    desc: { zh: '一共七十二层。小龙们数到第九层就开始吃了。', en: 'Seventy-two layers in all. The dragonlings start eating around layer nine.' } },
  { id: 'berry_parfait', kind: 'dessert', st: 'frost', inp: { blueberry: 2, strawberry: 2, cream: 1 }, price: 16, zh: '莓果芭菲', en: 'Berry Parfait',
    desc: { zh: '一层一层，像龙巢的地层图。吃到最底下也许有惊喜，也许没有。', en: 'Layered like a geology chart of Dragonest. Maybe a surprise at the bottom. Maybe not.' } },
  { id: 'jam_tart', kind: 'dessert', st: 'oven', inp: { flour: 1, jam: 1, cream: 1 }, price: 17, zh: '草莓挞', en: 'Strawberry Tart',
    desc: { zh: '草莓排得整整齐齐，是 Rakuakira 帮忙检查过的。', en: 'The strawberries are lined up perfectly. Rakuakira inspected them.' } },
  { id: 'pumpkin_pie', kind: 'dessert', st: 'oven', inp: { pumpkin_puree: 2, flour: 1, eggs: 2, sugar: 2 }, price: 18, zh: '南瓜派', en: 'Pumpkin Pie',
    desc: { zh: '丰砧月的味道。吃完会突然很想去囤点什么。', en: 'Tastes like Incudary. Makes you want to stockpile something.' } },
  { id: 'lava_scoop', kind: 'dessert', st: 'frost', inp: { cocoa_sauce: 1, milk: 3 }, price: 18, zh: '熔岩可可冰球', en: 'Lava Cocoa Scoop',
    desc: { zh: '外面是冰，里面是流心可可。和 Rhasari 一样外冷内热，虽然她外面也不冷。', en: 'Frozen outside, molten cocoa inside. Like Rhasari, except she is not cold outside either.' } },
  { id: 'matcha_roll', kind: 'dessert', st: 'oven', inp: { flour: 1, matcha: 1, cream: 1, eggs: 2 }, price: 22, zh: '抹茶卷', en: 'Matcha Roll',
    desc: { zh: '卷起来的样子像一条打盹的绿龙。', en: 'Rolled up, it looks like a napping green dragon.' } },
  { id: 'brulee', kind: 'dessert', st: 'torch', inp: { cream: 1, eggs: 2, vanilla: 1, caramel_sauce: 1 }, flame: 1, price: 30, tech: 'caramel_art', zh: '炙烤布蕾', en: 'Crème Brûlée',
    desc: { zh: '表面的焦糖要用勺子敲开，咔嚓一声，是本店最受欢迎的音效。', en: 'Crack the caramel top with a spoon. That crunch is the most popular sound in the shop.' } },
  { id: 'star_souffle', kind: 'dessert', st: 'oven', inp: { eggs: 4, sugar: 2, vanilla: 1, cream: 1 }, price: 32, tech: 'grand_patisserie', zh: '星屑舒芙蕾', en: 'Stardust Soufflé',
    desc: { zh: '曾经膨到顶住天花板。出炉十分钟内必须吃完，否则它会塌，然后你也会。', en: 'It once rose until it touched the ceiling. Eat within ten minutes or it collapses, and so will you.' } },
  { id: 'scale_pastry', kind: 'dessert', st: 'oven', inp: { flour: 3, butter: 2, jam: 1 }, price: 38, tech: 'grand_patisserie', zh: '千层鳞派', en: 'Thousand-Scale Pastry',
    desc: { zh: '酥皮像龙鳞一样一层层叠起来。数清层数的顾客可以免单，目前还没有人成功。', en: 'Flaky layers stacked like dragon scales. Count them all and it is free. Nobody has managed yet.' } },
  { id: 'phoenix_parfait', kind: 'dessert', st: 'torch', inp: { cream: 2, jam: 1, honey: 2 }, flame: 2, price: 45, tech: 'caramel_art', zh: '凤凰焰芭菲', en: 'Phoenix Flambé',
    desc: { zh: '上桌时还在燃烧。请在火灭之后再吃，或者先签免责声明。', en: 'Served still on fire. Eat after the flames die down, or sign the waiver first.' } },
  { id: 'hoard_cake', kind: 'dessert', st: 'oven', inp: { flour: 4, eggs: 5, cocoa_sauce: 1, cream: 3, honey: 2 }, price: 80, tech: 'grand_patisserie', zh: '宝藏堆蛋糕', en: 'Hoard Cake',
    desc: { zh: '做成宝藏堆形状的巨型蛋糕。龙族顾客看到会本能地趴上去守护，请提前准备好刀叉和说服技巧。', en: 'A giant cake shaped like a hoard. Dragon customers instinctively lie on it to guard it. Bring cutlery and persuasion.' } }
];
/* 加工层级：原料全是作物或畜产品的为 0 级；用到半成品或商品的，比其中最高的那一级再高一级 */
var _tierMemo = {};
function foodTier(f) {
  if (_tierMemo[f.id] != null) return _tierMemo[f.id];
  var t = 0;
  for (var k in f.inp) {
    var g = FOODS.find(function (x) { return x.id === k; });
    if (g) t = Math.max(t, foodTier(g) + 1);
  }
  _tierMemo[f.id] = t;
  return t;
}
/* 制作所需的工作量：原料种类越多、售价越高越费工夫；每高一级加工层级，工作量再加 1.5 倍 */
var TIER_WORK = 1.5;
FOODS.forEach(function (f) {
  f.tier = foodTier(f);
  if (f.work == null) f.work = Math.round((0.5 + 0.2 * Object.keys(f.inp).length + f.price * 0.02) * (1 + TIER_WORK * f.tier) * 100) / 100;
});

var CROP_MAP = {}, FOOD_MAP = {}, ING_MAP = {};
CROPS.forEach(function (c) { CROP_MAP[c.id] = c; });
FOODS.forEach(function (f) { FOOD_MAP[f.id] = f; });
INGREDIENTS.forEach(function (i) { ING_MAP[i.id] = i; });
var GOODS_LIST = FOODS.filter(function (f) { return f.kind !== 'proc'; });

function cropKnown(c, s) {
  return (c.tech && !!s.tech[c.tech]) || !!(s.farm && s.farm.known && s.farm.known[c.id]);
}
function stationReady(st, s) {
  if (st === 'torch') return !!s.rhasari.joined;
  return (s.bld[st] || 0) > 0;
}
function anyResUnlocked(id, s) {
  if (ING_MAP[id]) {
    var ing = ING_MAP[id];
    if (ing.crop) return cropKnown(CROP_MAP[ing.crop], s);
    return (s.bld[ing.bld] || 0) > 0;
  }
  if (FOOD_MAP[id]) return foodUnlocked(FOOD_MAP[id], s);
  return true;
}
function foodUnlocked(f, s) {
  if (f.tech && !s.tech[f.tech]) return false;
  if (!stationReady(f.st, s)) return false;
  for (var k in f.inp) if (!anyResUnlocked(k, s)) return false;
  return true;
}

/* 追加资源 */
INGREDIENTS.forEach(function (i) {
  RESOURCES.push({ id: i.id, zh: i.zh, en: i.en, cap: 100, group: 'ingredient', desc: i.desc,
    unlocked: function (s) { return anyResUnlocked(i.id, s); } });
});
FOODS.forEach(function (f) {
  var proc = f.kind === 'proc';
  RESOURCES.push({ id: f.id, zh: f.zh, en: f.en, cap: proc ? 50 : 20, group: proc ? 'processed' : 'goods', goods: !proc, desc: f.desc,
    unlocked: function (s) { return foodUnlocked(f, s); } });
});
