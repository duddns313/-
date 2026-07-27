/* ===================== 게임 데이터 정의 =====================
 * 해리포터 세계관을 배경으로 한 팬메이드 텍스트 RPG의 정적 데이터.
 * (개인적/비상업적 팬 프로젝트)
 * =============================================================
 */

const HOUSES = {
  gryffindor: {
    id: 'gryffindor',
    name: '그리핀도르',
    animal: '사자',
    trait: '용기와 대담함',
    desc: '용기와 배짱을 중시하는 기숙사. 위험 앞에서 물러서지 않는다.',
    bonus: { hp: 15, courage: 6, atk: 2, def: 0, intelligence: 0, charm: 0 },
  },
  slytherin: {
    id: 'slytherin',
    name: '슬리데린',
    animal: '뱀',
    trait: '야망과 지략',
    desc: '야망과 자존심, 그리고 목적을 위한 수단을 중시하는 기숙사.',
    bonus: { hp: 5, courage: 0, atk: 4, def: 2, intelligence: 3, charm: 2 },
  },
  ravenclaw: {
    id: 'ravenclaw',
    name: '레번클로',
    animal: '독수리',
    trait: '지혜와 재치',
    desc: '지식과 재치, 배움을 향한 갈증을 중시하는 기숙사.',
    bonus: { hp: 5, courage: 0, atk: 0, def: 2, intelligence: 8, charm: 1, maxMp: 10 },
  },
  hufflepuff: {
    id: 'hufflepuff',
    name: '후플푸프',
    animal: '오소리',
    trait: '성실과 우정',
    desc: '충직함과 인내, 공정함을 중시하는 기숙사.',
    bonus: { hp: 10, courage: 2, atk: 0, def: 4, intelligence: 1, charm: 4 },
  },
};

const SPELLS = {
  lumos: {
    id: 'lumos', name: '루모스', type: 'utility', mpCost: 1,
    desc: '지팡이 끝에 빛을 밝힌다. 어두운 곳을 탐험할 때 유용하다.',
    learnLevel: 1, startWith: true,
  },
  expelliarmus: {
    id: 'expelliarmus', name: '익스펠리아무스', type: 'attack', power: 10, mpCost: 4,
    desc: '상대를 무장 해제하는 주문. 기본적인 공격 주문.',
    learnLevel: 1, startWith: true,
  },
  protego: {
    id: 'protego', name: '프로테고', type: 'defense', power: 0, mpCost: 5,
    desc: '방어막을 펼쳐 다음 공격의 피해를 크게 줄인다.',
    learnLevel: 2,
  },
  stupefy: {
    id: 'stupefy', name: '스터닝 스펠', type: 'attack', power: 16, mpCost: 7,
    desc: '강한 충격으로 상대를 기절시키려는 공격 주문.',
    learnLevel: 3,
  },
  expectoPatronum: {
    id: 'expectoPatronum', name: '익스펙토 패트로눔', type: 'attack', power: 22, mpCost: 14,
    desc: '수호신 주문. 디멘터류의 어둠의 생명체에게 압도적으로 강력하다.',
    learnLevel: 5, bonusVs: ['dementor'], bonusMult: 3,
  },
  confringo: {
    id: 'confringo', name: '콘프린고', type: 'attack', power: 24, mpCost: 12,
    desc: '폭발을 일으키는 공격 주문.',
    learnLevel: 6,
  },
  sectumsempra: {
    id: 'sectumsempra', name: '섹텀셈프라', type: 'attack', power: 30, mpCost: 13,
    desc: '스네이프가 만든 위험한 주문. 사용할 때마다 마음이 조금씩 어두워진다.',
    learnLevel: 6, alignment: -8, dark: true,
  },
  avadaKedavra: {
    id: 'avadaKedavra', name: '아바다 케다브라', type: 'attack', power: 70, mpCost: 28,
    desc: '용서받을 수 없는 저주. 압도적인 위력을 지녔지만 사용할 때마다 영혼이 어둠에 물든다.',
    learnLevel: 8, alignment: -35, dark: true,
  },
};

const ITEMS = {
  healPotion: { id: 'healPotion', name: '회복 물약', type: 'potion', effect: { hp: 30 }, price: 15, sell: 5, desc: '체력을 30 회복한다.' },
  manaPotion: { id: 'manaPotion', name: '마나 물약', type: 'potion', effect: { mp: 20 }, price: 18, sell: 6, desc: '마력을 20 회복한다.' },
  elixir: { id: 'elixir', name: '펠릭스 펠리시스(모조품)', type: 'potion', effect: { hp: 9999, mp: 9999 }, price: 80, sell: 25, desc: '체력과 마력을 완전히 회복한다.' },
  chocolateFrog: { id: 'chocolateFrog', name: '초콜릿 개구리', type: 'potion', effect: { hp: 15, mp: 5 }, price: 6, sell: 2, desc: '디멘터를 만난 후 원기 회복에 좋다.' },
  woodenWand: { id: 'woodenWand', name: '낡은 지팡이', type: 'wand', atk: 2, price: 0, desc: '기본 지급되는 지팡이.' },
  phoenixWand: { id: 'phoenixWand', name: '불사조 깃털 지팡이', type: 'wand', atk: 10, price: 140, desc: '올리밴더 상점의 명작.' },
  dragonWand: { id: 'dragonWand', name: '용의 심장근 지팡이', type: 'wand', atk: 18, price: 300, desc: '강력하지만 다루기 까다로운 지팡이.' },
  schoolRobe: { id: 'schoolRobe', name: '학교 로브', type: 'robe', def: 2, price: 0, desc: '기본 지급되는 로브.' },
  dragonhideVest: { id: 'dragonhideVest', name: '용가죽 조끼', type: 'robe', def: 9, price: 160, desc: '웬만한 저주는 튕겨낸다.' },
  invisibilityBooster: { id: 'invisibilityBooster', name: '은신 부적', type: 'robe', def: 4, price: 90, desc: '위기 상황에서 회피율을 높여준다.' },
  spellbookAdvanced: { id: 'spellbookAdvanced', name: '고급 주문 교본', type: 'book', price: 100, desc: '희귀한 주문의 지식이 담긴 책. (지식 스탯 상승)', effect: { intelligence: 3 } },
  marauderMap: { id: 'marauderMap', name: '도둑 지도', type: 'quest', desc: '성 안의 비밀 통로와 사람들의 위치를 보여주는 지도.' },
  oldDiary: { id: 'oldDiary', name: '낡은 일기장', type: 'quest', desc: '누군가 숨겨둔 듯한 정체불명의 일기장.' },
  rustyKey: { id: 'rustyKey', name: '녹슨 열쇠', type: 'quest', desc: '오래된 자물쇠에 맞을 것 같은 열쇠.' },
  basiliskFang: { id: 'basiliskFang', name: '바실리스크의 송곳니', type: 'quest', desc: '거대한 뱀의 것으로 보이는 송곳니. 어둠의 마법 물건을 파괴할 수 있다.' },
};

const ENEMIES = {
  pixie: { id: 'pixie', name: '콘월 픽시', hp: 20, atk: 4, def: 1, exp: 8, gold: [2, 6] },
  flobberworm: { id: 'flobberworm', name: '성난 플러버웜', hp: 14, atk: 2, def: 0, exp: 4, gold: [1, 3] },
  boggart: { id: 'boggart', name: '보가트', hp: 34, atk: 8, def: 2, exp: 16, gold: [4, 10] },
  troll: { id: 'troll', name: '산 트롤', hp: 65, atk: 13, def: 4, exp: 32, gold: [12, 22] },
  darkCreature: { id: 'darkCreature', name: '그림자 생명체', hp: 48, atk: 15, def: 3, exp: 28, gold: [8, 18] },
  dementor: { id: 'dementor', name: '디멘터', hp: 55, atk: 11, def: 6, exp: 36, gold: [0, 4], weakness: 'expectoPatronum' },
  acromantula: { id: 'acromantula', name: '아크로만툴라', hp: 72, atk: 17, def: 5, exp: 42, gold: [10, 26] },
  deathEater: { id: 'deathEater', name: '죽음을 먹는 자', hp: 80, atk: 19, def: 7, exp: 55, gold: [20, 40] },
  riddleShade: { id: 'riddleShade', name: '톰 리들의 환영', hp: 100, atk: 20, def: 8, exp: 90, gold: [25, 45], boss: true },
  basilisk: { id: 'basilisk', name: '바실리스크', hp: 140, atk: 24, def: 10, exp: 150, gold: [40, 70], boss: true },
  voldemortShadow: { id: 'voldemortShadow', name: '볼드모트의 잔영', hp: 180, atk: 28, def: 11, exp: 250, gold: [100, 200], boss: true, finalBoss: true },
};

/* 장소 정의: id, 이름, 설명, 태그(랜덤 이벤트 풀 결정), 연결된 장소, 가능한 행동 */
const LOCATIONS = {
  commonRoom: {
    id: 'commonRoom', name: '기숙사 휴게실',
    desc: '아늑한 벽난로 앞, 하루의 피로를 녹일 수 있는 곳.',
    tag: 'safe', connections: ['greatHall', 'library', 'corridors'],
  },
  greatHall: {
    id: 'greatHall', name: '대연회장',
    desc: '천장에 밤하늘이 펼쳐진 웅장한 홀. 학생들이 모여 식사를 한다.',
    tag: 'safe', connections: ['commonRoom', 'library', 'corridors', 'headmasterOffice'],
  },
  library: {
    id: 'library', name: '도서관',
    desc: '끝없이 늘어선 책장들. 지식과 단서가 잠들어 있다.',
    tag: 'library', connections: ['greatHall', 'corridors'],
  },
  classroom: {
    id: 'classroom', name: '주문학 교실',
    desc: '플리트윅 교수의 교실. 이곳에서 새로운 주문을 수련할 수 있다.',
    tag: 'training', connections: ['corridors'],
  },
  corridors: {
    id: 'corridors', name: '성의 복도',
    desc: '끝없이 이어지는 호그와트의 복도. 계단이 제멋대로 움직인다.',
    tag: 'corridor', connections: ['greatHall', 'library', 'classroom', 'hogsmeade', 'forbiddenForest', 'headmasterOffice'],
  },
  headmasterOffice: {
    id: 'headmasterOffice', name: '교장실',
    desc: '덤블도어 교수가 머무는 곳. 중요한 이야기는 이곳에서 이루어진다.',
    tag: 'quest', connections: ['greatHall', 'corridors'],
  },
  hogsmeade: {
    id: 'hogsmeade', name: '호그스미드 마을',
    desc: '학생들이 자유롭게 오갈 수 있는 유일한 마을. 상점들이 늘어서 있다.',
    tag: 'village', connections: ['corridors', 'honeydukes', 'ollivanders'],
  },
  honeydukes: {
    id: 'honeydukes', name: '허니듀크스',
    desc: '온갖 마법 과자와 물약을 파는 상점.', shop: 'honeydukes',
    tag: 'shop', connections: ['hogsmeade'],
  },
  ollivanders: {
    id: 'ollivanders', name: '올리밴더 지팡이 상점',
    desc: '지팡이와 방어구를 파는 유서 깊은 상점.', shop: 'ollivanders',
    tag: 'shop', connections: ['hogsmeade'],
  },
  forbiddenForest: {
    id: 'forbiddenForest', name: '금지된 숲',
    desc: '학생 출입 금지 구역. 위험하지만 강력한 존재들이 숨어있다.',
    tag: 'forest', connections: ['corridors'],
  },
  chamberOfSecrets: {
    id: 'chamberOfSecrets', name: '비밀의 방',
    desc: '전설로만 전해지던 장소. 차갑고 축축한 공기가 감돈다.',
    tag: 'chamber', connections: ['corridors'], locked: true,
  },
};

/* 상점 재고 */
const SHOPS = {
  honeydukes: { name: '허니듀크스', items: ['healPotion', 'manaPotion', 'chocolateFrog', 'elixir'] },
  ollivanders: { name: '올리밴더 상점', items: ['phoenixWand', 'dragonWand', 'dragonhideVest', 'invisibilityBooster', 'spellbookAdvanced'] },
};

/* 장소 태그별 랜덤 탐험 이벤트 풀 */
const EVENTS = {
  corridor: [
    {
      id: 'ghost_riddle', text: '피투성이 남작이 나타나 알쏭달쏭한 수수께끼를 낸다.\n"낮에는 숨고 밤에만 나타나는 것은?"',
      choices: [
        { label: '"그림자입니다."', success: true, effect: { intelligence: 1, exp: 6 }, resultText: '남작이 만족스러운 듯 사라진다. (지식 +1, 경험치 +6)' },
        { label: '모르겠다고 답한다', effect: { exp: 1 }, resultText: '남작이 코웃음을 치며 사라진다.' },
      ],
    },
    {
      id: 'peeves_prank', text: '말썽꾸러기 유령 피브스가 갑자기 물풍선을 던지려 한다!',
      choices: [
        { label: '주문으로 쫓아낸다 (마력 3 소모)', cost: { mp: 3 }, effect: { exp: 5, courage: 1 }, resultText: '피브스가 깔깔거리며 도망간다. (경험치 +5)' },
        { label: '재빨리 피한다', effect: { courage: 1 }, resultText: '간신히 피했다. 로브 자락만 살짝 젖었다.' },
      ],
    },
    {
      id: 'lost_firstyear', text: '길을 잃은 신입생이 울먹이며 서 있다.',
      choices: [
        { label: '길을 안내해준다', effect: { charm: 1, alignment: 4, exp: 5 }, resultText: '신입생이 고마워하며 뛰어간다. (매력 +1, 성향 +4)' },
        { label: '무시하고 지나간다', effect: { alignment: -3 }, resultText: '신입생이 실망한 표정을 짓는다. (성향 -3)' },
      ],
    },
    {
      id: 'find_coin', text: '복도 구석에서 반짝이는 갈레온 몇 개를 발견했다.',
      choices: [{ label: '줍는다', effect: { gold: 8 }, resultText: '8 갈레온을 얻었다.' }],
    },
    {
      id: 'moving_stairs', text: '계단이 갑자기 움직이며 낯선 통로로 이어진다.',
      choices: [
        { label: '따라가본다', effect: { exp: 4 }, resultText: '흥미로운 골동품이 있는 빈 교실을 발견했다.' },
        { label: '원래 길로 돌아간다', effect: {}, resultText: '무사히 원래 길로 돌아왔다.' },
      ],
    },
    { id: 'encounter_boggart', text: '옷장 속에서 부스럭거리는 소리가 들린다... 보가트다!', combat: 'boggart' },
    { id: 'encounter_pixie', text: '누군가 풀어놓은 콘월 픽시가 소란을 피운다!', combat: 'pixie' },
  ],
  library: [
    {
      id: 'clue_diary', text: '서고 깊은 곳, 먼지 쌓인 책들 사이에서 낯선 일기장을 발견했다.',
      once: true, requiresFlag: 'ch1_started', notFlag: 'has_diary',
      choices: [{ label: '일기장을 챙긴다', effect: { item: 'oldDiary', flag: 'has_diary', exp: 10 }, resultText: '낡은 일기장을 손에 넣었다. 무언가 단서가 될 것 같다.' }],
    },
    {
      id: 'study_session', text: '조용히 앉아 마법 이론서를 읽는다.',
      choices: [{ label: '집중해서 공부한다 (1시간)', effect: { intelligence: 2, exp: 6 }, resultText: '지식이 한층 늘었다. (지식 +2)' }],
    },
    {
      id: 'hermione_help', text: '헤르미온느가 어려운 주문의 이론을 친절히 설명해준다.',
      choices: [{ label: '경청한다', effect: { intelligence: 1, charm: 1, exp: 8 }, resultText: '많은 것을 배웠다. (지식 +1, 매력 +1)' }],
    },
    {
      id: 'restricted_section', text: '금서 구역에서 수상한 기운이 느껴진다.',
      choices: [
        { label: '몰래 살펴본다', effect: { alignment: -5, exp: 8, intelligence: 1 }, resultText: '어둠의 지식을 살짝 엿보았다. (성향 -5, 지식 +1)' },
        { label: '그냥 지나친다', effect: { alignment: 2 }, resultText: '유혹을 뿌리쳤다. (성향 +2)' },
      ],
    },
  ],
  forest: [
    { id: 'forest_acromantula', text: '거대한 거미줄 너머로 아크로만툴라가 모습을 드러낸다!', combat: 'acromantula' },
    { id: 'forest_darkcreature', text: '나무 그림자 사이에서 정체를 알 수 없는 어둠의 생명체가 튀어나온다!', combat: 'darkCreature' },
    { id: 'forest_troll', text: '거대한 발소리와 함께 산 트롤이 나타난다!', combat: 'troll' },
    {
      id: 'forest_centaur', text: '켄타우로스 무리가 별을 관찰하고 있다. 그중 하나가 당신을 바라본다.',
      choices: [
        { label: '정중히 인사한다', effect: { charm: 2, exp: 10, alignment: 3 }, resultText: '켄타우로스가 알듯 모를 듯한 조언을 건넨다. (매력 +2)' },
        { label: '조용히 지나간다', effect: { exp: 3 }, resultText: '별 탈 없이 지나쳤다.' },
      ],
    },
    {
      id: 'forest_herb', text: '희귀한 마법 약초가 자라난 것을 발견했다.',
      choices: [{ label: '채집한다', effect: { item: 'manaPotion', exp: 5 }, resultText: '약초를 채집해 마나 물약으로 정제했다.' }],
    },
    {
      id: 'forest_key', text: '땅에 반쯤 파묻힌 녹슨 열쇠를 발견했다.',
      once: true, notFlag: 'has_key',
      choices: [{ label: '집어 든다', effect: { item: 'rustyKey', flag: 'has_key', exp: 6 }, resultText: '녹슨 열쇠를 손에 넣었다.' }],
    },
  ],
  village: [
    {
      id: 'hogsmeade_hagrid', text: '해그리드가 오두막 앞에서 손을 흔든다. "차 한잔 하고 가겠니?"',
      choices: [
        { label: '함께 차를 마신다', effect: { hp: 15, charm: 2, exp: 6 }, resultText: '따뜻한 차와 함께 즐거운 시간을 보냈다. (체력 +15, 매력 +2)' },
        { label: '바쁘다며 사양한다', effect: {}, resultText: '해그리드가 아쉬운 표정을 짓는다.' },
      ],
    },
    {
      id: 'hogsmeade_beggar', text: '길가에 지친 방랑자 마법사가 도움을 청한다.',
      choices: [
        { label: '갈레온 10을 준다', requiresGold: 10, effect: { gold: -10, alignment: 6, exp: 5 }, resultText: '방랑자가 진심으로 고마워한다. (성향 +6)' },
        { label: '외면한다', effect: { alignment: -4 }, resultText: '뒤통수가 따갑다. (성향 -4)' },
      ],
    },
    {
      id: 'hogsmeade_duel', text: '한 학생이 결투를 신청한다. "실력 좀 볼까?"', combat: 'boggart',
    },
    {
      id: 'hogsmeade_gossip', text: '마을 사람들이 최근 실종 사건에 대해 수군거리고 있다.',
      choices: [{ label: '귀를 기울인다', effect: { exp: 6, flag: 'heard_rumor' }, resultText: '흥미로운 소문을 들었다. 교장실에 가서 상의해볼 만하다.' }],
    },
  ],
};

/* 메인 스토리 챕터 (교장실에서 진행) */
const STORY = {
  chapters: [
    {
      id: 'ch1',
      requiresFlags: [],
      setFlag: 'ch1_started',
      title: '1장. 이상한 소문',
      text: '덤블도어 교수가 근심 어린 얼굴로 말한다.\n"최근 학생들이 하나둘 실종되고 있다네. 복도와 도서관에서 단서를 찾아주겠나?"\n(도서관과 복도를 탐험하여 단서를 모아보세요)',
      choices: [{ label: '알겠습니다', effect: {}, resultText: '조사를 시작하기로 했다.' }],
    },
    {
      id: 'ch1_report',
      requiresFlags: ['ch1_started', 'has_diary'],
      setFlag: 'ch1_done',
      title: '단서 보고',
      text: '당신은 낡은 일기장을 덤블도어 교수에게 보여준다.\n그는 눈을 가늘게 뜨며 말한다.\n"이건... 예전에 이 학교를 다녔던 누군가의 일기로군. 필체가 낯이 익어. 금지된 숲에 무언가 더 있을지도 모르겠네."',
      choices: [{ label: '금지된 숲을 조사하겠습니다', effect: { exp: 20 }, resultText: '금지된 숲으로 향하기로 결심했다.' }],
    },
    {
      id: 'ch2',
      requiresFlags: ['ch1_done', 'has_key'],
      setFlag: 'ch2_done',
      title: '2장. 금지된 숲의 흔적',
      text: '금지된 숲에서 찾은 녹슨 열쇠를 교수에게 보여주자, 그의 표정이 굳는다.\n"이 열쇠는... 오래전 봉인되었던 방으로 통하는 것일세. \'비밀의 방\'이라 불리던 곳이지. 자네가 가려는가?"',
      choices: [
        { label: '제가 가겠습니다', effect: { flag: 'chamber_unlocked', exp: 25 }, resultText: '비밀의 방으로 가는 길이 열렸다.' },
      ],
    },
    {
      id: 'ch3',
      requiresFlags: ['ch2_done', 'riddle_defeated'],
      setFlag: 'ch3_done',
      title: '3장. 그림자의 정체',
      text: '톰 리들의 환영을 물리친 뒤, 당신은 그 안에서 흘러나온 검은 안개가 무언가의 "잔영"임을 느낀다.\n덤블도어가 침통하게 말한다.\n"그것은... 볼드모트가 남긴 어둠의 파편일세. 완전히 소멸시켜야만 학생들이 안전해질 걸세."',
      choices: [{ label: '끝까지 가겠습니다', effect: { exp: 30 }, resultText: '마지막 결전을 준비한다.' }],
    },
  ],
};

/* 엔딩 정의: alignment 값과 최종 보스 처치 여부에 따라 결정 */
const ENDINGS = {
  light: {
    id: 'light', title: '빛의 마법사',
    text: '당신은 어둠에 흔들리지 않고 끝까지 신념을 지켰다. 호그와트는 다시 평화를 되찾았고, 사람들은 당신을 진정한 영웅으로 기억한다.',
  },
  balanced: {
    id: 'balanced', title: '균형 잡힌 자',
    text: '당신은 빛과 어둠 사이에서 흔들렸지만, 결국 스스로의 길을 찾아냈다. 완벽하지는 않아도, 사람들은 당신의 선택을 존중한다.',
  },
  dark: {
    id: 'dark', title: '어둠에 물든 자',
    text: '금지된 주문을 거듭 사용하며, 당신의 영혼은 서서히 어둠에 잠식되었다. 승리는 거두었지만, 당신을 바라보는 이들의 눈빛엔 두려움이 서려 있다.',
  },
  defeat: {
    id: 'defeat', title: '쓰러진 자',
    text: '어둠 속에서 당신은 쓰러지고 말았다. 하지만 이야기는 여기서 끝나지 않을 것이다...',
  },
};
