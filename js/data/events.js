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
            critical: { effect: { intelligence: 2, exp: 12 }, text: '남작이 감탄하며 사라진다.' },
            success: { effect: { intelligence: 1, exp: 6 }, text: '남작이 만족스러운 듯 사라진다.' },
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
            critical: { effect: { exp: 8, agility: 1 }, text: '가볍게 피하며 멋진 몸놀림을 보였다.' },
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
        { label: '길을 안내해준다', effect: { charm: 1, alignment: 4, exp: 5 }, resultText: '신입생이 고마워하며 뛰어간다.' },
        { label: '무시하고 지나간다', effect: { alignment: -3 }, resultText: '신입생이 실망한 표정을 짓는다.' },
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
      id: 'find_nevilles_book', priority: 1, once: true, requiresFlag: 'neville_book_active', notFlag: 'has_nevilles_book',
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
    {
      id: 'professor_suspicion', once: true,
      requiresFn: (s) => !!(s.memories && s.memories.read_dark_book),
      recall: 'read_dark_book', recallText: '금서 구역에서 옮겨 적었던 그 어두운 지식이 떠오른다.',
      text: '스네이프 교수가 복도에서 영운을 불러 세운다.\n\n"요즘 자네에게서... 익숙하지 않은 기운이 느껴지는군." 그의 눈이 가늘어진다. "무엇을 공부하고 있는 건가?"',
      choices: [
        {
          label: '시치미를 뗀다', check: { stat: 'charm', dc: 8 },
          outcomes: {
            critical: { effect: { exp: 10 }, text: '태연한 얼굴에 교수도 더 캐묻지 않고 돌아선다.' },
            success: { effect: { exp: 5 }, text: '교수가 미심쩍은 눈으로 바라보지만, 일단은 넘어간다.' },
            fail: { effect: { alignment: -3 }, text: '목소리가 떨린 걸 눈치챘는지, 교수의 눈빛이 더 날카로워진다.' },
            fumble: { effect: { alignment: -6 }, text: '"거짓말은 서투르군." 교수가 낮게 말한다. 요주의 인물로 찍힌 듯하다.' },
          },
        },
        { label: '솔직하게 털어놓는다', effect: { alignment: 3, exp: 6 }, resultText: '교수는 뜻밖이라는 듯 잠시 침묵하더니, "차라리 낫군." 이라고만 말한다.' },
        { label: '얼버무리며 지나간다', effect: {}, resultText: '교수는 더 묻지 않지만, 시선이 오래도록 등 뒤에 머무는 게 느껴진다.' },
      ],
    },
    {
      id: 'broom_balance_training',
      requiresFn: (s) => !s.flags.broomBalance_done,
      text: '창밖으로 마당에서 빗자루 비행 연습이 한창인 게 보인다.\n\n아직도 이륙하는 순간의 균형이 영 서투르다. 오늘도 한 번 더 시도해볼까.',
      choices: [
        {
          label: '빗자루에 올라 균형을 잡아본다', check: { stat: 'agility', dc: 7 },
          streakId: 'broomBalance', streakTarget: 3,
          streakReward: { agility: 2, exp: 20 },
          streakRewardText: '이제 빗자루 위에서 흔들림 없이 균형을 잡을 수 있게 되었다!',
          outcomes: {
            critical: { effect: { exp: 8 }, text: '깃털처럼 가볍게 떠올라 완벽하게 균형을 잡았다!' },
            success: { effect: { exp: 5 }, text: '비틀거렸지만 넘어지지 않고 버텨냈다.' },
            fail: { effect: {}, text: '균형을 잃고 풀밭에 쿵 떨어졌다. 처음부터 다시 해야 할 것 같다.' },
            fumble: { effect: { hp: -4 }, text: '빗자루가 제멋대로 날뛰며 바닥에 내동댕이쳐졌다.' },
          },
        },
      ],
    },
    {
      id: 'boggart_encounter', once: true, priority: 1,
      text: '복도 끝, 낡은 옷장이 덜컹거리며 흔들린다.\n\n손잡이를 잡는 순간 문이 벌컥 열리며, 안개 같은 형체가 소용돌이친다. 그것은 아직 아무 모습도 아니었다 — 이제 막, 영운이 가장 두려워하는 것으로 변하려는 참이다.',
      choices: [
        {
          label: '거대한 거미가 나타난다', check: { stat: 'courage', dc: 7 },
          outcomes: {
            critical: { effect: { memory: 'fear_spider', flag: 'boggart_faced', exp: 15, courage: 1 }, text: '"리들리쿠러스!" 외치자 거미 다리에 롤러스케이트가 채워지며 우스꽝스럽게 미끄러진다. 웃음이 터지자 안개가 순식간에 옅어지며 사라졌다.' },
            success: { effect: { memory: 'fear_spider', flag: 'boggart_faced', exp: 8 }, text: '"리, 리들리쿠러스!" 목소리가 떨렸지만, 거미 다리 여덟 개가 풍선처럼 부풀어 오르는 걸 보자 웃음이 새어 나왔다. 형체가 흐려지며 흩어진다.' },
            fail: { effect: { memory: 'fear_spider', flag: 'boggart_faced' }, text: '주문이 목에 걸려 나오지 않는다. 거미가 성큼 다가서는 순간, 지나가던 선배가 대신 주문을 외쳐준다. 안개가 겨우 흩어졌다.' },
            fumble: { effect: { memory: 'fear_spider', flag: 'boggart_faced', hp: -4 }, text: '몸이 얼어붙어 아무 말도 나오지 않는다. 거미 형상이 코앞까지 다가온 순간에야, 누군가 대신 처리해준다. 식은땀이 흥건하다.' },
          },
        },
        {
          label: '숨 막히는 어둠이 밀려온다', check: { stat: 'courage', dc: 7 },
          outcomes: {
            critical: { effect: { memory: 'fear_darkness', flag: 'boggart_faced', exp: 15, courage: 1 }, text: '"리들리쿠러스!" 어둠이 뿅 소리를 내며 색색의 폭죽처럼 터진다. 형체가 순식간에 흩어지며 사라졌다.' },
            success: { effect: { memory: 'fear_darkness', flag: 'boggart_faced', exp: 8 }, text: '숨이 턱 막혔지만 주문을 외치자, 어둠이 반짝이는 색종이 조각으로 변해 흩날린다.' },
            fail: { effect: { memory: 'fear_darkness', flag: 'boggart_faced' }, text: '목소리가 나오지 않는다. 지나가던 선배가 대신 주문을 외쳐, 어둠이 겨우 걷힌다.' },
            fumble: { effect: { memory: 'fear_darkness', flag: 'boggart_faced', hp: -4 }, text: '숨이 막혀 아무것도 할 수 없다. 누군가 대신 처리해줄 때까지, 온몸이 얼어붙어 있었다.' },
          },
        },
        {
          label: '무언가에 실패하는 모습이 보인다', check: { stat: 'courage', dc: 7 },
          outcomes: {
            critical: { effect: { memory: 'fear_failure', flag: 'boggart_faced', exp: 15, courage: 1 }, text: '"리들리쿠러스!" 실패하는 자신의 모습이 우스꽝스러운 몸짓으로 바뀌어 버린다. 웃음과 함께 형체가 사라졌다.' },
            success: { effect: { memory: 'fear_failure', flag: 'boggart_faced', exp: 8 }, text: '주문을 외치자 장면이 익살스럽게 뒤틀린다. 조금 민망하지만, 형체는 흩어졌다.' },
            fail: { effect: { memory: 'fear_failure', flag: 'boggart_faced' }, text: '그 장면에서 눈을 뗄 수가 없다. 선배가 대신 주문을 외워준다.' },
            fumble: { effect: { memory: 'fear_failure', flag: 'boggart_faced', hp: -4 }, text: '다리에 힘이 풀려 주저앉는다. 누군가 대신 처리해줄 때까지 아무 말도 나오지 않았다.' },
          },
        },
        {
          label: '소중한 사람을 잃는 장면이 스친다', check: { stat: 'courage', dc: 7 },
          outcomes: {
            critical: { effect: { memory: 'fear_loss', flag: 'boggart_faced', exp: 15, courage: 1 }, text: '"리들리쿠러스!" 장면이 뚝 끊기며 우스꽝스러운 촌극으로 바뀐다. 웃음과 함께 형체가 사라졌다.' },
            success: { effect: { memory: 'fear_loss', flag: 'boggart_faced', exp: 8 }, text: '목이 메었지만 주문을 외쳤다. 장면이 어색하게 뒤틀리며 형체가 흩어진다.' },
            fail: { effect: { memory: 'fear_loss', flag: 'boggart_faced' }, text: '가슴이 죄어와 아무 말도 나오지 않는다. 선배가 대신 나서준다.' },
            fumble: { effect: { memory: 'fear_loss', flag: 'boggart_faced', hp: -4 }, text: '그 자리에 얼어붙어 버렸다. 누군가 나서줄 때까지, 눈물이 핑 돌았다.' },
          },
        },
      ],
    },
    {
      id: 'patronus_practice', once: true, priority: 1,
      requiresFlag: 'dementor_faced',
      requiresFn: (s) => !s.flags.patronusPractice_done,
      text: '루핀 교수가 조용히 다가온다.\n\n"디멘터를 마주쳤다고 들었네. 괜찮다면… 패트로누스를 가르쳐주지. 쉽지 않을 걸세. 정말로 행복했던 기억 하나에 온전히 집중해야 하네."',
      choices: [
        {
          label: '행복한 기억에 집중하며 "익스펙토 패트로눔!"', check: { stat: 'charm', dc: 9 },
          streakId: 'patronusPractice', streakTarget: 3,
          streakRewardText: '은빛 안개가 짙어지더니, 마침내 또렷한 형체를 갖춘다 — 영운만의 수호신이 완성되었다!',
          streakReward: { learnSpell: 'expectoPatronum' },
          outcomes: {
            critical: { effect: { exp: 10 }, text: '지팡이 끝에서 밝은 은빛이 뿜어져 나온다. 루핀 교수의 눈이 커진다. "훌륭하군!"' },
            success: { effect: { exp: 6 }, text: '희미한 은빛 안개가 지팡이 끝에서 피어오른다. "좋아, 그 감각을 잊지 말게."' },
            fail: { effect: {}, text: '아무 일도 일어나지 않는다. "괜찮네, 다시 해보게." 루핀 교수가 다독인다.' },
            fumble: { effect: {}, text: '집중이 흐트러지며 오히려 서늘한 기운이 스친다. 잠시 숨을 고른다.' },
          },
        },
      ],
    },
    {
      id: 'patronus_trial', once: true, priority: 1,
      requiresFlag: 'patronusPractice_done',
      requiresFn: (s) => !s.flags.patronusTrial_done,
      text: '루핀 교수가 진지한 얼굴로 말한다.\n\n"기초는 익혔군. 하지만 진짜 디멘터 앞에서, 그것도 여러 번 연속으로 버텨낼 수 있겠나? 이건 훈련이 아니라 시련일세. 준비되었을 때만 도전하게."',
      choices: [
        {
          label: '시련에 도전한다 (연속 3회 성공 · 실패 시 처음부터)', check: { stat: 'charm', dc: 12 },
          streakId: 'patronusTrial', streakTarget: 3,
          streakRewardText: '',
          outcomes: {
            critical: { effect: { exp: 15 }, text: '수호신이 또렷하게 솟아올라 주변을 은빛으로 물들인다. 루핀 교수가 감탄한다.' },
            success: { effect: { exp: 8 }, text: '수호신이 흔들림 없이 버텨낸다.' },
            fail: { effect: {}, text: '집중이 무너지며 수호신이 옅어진다. 처음부터 다시 해야 한다.' },
            fumble: { effect: { hp: -6 }, text: '서늘한 냉기가 스치며 온몸에 소름이 돋는다. 다시 정신을 가다듬어야 한다.' },
          },
        },
        { label: '아직은 때가 아니다', effect: {}, resultText: '조금 더 자신감이 붙으면 다시 도전하기로 했다.' },
      ],
    },
  ],

  library: [
    {
      id: 'clue_diary', priority: 3, once: true, requiresFlag: 'ch1_started', notFlag: 'has_diary',
      text: '서고 깊은 곳, 먼지 쌓인 책들 사이에서 낯선 일기장을 발견했다.',
      choices: [{ label: '일기장을 챙긴다', effect: { item: 'oldDiary', flag: 'has_diary', exp: 10 }, resultText: '낡은 일기장을 손에 넣었다. 무언가 단서가 될 것 같다.' }],
    },
    {
      id: 'study_session', text: '조용히 앉아 마법 이론서를 읽는다.',
      choices: [{ label: '집중해서 공부한다', effect: { intelligence: 2, exp: 6 }, resultText: '지식이 한층 늘었다.' }],
    },
    {
      id: 'hermione_help',
      text: '헤르미온느가 어려운 주문의 이론을 친절히 설명해준다.',
      choices: [
        {
          label: '경청한다', check: { stat: 'charm', dc: 6 },
          outcomes: {
            critical: { effect: { learnSpell: 'episkey' }, text: '헤르미온느가 감탄하며 에피스키 시전법을 직접 보여준다! [에피스키]를 습득했다.' },
            success: { effect: { intelligence: 1, charm: 1, exp: 8 }, text: '많은 것을 배웠다.' },
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
            critical: { effect: { item: 'scrollSectumsempra', alignment: -5, exp: 10, memory: 'read_dark_book' }, text: '위험한 지식을 완전히 이해했다. [섹텀셈프라] 주문서를 손에 넣었다.' },
            success: { effect: { item: 'scrollSectumsempra', alignment: -8, memory: 'read_dark_book' }, text: '어둠의 지식을 옮겨 적었다. [섹텀셈프라] 주문서를 손에 넣었다.' },
            fail: { effect: { alignment: -3 }, text: '알 수 없는 불쾌한 기운만 느끼고 물러났다.' },
            fumble: { effect: { alignment: -10, hp: -10 }, text: '봉인 마법이 발동해 저주에 스쳤다!' },
          },
        },
        { label: '그냥 지나친다', effect: { alignment: 2 }, resultText: '유혹을 뿌리쳤다.' },
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
    {
      id: 'hermione_crisis', once: true, requiresFlag: 'ch1_done',
      recall: 'saved_hermione', recallText: '트롤에게서 헤르미온느를 구했던 그날 밤이 스친다.',
      text: '서가 사이, 헤르미온느가 낡은 마법서를 끌어안은 채 안절부절못하고 있다.\n\n"이 주문, 시험에서 실패하면 어떡하지..." 그녀답지 않게 목소리가 떨린다. 평소라면 누구보다 자신만만했을 텐데.',
      choices: [
        {
          label: '"나를 믿어. 잘할 거야."', requiresMemory: 'saved_hermione',
          check: { stat: 'charm', dc: 6, bonusPercent: 15 },
          outcomes: {
            critical: { effect: { companionAffinity: { id: 'hermione', amount: 15 }, exp: 10 }, text: '헤르미온느가 망설임 없이 고개를 끄덕인다. 그날 밤처럼, 영운을 믿기로 한 것이다.' },
            success: { effect: { companionAffinity: { id: 'hermione', amount: 8 }, exp: 5 }, text: '헤르미온느의 표정이 한결 편안해진다.' },
            fail: { effect: {}, text: '헤르미온느는 여전히 초조한 얼굴이지만, 옆에 있어준 것만으로도 고마워하는 눈치다.' },
            fumble: { effect: { companionAffinity: { id: 'hermione', amount: -2 } }, text: '위로가 서툴렀는지, 헤르미온느가 어색하게 웃으며 화제를 돌린다.' },
          },
        },
        { label: '조용히 옆에 앉아 함께 책을 본다', effect: { intelligence: 1, exp: 4 }, resultText: '말없이 함께 책장을 넘기다 보니, 어느새 헤르미온느의 손끝이 떨림을 멈췄다.' },
      ],
    },
  ],

  forest: [
    {
      id: 'dementor_encounter', once: true, priority: 1,
      requiresFlag: 'boggart_faced',
      recallOptions: {
        fear_spider: '보가트가 거미로 변했던 순간이 스친다. 그때와 같은 오싹함이 등줄기를 타고 오른다.',
        fear_darkness: '숨 막히는 어둠이 밀려오던 그 순간이 떠오른다. 시야가 다시 흐려지는 것 같다.',
        fear_failure: '무언가에 실패하던 그 장면이 눈앞에 아른거린다.',
        fear_loss: '소중한 사람을 잃는 장면이 다시 스쳐 지나간다.',
      },
      text: '숲 사이로 냉기가 밀려온다. 나뭇잎이 하나둘 얼어붙고, 내쉬는 숨이 하얗게 응결된다.\n\n검은 로브를 두른 형체가 미끄러지듯 다가온다 — 디멘터다.',
      combat: 'dementor',
    },
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
      id: 'hagrid_favor_herb', priority: 1, once: true, requiresFlag: 'hagrid_favor_active', notFlag: 'hagrid_favor_have_herb',
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
            success: { effect: { charm: 1, exp: 8, alignment: 2 }, text: '알듯 모를 듯한 조언을 건넨다.' },
            fail: { effect: {}, text: '반응 없이 별만 바라본다.' },
            fumble: { effect: { alignment: -2 }, text: '무례하다는 듯 자리를 피한다.' },
          },
        },
      ],
    },
    { id: 'forest_herb', text: '희귀한 마법 약초가 자라난 것을 발견했다.', choices: [{ label: '채집한다', effect: { item: 'manaPotion', exp: 5 }, resultText: '약초를 채집해 마나 물약으로 정제했다.' }] },
    {
      id: 'forest_key', priority: 3, once: true, notFlag: 'has_key',
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
        { label: '함께 차를 마신다', effect: { hp: 15, charm: 2, exp: 6 }, resultText: '따뜻한 차와 함께 즐거운 시간을 보냈다.' },
        { label: '바쁘다며 사양한다', effect: {}, resultText: '해그리드가 아쉬운 표정을 짓는다.' },
      ],
    },
    {
      id: 'hagrid_favor_ask', priority: 1, once: true, notFlag: 'hagrid_favor_active',
      text: '해그리드가 걱정스러운 표정으로 말한다. "영운아, 부탁 하나만 들어줄 수 있겠니? 금지된 숲 깊은 곳에 은빛 잎사귀 약초가 자란다는데, 다치는 동물이 있어서 말이야..."',
      choices: [{ label: '부탁을 들어주겠다고 한다', effect: { flag: 'hagrid_favor_active' }, resultText: '금지된 숲에서 약초를 찾아보기로 했다.' }],
    },
    {
      id: 'hagrid_favor_return', priority: 1, once: true, requiresFlag: 'hagrid_favor_have_herb',
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
            critical: { effect: { gold: 20, exp: 5 }, text: '먼 친척이 용돈을 보내주었다!' },
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
        { label: '함께 응원하러 간다', effect: { charm: 1, exp: 6, hp: 10 }, resultText: '신나는 경기를 보며 스트레스를 풀었다.' },
        { label: '다음에 가겠다고 한다', effect: {}, resultText: '아쉽지만 다음을 기약했다.' },
      ],
    },
    {
      id: 'hogsmeade_beggar',
      text: '길가에 지친 방랑자 마법사가 도움을 청한다.',
      choices: [
        { label: '갈레온 10을 준다', requiresGold: 10, effect: { gold: -10, alignment: 6, exp: 5 }, resultText: '방랑자가 진심으로 고마워한다.' },
        { label: '외면한다', effect: { alignment: -4 }, resultText: '뒤통수가 따갑다.' },
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
            critical: { effect: { gold: -5, item: 'magicStone', exp: 4 }, text: '상자 안에 마법석이 반짝이며 들어있었다!' },
            success: { effect: { gold: -5, item: 'magicStone' }, text: '마법석 하나를 건졌다.' },
            fail: { effect: { gold: -5 }, text: '잡동사니뿐이었다.' },
            fumble: { effect: { gold: -5, alignment: -1 }, text: '상자 안에서 고약한 냄새가 나는 물건만 나왔다.' },
          },
        },
      ],
    },
    {
      id: 'neville_book_request', priority: 1, once: true, notFlag: 'neville_book_active',
      text: '네빌이 걱정스러운 얼굴로 다가온다. "혹시 내 약초학 교과서 못 봤어? 복도 어딘가에서 잃어버린 것 같은데..."',
      choices: [{ label: '찾아봐 주겠다고 한다', effect: { flag: 'neville_book_active' }, resultText: '네빌의 교과서를 찾아주기로 했다.' }],
    },
    {
      id: 'return_nevilles_book', priority: 1, once: true, requiresFlag: 'has_nevilles_book',
      text: '네빌에게 찾아낸 교과서를 건넨다.',
      choices: [{ label: '"여기, 찾았어."', effect: { companionAffinity: { id: 'neville', amount: 15 }, gold: 10, exp: 8, memory: 'kept_promise_neville' }, resultText: '네빌이 눈물이 그렁그렁한 채로 고마워한다.' }],
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
      id: 'halloween_troll', priority: 2, once: true, requiresFlag: 'ch1_started',
      text: '핼러윈 연회 도중, 한 교수가 다급하게 뛰어들며 외친다.\n"트롤이다! 던전에 트롤이 있다!"\n대연회장이 순식간에 아수라장이 된다. 문득 헤르미온느가 아직 화장실에서 나오지 않았다는 사실이 떠오른다.',
      choices: [
        { label: '헤르미온느를 구하러 달려간다', effect: { companionAffinity: { id: 'hermione', amount: 20 }, memory: 'saved_hermione' }, resultText: '한달음에 달려가니 거대한 트롤이 헤르미온느 앞을 가로막고 있었다!', combat: 'troll' },
        { label: '다른 학생들과 함께 대피한다', effect: { exp: 5, alignment: -2 }, resultText: '안전하게 대피했지만, 헤르미온느가 걱정되어 마음이 편치 않다.' },
      ],
    },
    {
      id: 'quidditch_match', priority: 2, once: true, requiresFlag: 'ch1_done',
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
      id: 'yule_ball', priority: 2, once: true, requiresFlag: 'ch2_done',
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
