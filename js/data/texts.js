/* 叙事与随机文案。每条均为 {zh, en}，{0} {1} 为占位参数 */
var TXT = {
  story: {
    intro: { zh: '你是一只身无分文的猫族炼金术士，站在龙巢中心天穹 Aethorf 的山脚下。巨龙们的宝藏堆很高，偶尔会有几枚硬币滚落下来。',
      en: 'You are a penniless cat alchemist standing at the foot of Aethorf, the heart of Dragonest. The dragons\' hoards are piled high, and now and then a coin rolls off.' },
    luckyCoin: { zh: '一枚硬币从某条龙的宝藏堆上滚下来，正好停在你脚边。硬币 +{0}。',
      en: 'A coin rolls off some dragon\'s hoard and stops right at your feet. Coins +{0}.' },
    firewood: { zh: '一位路过的樵夫看上了你的硬币：一百枚换一捆柴薪，童叟无欺。有了柴，就能给小龙搭窝了。',
      en: 'A passing woodcutter eyes your coins: one bundle of firewood for a hundred, fair and square. With firewood, you can build nests for dragonlings.' },
    firstDragon: { zh: '{0} 好奇地探进头来。它说，只要有零花钱，什么活都可以干。',
      en: '{0} pokes its head in curiously. It says it will do any job, as long as there is pocket money.' },
    dragonArrive: { zh: '一只名叫 {0} 的小龙飞进了龙巢。', en: 'A dragonling named {0} flies into the nest.' },
    dragonLeave: { zh: '{0} 没有零花钱了，失望地飞走了。', en: '{0} ran out of pocket money and flew away, disappointed.' },
    workshopBuilt: { zh: '工坊落成了。你花光了全部 {0} 枚硬币，口袋里只剩一根线头。但炉火已经点燃，招牌也挂上了：只接待小型龙族。',
      en: 'The workshop is complete. You spent all {0} of your coins; only a loose thread is left in your pocket. But the furnace is lit, and the sign is up: Small dragons only.' },
    rakuMeet: { zh: '一只渡鸦轻轻落在新工坊的招牌上，歪着头看了你一会儿。“你好呀，我是 Rakuakira，替 Ayrelia 送信的。以后每个月都会来打扰一下，请多关照。”',
      en: 'A raven lands softly on the new workshop\'s sign and tilts her head at you. "Hello. I am Rakuakira, I carry Ayrelia\'s letters. I will be dropping by every month from now on. I hope that is all right."' },
    market: { zh: '兜里有了翎鸾以后，集市上的摊主们开始热情地朝你招手。现在可以在湖畔页的集市里淘宝了。', en: 'Now that your pockets jingle with quills, the market stallholders wave at you eagerly. You can rummage at the market on the Lakeside tab.' },
    rhasariHint: { zh: '窗外有一只凤凰幼崽，盯着你的布丁看了很久。', en: 'A phoenix chick outside the window has been staring at your pudding for a long time.' },
    rhasariJoin: { zh: '你把一份布丁放在窗台上。凤凰幼崽探头探脑地靠近……三份布丁之后，她已经站在你的手臂上了。她叫 Rhasari。从今天起，她是工坊的“烧火鸟”。她本鸟对这个称呼表示强烈不满。',
      en: 'You leave a pudding on the windowsill. The phoenix chick creeps closer... Three puddings later, she is perched on your arm. Her name is Rhasari. From today she is the workshop\'s "stoker bird". She herself strongly objects to the title.' },
    courier: { zh: '驿站建好了。小龙们可以出发去龙巢各地了。', en: 'The waystation is ready. Dragonlings can now set out across Dragonest.' },
    transmute: { zh: '你终于理解了元素之间的嬗变。工坊的炼金炉第一次真正地亮了起来。',
      en: 'You finally understand how the elements transmute. For the first time, the workshop\'s alchemy furnace truly lights up.' },
    monthStart: { zh: '{0}到了。', en: '{0} has begun.' },
    quarterEnd: { zh: '季度结束，未完成的委托已由 Rakuakira 收回。', en: 'The quarter is over. Rakuakira has collected the unfinished commissions.' },
    phase: { zh: '{0}。{1}', en: '{0}. {1}' },
    grow: { zh: '小龙们又长大了一点。', en: 'The dragonlings have grown a little.' },
    offline: { zh: '你离开了 {0}。小龙们一直在照看工坊。', en: 'You were away for {0}. The dragonlings kept the workshop running.' }
  },

  /* Rakuakira：性格随和，说话软，话不多 */
  raku: {
    snack: [
      { zh: 'Rakuakira 落在窗台上，小口小口地吃完了{0}。“谢谢款待。这些消息，只说给你一个人听哦。”情报 +{1}。',
        en: 'Rakuakira lands on the windowsill and nibbles the {0} in tiny bites. "Thank you for the treat. This news is just for you, all right?" Intel +{1}.' },
      { zh: 'Rakuakira 把{0}吃得干干净净，又把碎屑收拾好，才留下一页写得整整齐齐的情报。情报 +{1}。',
        en: 'Rakuakira finishes the {0}, tidies up every crumb, and only then leaves a neatly written report. Intel +{1}.' },
      { zh: '“{0}很好吃呢。”Rakuakira 眯起眼睛，慢慢地跟你讲起各协的近况。情报 +{1}。',
        en: '"The {0} is lovely." Rakuakira half-closes her eyes and slowly tells you what is happening in every district. Intel +{1}.' },
      { zh: 'Rakuakira 吃完{0}，认真地用翅膀比了个“好”。“这份点心，我会好好记在心里的。”情报 +{1}。',
        en: 'Rakuakira finishes the {0} and gives you a serious wing-up. "I will remember this treat." Intel +{1}.' },
      { zh: 'Rakuakira 想把{0}分一半给你，被你推了回去。她犹豫了一下，还是认真地吃完了。“那这份情报算我多送的。”情报 +{1}。',
        en: 'Rakuakira tries to give you half of the {0}. You push it back. She hesitates, then eats it all very properly. "Then this report is a little extra from me." Intel +{1}.' }
    ],
    noSnack: [
      { zh: 'Rakuakira 在空空的窗台上站了一会儿，没说什么，留下一点情报就飞走了。情报 +{1}。',
        en: 'Rakuakira stands on the empty windowsill for a while, says nothing, leaves a little intel and flies off. Intel +{1}.' },
      { zh: 'Rakuakira：“今天窗台上没有点心呀……没关系，该送的消息还是要送到的。”情报 +{1}。',
        en: 'Rakuakira: "No snack on the windowsill today... That is all right. The news still has to be delivered." Intel +{1}.' },
      { zh: '“唔，没有点心也不要紧。”Rakuakira 轻声说，“不过我会有一点点失落，这个也要如实告诉你。”情报 +{1}。',
        en: '"Mm, no snack is fine," Rakuakira says softly. "But I am a tiny bit disappointed, and I should tell you that honestly too." Intel +{1}.' }
    ],
    letter: { zh: 'Rakuakira 送来了 Ayrelia 本季度的委托。', en: 'Rakuakira brings Ayrelia\'s commissions for this quarter.' }
  },

  /* Ayrelia：强大、孤独、傲娇，口癖是“哼” */
  ayrelia: [
    { zh: '哼，别误会。我不缺这些东西，只是想看看你的工坊能做到什么程度。', en: 'Hmph. Do not misunderstand. I lack none of these things. I only want to see what your workshop can do.' },
    { zh: '本季度的委托在下面。做不完也无妨。', en: 'This quarter\'s requests are below. It does not matter if you cannot finish them.' },
    { zh: '我找 Rakuakira 说话，是因为她会认真听。哼。', en: 'I talk to Rakuakira because she listens properly. Hmph.' },
    { zh: '强大的意思是不需要帮助。这些委托只是我的一点任性。', en: 'To be strong is to need no help. These requests are only a whim of mine.' },
    { zh: '昨晚又看见你工坊的炉火了。很小，很亮。', en: 'I saw your workshop\'s fire again last night. Very small, very bright.' },
    { zh: '火焰燃尽之后，会留下什么？……哼，快去干活。', en: 'What remains after a flame burns out? ...Hmph. Get to work.' },
    { zh: '星誓月的夜空最澄澈，古时的龙族都在那样的夜里立誓。我没有什么需要立誓的。', en: 'The skies of Astriel are the clearest; dragons of old swore their oaths on such nights. I have nothing to swear.' },
    { zh: '一个人的时候，时间又长又安静。', en: 'Alone, time is long and quiet.' },
    { zh: 'Rakuakira 说你的点心不错。她的口味一向普通，这说明不了什么。哼。', en: 'Rakuakira says your snacks are good. Her taste is ordinary, so that proves nothing. Hmph.' },
    { zh: '风会把灰烬带走，但带不走曾经燃烧过的事实。', en: 'The wind carries ash away, but not the fact that something once burned.' }
  ],
  lysari: {
    arrive: [
      { zh: '窗外忽然暗了下来。一只巨大的、水汪汪的眼睛贴在窗户上，正在找 Rhasari。是 Lysari。工坊只接待小型龙族，她进不来。',
        en: 'The window suddenly goes dark. A huge, glistening eye presses against the glass, looking for Rhasari. It is Lysari. The workshop only serves small dragons, so she cannot come in.' },
      { zh: 'Lysari 在工坊上空滴溜~地翻了一圈，下起了一场小雨。Rhasari 在窗边兴奋地扑腾翅膀。',
        en: 'Lysari does a little barrel roll over the workshop, and a light rain begins. Rhasari flaps excitedly at the window.' },
      { zh: '“妹妹有没有好好吃饭呀？”Lysari 把下巴搁在屋顶上，声音软软的。屋顶发出了危险的声音。',
        en: '"Is my little sister eating well?" Lysari rests her chin on the roof and asks sweetly. The roof makes a worrying noise.' }
    ],
    gift: { zh: 'Lysari 隔着窗户塞进来一些礼物：“这是给妹妹的零花钱，不许克扣！”获得 {0}。',
      en: 'Lysari pushes some gifts through the window. "This is pocket money for my sister. Don\'t you dare skim it!" Received {0}.' },
    rain: { zh: 'Lysari 的甘霖：接下来一个月，作物生长 +15%，地块每天多补 5 点水。', en: 'Lysari\'s Rain: for the next month, crops grow 15% faster and every plot gains 5 extra water a day.' },
    scale: { zh: '她临走时掉了一枚鳞片。获得 Lysari 的鳞片。', en: 'She dropped a scale as she left. Received Lysari\'s Scale.' }
  },

  rhasari: {
    feedPudding: [
      { zh: 'Rhasari 把布丁吃得满脸都是，开心地抖了抖羽毛。', en: 'Rhasari gets pudding all over her face and fluffs her feathers happily.' },
      { zh: 'Rhasari 小口小口地啄着布丁，尾羽一晃一晃。', en: 'Rhasari pecks at the pudding in tiny bites, tail feathers swaying.' }
    ],
    feedCaramel: [
      { zh: 'Rhasari 对自己亲口喷出来的焦糖格外满意。', en: 'Rhasari is especially pleased with caramel she torched herself.' },
      { zh: '吃到焦糖布丁的 Rhasari 在柜台上转了三圈。', en: 'After the caramel pudding, Rhasari spins three times on the counter.' }
    ],
    insult: [
      { zh: '“我不是烧火鸟！”Rhasari 气得喷出一大团火，正好把炉子烧得旺旺的。', en: '"I am NOT a stoker bird!" Rhasari puffs out a huge angry flame, which happens to stoke the furnace nicely.' },
      { zh: '“凤凰！是凤凰！”Rhasari 跳着脚纠正你，火星溅了一地。', en: '"Phoenix! I\'m a PHOENIX!" Rhasari stomps and corrects you, scattering sparks everywhere.' },
      { zh: 'Rhasari 背对着你，尾羽冒着小火苗。她生气了，但炉子很暖和。', en: 'Rhasari turns her back on you, tail feathers smoldering. She is angry, but the furnace is very warm.' }
    ],
    insultSuffix: { zh: '火力 +{0}，心情 -{1}。', en: 'Flame +{0}, mood -{1}.' },
    down: { zh: 'Rhasari 心情很好，掉了一片亮晶晶的绒羽。你悄悄收了起来。', en: 'Rhasari is in a great mood and drops a glittering bit of down. You quietly pocket it.' },
    guard: { zh: 'Rhasari 在炉边护着火。', en: 'Rhasari guards the flame by the furnace.' }
  },

  serve: {
    drink: [
      { zh: '你把{1}推到{0}面前。它用两只爪子捧着杯子，小心翼翼地吹了三下。', en: 'You slide the {1} over to {0}. It holds the cup in both claws and blows on it three times, very carefully.' },
      { zh: '{0}点了一杯{1}，一口气喝完，尾巴尖都竖了起来。', en: '{0} orders a {1} and downs it in one go. The tip of its tail stands straight up.' },
      { zh: '{0}捧着{1}，对着杯子里自己的倒影看了很久。', en: '{0} holds the {1} and stares at its own reflection for a long time.' },
      { zh: '{0}喝完{1}，打了一个带火星的嗝，有点不好意思。', en: '{0} finishes the {1} and lets out a sparky burp. It looks a little embarrassed.' }
    ],
    dessert: [
      { zh: '{1}在盘子里抖了抖，{0}也跟着抖了抖尾巴。', en: 'The {1} wobbles on the plate, and {0} wobbles its tail along with it.' },
      { zh: '{0}用勺子戳了戳{1}，好像在确认它是不是活的。', en: '{0} pokes the {1} with a spoon, as if checking whether it is alive.' },
      { zh: '你把{1}端给{0}。它闻了闻，然后整个吞了下去。', en: 'You bring the {1} to {0}. It sniffs it, then swallows it whole.' },
      { zh: '{0}吃完{1}，舔了舔盘子，又舔了舔爪子。', en: '{0} finishes the {1}, licks the plate, and then its claws.' },
      { zh: '{0}把{1}护在身下，像守护宝藏一样吃完了它。', en: '{0} guards the {1} like treasure, then eats it.' }
    ],
    show: [
      { zh: '你把布丁端到{0}面前，另一只手托着 Rhasari，往上面撒了一把红糖。Rhasari 呼地一口火，焦糖布丁当场完成。{0}鼓起了掌。',
        en: 'You set a pudding in front of {0}, Rhasari perched on your other arm, and sprinkle brown sugar on top. Rhasari breathes a puff of fire, and the caramel pudding is done right there. The customer applauds.' },
      { zh: 'Rhasari 喷火前清了清嗓子，表情庄严得像在举行成年礼。红糖滋滋作响，{0}看呆了。',
        en: 'Before breathing fire, Rhasari clears her throat, as solemn as a coming-of-age rite. The sugar sizzles, and {0} stares in awe.' },
      { zh: '这次火候有点大，{0}的眉毛……还好，龙族没有眉毛。',
        en: 'The flame was a bit strong this time. The eyebrows of {0}... ah, never mind. Dragons have no eyebrows.' },
      { zh: '红糖在火焰里化成琥珀色。Rhasari 骄傲地挺起胸脯，{0}多给了一些小费。',
        en: 'The sugar melts into amber in the flame. Rhasari puffs out her chest proudly, and {0} leaves an extra tip.' },
      { zh: '{0}问能不能再喷一次。Rhasari 看了你一眼，你看了看火力槽。',
        en: '{0} asks for an encore. Rhasari looks at you. You look at the flame gauge.' }
    ],
    none: [
      { zh: '{0}看了看空空的柜台，失望地飞走了。', en: '{0} looks at the empty counter and flies away disappointed.' }
    ],
    noCustomer: { zh: '现在没有顾客在等。', en: 'No customers are waiting right now.' }
  },

  trip: {
    go: { zh: '你数了数口袋里的硬币，一枚都没留下，然后高高兴兴地出门旅行去了。目的地：{0}。店里交给小龙们照看。',
      en: 'You count every coin in your pocket, keep not a single one, and happily set off for {0}. The dragonlings will mind the shop.' },
    back: { zh: '你旅行回来了，晒黑了一点，口袋空空，背包满满。旅行见闻 +1，情报 +{0}，带回：{1}。',
      en: 'You are back from your trip, a little tanned, pockets empty, backpack full. Travel Memories +1, Intel +{0}, souvenirs: {1}.' },
    places: [
      { zh: '栖凰', en: 'Pyralis' }, { zh: '燕洵', en: 'Hirundep' }, { zh: '衔风', en: 'Zephyrcarry' },
      { zh: '时影', en: 'Tempulience' }, { zh: '海鸣', en: 'Seasough' }, { zh: '镜湖', en: 'Mirrorscale Basin' },
      { zh: '璨星湖', en: 'Maple' }, { zh: '紫叶罗兰', en: 'Patches of Violet' }, { zh: '古榕渊', en: 'Eldermiasmic' },
      { zh: '猫头鹰王国的大都会', en: 'Metropolis of Vohrkthal' }, { zh: '玛琳黛', en: 'Marlinde' }, { zh: '瓦伦提斯', en: 'Valentis' }
    ]
  },

  disp: {
    go: { zh: '{0} 背着小包出发前往{1}。', en: '{0} sets off for {1} with a little backpack.' },
    back: { zh: '{0} 从{1}回来了，带回：{2}。', en: '{0} is back from {1}, bringing: {2}.' },
    injured: { zh: '{0} 受了点轻伤，带回来的东西少了一些。', en: '{0} got a little hurt and brought back less than hoped.' },
    shielded: { zh: '力场替 {0} 挡下了一次危险。', en: 'The field shielded {0} from danger.' },
    levelUp: { zh: '{0} 的战斗等级提升到了 {1}。', en: '{0}\'s Combat Level rose to {1}.' }
  },

  alch: {
    ok: { zh: '炼金完成：{0}。', en: 'Transmutation complete: {0}.' },
    fail: { zh: '炉子里冒出一股可疑的黑烟……得到了杂质。差一点就是 {0} 了。', en: 'A suspicious puff of black smoke rises from the furnace... you got an Impurity. It almost became {0}.' },
    recipe: { zh: '固定配方生效！得到了 {0}。', en: 'A fixed recipe takes effect! You got {0}.' },
    sway: { zh: '炉膛里的{0}气息占了上风，产物被拽向了同一种元素。', en: 'The {0} essence in the furnace wins out and drags the product toward the same element.' }
  },

  shop: {
    owlSell: { zh: '路过的猫头鹰商人收走了 {0}，付给你 {1}。', en: 'A passing owl merchant buys {0} and pays you {1}.' },
    displaySold: { zh: '顾客买走了展柜里的 {0}，收入 {1}。', en: 'A customer buys {0} from the display case. Earned {1}.' },
    windowSold: { zh: '一位{0}在橱窗前停下，买走了 {1}，收入 {2}。', en: '{0} stops at the window and buys {1}. Earned {2}.' },
    manualServe: { zh: '{0}收入 {1}。', en: '{0} Earned {1}.' },
    quillFull: { zh: '翎鸾已经装满了，这笔货款改收硬币。', en: 'Your quills are full, so this payment was taken in coins.' }
  },

  comm: {
    goods: { t: { zh: '送来{0}', en: 'Deliver {0}' },
      d: { zh: '交付 {1} 份{0}。{0}在后厨制作，库存够了就能提交，提交后从库存扣除。', en: 'Deliver {1} {0}. It is made in the kitchen; you can submit once you have enough in stock, and it is taken from your stock.' } },
    serve: { t: { zh: '招待顾客', en: 'Serve customers' },
      d: { zh: '本季度招待 {0} 位顾客。从收到委托时开始计数，店员和你亲自招待的都算。达成后点“领取”。', en: 'Serve {0} customers this quarter. Counting starts when the commission arrives; customers served by clerks and by you both count. Claim the reward once done.' } },
    firewood: { t: { zh: 'Rakuakira 的窝', en: 'Rakuakira\'s Nest' },
      d: { zh: '交付柴薪 ×{0}，用来修补 Rakuakira 漏风的窝。这一份是 Rakuakira 自己的请求。提交后从库存扣除。', en: 'Deliver {0} Firewood to patch Rakuakira\'s draughty nest. This one is Rakuakira\'s own request. It is taken from your stock when you submit.' } },
    item: { t: { zh: '寻物：{0}', en: 'Wanted: {0}' },
      d: { zh: '交付 {0} ×{1}。这是能在派遣中采集到的物品，也可能从集市淘到。提交后从仓库扣除。', en: 'Deliver {0} x{1}. It can be gathered on expeditions and sometimes turns up at the market. It is taken from your storage when you submit.' } },
    element: { t: { zh: '{0}属性物品', en: '{0}-element items' },
      d: { zh: '交付 {1} 件{0}属性、炼金等级不低于 {2} 的物品，种类不限。', en: 'Deliver {1} {0}-element items of level {2} or higher; any kind will do.' } },
    rarity: { t: { zh: '稀有物品', en: 'Rare items' },
      d: { zh: '交付 {0} 件稀有度不低于 Rare {1} 的物品，种类不限。', en: 'Deliver {0} items of Rare {1} or higher; any kind will do.' } },
    dispatch: { t: { zh: '派遣到{0}', en: 'Expedition to {0}' },
      d: { zh: '本季度完成一次前往{0}的派遣。小龙在季度结束前回来才算数，最好早点出发。', en: 'Complete one expedition to {0} this quarter. It only counts if the dragonling returns before the quarter ends, so send one early.' } },
    alchemy: { t: { zh: '持续炼金', en: 'Keep transmuting' },
      d: { zh: '本季度完成 {0} 次炼金。从收到委托时开始计数，固定配方和失败变成杂质的也都算。', en: 'Perform {0} transmutations this quarter. Counting starts when the commission arrives; fixed recipes and failures that turn into Impurity count too.' } },
    caramel: { t: { zh: '焦糖布丁', en: 'Caramel puddings' },
      d: { zh: '本季度制作 {0} 份焦糖布丁。从收到委托时开始计数，厨师做的和你亲手做的都算。', en: 'Make {0} caramel puddings this quarter. Counting starts when the commission arrives; puddings made by cooks and by you both count.' } },
    harvest: { t: { zh: '收获作物', en: 'Harvest crops' },
      d: { zh: '本季度在草地收获 {0} 次作物，每收一块地算一次。从收到委托时开始计数。', en: 'Harvest crops {0} times this quarter; each plot harvested counts once. Counting starts when the commission arrives.' } },
    window: { t: { zh: '橱窗销售', en: 'Window sales' },
      d: { zh: '本季度从橱窗卖出 {0} 件半成品。从收到委托时开始计数。', en: 'Sell {0} prepared goods from the window this quarter. Counting starts when the commission arrives.' } },
    product: { t: { zh: '炼金产物：{0}', en: 'Alchemy product: {0}' },
      d: { zh: '交付 1 件{0}（Lv {1}，{2}）。这是 25 级以上的普通炼金产物，可以在自由炼金中炼出，也可能从集市淘到。提交后从仓库扣除。', en: 'Deliver one {0} (Lv {1}, {2}). It is an ordinary alchemy product above level 25; you can transmute it or find it at the market. It is taken from your storage when you submit.' } },
    done: { zh: '委托完成：{0}。获得 {1}。', en: 'Commission complete: {0}. Received {1}.' }
  },

  dragon: {
    feedFav: [
      { zh: '{0} 吃到了最爱的{1}，开心地在地上打了个滚。', en: '{0} gets its favourite {1} and happily rolls on the floor.' },
      { zh: '{0} 看到{1}的瞬间，尾巴摇得像风车。', en: 'The moment {0} sees the {1}, its tail spins like a windmill.' }
    ],
    feed: [
      { zh: '{0} 吃掉了{1}。不是最爱，但也不挑。', en: '{0} eats the {1}. Not its favourite, but it is not picky.' },
      { zh: '{0} 礼貌地吃完了{1}，然后用眼神暗示它想要别的。', en: '{0} politely finishes the {1}, then hints with its eyes that it wanted something else.' }
    ],
    feedAll: { zh: '你给 {0} 只小龙各发了一份点心，消耗了 {1}。', en: 'You hand out snacks to {0} dragonlings, using {1}.' },
    release: [
      { zh: '{0} 回头看了你一眼，振翅飞向远方。它留下了{1}作为纪念。', en: '{0} looks back at you once, then flies off into the distance. It leaves {1} as a keepsake.' },
      { zh: '{0} 要去外面的世界闯一闯了。临走前，它把{1}塞进你手里。', en: '{0} is off to see the wide world. Before leaving, it presses {1} into your paw.' }
    ],
    rename: { zh: '{0} 现在叫 {1} 了。它花了一会儿才习惯。', en: '{0} is now called {1}. It takes a moment to get used to it.' },
    leader: { zh: '{0} 成为了领头龙，昂首挺胸地巡视了一圈。', en: '{0} becomes the lead dragonling and proudly inspects everyone.' },
    master: { zh: '{0} 的{1}熟练度达到了“{2}”。', en: '{0} has become {2} as a {1}.' },
    crowded: { zh: '龙巢有点挤了，小龙们开始抱怨。可以考虑温泉池、保育员和零食。', en: 'The nest is getting crowded and the dragonlings are grumbling. Consider hot springs, caretakers and snacks.' }
  },

  party: {
    start: { zh: '茶会开始了！长桌上摆满了饮品和点心，小龙们端着小杯子，郑重其事地互相碰杯。幸福度与客流各 +{0}%，持续 {1} 天。', en: 'The tea party begins! The long table is laden with drinks and treats, and the dragonlings clink their tiny cups with great ceremony. Happiness and customers +{0}% for {1} days.' },
    end: { zh: '茶会结束了。地上全是点心渣，有几只小龙睡在桌子底下。', en: 'The tea party is over. Crumbs everywhere, and a few dragonlings asleep under the tables.' }
  },

  sky: {
    appear: { zh: '一颗流星划过天际！快去观星。', en: 'A shooting star streaks across the sky! Quick, observe it.' },
    observe: { zh: '你记下了流星的轨迹。学识 +{0}，情报 +{1}。', en: 'You note down the star\'s path. Lore +{0}, Intel +{1}.' },
    auto: { zh: '观星台自动记录下了一颗流星。学识 +{0}，情报 +{1}。', en: 'The Stargazing Deck recorded a shooting star. Lore +{0}, Intel +{1}.' },
    item: { zh: '草地上落下了一点闪光的东西：{0}。', en: 'Something glittering falls onto the meadow: {0}.' },
    missed: { zh: '流星消失了。你只来得及许了半个愿望。', en: 'The star is gone. You only managed half a wish.' }
  },

  trade: {
    depart: { zh: '{1} 只小龙组成的商队背着 {2} 件货物，出发前往{0}了。', en: 'A caravan of {1} dragonlings sets off for {0}, carrying {2} goods.' },
    back: { zh: '前往{0}的商队回来了：送出 {1}，换回 {2}。', en: 'The caravan to {0} is back: gave {1}, brought home {2}.' },
    loss: { zh: '前往{0}的商队路上出了点状况，货物损失了大约 {1}。', en: 'The caravan to {0} ran into trouble on the road and lost about {1} of its haul.' },
    seed: { zh: '对方额外送了一包种子：{0}。现在可以在草地上种了。', en: 'They also hand over a seed packet: {0}. You can plant it in the meadow now.' },
    unlock: { zh: '你在派遣中结识了{0}的龙。现在可以和他们做生意了。', en: 'Your expeditions have made friends with {0}. You can now trade with them.' }
  },

  farm: {
    reclaim: { zh: '你开垦了一块新地。几只小龙在新翻的土里打滚，被你赶了出去。', en: 'You clear a new plot. A few dragonlings roll in the fresh soil until you shoo them out.' },
    compost: { zh: '你把 {0} 份杂质扔进了堆肥箱。堆肥箱发出了满意的咕嘟声。肥料 +{1}。', en: 'You toss {0} impurities into the compost bin. It gurgles contentedly. Fertilizer +{1}.' },
    coldWarn: { zh: '天冷了，没有温室遮挡的作物会长得很慢。', en: 'It is cold now. Crops without a greenhouse will grow slowly.' }
  },

  market: {
    got: { zh: '你在集市的旧货堆里翻了半天，花掉 1 金翎，换回 {0}。', en: 'You rummage through the market stalls for a while, spend 1 gold quill, and come away with {0}.' },
    rare: { zh: '眼尖的你在一堆杂物底下摸到了 {0}！摊主看你的眼神有点后悔。', en: 'Sharp-eyed, you dig {0} out from under a pile of junk! The stallholder looks like they regret something.' }
  },

  kitchen: {
    priDone: { zh: '优先制作的{0}已经补到目标库存，优先状态取消了。', en: 'The priority {0} has reached its target stock; priority cleared.' }
  },

  lux: {
    got: { zh: '{0} 带回来一把闪闪发光的东西：{1}。小龙们围了上去。', en: '{0} brings back a pawful of shiny things: {1}. The dragonlings crowd around.' },
    out: { zh: '最后一份{0}也被小龙们玩没了。它们看起来有点失落。', en: 'The dragonlings have played the last of the {0} away. They look a little glum.' }
  },

  ach: { zh: '达成成就：{0}。', en: 'Achievement unlocked: {0}.' },
  migrated: { zh: '存档已升级到 v0.3：硬币之外多了翎鸾，日子过得慢了一倍，营业、后厨与草地的活儿都改成了进度条。按住按钮可以亲自加快进度。',
    en: 'Save upgraded to v0.3: Luan Quills now sit beside coins, days pass half as fast, and shop, kitchen and meadow chores are now progress bars. Hold a button to speed one up yourself.' },
  upgradeReset: { zh: '游戏进行了大幅改版，旧存档的数值已不再适用，进度已重置。很抱歉，也欢迎回来。', en: 'The game has been heavily reworked and old saves no longer fit the new numbers, so progress was reset. Sorry, and welcome back.' }
};
