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
            fail: { effect: { exp: 1 }, text: '남작이 코웃음을 치며 사라진다.' },
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
  ],

  library: [
    {
      id: 'clue_diary', once: true, requiresFlag: 'ch1_started', notFlag: 'has_diary',
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
            fail: { effect: { exp: 3 }, text: '설명이 너무 빨라 절반쯤 놓쳤다.' },
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
  ],

  forest: [
    { id: 'forest_acromantula', text: '거대한 거미줄 너머로 아크로만툴라가 모습을 드러낸다!', combat: 'acromantula' },
    { id: 'forest_darkcreature', text: '나무 그림자 사이에서 정체를 알 수 없는 어둠의 생명체가 튀어나온다!', combat: 'darkCreature' },
    { id: 'forest_troll', text: '거대한 발소리와 함께 산 트롤이 나타난다!', combat: 'troll' },
    {
      id: 'forest_centaur',
      text: '켄타우로스 무리가 별을 관찰하고 있다. 그중 하나가 당신을 바라본다.',
      choices: [
        {
          label: '정중히 인사한다', check: { stat: 'charm', dc: 6 },
          outcomes: {
            critical: { effect: { charm: 2, exp: 14, alignment: 4, item: 'manaPotion' }, text: '켄타우로스가 흡족해하며 마나 물약을 건넨다.' },
            success: { effect: { charm: 1, exp: 8, alignment: 2 }, text: '알듯 모를 듯한 조언을 건넨다. (매력 +1)' },
            fail: { effect: { exp: 2 }, text: '반응 없이 별만 바라본다.' },
            fumble: { effect: { alignment: -2 }, text: '무례하다는 듯 자리를 피한다. (성향 -2)' },
          },
        },
      ],
    },
    { id: 'forest_herb', text: '희귀한 마법 약초가 자라난 것을 발견했다.', choices: [{ label: '채집한다', effect: { item: 'manaPotion', exp: 5 }, resultText: '약초를 채집해 마나 물약으로 정제했다.' }] },
    {
      id: 'forest_key', once: true, notFlag: 'has_key',
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
  ],

  village: [
    {
      id: 'hogsmeade_hagrid',
      text: '해그리드가 오두막 앞에서 손을 흔든다. "차 한잔 하고 가겠니?"',
      choices: [
        { label: '함께 차를 마신다', effect: { hp: 15, charm: 2, exp: 6 }, resultText: '따뜻한 차와 함께 즐거운 시간을 보냈다. (체력 +15, 매력 +2)' },
        { label: '바쁘다며 사양한다', effect: {}, resultText: '해그리드가 아쉬운 표정을 짓는다.' },
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
  ],
};
