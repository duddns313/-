/* ===================== 아이템 희귀도 · 접사 · 장비 템플릿 ===================== */

const RARITIES = [
  { id: 'common', name: '평범', color: '#9aa0a6', affixSlots: 0, statMult: 1.0, weight: 100 },
  { id: 'uncommon', name: '쓸만한', color: '#4caf7d', affixSlots: 1, statMult: 1.15, weight: 45 },
  { id: 'rare', name: '진귀한', color: '#5b8bd0', affixSlots: 2, statMult: 1.35, weight: 18 },
  { id: 'epic', name: '명품', color: '#a557f0', affixSlots: 2, statMult: 1.6, weight: 6, needsId: true },
  { id: 'legendary', name: '전설', color: '#e08a2b', affixSlots: 2, statMult: 2.0, weight: 1.5, needsId: true, unique: true },
  { id: 'artifact', name: '성물', color: '#d4af37', affixSlots: 0, statMult: 2.5, weight: 0, needsId: true, fixed: true, unique: true },
];
const RARITY_BY_ID = Object.fromEntries(RARITIES.map((r) => [r.id, r]));
function rarityIndex(id) { return RARITIES.findIndex((r) => r.id === id); }

/* 접두사: 주로 공격/방어/능력치 계열 보너스 */
const PREFIXES = [
  { id: 'sharp', name: '날카로운', stat: 'atk', roll: [2, 5] },
  { id: 'sturdy', name: '견고한', stat: 'def', roll: [2, 5] },
  { id: 'sage', name: '현자의', stat: 'intelligence', roll: [1, 3] },
  { id: 'swift', name: '신속한', stat: 'agility', roll: [1, 3] },
  { id: 'lucky', name: '행운의', stat: 'luck', roll: [1, 3] },
];

/* 접미사: 부가 효과 계열 */
const SUFFIXES = [
  { id: 'phoenix', name: '불사조의 가호', stat: 'maxHp', roll: [8, 20] },
  { id: 'serpent', name: '뱀의 저주', stat: 'curseBonus', roll: [3, 8], desc: '저주 계열 주문 위력 증가' },
  { id: 'lion', name: '사자의 심장', stat: 'courage', roll: [1, 3] },
  { id: 'eagle', name: '독수리의 지혜', stat: 'maxMp', roll: [5, 12] },
];

const AFFIX_BY_ID = Object.fromEntries([...PREFIXES, ...SUFFIXES].map((a) => [a.id, a]));

/* ── 어빌리티 (전투 패시브) ──
 * 원작에서 "어떤 어빌리티를 가진 장비를 얻느냐가 캐릭터의 전투력을 결정한다".
 * 단순 스탯 증가와 달리 주문 사슬의 작동 방식 자체를 바꾼다.
 * minRarity 이상 등급의 장비에서 접미사 자리에 대신 붙을 수 있다. */
const ABILITIES = {
  firstBlood: {
    id: 'firstBlood', name: '선취점', minRarity: 'rare',
    desc: '사슬의 첫 주문이 반드시 대성공한다.',
  },
  echoBack: {
    id: 'echoBack', name: '되울림', minRarity: 'epic',
    desc: '사슬의 마지막 주문이 한 번 더 발동한다.',
  },
  pickpocket: {
    id: 'pickpocket', name: '소매치기', minRarity: 'uncommon',
    desc: '전투에서 져도 갈레온을 챙긴다.',
  },
  inkWard: {
    id: 'inkWard', name: '잉크의 가호', minRarity: 'rare',
    desc: '전투에 이기면 침식이 한 턴 늦춰진다.',
  },
  steadyCore: {
    id: 'steadyCore', name: '굳은 심지', minRarity: 'epic',
    desc: '주사위가 7 이하로 나와도 10으로 친다.',
  },
  resonance: {
    id: 'resonance', name: '메아리', minRarity: 'rare',
    desc: '같은 계열 주문이 연달아 발동하면 뒤엣것의 위력이 절반만큼 늘어난다.',
  },
  mastersHand: {
    id: 'mastersHand', name: '대가의 손', minRarity: 'legendary',
    desc: '한 전투에 주문을 하나 더 쓸 수 있다.',
  },
  worthOfNames: {
    id: 'worthOfNames', name: '이름값', minRarity: 'epic',
    desc: '명부에 온전히 남은 이름 하나당 위력이 2씩 오른다.',
  },
};

const ABILITY_LIST = Object.values(ABILITIES);

/* 전설 등급 고유 각인 (모든 전설 장비에 하나씩 랜덤 부여) */
const LEGENDARY_MARKS = [
  { id: 'mark_fate', label: '운명의 각인', stat: 'luck', value: 6 },
  { id: 'mark_will', label: '불굴의 각인', stat: 'courage', value: 6 },
  { id: 'mark_mind', label: '현자의 각인', stat: 'intelligence', value: 6 },
];

/* 장비 슬롯: wand(지팡이) / robe(로브) / accessory(장신구) */
const EQUIP_TEMPLATES = {
  woodenWand: { id: 'woodenWand', name: '낡은 지팡이', slot: 'wand', stat: 'atk', range: [2, 2], tier: 0, starter: true },
  rowanWand: { id: 'rowanWand', name: '물푸레나무 지팡이', slot: 'wand', stat: 'atk', range: [4, 7], tier: 1, price: 60 },
  mahoganyWand: { id: 'mahoganyWand', name: '마호가니 지팡이', slot: 'wand', stat: 'atk', range: [7, 11], tier: 2, price: 140 },
  ebonyWand: { id: 'ebonyWand', name: '흑단 지팡이', slot: 'wand', stat: 'atk', range: [11, 16], tier: 3, price: 260 },

  schoolRobe: { id: 'schoolRobe', name: '학교 로브', slot: 'robe', stat: 'def', range: [2, 2], tier: 0, starter: true },
  travelerRobe: { id: 'travelerRobe', name: '여행자 로브', slot: 'robe', stat: 'def', range: [4, 6], tier: 1, price: 55 },
  dragonhideRobe: { id: 'dragonhideRobe', name: '용가죽 로브', slot: 'robe', stat: 'def', range: [7, 10], tier: 2, price: 130 },
  merpeopleRobe: { id: 'merpeopleRobe', name: '인어가죽 로브', slot: 'robe', stat: 'def', range: [10, 14], tier: 3, price: 240 },

  rabbitFoot: { id: 'rabbitFoot', name: '행운의 토끼발', slot: 'accessory', stat: 'luck', range: [2, 4], tier: 1, price: 50 },
  silverCharm: { id: 'silverCharm', name: '은빛 부적', slot: 'accessory', stat: 'agility', range: [2, 4], tier: 1, price: 50 },
  manaRing: { id: 'manaRing', name: '마력 반지', slot: 'accessory', stat: 'maxMp', range: [5, 10], tier: 2, price: 110 },
  phoenixLocket: { id: 'phoenixLocket', name: '불사조 로켓', slot: 'accessory', stat: 'luck', range: [5, 9], tier: 3 },

  /* 최상급 장비 — 상점에서 팔지 않으며 강력한 적의 전리품으로만 얻을 수 있다 */
  obsidianWand: { id: 'obsidianWand', name: '흑요석 지팡이', slot: 'wand', stat: 'atk', range: [16, 22], tier: 4 },
  centaurHideRobe: { id: 'centaurHideRobe', name: '켄타우로스 가죽 로브', slot: 'robe', stat: 'def', range: [14, 19], tier: 4 },

  /* 시련 전용 보상 — 무작위 드랍 풀에서 제외하고, 시련 완수 시에만 성물(artifact) 등급으로 지급한다 */
  patronusCharm: { id: 'patronusCharm', name: '수호신의 부적', slot: 'accessory', stat: 'charm', range: [12, 16], tier: 4, excludeFromLoot: true },
};

const EQUIP_TEMPLATES_BY_SLOT = {
  wand: Object.values(EQUIP_TEMPLATES).filter((t) => t.slot === 'wand' && !t.starter && !t.excludeFromLoot),
  robe: Object.values(EQUIP_TEMPLATES).filter((t) => t.slot === 'robe' && !t.starter && !t.excludeFromLoot),
  accessory: Object.values(EQUIP_TEMPLATES).filter((t) => t.slot === 'accessory' && !t.starter && !t.excludeFromLoot),
};

/* 지팡이 뽑기 재료(코어) */
const WAND_CORES = {
  phoenixFeather: {
    id: 'phoenixFeather', name: '불사조 깃털', flavor: '빛나는 깃털에서 따뜻한 기운이 느껴진다.',
    favorsStat: 'intelligence', matches: (s) => s.alignment >= 0,
    matchText: '지팡이가 손끝에서 따뜻하게 반응한다 — 당신을 선택했다!',
  },
  dragonHeartstring: {
    id: 'dragonHeartstring', name: '용의 심장근', flavor: '거칠고 강렬한 기운이 손을 타고 흐른다.',
    favorsStat: 'atk', matches: (s) => s.stats.courage >= 12,
    matchText: '지팡이 끝에서 불꽃이 튀며 강하게 진동한다 — 당신을 선택했다!',
  },
  unicornHair: {
    id: 'unicornHair', name: '유니콘의 꼬리털', flavor: '은은하고 온화한 기운이 흐른다.',
    favorsStat: 'luck', matches: (s) => s.houseId === 'hufflepuff' || s.stats.charm >= 12,
    matchText: '지팡이가 부드러운 빛을 내며 손에 감긴다 — 당신을 선택했다!',
  },
};

/* 소모품 / 재료 / 퀘스트 아이템 / 주문서 (수량 기반, 등급 없음) */
const ITEMS = {
  healPotion: { id: 'healPotion', name: '회복 물약', type: 'potion', effect: { hp: 30 }, price: 15, sell: 5, desc: '체력을 30 회복한다.' },
  manaPotion: { id: 'manaPotion', name: '마나 물약', type: 'potion', effect: { mp: 20 }, price: 18, sell: 6, desc: '마력을 20 회복한다.' },
  elixir: { id: 'elixir', name: '펠릭스 펠리시스(모조품)', type: 'potion', effect: { hp: 9999, mp: 9999 }, price: 80, sell: 25, desc: '체력과 마력을 완전히 회복한다.' },
  chocolateFrog: { id: 'chocolateFrog', name: '초콜릿 개구리', type: 'potion', effect: { hp: 15, mp: 5 }, price: 6, sell: 2, desc: '디멘터를 만난 후 원기 회복에 좋다.' },
  pepperUpPotion: { id: 'pepperUpPotion', name: '페퍼업 포션', type: 'potion', effect: { bonusSlot: 1 }, price: 25, sell: 8, desc: '마시면 귀에서 김이 난다. 그날의 시간대가 하나 늘어난다. (하루 한 번, 아침 식사와 한도 공유)' },

  magicStone: { id: 'magicStone', name: '마법석', type: 'material', price: 20, sell: 7, desc: '장비 강화에 사용하는 결정석.' },

  /* 세계 규칙 3 — 손으로 쓴 잉크는 남는다.
   * 이름을 다시 덧쓰면 잊히는 속도가 한 걸음 늦춰진다. */
  inkBottle: { id: 'inkBottle', name: '잉크병', type: 'potion', effect: { slowErosion: 2 }, price: 22, sell: 9,
    desc: '쓰면 수첩의 이름들을 다시 덧쓴다. 잊히는 시계가 두 걸음 뒤로 간다.' },

  scrollStupefy: { id: 'scrollStupefy', name: '주문서 : 스터닝 스펠', type: 'scroll', spellId: 'stupefy', dc: 6, price: 70, sell: 20, desc: '사용 시 지식 판정에 성공하면 주문을 습득한다.' },
  scrollExpectoPatronum: { id: 'scrollExpectoPatronum', name: '주문서 : 익스펙토 패트로눔', type: 'scroll', spellId: 'expectoPatronum', dc: 9, price: 120, sell: 35, desc: '사용 시 지식 판정에 성공하면 주문을 습득한다.' },
  scrollConfringo: { id: 'scrollConfringo', name: '주문서 : 콘프린고', type: 'scroll', spellId: 'confringo', dc: 10, price: 140, sell: 40, desc: '사용 시 지식 판정에 성공하면 주문을 습득한다.' },
  scrollEpiskey: { id: 'scrollEpiskey', name: '주문서 : 에피스키', type: 'scroll', spellId: 'episkey', dc: 5, price: 60, sell: 18, desc: '사용 시 지식 판정에 성공하면 주문을 습득한다.' },
  scrollAvifors: { id: 'scrollAvifors', name: '주문서 : 아비포스', type: 'scroll', spellId: 'avifors', dc: 5, price: 55, sell: 16, desc: '사용 시 지식 판정에 성공하면 주문을 습득한다.' },
  scrollBombarda: { id: 'scrollBombarda', name: '주문서 : 봄바르다', type: 'scroll', spellId: 'bombarda', dc: 12, price: 160, sell: 45, desc: '사용 시 지식 판정에 성공하면 주문을 습득한다.' },
  scrollProtegoTotalum: { id: 'scrollProtegoTotalum', name: '주문서 : 프로테고 토탈룸', type: 'scroll', spellId: 'protegoTotalum', dc: 10, price: 130, sell: 38, desc: '사용 시 지식 판정에 성공하면 주문을 습득한다.' },
  scrollHardenSkin: { id: 'scrollHardenSkin', name: '주문서 : 피부 경화술', type: 'scroll', spellId: 'hardenSkin', dc: 7, price: 80, sell: 24, desc: '사용 시 지식 판정에 성공하면 주문을 습득한다.' },
  scrollVulneraSanentur: { id: 'scrollVulneraSanentur', name: '주문서 : 불네라 사넨투르', type: 'scroll', spellId: 'vulneraSanentur', dc: 8, price: 100, sell: 30, desc: '사용 시 지식 판정에 성공하면 주문을 습득한다.' },
  scrollSectumsempra: { id: 'scrollSectumsempra', name: '주문서 : 섹텀셈프라 (금서)', type: 'scroll', spellId: 'sectumsempra', dc: 11, price: 0, sell: 50, desc: '금지된 지식. 습득 시 성향이 크게 흔들린다.' },
  scrollAvadaKedavra: { id: 'scrollAvadaKedavra', name: '주문서 : 아바다 케다브라 (금서)', type: 'scroll', spellId: 'avadaKedavra', dc: 14, price: 0, sell: 100, desc: '용서받을 수 없는 저주의 지식. 습득 시 영혼이 크게 어두워진다.' },

  marauderMap: { id: 'marauderMap', name: '도둑 지도', type: 'quest', price: 150, desc: '성 안의 비밀 통로와 사람들의 위치를 보여주는 지도. 지니고 있으면 구역을 넘나드는 이동이 시간을 잡아먹지 않는다.' },
  oldDiary: { id: 'oldDiary', name: '낡은 일기장', type: 'quest', desc: '누군가 숨겨둔 듯한 정체불명의 일기장.' },
  rustyKey: { id: 'rustyKey', name: '녹슨 열쇠', type: 'quest', desc: '오래된 자물쇠에 맞을 것 같은 열쇠.' },
  basiliskFang: { id: 'basiliskFang', name: '바실리스크의 송곳니', type: 'quest', desc: '거대한 뱀의 것으로 보이는 송곳니.' },
  rareHerb: { id: 'rareHerb', name: '희귀한 약초', type: 'quest', desc: '해그리드가 부탁한 귀한 약초.' },
  nevilleBook: { id: 'nevilleBook', name: '네빌의 약초학 교과서', type: 'quest', desc: '네빌이 잃어버렸다는 낡은 교과서.' },
};
