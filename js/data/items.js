/* 物品总表
 * 每行格式：id|中文名|English name|炼金等级|稀有度|元素|类别|标记
 * 元素：n 无  s 灼燃  f 冰封  p 麻痹  d 沉沦  c 腐蚀  t 震颤  e 侵蚀
 * 类别：min 矿物  flo 植物  bst 兽材  rel 旧物  cry 结晶  pot 药剂  cha 护符  con 甜品  too 器具  cur 奇物
 * 标记：g 可在派遣中采集   x 特殊物品，不会作为普通炼金产物随机出现（配方产物、角色赠礼等）
 */
var ITEM_TABLE = `
impurity|杂质|Impurity|1|1|n|cur|x

rusty_nail|生锈的铁钉|Rusty Nail|1|1|n|rel|g
nest_dust|一撮巢尘|Pinch of Nest Dust|1|1|n|min|g
dry_moss|干苔藓|Dry Moss|1|1|n|flo|g
eggshell_shard|龙蛋碎壳|Dragon Eggshell Shard|1|2|n|bst|g
bent_coin|弯掉的铜币|Bent Copper Coin|1|2|n|rel|g
catnip_leaf|猫薄荷叶|Catnip Leaf|1|3|n|flo|g
frost_flake|蛛痕霜屑|Spidercrack Frost Flake|1|3|f|min|g

pebble|圆石子|Round Pebble|2|1|n|min|g
straw|一束干草|Bundle of Straw|2|1|n|flo|g
faded_ribbon|褪色丝带|Faded Ribbon|2|1|n|rel|g
milk_tooth|幼龙乳牙|Dragonling Milk Tooth|2|2|n|bst|g
warm_ash|余温灰烬|Warm Ash|2|2|s|min|g
raven_feather|走失的鸦羽|Stray Raven Feather|2|3|n|bst|g
clover|四叶草|Four-leaf Clover|2|3|n|flo|g

broken_spoon|断柄木勺|Broken Wooden Spoon|3|1|n|rel|g
brown_sugar_lump|红糖块|Brown Sugar Lump|3|1|n|con|g
damp_clay|湿黏土|Damp Clay|3|1|t|min|g
dandelion|信风蒲公英|Tradewind Dandelion|3|2|p|flo|g
bitter_tonic|苦味补剂|Bitter Tonic|3|2|n|pot|
shed_claw|蜕下的爪尖|Shed Claw Tip|3|3|n|bst|g
spark_stone|打火石|Flint Spark Stone|3|3|s|min|g

wild_coffee_cherry|野生咖啡果|Wild Coffee Cherry|4|1|n|flo|g
iron_scrap|碎铁片|Iron Scrap|4|1|n|min|g
chipped_cup|缺口的茶杯|Chipped Teacup|4|1|n|rel|g
tide_shell|潮声贝壳|Tidesong Shell|4|2|d|bst|g
rust_powder|铁锈粉|Rust Powder|4|2|c|min|g
sticky_caramel|黏糊糊的焦糖|Sticky Caramel|4|3|s|con|
lucky_bell|小铃铛|Tiny Lucky Bell|4|3|p|cha|

oak_twig|橡木枝|Oak Twig|5|1|n|flo|g
glass_bead|玻璃珠|Glass Bead|5|1|n|rel|g
salt_crust|盐壳|Salt Crust|5|1|e|min|g
moth_wing|灰蛾翅|Ash Moth Wing|5|2|e|bst|g
glowcap|荧光蘑菇|Glowcap Mushroom|5|2|p|flo|g
warming_salve|暖身药膏|Warming Salve|5|3|s|pot|
copper_coil|铜丝卷|Coil of Copper Wire|5|3|p|too|

pine_resin|松脂|Pine Resin|6|1|s|flo|g
frayed_rope|磨损的绳子|Frayed Rope|6|1|n|rel|g
quartz_chip|石英碎片|Quartz Chip|6|1|n|min|g
crab_husk|沙蟹空壳|Sand Crab Husk|6|2|t|bst|g
frostmint|霜薄荷|Sprig of Frostmint|6|2|f|flo|g
candle_stub|蜡烛头|Candle Stub|6|3|s|rel|g
fizz_powder|跳跳粉|Fizzing Powder|6|3|p|pot|
passable_brick|还算像样的砖|A Passable Brick|6|2|n|cur|x

old_map|旧地图残片|Old Map Fragment|7|1|n|rel|g
reed|芦苇杆|Reed Stalk|7|1|d|flo|g
coal_lump|煤块|Lump of Coal|7|1|s|min|g
snail_shell|螺旋蜗牛壳|Spiral Snail Shell|7|2|c|bst|g
sourberry|酸浆果|Sourberry|7|2|c|flo|g
mood_candy|心情糖|Mood Candy|7|3|n|con|
tin_whistle|锡哨子|Tin Whistle|7|3|t|too|

wolf_fur|狼的落毛|Shed Wolf Fur|8|1|n|bst|g
slate|板岩片|Slate Shard|8|1|t|min|g
acorn|橡实|Acorn|8|1|n|flo|g
lantern_wick|灯芯|Lantern Wick|8|2|s|rel|g
bogbubble|沼泽泡泡草|Bogbubble Weed|8|2|d|flo|g
clarity_draught|清醒药水|Clarity Draught|8|3|n|pot|
spice_pouch|香料小包|Spice Pouch|8|3|s|con|
catnip_tea|猫薄荷茶|Catnip Tea|8|3|n|con|x

lodestone|磁石|Lodestone|9|1|p|min|g
sealing_wax|封蜡|Sealing Wax|9|1|s|rel|g
beetle_shell|甲虫壳|Beetle Carapace|9|1|t|bst|g
thornvine|棘藤|Thornvine|9|2|c|flo|g
silk_thread|蛛丝线|Spider Silk Thread|9|2|f|bst|g
pocket_compass|袖珍罗盘|Pocket Compass|9|3|p|too|
nap_potion|小睡药水|Nap Potion|9|3|d|pot|

copper_ore|铜矿石|Copper Ore|10|1|n|min|g
herb_bundle|药草束|Bundle of Herbs|10|1|n|flo|g
leather_scrap|旧皮革|Leather Scrap|10|1|n|rel|g
owl_feather|猫头鹰羽|Owl Feather|10|2|n|bst|g
embermoss|余烬苔|Embermoss|10|2|s|flo|g
star_sugar|星形砂糖|Star Sugar|10|3|n|con|
bugward_charm|驱虫护符|Bugward Charm|10|3|c|cha|

iron_ore|铁矿石|Iron Ore|11|1|n|min|g
willow_bark|柳树皮|Willow Bark|11|1|d|flo|g
fishbone|鱼骨|Fishbone|11|2|d|bst|g
ownerless_key|无主的钥匙|Ownerless Key|11|2|n|rel|g
numbmoss|麻痹苔|Numbmoss|11|3|p|flo|g
glass_vial|玻璃药瓶|Glass Vial|11|3|n|too|
caramel_glaze|焦糖淋面|Caramel Glaze|11|4|s|con|

sandstone|砂岩块|Sandstone Block|12|1|e|min|g
feathergrass|羽毛草|Feathergrass|12|1|p|flo|g
bat_membrane|蝙蝠翼膜|Bat Wing Membrane|12|2|c|bst|g
brass_gear|黄铜齿轮|Brass Gear|12|2|t|rel|g
frostbell|霜铃花|Frostbell Flower|12|3|f|flo|g
hearth_potion|炉心药剂|Hearthheart Potion|12|3|s|pot|
weathervane|小风向标|Tiny Weathervane|12|4|p|too|

tin_ore|锡矿石|Tin Ore|13|1|n|min|g
cattail|香蒲|Cattail|13|1|d|flo|g
scale_flake|鳞片碎屑|Scale Flakes|13|2|n|bst|g
clay_tablet|刻字泥板|Inscribed Clay Tablet|13|2|e|rel|g
venom_sac|毒囊|Venom Sac|13|3|c|bst|g
rattle_charm|摇摇护符|Rattle Charm|13|3|t|cha|
frost_jelly|冰封果冻|Frost Jelly|13|4|f|con|

scorch_crystal|灼燃结晶|Scorch Crystal|14|2|s|cry|g
freeze_crystal|冰封结晶|Freeze Crystal|14|2|f|cry|g
paralyze_crystal|麻痹结晶|Paralyze Crystal|14|2|p|cry|g
drown_crystal|沉沦结晶|Drown Crystal|14|2|d|cry|g
corrode_crystal|腐蚀结晶|Corrode Crystal|14|2|c|cry|g
tremor_crystal|震颤结晶|Tremor Crystal|14|2|t|cry|g
erode_crystal|侵蚀结晶|Erode Crystal|14|2|e|cry|g

silver_ore|银矿石|Silver Ore|15|1|n|min|g
nightshade|龙葵|Nightshade|15|1|c|flo|g
horn_shavings|角屑|Horn Shavings|15|2|t|bst|g
tarnished_medal|褪色勋章|Tarnished Medal|15|2|n|rel|g
lunavite_lily|邀月百合|Lunavite Lily|15|3|n|flo|g
smoke_pellet|烟雾弹|Smoke Pellet|15|3|e|too|
golden_pudding|金黄布丁|Golden Pudding|15|4|n|con|

obsidian_chip|黑曜石片|Obsidian Chip|16|1|s|min|g
deep_kelp|深水海带|Deepwater Kelp|16|1|d|flo|g
crowquill|鸦羽笔|Crowquill Pen|16|2|n|rel|g
jolt_tonic|提神电击水|Jolt Tonic|16|2|p|pot|
star_dew|星誓夜露|Star-oath Dew|16|3|n|flo|g
quake_drum|小震鼓|Little Quake Drum|16|3|t|too|
mirrorlake_charm|镜湖护符|Mirrorlake Charm|16|4|d|cha|

amber_bead|琥珀珠|Amber Bead|17|1|s|min|g
thistle|蓟花|Thistle|17|1|c|flo|g
serpent_molt|蛇蜕|Serpent Molt|17|2|e|bst|g
sundial_piece|日晷残块|Sundial Fragment|17|2|n|rel|g
storm_pollen|风暴花粉|Storm Pollen|17|3|p|flo|g
antidote|万用解药|Common Antidote|17|3|c|pot|
ember_brooch|烬火胸针|Ember Brooch|17|4|s|cha|

jade_pebble|碧玉卵石|Jade Pebble|18|1|n|min|g
frost_lichen|霜地衣|Frost Lichen|18|1|f|flo|g
turtle_scute|龟甲片|Turtle Scute|18|2|t|bst|g
broken_hourglass|碎沙漏|Broken Hourglass|18|2|e|rel|g
bubble_potion|泡泡药水|Bubble Potion|18|3|d|pot|
bottled_wind|瓶中风|Wind in a Bottle|18|3|p|cur|
icicle_chime|冰棱风铃|Icicle Windchime|18|4|f|too|
rhasari_down|Rhasari 的绒羽|Rhasari's Molted Down|18|4|s|bst|x
spidercrack_lace|蛛痕霜纹蕾丝|Spidercrack Lace|18|4|f|cur|x

greyore|灰锡矿|Greytin Ore|19|1|c|min|g
mandrake|曼德拉草根|Mandrake Root|19|1|e|flo|g
beast_fluff|幻兽软毛|Phantom Beast Fluff|19|2|n|bst|g
spellword_shard|言灵碎片|Spellword Shard|19|2|n|rel|g
glowworm_jar|萤火虫罐|Jar of Glowworms|19|3|p|cur|
ironbone_tonic|铁骨药剂|Ironbone Tonic|19|3|t|pot|
frostkiss_candy|冰吻糖|Frostkiss Candy|19|4|f|con|

gold_nugget|小金块|Small Gold Nugget|20|1|n|min|g
ashwood|灰木|Ashwood Log|20|1|s|flo|g
wyvern_tooth|飞龙齿|Wyvern Tooth|20|2|n|bst|g
broken_lantern|破灯笼|Broken Lantern|20|2|s|rel|g
pluvinter_orchid|雨葬兰|Pluvinter Orchid|20|3|d|flo|g
numbing_needle|麻针|Numbing Needle|20|3|p|too|
oath_ring|誓言指环|Oath Ring|20|4|n|cha|

basalt|玄武岩|Basalt Chunk|21|1|t|min|g
swamp_lotus|沼泽莲|Swamp Lotus|21|2|c|flo|g
drake_scale|地龙鳞|Drake Scale|21|2|t|bst|g
ancient_coin|古龙币|Ancient Dragon Coin|21|3|n|rel|g
fog_essence|雾精|Fog Essence|21|3|d|pot|
noctflame_lantern|燃夜提灯|Noctflame Lantern|21|4|s|too|
thunder_pudding|雷霆布丁|Thunder Pudding|21|5|p|con|

marble|大理石板|Marble Slab|22|1|n|min|g
witch_hazel|金缕梅|Witch Hazel|22|2|n|flo|g
seal_fang|海豹牙|Seal Fang|22|2|d|bst|g
cracked_mask|裂纹面具|Cracked Mask|22|3|e|rel|g
etching_ink|蚀刻墨水|Etching Ink|22|3|c|pot|
tremor_bell|震铃|Tremor Bell|22|4|t|cha|
glacier_bonbon|冰川夹心糖|Glacier Bonbon|22|5|f|con|
rhasari_caramel|Rhasari 的焦糖|Rhasari's Caramel|22|5|s|con|x

cobalt_ore|钴矿石|Cobalt Ore|23|1|f|min|g
sea_fennel|海茴香|Sea Fennel|23|2|d|flo|g
emberleaf_tea|烬叶茶|Emberleaf Tea|23|2|s|con|
thunderbird_plume|雷鸟尾羽|Thunderbird Tailfeather|23|3|p|bst|g
old_banner|旧氏族旗|Old Clan Banner|23|3|n|rel|g
miasma_vial|瘴气瓶|Vial of Miasma|23|4|c|pot|
weathered_hourglass|风化沙漏|Weathered Hourglass|23|4|e|too|
galehowl_flute|惊岚长笛|Galehowl Flute|23|5|p|too|

granite|花岗岩|Granite|24|1|t|min|g
moonflower|月见花|Moonflower|24|2|n|flo|g
frostwolf_fang|霜狼牙|Frost Wolf Fang|24|2|f|bst|g
crown_shard|王冠碎片|Crown Shard|24|3|n|rel|g
paralysis_powder|麻痹粉|Paralysis Powder|24|3|p|pot|
tide_compass|潮汐罗盘|Tide Compass|24|4|d|too|
caramel_crown|焦糖王冠|Caramel Crown|24|5|s|con|

pumice|浮石|Pumice|25|1|e|min|g
dragonfruit|龙果|Dragonfruit|25|2|s|flo|g
bone_flute|骨笛|Bone Flute|25|2|c|rel|g
abysweald_pearl|沧麓珍珠|Abysweald Pearl|25|3|d|bst|g
rust_charm|锈蚀护符|Rust Charm|25|4|c|cha|
quakestep_boots|震步靴|Quakestep Boots|25|4|t|too|
starsworn_cake|星誓蛋糕|Star-oath Cake|25|5|n|con|

tourmaline|碧玺|Tourmaline|26|1|p|min|g
spirit_moss|灵苔|Spirit Moss|26|2|n|flo|g
abyssal_ink_sac|深渊墨囊|Abyssal Ink Sac|26|3|d|bst|g
ancient_scroll|古卷轴|Ancient Scroll|26|3|e|rel|g
frostheart_tonic|冰心药剂|Frostheart Tonic|26|3|f|pot|
static_gloves|静电手套|Static Gloves|26|4|p|too|
scorch_pepper|灼燃辣酱|Scorch Pepper Sauce|26|5|s|con|
ciorre_blend|Ciorre 特调|Ciorre's Signature Blend|26|5|n|con|x

onyx|缟玛瑙|Onyx|27|1|c|min|g
ironwood|铁木|Ironwood|27|2|t|flo|g
molten_scale|熔岩鳞|Molten Scale|27|3|s|bst|g
spellword_slate|言灵石板|Spellword Slate|27|3|n|rel|g
erosion_elixir|风蚀药剂|Erosion Elixir|27|4|e|pot|
owl_monocle|猫头鹰单片镜|Owl Monocle|27|4|n|too|
dream_souffle|梦境舒芙蕾|Dream Souffle|27|5|d|con|

pure_scorch|纯净灼燃结晶|Pure Scorch Crystal|28|4|s|cry|g
pure_freeze|纯净冰封结晶|Pure Freeze Crystal|28|4|f|cry|g
pure_paralyze|纯净麻痹结晶|Pure Paralyze Crystal|28|4|p|cry|g
pure_drown|纯净沉沦结晶|Pure Drown Crystal|28|4|d|cry|g
pure_corrode|纯净腐蚀结晶|Pure Corrode Crystal|28|4|c|cry|g
pure_tremor|纯净震颤结晶|Pure Tremor Crystal|28|4|t|cry|g
pure_erode|纯净侵蚀结晶|Pure Erode Crystal|28|4|e|cry|g

greysilver|灰银矿|Greysilver Ore|29|1|n|min|g
phoenix_ash|凤凰灰|Phoenix Ash|29|2|s|min|g
frostbloom|霜华|Frostbloom|29|2|f|flo|g
deepsea_scale|深海鳞|Deepsea Scale|29|3|d|bst|g
clan_seal|氏族印章|Clan Seal|29|3|n|rel|g
corrosive_elixir|腐毒药剂|Corrosive Elixir|29|4|c|pot|
tremor_core|震颤核心|Tremor Core|29|5|t|too|

meteor_iron|陨铁|Meteoric Iron|30|1|t|min|g
glimmerfern|烁光蕨|Glimmerfern|30|2|p|flo|g
storm_feather|风暴羽|Storm Feather|30|3|p|bst|g
unopened_letter|未拆的信|Unopened Letter|30|3|n|rel|g
revival_draught|回魂药剂|Revival Draught|30|4|n|pot|
moonlit_bell|邀月铃|Moonlit Bell|30|4|n|cha|
emberhearth_core|烬火炉心|Emberhearth Core|30|5|s|too|
raku_compass|Rakuakira 的罗盘|Rakuakira's Compass|30|5|n|too|x

starsteel_ore|星钢矿|Starsteel Ore|31|2|n|min|g
vacuumyth_lily|虚传百合|Vacuumyth Lily|31|3|e|flo|g
elder_horn|古龙角|Elder Horn|31|4|t|bst|g
ash_hourglass|灰烬沙漏|Hourglass of Ash|31|4|s|too|
spidercrack_mirror|蛛痕镜|Spidercrack Mirror|31|5|f|cur|
astriel_covenant|星誓之约|Astriel Covenant|31|6|n|cha|

frost_opal|霜蛋白石|Frost Opal|32|2|f|min|g
crimtwlit_moss|绯暗苔|Crimtwlit Moss|32|3|c|flo|g
thunderhorn|雷角|Thunderhorn|32|4|p|bst|g
tidal_flask|潮汐烧瓶|Tidal Flask|32|4|d|too|
wolfhowl_amulet|狼嗥护符|Wolfhowl Amulet|32|5|n|cha|
inferno_flan|业火布丁|Inferno Flan|32|6|s|con|

sunstone|日长石|Sunstone|33|2|s|min|g
whisperreed|低语芦苇|Whisperreed|33|3|e|flo|g
zylmorak_scale|巨海鳞|Zylmorak Scale|33|4|d|bst|g
elder_tablet|古龙碑文|Elder Tablet|33|4|n|rel|g
quake_hammer|震颤之锤|Quake Hammer|33|5|t|too|
corroded_crown|蚀冠|Corroded Crown|33|6|c|cur|

moonstone|月长石|Moonstone|34|2|n|min|g
frozen_rose|冰封玫瑰|Frozen Rose|34|3|f|flo|g
shadow_pelt|暗影皮毛|Shadow Pelt|34|4|e|bst|g
bottled_storm|雷暴瓶|Bottled Thunderstorm|34|4|p|cur|
drowned_bell|沉钟|Drowned Bell|34|5|d|too|
emberwing_crest|烬翼徽记|Emberwing Crest|34|6|s|cha|
owl_invitation|猫头鹰王国的邀请函|Invitation from Vohrkthal|34|5|n|cur|x

black_pearl|黑珍珠|Black Pearl|35|2|d|min|g
ironroot|铁根草|Ironroot|35|3|t|flo|g
wyrm_fang|古龙牙|Wyrm Fang|35|4|n|bst|g
clan_heirloom|氏族遗物|Clan Heirloom|35|4|n|rel|g
miasma_lantern|瘴灯|Miasma Lantern|35|5|c|too|
throne_fragment|风化王座残片|Weathered Throne Fragment|35|6|e|cur|

aethorf_iron|天穹铁|Aethorf Iron|36|2|n|min|g
abyssal_kelp|渊海藻|Abyssal Kelp|36|3|d|flo|g
frostdrake_horn|霜龙角|Frostdrake Horn|36|4|f|bst|g
void_ink|虚空墨水|Void Ink|36|4|e|pot|
static_crown|雷冠|Static Crown|36|5|p|cha|
lava_cake|地心熔岩蛋糕|Lava Core Cake|36|6|s|con|
lysari_scale|Lysari 的鳞片|Lysari's Scale|36|6|d|bst|x

stardust|星屑|Stardust Fragment|37|3|n|min|g
umbrile_orchid|冥纱兰|Umbrile Orchid|37|4|e|flo|g
elder_scale|长老鳞|Elder Dragon Scale|37|4|n|bst|g
frost_crown|霜冠|Frost Crown|37|5|f|cha|
thunder_engine|雷鸣机芯|Thunder Engine|37|5|p|too|
phoenix_eggshell|凤凰蛋壳|Phoenix Eggshell|37|6|s|bst|g

abyss_stone|渊石|Abyss Stone|38|3|d|min|g
rotvine|腐藤|Rotvine|38|4|c|flo|g
quake_scale|震鳞|Quake Scale|38|4|t|bst|g
spellword_lens|言灵透镜|Spellword Lens|38|5|n|too|
greater_erosion|大风蚀药剂|Greater Erosion Elixir|38|5|e|pot|
starsea_cake|星海蛋糕|Starsea Cake|38|6|n|con|

aurora_shard|极光晶|Aurora Shard|39|3|n|min|g
silver_willow|银柳|Silver Willow|39|4|f|flo|g
storm_eye|风暴之眼|Eye of the Storm|39|4|p|cur|
tide_crown|潮冠|Tide Crown|39|5|d|cha|
etching_engine|蚀刻机|Etching Engine|39|5|c|too|
dragonflame_core|龙焰核心|Dragonflame Core|39|6|s|cur|

scorch_heart|灼燃心核|Scorch Heartstone|40|5|s|cry|g
freeze_heart|冰封心核|Freeze Heartstone|40|5|f|cry|g
paralyze_heart|麻痹心核|Paralyze Heartstone|40|5|p|cry|g
drown_heart|沉沦心核|Drown Heartstone|40|5|d|cry|g
corrode_heart|腐蚀心核|Corrode Heartstone|40|5|c|cry|g
tremor_heart|震颤心核|Tremor Heartstone|40|5|t|cry|g
erode_heart|侵蚀心核|Erode Heartstone|40|5|e|cry|g

polar_iron|极夜铁|Polar Night Iron|41|3|n|min|g
ghost_lotus|幽莲|Ghost Lotus|41|4|e|flo|g
thunderwyrm_scale|雷龙鳞|Thunderwyrm Scale|41|4|p|bst|g
frost_scepter|冰封权杖|Frost Scepter|41|5|f|too|
drowned_chalice|沉沦圣杯|Drowned Chalice|41|5|d|cur|
undying_ember|不熄余烬|Undying Ember|41|6|s|cur|

void_shard|虚晶|Void Shard|42|3|e|min|g
worldroot|世界根须|Worldroot Tendril|42|4|t|flo|g
corrosive_fang|蚀牙|Corrosive Fang|42|4|c|bst|g
panacea|万灵药|Panacea|42|5|n|pot|
quake_crown|震冠|Quake Crown|42|5|t|cha|
starfall_pudding|坠星布丁|Starfall Pudding|42|6|n|con|

celestial_ore|天穹晶矿|Celestial Ore|43|4|n|min|g
frost_phoenix_plume|冰凤羽|Frost Phoenix Plume|43|4|f|bst|g
tide_engine|潮汐机芯|Tide Engine|43|5|d|too|
erosion_crown|蚀风冠|Erosion Crown|43|5|e|cha|
obsidian_throne|黑曜王座模型|Obsidian Throne Model|43|6|s|cur|

elder_amber|古龙琥珀|Elder Amber|44|4|s|min|g
thunder_lotus|雷莲|Thunder Lotus|44|4|p|flo|g
rot_crown|腐冠|Rot Crown|44|5|c|cha|
void_compass|虚空罗盘|Void Compass|44|5|e|too|
moonsea_mirror|月海之镜|Moonsea Mirror|44|6|d|cur|

dragonheart_ruby|龙心红玉|Dragonheart Ruby|45|4|s|min|g
everfrost_moss|永霜苔|Everfrost Moss|45|4|f|flo|g
tremor_scepter|震颤权杖|Tremor Scepter|45|5|t|too|
philosopher_pudding|贤者布丁|Philosopher's Pudding|45|5|n|con|
polar_crown|极夜之冠|Crown of Polar Night|45|6|n|cha|

starfallen_iron|星陨铁|Starfallen Iron|46|4|t|min|g
abyssbloom|深渊花|Abyssbloom|46|4|d|flo|g
thunder_scepter|雷霆权杖|Thunder Scepter|46|5|p|too|
corroded_grail|蚀杯|Corroded Grail|46|5|c|cur|
elder_wingbone|古龙翼骨|Elder Wingbone|46|6|n|bst|g

aurora_heart|极光之心|Aurora Heart|47|5|n|min|g
emberthrone_seal|烬翼印玺|Emberthrone Seal|47|5|s|cha|
frostshroud_seal|霜息印玺|Frostshroud Seal|47|5|f|cha|
thornspire_seal|棘语印玺|Thornspire Seal|47|6|p|cha|
necroclave_seal|冥骸印玺|Necroclave Seal|47|6|c|cha|

spellword_tome|言灵典籍|Spellword Tome|48|5|n|cur|
drowned_scepter|沉沦权杖|Drowned Scepter|48|5|d|too|
quake_heart|震颤之心|Heart of the Quake|48|5|t|cur|
erosion_tome|侵蚀之书|Book of Erosion|48|6|e|cur|
dragonflame_pudding|龙焰布丁|Dragonflame Pudding|48|6|s|con|
ayrelia_plume|Ayrelia 的落羽|Ayrelia's Fallen Plume|48|6|s|bst|x

starsworn_crown|星誓王冠|Star-oath Crown|49|5|n|cha|
everfrost_core|永霜之核|Everfrost Core|49|5|f|cur|
thunderwing_relic|雷翼遗骸|Thunderwing Relic|49|5|p|cur|
vacuumyth_heart|虚传之心|Heart of Vacuumyth|49|6|e|cur|
abyssal_crown|渊冠|Abyssal Crown|49|6|d|cha|

dragonest_atlas|龙巢全图|Atlas of Dragonest|50|5|n|cur|
primordial_flame|远古龙焰|Primordial Dragonflame|50|5|s|cur|
philosopher_stone|贤者之石|Philosopher's Stone|50|5|n|cur|
world_egg|世界之卵|World Egg|50|6|n|cur|
last_pudding|终焉布丁|The Last Pudding|50|6|n|con|
heptachrome_prism|七曜棱镜|Heptachrome Prism|50|6|n|cur|x
flame_tide_vigil|焰与潮与守望|Of Flame, Tide and Vigil|50|6|n|cur|x
`;

/* 固定配方：材料为物品 id 的多重集合（顺序无关，数量必须完全一致） */
var RECIPES = [
  { id: 'r_brick', out: 'passable_brick',
    mats: { impurity: 7 },
    hint: { zh: '七次失败，能不能凑出一次成功？', en: 'Can seven failures add up to one success?' } },
  { id: 'r_catnip_tea', out: 'catnip_tea',
    mats: { catnip_leaf: 3 },
    hint: { zh: '猫族炼金术士的私藏。三片叶子就够了。', en: 'A cat alchemist\'s private stash. Three leaves will do.' } },
  { id: 'r_lace', out: 'spidercrack_lace',
    mats: { frost_flake: 3, silk_thread: 1 },
    hint: { zh: '蛛痕月的霜，配上真正的蛛丝。', en: 'Frost from Fissuary, plus real spider silk.' } },
  { id: 'r_rhasari_caramel', out: 'rhasari_caramel',
    mats: { brown_sugar_lump: 2, rhasari_down: 1 },
    hint: { zh: '红糖，再加一点点凤凰的心意。', en: 'Brown sugar, and a little piece of a phoenix\'s heart.' } },
  { id: 'r_blend', out: 'ciorre_blend',
    mats: { wild_coffee_cherry: 2, star_dew: 1 },
    hint: { zh: '咖啡果，以及一个晴朗夜晚的露水。', en: 'Coffee cherries, and the dew of a clear night.' } },
  { id: 'r_compass', out: 'raku_compass',
    mats: { raven_feather: 1, lodestone: 1, old_map: 1 },
    hint: { zh: '一根认路的羽毛，一块认北的石头，一张认不出的地图。', en: 'A feather that knows the way, a stone that knows north, and a map no one can read.' } },
  { id: 'r_invite', out: 'owl_invitation',
    mats: { owl_feather: 2, sealing_wax: 1, crowquill: 1 },
    hint: { zh: '东边的猫头鹰们写信时，总要用自己的羽毛。', en: 'When the owls to the east write letters, they always use their own feathers.' } },
  { id: 'r_prism', out: 'heptachrome_prism',
    mats: { scorch_crystal: 1, freeze_crystal: 1, paralyze_crystal: 1, drown_crystal: 1, corrode_crystal: 1, tremor_crystal: 1, erode_crystal: 1 },
    hint: { zh: '七种元素，各取其一。', en: 'Seven elements, one of each.' } },
  { id: 'r_vigil', out: 'flame_tide_vigil',
    mats: { ayrelia_plume: 1, lysari_scale: 1, rhasari_caramel: 1 },
    hint: { zh: '一片落羽，一枚鳞片，一块焦糖。', en: 'A fallen plume, a single scale, a piece of caramel.' } }
];

/* 解析物品表 */
var ITEMS = {};
var ITEM_LIST = [];
var PRODUCTS_BY_LEVEL = {};   // 普通炼金产物，按等级分组
var GATHER_BY_LEVEL = {};     // 可采集物品，按等级分组
(function parseItems() {
  ITEM_TABLE.split('\n').forEach(function (line) {
    line = line.trim();
    if (!line) return;
    var p = line.split('|');
    var it = {
      id: p[0], zh: p[1], en: p[2], lv: +p[3], r: +p[4], el: p[5], cat: p[6],
      g: (p[7] || '').indexOf('g') >= 0,
      x: (p[7] || '').indexOf('x') >= 0
    };
    if (ITEMS[it.id]) console.warn('重复的物品 id', it.id);
    ITEMS[it.id] = it;
    ITEM_LIST.push(it);
    if (!it.x) (PRODUCTS_BY_LEVEL[it.lv] = PRODUCTS_BY_LEVEL[it.lv] || []).push(it);
    if (it.g) (GATHER_BY_LEVEL[it.lv] = GATHER_BY_LEVEL[it.lv] || []).push(it);
  });
})();
