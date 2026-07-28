/* ===================== 랜덤 탐험 이벤트 ===================== */
/* choice.check가 있으면 능력 판정(4단계: critical/success/fail/fumble)을 거친다.
 * check가 없으면 기존처럼 effect가 무조건 적용된다 (가치관 선택 등 확률이 필요 없는 경우). */

const EVENTS = {
  corridor: [
    {
      id: 'ghost_riddle',
      text: '피투성이 남작이 나타나 알쏭달쏭한 수수께끼를 낸다.\n"낮에는 숨고 밤에만 나타나는 것은?"',
      choices: [
        {
          label: '"그림자입니다."', check: { stat: 'intelligence', dc: 5 },
          outcomes: {
            critical: { effect: { intelligence: 2, exp: 12 }, text: '남작이 감탄하며 사라진다. (지식 +2, 경험치 +12)' },
            success: { effect: { intelligence: 1, exp: 6 }, text: '남작이 만족스러운 듯 사라진다. (지식 +1, 경험치 +6)' },
            fail: { effect: {}, text: '남작이 코웃음을 치며 사라진다.' },
            fumble: { effect: { exp: 1, courage: -1 }, text: '남작이 서늘하게 웃으며 벽을 통과해 사라진다. 등골이 서늘하다.' },
          },
        },
        { label: '모르겠다고 답한다', effect: { exp: 1 }, resultText: '남작이 코웃음을 치며 사라진다.' },
      ],
    },
    {
      id: 'peeves_prank',
      text: '말썽꾸러기 유령 피브스가 갑자기 물풍선을 던지려 한다!',
      choices: [
        {
          label: '재빨리 피한다', check: { stat: 'agility', dc: 5 },
          outcomes: {
            critical: { effect: { exp: 8, agility: 1 }, text: '가볍게 피하며 멋진 몸놀림을 보였다. (민첩 +1)' },
            success: { effect: { exp: 4 }, text: '간신히 피했다.' },
            fail: { effect: { hp: -6 }, text: '물풍선을 정통으로 맞았다. 로브가 흠뻑 젖었다.' },
            fumble: { effect: { hp: -10, charm: -1 }, text: '미끄러져 넘어지며 온몸이 젖었다. 지나가던 학생들이 웃는다.' },
          },
        },
        { label: '주문으로 쫓아낸다 (마력 3 소모)', cost: { mp: 3 }, effect: { exp: 5, courage: 1 }, resultText: '피브스가 깔깔거리며 도망간다.' },
      ],
    },
    {
      id: 'lost_firstyear',
      text: '길을 잃은 신입생이 울먹이며 서 있다.',
      choices: [
        { label: '길을 안내해준다', effect: { charm: 1, alignment: 4, exp: 5 }, resultText: '신입생이 고마워하며 뛰어간다. (매력 +1, 성향 +4)' },
        { label: '무시하고 지나간다', effect: { alignment: -3 }, resultText: '신입생이 실망한 표정을 짓는다. (성향 -3)' },
      ],
    },
    { id: 'find_coin', text: '복도 구석에서 반짝이는 갈레온 몇 개를 발견했다.', choices: [{ label: '줍는다', effect: { gold: 8 }, resultText: '8 갈레온을 얻었다.' }] },
    {
      id: 'moving_stairs',
      text: '계단이 갑자기 움직이며 낯선 통로로 이어진다.',
      choices: [
        {
          label: '따라가본다', check: { stat: 'agility', dc: 4 },
          outcomes: {
            critical: { effect: { item: 'magicStone', exp: 8 }, text: '숨겨진 방에서 마법석을 발견했다!' },
            success: { effect: { exp: 4 }, text: '흥미로운 골동품이 있는 빈 교실을 발견했다.' },
            fail: { effect: {}, text: '막다른 길이었다. 되돌아왔다.' },
            fumble: { effect: { hp: -8 }, text: '계단이 갑자기 사라져 발을 헛디뎠다!' },
          },
        },
        { label: '원래 길로 돌아간다', effect: {}, resultText: '무사히 원래 길로 돌아왔다.' },
      ],
    },
    {
      id: 'corridor_gear', once: true,
      text: '복도 구석 갑옷 뒤에서 무언가 반짝이는 물건이 보인다.',
      choices: [{ label: '살펴본다', effect: { equipDrop: { slot: 'accessory', tier: 1 } }, resultText: '누군가 흘리고 간 장신구를 주웠다.' }],
    },
    { id: 'encounter_boggart', text: '옷장 속에서 부스럭거리는 소리가 들린다... 보가트다!', combat: 'boggart' },
    { id: 'encounter_pixie', text: '누군가 풀어놓은 콘월 픽시가 소란을 피운다!', combat: 'pixie' },
    { id: 'encounter_hinkypunk', text: '어두운 구석에서 정체 모를 불빛이 흔들리며 다가온다. 힝키펑크다!', combat: 'hinkypunk' },
    {
      id: 'corridor_prefect',
      text: '통금 시간이 지난 복도, 반장이 영운을 발견하고 다가온다. "영운, 이 시간에 여기서 뭐 하는 거지?"',
      choices: [
        {
          label: '그럴듯한 핑계를 댄다', check: { stat: 'charm', dc: 6 },
          outcomes: {
            critical: { effect: { charm: 1, exp: 6 }, text: '반장이 웃으며 넘어가 준다. 오히려 호감을 샀다.' },
            success: { effect: { exp: 4 }, text: '반장이 못 미더운 듯하지만 그냥 보내준다.' },
            fail: { effect: { alignment: -1 }, text: '변명이 통하지 않아 훈계를 들었다.' },
            fumble: { effect: { alignment: -3, gold: -5 }, text: '거짓말이 들통나 기숙사 점수를 깎일 뻔했다. 대신 벌금을 냈다.' },
          },
        },
      ],
    },
    {
      id: 'corridor_slytherin_taunt',
      text: '슬리데린 학생 무리가 지나가며 비웃는 말을 던진다.',
      choices: [
        {
          label: '당당하게 맞선다', check: { stat: 'courage', dc: 6 },
          outcomes: {
            critical: { effect: { courage: 2, exp: 8 }, text: '기죽지 않는 모습에 오히려 무리가 조용해진다.' },
            success: { effect: { courage: 1, exp: 4 }, text: '가볍게 받아치고 지나갔다.' },
            fail: { effect: {}, text: '별다른 대응 없이 지나쳤다.' },
            fumble: { effect: { alignment: -2 }, text: '말싸움이 커져 서로 감정만 상했다.' },
          },
        },
        { label: '무시하고 지나간다', effect: {}, resultText: '신경 쓰지 않기로 했다.' },
      ],
    },
    {
      id: 'find_nevilles_book', priority: true, once: true, requiresFlag: 'neville_book_active', notFlag: 'has_nevilles_book',
      text: '복도 구석 화분 뒤에 낡은 책 한 권이 떨어져 있다. 네빌이 찾던 것과 비슷하다.',
      choices: [{ label: '책을 챙긴다', effect: { item: 'nevilleBook', flag: 'has_nevilles_book', exp: 5 }, resultText: '네빌의 교과서를 찾았다! 돌려주러 가자.' }],
    },
    {
      id: 'ron_chat',
      text: '론이 복도에서 마주치자 반갑게 손을 흔든다. "영운아! 오늘 무슨 일 있었어?"',
      choices: [
        {
          label: '오늘 있었던 일을 이야기한다', check: { stat: 'charm', dc: 5 },
          outcomes: {
            critical: { effect: { companionAffinity: { id: 'ron', amount: 10 }, exp: 6 }, text: '론이 배꼽을 잡고 웃는다. 둘도 없는 이야기 상대가 된 기분이다.' },
            success: { effect: { companionAffinity: { id: 'ron', amount: 6 }, exp: 4 }, text: '론과 즐겁게 수다를 떨었다.' },
            fail: { effect: {}, text: '어색하게 몇 마디만 주고받았다.' },
            fumble: { effect: { companionAffinity: { id: 'ron', amount: -3 } }, text: '론이 딴 생각을 하는 듯 건성으로 대답한다. 살짝 서운한 눈치다.' },
          },
        },
      ],
    },
  ],

  library: [
    {
      id: 'clue_diary', priority: true, once: true, requiresFlag: 'ch1_started', notFlag: 'has_diary',
      text: '서고 깊은 곳, 먼지 쌓인 책들 사이에서 낯선 일기장을 발견했다.',
      choices: [{ label: '일기장을 챙긴다', effect: { item: 'oldDiary', flag: 'has_diary', exp: 10 }, resultText: '낡은 일기장을 손에 넣었다. 무언가 단서가 될 것 같다.' }],
    },
    {
      id: 'study_session', text: '조용히 앉아 마법 이론서를 읽는다.',
      choices: [{ label: '집중해서 공부한다', effect: { intelligence: 2, exp: 6 }, resultText: '지식이 한층 늘었다. (지식 +2)' }],
    },
    {
      id: 'hermione_help',
      text: '헤르미온느가 어려운 주문의 이론을 친절히 설명해준다.',
      choices: [
        {
          label: '경청한다', check: { stat: 'charm', dc: 6 },
          outcomes: {
            critical: { effect: { learnSpell: 'episkey' }, text: '헤르미온느가 감탄하며 에피스키 시전법을 직접 보여준다! [에피스키]를 습득했다.' },
            success: { effect: { intelligence: 1, charm: 1, exp: 8 }, text: '많은 것을 배웠다. (지식 +1, 매력 +1)' },
            fail: { effect: {}, text: '설명이 너무 빨라 절반쯤 놓쳤다.' },
            fumble: { effect: { charm: -1 }, text: '엉뚱한 질문을 해서 살짝 무안해졌다.' },
          },
        },
      ],
    },
    {
      id: 'restricted_section',
      text: '금서 구역에서 수상한 기운이 느껴진다.',
      choices: [
        {
          label: '몰래 살펴본다', check: { stat: 'intelligence', dc: 9 },
          outcomes: {
            critical: { effect: { item: 'scrollSectumsempra', alignment: -5, exp: 10 }, text: '위험한 지식을 완전히 이해했다. [섹텀셈프라] 주문서를 손에 넣었다. (성향 -5)' },
            success: { effect: { item: 'scrollSectumsempra', alignment: -8 }, text: '어둠의 지식을 옮겨 적었다. [섹텀셈프라] 주문서를 손에 넣었다. (성향 -8)' },
            fail: { effect: { alignment: -3 }, text: '알 수 없는 불쾌한 기운만 느끼고 물러났다. (성향 -3)' },
            fumble: { effect: { alignment: -10, hp: -10 }, text: '봉인 마법이 발동해 저주에 스쳤다! (성향 -10, 체력 -10)' },
          },
        },
        { label: '그냥 지나친다', effect: { alignment: 2 }, resultText: '유혹을 뿌리쳤다. (성향 +2)' },
      ],
    },
    {
      id: 'library_notes', once: true,
      text: '누군가 두고 간 선배의 필기 노트를 발견했다. 여백에 낯선 주문이 적혀 있다.',
      choices: [{ label: '옮겨 적는다', effect: { item: 'scrollAvifors', exp: 5 }, resultText: '[아비포스] 주문서를 손에 넣었다.' }],
    },
    {
      id: 'library_ancient_rune',
      text: '고대 룬 문자가 새겨진 석판을 발견했다. 해독할 수 있을까?',
      choices: [
        {
          label: '해독을 시도한다', check: { stat: 'intelligence', dc: 8 },
          outcomes: {
            critical: { effect: { intelligence: 3, exp: 14, item: 'magicStone' }, text: '완벽하게 해독했다! 숨겨진 지식과 함께 마법석을 발견했다.' },
            success: { effect: { intelligence: 1, exp: 8 }, text: '일부를 해독하는 데 성공했다.' },
            fail: { effect: {}, text: '전혀 알아볼 수 없는 문자였다.' },
            fumble: { effect: { mp: -10 }, text: '잘못된 해석으로 작은 마법 반응이 일어나 마력이 소모되었다.' },
          },
        },
      ],
    },
    {
      id: 'library_overdue_book',
      text: '사서 핀스 부인이 연체된 책을 들고 영운을 노려본다.',
      choices: [
        {
          label: '정중히 사과한다', check: { stat: 'charm', dc: 5 },
          outcomes: {
            critical: { effect: { charm: 1 }, text: '핀스 부인의 마음이 누그러져 오히려 좋은 책을 추천해준다.' },
            success: { effect: {}, text: '사과를 받아들여 준다.' },
            fail: { effect: { gold: -5 }, text: '연체료를 물어야 했다.' },
            fumble: { effect: { gold: -10, alignment: -1 }, text: '핀스 부인이 단단히 화가 나 벌금을 두 배로 물렸다.' },
          },
        },
      ],
    },
    {
      id: 'hermione_chat',
      text: '헤르미온느가 책 더미에 파묻혀 있다가 영운을 보고 웃는다. "영운아, 마침 잘 왔어!"',
      choices: [
        {
          label: '함께 공부한다', check: { stat: 'intelligence', dc: 5 },
          outcomes: {
            critical: { effect: { companionAffinity: { id: 'hermione', amount: 10 }, intelligence: 1 }, text: '헤르미온느와 죽이 잘 맞는다. 즐거운 시간이었다.' },
            success: { effect: { companionAffinity: { id: 'hermione', amount: 6 } }, text: '함께 공부하며 가까워졌다.' },
            fail: { effect: {}, text: '진도를 따라가기 벅찼지만 나쁘지 않았다.' },
            fumble: { effect: { companionAffinity: { id: 'hermione', amount: -3 } }, text: '헤르미온느가 다른 책에 정신이 팔려 대답도 건성이다. 살짝 무시당한 기분이다.' },
          },
        },
      ],
    },
  ],

  forest: [
    { id: 'forest_acromantula', text: '거대한 거미줄 너머로 아크로만툴라가 모습을 드러낸다!', combat: 'acromantula' },
    { id: 'forest_darkcreature', text: '나무 그림자 사이에서 정체를 알 수 없는 어둠의 생명체가 튀어나온다!', combat: 'darkCreature' },
    { id: 'forest_troll', text: '거대한 발소리와 함께 산 트롤이 나타난다!', combat: 'troll' },
    { id: 'forest_bowtruckle', text: '나무껍질처럼 위장하고 있던 작은 생명체가 나뭇가지를 휘두르며 경계한다. 보우트러클이다!', combat: 'bowtruckle' },
    { id: 'forest_werewolf', text: '달빛 아래 그림자 하나가 늑대의 형상으로 일렁인다!', combat: 'werewolfShade' },
    {
      id: 'forest_basilisk_lair', once: true,
      requiresFn: (s) => ((s.statsTrack.exploreByTag || {}).forest || 0) >= 8,
      text: '깊은 굴 속에서 거대한 비늘이 스치는 소리가 들린다... 전설의 바실리스크와 마주쳤다!',
      combat: 'basilisk',
    },
    {
      id: 'hagrid_favor_herb', priority: true, once: true, requiresFlag: 'hagrid_favor_active', notFlag: 'hagrid_favor_have_herb',
      text: '해그리드가 말한 은빛 잎사귀 약초가 나무 아래 자라있다.',
      choices: [{ label: '조심스레 채집한다', effect: { item: 'rareHerb', flag: 'hagrid_favor_have_herb', exp: 6 }, resultText: '희귀한 약초를 채집했다. 해그리드에게 가져다주자.' }],
    },
    {
      id: 'forest_centaur',
      text: '켄타우로스 무리가 별을 관찰하고 있다. 그중 하나가 영운을 바라본다.',
      choices: [
        {
          label: '정중히 인사한다', check: { stat: 'charm', dc: 6 },
          outcomes: {
            critical: { effect: { charm: 2, exp: 14, alignment: 4, item: 'manaPotion' }, text: '켄타우로스가 흡족해하며 마나 물약을 건넨다.' },
            success: { effect: { charm: 1, exp: 8, alignment: 2 }, text: '알듯 모를 듯한 조언을 건넨다. (매력 +1)' },
            fail: { effect: {}, text: '반응 없이 별만 바라본다.' },
            fumble: { effect: { alignment: -2 }, text: '무례하다는 듯 자리를 피한다. (성향 -2)' },
          },
        },
      ],
    },
    { id: 'forest_herb', text: '희귀한 마법 약초가 자라난 것을 발견했다.', choices: [{ label: '채집한다', effect: { item: 'manaPotion', exp: 5 }, resultText: '약초를 채집해 마나 물약으로 정제했다.' }] },
    {
      id: 'forest_key', priority: true, once: true, notFlag: 'has_key',
      text: '땅에 반쯤 파묻힌 녹슨 열쇠를 발견했다.',
      choices: [{ label: '집어 든다', effect: { item: 'rustyKey', flag: 'has_key', exp: 6 }, resultText: '녹슨 열쇠를 손에 넣었다.' }],
    },
    {
      id: 'forest_treasure',
      text: '나무 뿌리 사이에 무언가 파묻힌 흔적이 있다.',
      choices: [
        {
          label: '파헤쳐본다', check: { stat: 'luck', dc: 6 },
          outcomes: {
            critical: { effect: { equipDrop: { slot: 'wand', tier: 2 } }, text: '누군가 잃어버린 지팡이를 발견했다!' },
            success: { effect: { item: 'magicStone' }, text: '마법석 조각을 발견했다.' },
            fail: { effect: {}, text: '흙과 나무뿌리뿐이었다.' },
            fumble: { effect: { hp: -6 }, text: '숨어있던 콘월 픽시 떼에게 물렸다!' },
          },
        },
      ],
    },
    {
      id: 'luna_chat',
      text: '루나가 나뭇가지 사이에서 나뭇잎으로 만든 목걸이를 만지작거리며 콧노래를 부르고 있다.',
      choices: [
        {
          label: '무엇을 하는지 물어본다', check: { stat: 'luck', dc: 5 },
          outcomes: {
            critical: { effect: { companionAffinity: { id: 'luna', amount: 10 }, luck: 1 }, text: '루나가 신비로운 이야기를 들려준다. 왠지 운이 좋아진 기분이다.' },
            success: { effect: { companionAffinity: { id: 'luna', amount: 6 } }, text: '알쏭달쏭하지만 즐거운 대화를 나눴다.' },
            fail: { effect: {}, text: '무슨 말인지 잘 이해되지 않았지만 웃음이 났다.' },
            fumble: { effect: { companionAffinity: { id: 'luna', amount: -3 } }, text: '루나가 먼 산을 바라보며 대답이 없다. 이상하게 거리감이 느껴진다.' },
          },
        },
      ],
    },
  ],

  village: [
    {
      id: 'hogsmeade_hagrid',
      text: '해그리드가 오두막 앞에서 손을 흔든다. "영운아, 차 한잔 하고 가겠니?"',
      choices: [
        { label: '함께 차를 마신다', effect: { hp: 15, charm: 2, exp: 6 }, resultText: '따뜻한 차와 함께 즐거운 시간을 보냈다. (체력 +15, 매력 +2)' },
        { label: '바쁘다며 사양한다', effect: {}, resultText: '해그리드가 아쉬운 표정을 짓는다.' },
      ],
    },
    {
      id: 'hagrid_favor_ask', priority: true, once: true, notFlag: 'hagrid_favor_active',
      text: '해그리드가 걱정스러운 표정으로 말한다. "영운아, 부탁 하나만 들어줄 수 있겠니? 금지된 숲 깊은 곳에 은빛 잎사귀 약초가 자란다는데, 다치는 동물이 있어서 말이야..."',
      choices: [{ label: '부탁을 들어주겠다고 한다', effect: { flag: 'hagrid_favor_active' }, resultText: '금지된 숲에서 약초를 찾아보기로 했다.' }],
    },
    {
      id: 'hagrid_favor_return', priority: true, once: true, requiresFlag: 'hagrid_favor_have_herb',
      text: '해그리드에게 채집해 온 약초를 건넨다.',
      choices: [{ label: '"여기, 부탁하신 약초예요."', effect: { gold: 30, exp: 15, item: 'healPotion' }, resultText: '해그리드가 활짝 웃으며 고마워한다. 답례로 회복 물약을 챙겨준다.' }],
    },
    {
      id: 'hogsmeade_owl_post',
      text: '부엉이 우체국에서 편지 한 통이 영운 앞으로 배달된다.',
      choices: [
        {
          label: '열어본다', check: { stat: 'luck', dc: 5 },
          outcomes: {
            critical: { effect: { gold: 20, exp: 5 }, text: '먼 친척이 용돈을 보내주었다! (갈레온 +20)' },
            success: { effect: { gold: 8 }, text: '작은 용돈이 들어있었다.' },
            fail: { effect: {}, text: '광고 전단지였다.' },
            fumble: { effect: { alignment: -1 }, text: '누군가 보낸 짓궂은 장난 편지였다.' },
          },
        },
      ],
    },
    {
      id: 'hogsmeade_quidditch',
      text: '친구가 퀴디치 경기 표를 흔들며 함께 보러 가자고 한다.',
      choices: [
        { label: '함께 응원하러 간다', effect: { charm: 1, exp: 6, hp: 10 }, resultText: '신나는 경기를 보며 스트레스를 풀었다. (매력 +1, 체력 +10)' },
        { label: '다음에 가겠다고 한다', effect: {}, resultText: '아쉽지만 다음을 기약했다.' },
      ],
    },
    {
      id: 'hogsmeade_beggar',
      text: '길가에 지친 방랑자 마법사가 도움을 청한다.',
      choices: [
        { label: '갈레온 10을 준다', requiresGold: 10, effect: { gold: -10, alignment: 6, exp: 5 }, resultText: '방랑자가 진심으로 고마워한다. (성향 +6)' },
        { label: '외면한다', effect: { alignment: -4 }, resultText: '뒤통수가 따갑다. (성향 -4)' },
      ],
    },
    { id: 'hogsmeade_duel', text: '한 학생이 결투를 신청한다. "실력 좀 볼까?"', combat: 'rivalStudent' },
    {
      id: 'hogsmeade_gossip',
      text: '마을 사람들이 최근 실종 사건에 대해 수군거리고 있다.',
      choices: [{ label: '귀를 기울인다', effect: { exp: 6, flag: 'heard_rumor' }, resultText: '흥미로운 소문을 들었다. 교장실에 가서 상의해볼 만하다.' }],
    },
    {
      id: 'hogsmeade_stall',
      text: '노점상이 낡은 상자 하나를 헐값에 팔고 있다. "운이 좋으면 좋은 게 나올 수도?"',
      choices: [
        {
          label: '갈레온 5로 산다', requiresGold: 5, check: { stat: 'luck', dc: 6 },
          outcomes: {
            critical: { effect: { gold: -5, item: 'magicStone', exp: 4 }, text: '상자 안에 마법석이 두 개나 들어있었다! (마법석 +2)' },
            success: { effect: { gold: -5, item: 'magicStone' }, text: '마법석 하나를 건졌다.' },
            fail: { effect: { gold: -5 }, text: '잡동사니뿐이었다.' },
            fumble: { effect: { gold: -5, alignment: -1 }, text: '상자 안에서 고약한 냄새가 나는 물건만 나왔다.' },
          },
        },
      ],
    },
    {
      id: 'neville_book_request', priority: true, once: true, notFlag: 'neville_book_active',
      text: '네빌이 걱정스러운 얼굴로 다가온다. "혹시 내 약초학 교과서 못 봤어? 복도 어딘가에서 잃어버린 것 같은데..."',
      choices: [{ label: '찾아봐 주겠다고 한다', effect: { flag: 'neville_book_active' }, resultText: '네빌의 교과서를 찾아주기로 했다.' }],
    },
    {
      id: 'return_nevilles_book', priority: true, once: true, requiresFlag: 'has_nevilles_book',
      text: '네빌에게 찾아낸 교과서를 건넨다.',
      choices: [{ label: '"여기, 찾았어."', effect: { companionAffinity: { id: 'neville', amount: 15 }, gold: 10, exp: 8 }, resultText: '네빌이 눈물이 그렁그렁한 채로 고마워한다. (네빌과 더 가까워졌다)' }],
    },
    {
      id: 'neville_chat',
      text: '네빌이 온실에서 가져온 화분을 조심스레 옮기다 영운을 발견하고 인사한다. "아, 영운아!"',
      choices: [
        {
          label: '함께 화분을 옮겨준다', check: { stat: 'charm', dc: 5 },
          outcomes: {
            critical: { effect: { companionAffinity: { id: 'neville', amount: 10 }, charm: 1 }, text: '네빌이 진심으로 고마워하며 마음을 연다.' },
            success: { effect: { companionAffinity: { id: 'neville', amount: 6 } }, text: '네빌과 도란도란 이야기를 나눴다.' },
            fail: { effect: {}, text: '어색했지만 그런대로 도와주었다.' },
            fumble: { effect: { companionAffinity: { id: 'neville', amount: -3 } }, text: '네빌이 당황해 서둘러 자리를 뜬다. 실수한 것 같다.' },
          },
        },
      ],
    },
  ],

  /* 대연회장·기숙사 휴게실 — 책에 등장하는 대형 이벤트들. 필수 조건 충족 시 다른 것보다 우선 등장한다. */
  safe: [
    {
      id: 'halloween_troll', priority: true, once: true, requiresFlag: 'ch1_started',
      text: '핼러윈 연회 도중, 한 교수가 다급하게 뛰어들며 외친다.\n"트롤이다! 던전에 트롤이 있다!"\n대연회장이 순식간에 아수라장이 된다. 문득 헤르미온느가 아직 화장실에서 나오지 않았다는 사실이 떠오른다.',
      choices: [
        { label: '헤르미온느를 구하러 달려간다', effect: { companionAffinity: { id: 'hermione', amount: 20 } }, resultText: '한달음에 달려가니 거대한 트롤이 헤르미온느 앞을 가로막고 있었다!', combat: 'troll' },
        { label: '다른 학생들과 함께 대피한다', effect: { exp: 5, alignment: -2 }, resultText: '안전하게 대피했지만, 헤르미온느가 걱정되어 마음이 편치 않다.' },
      ],
    },
    {
      id: 'quidditch_match', priority: true, once: true, requiresFlag: 'ch1_done',
      text: '기숙사 대항 퀴디치 시합 날이다! 관중석이 함성으로 가득 찬 가운데, 빗자루를 탄 선수들이 하늘로 날아오른다.',
      choices: [
        {
          label: '직접 경기에 나선다', check: { stat: 'agility', dc: 7 },
          outcomes: {
            critical: { effect: { exp: 25, gold: 30, charm: 2 }, text: '눈부신 활약으로 스니치를 잡아냈다! 관중석이 떠나갈 듯한 함성을 보낸다.' },
            success: { effect: { exp: 15, gold: 15 }, text: '치열한 접전 끝에 승리를 거뒀다.' },
            fail: { effect: { hp: -10 }, text: '빗자루에서 떨어질 뻔했다. 아쉽게 패배했다.' },
            fumble: { effect: { hp: -20, charm: -1 }, text: '크게 넘어져 다치고, 경기에서도 패배하고 말았다.' },
          },
        },
        { label: '관중석에서 응원한다', effect: { charm: 1, exp: 5 }, resultText: '친구들과 함께 신나게 응원했다.' },
      ],
    },
    {
      id: 'yule_ball', priority: true, once: true, requiresFlag: 'ch2_done',
      text: '겨울 무도회가 열리는 밤, 화려하게 장식된 대연회장에 친구들이 한자리에 모였다.',
      choices: [
        {
          label: '친구들과 함께 춤추며 즐긴다', check: { stat: 'charm', dc: 6 },
          outcomes: {
            critical: { effect: { companionAffinityAll: 12, charm: 2 }, text: '모두가 함박웃음을 지으며 밤새 즐거운 시간을 보냈다.' },
            success: { effect: { companionAffinityAll: 8 }, text: '다 함께 즐거운 시간을 보냈다.' },
            fail: { effect: {}, text: '어색하게 자리만 지키다 왔다.' },
            fumble: { effect: { charm: -1 }, text: '실수로 넘어져 잠시 망신을 당했다.' },
          },
        },
        { label: '조용히 구석에서 지켜본다', effect: { intelligence: 1 }, resultText: '차분하게 밤을 보냈다.' },
      ],
    },
  ],
};
