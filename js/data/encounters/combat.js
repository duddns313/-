/* ===================== 인카운터 · 전투 조우 =====================
 * 전투 인카운터에는 반드시 「물러선다」가 있다.
 * 싸울지 말지가 선택이어야, 편성이 의미를 갖는다. */

const ENCOUNTERS_COMBAT = {

pixie_loose: {
  id: 'pixie_loose', pool: 'combat', weight: 12, progress: [0, 45], repeatable: true, gain: 3,
  text:
`교실 문을 열자마자 뭔가 얼굴 옆을 스쳐 지나갔다.

파란 것 하나. 그리고 또 하나.

누가 픽시 상자를 열어놓고 갔다. 잉크병이 뒤집혀 있고 커튼이 반쯤 뜯겨 있었다.`,
  choices: [
    { label: '잡는다', combat: 'pixie', resultText: '영운은 지팡이를 들었다.' },
    {
      label: '문을 닫고 물러선다',
      check: { stat: 'agility', dc: 8 },
      gain: 1,
      outcomes: {
        critical: { effect: { agility: 1 }, text: '문을 닫고 손잡이를 붙들었다. 안쪽에서 부딪히는 소리가 났지만 나오지는 못했다.' },
        success: { effect: {}, text: '문을 닫았다. 누군가 나중에 처리할 것이다.' },
        fail: { effect: { hp: -5 }, text: '문틈으로 두 마리가 빠져나와 머리카락을 잡아당겼다.' },
        fumble: { effect: { hp: -9 }, text: '문을 닫다 손가락이 끼었다. 픽시들이 그 틈으로 우르르 나왔다.' },
      },
    },
  ],
},

duel_challenge: {
  id: 'duel_challenge', pool: 'combat', weight: 10, progress: [5, 60], gain: 3,
  text:
`복도에서 누가 앞을 막았다.

"편입생이라며."

이런 건 어느 학교에나 있다. 영운은 짐작이 갔다.

"결투 신청. 규칙대로. 여기서."

구경꾼이 벌써 몇 모였다.`,
  choices: [
    { label: '받아들인다', combat: 'rivalStudent', resultText: '영운은 지팡이를 들고 세 걸음 물러섰다. 규칙대로.' },
    {
      label: '말로 넘긴다',
      check: { stat: 'charm', dc: 12 },
      gain: 2,
      outcomes: {
        critical: { effect: { charm: 2, exp: 30 }, text: '"네가 이기면 뭐가 좋아지는데?"\n\n상대가 대답을 못 했다. 구경꾼 하나가 웃었고, 분위기가 풀렸다. 그쪽이 지팡이를 내렸다.' },
        success: { effect: { charm: 1 }, text: '몇 마디 주고받다 보니 흐지부지됐다. 구경꾼들이 시시하다며 흩어졌다.' },
        fail: { effect: {}, text: '말이 통하지 않았다. 결국 지팡이를 들어야 했다.', combat: 'rivalStudent' },
        fumble: { effect: { hp: -4 }, text: '말이 헛나왔다. 상대가 먼저 쐈다.', combat: 'rivalStudent' },
      },
    },
  ],
},

forest_edge: {
  id: 'forest_edge', pool: 'combat', weight: 10, progress: [20, 100], repeatable: true, gain: 4,
  text:
`금지된 숲 가장자리. 여기까지는 벌점만 받고 끝난다.

나무 사이에서 뭔가 움직였다. 처음엔 사슴인 줄 알았다.

사슴은 그렇게 오래 서서 사람을 보지 않는다.`,
  choices: [
    { label: '지팡이를 든다', combat: 'darkCreature', resultText: '영운은 지팡이를 들었다. 그것이 천천히 다가왔다.' },
    {
      label: '천천히 뒷걸음질 친다',
      check: { stat: 'agility', dc: 12 },
      gain: 1,
      outcomes: {
        critical: { effect: { agility: 1 }, text: '눈을 떼지 않은 채로 물러났다. 그것도 따라오지 않았다. 서로 지켜보다가 끝났다.' },
        success: { effect: { hp: -4 }, text: '물러나는 동안 나뭇가지에 긁혔다. 그것은 따라오지 않았다.' },
        fail: { effect: { hp: -10 }, text: '돌아서는 순간 뭔가가 등을 스쳤다. 뛰어서 성까지 왔다.' },
        fumble: { effect: {}, text: '나무뿌리에 걸려 넘어졌다.', combat: 'darkCreature' },
      },
    },
    {
      label: '루모스로 비춰본다',
      requiresSpell: 'lumos',
      check: { stat: 'courage', dc: 8 },
      gain: 3,
      outcomes: {
        critical: { effect: { courage: 1, exp: 26 }, text: '빛이 닿자 그것이 물러섰다. 물러서면서 형태가 잠깐 흐트러졌다 — 짐승이 아니었다. 짐승 모양을 하고 있었을 뿐이다.' },
        success: { effect: { exp: 12 }, text: '빛이 닿자 그것이 나무 뒤로 물러났다.' },
        fail: { effect: { hp: -6 }, text: '빛이 닿았는데도 물러서지 않았다. 오히려 가까워졌다.' },
        fumble: { effect: {}, text: '빛이 그것을 자극했다.', combat: 'darkCreature' },
      },
    },
  ],
},

boggart_closet: {
  id: 'boggart_closet', pool: 'combat', weight: 8, progress: [10, 70], gain: 3,
  text:
`빈 교실 뒤편 벽장이 혼자 덜컹거렸다.

보가트다. 성 안에 늘 몇 마리쯤 있고, 대개는 아무도 안 쓰는 가구 안에 산다.

문고리에 손을 댔더니 안쪽에서 조용해졌다. 기다리는 것이다.`,
  choices: [
    { label: '연다', combat: 'boggart', resultText: '영운은 문을 열었다.' },
    { label: '그냥 둔다', gain: 1, effect: {}, resultText: '영운은 손을 뗐다. 벽장이 다시 덜컹거리기 시작했다. 복도로 나올 때까지 소리가 따라왔다.' },
    {
      label: '무엇이 나올지 먼저 생각해둔다',
      check: { stat: 'courage', dc: 12 },
      outcomes: {
        critical: { effect: { courage: 2, exp: 34 }, text: '영운은 눈을 감고 생각했다. 무엇이 제일 무서운가.\n\n떠오르는 게 없었다. 그게 이상해서 한참 생각했고, 결국 문을 열지 않았다.\n\n무서운 게 없는 게 아니라, 아직 잃어본 게 없다는 뜻이었다.' },
        success: { effect: { courage: 1, exp: 16 }, text: '무엇이 나올지 몇 가지 떠올려봤다. 어느 것도 확실하지 않았다. 문은 열지 않았다.' },
        fail: { effect: { hp: -4 }, text: '생각하는 사이 문이 저절로 열렸다.', combat: 'boggart' },
        fumble: { effect: { hp: -6 }, text: '떠올린 것이 그대로 문틈으로 새어 나왔다.', combat: 'boggart' },
      },
    },
  ],
},

troll_cellar: {
  id: 'troll_cellar', pool: 'combat', weight: 8, progress: [40, 100], gain: 4,
  text:
`지하 통로에서 냄새가 났다. 젖은 돌 냄새가 아니라 다른 것.

모퉁이를 돌자 천장에 머리가 닿을 듯한 것이 서 있었다.

산 트롤. 성 안에 있을 리가 없는 것이다. 이십오 년 전에는 있었다고 한다.`,
  choices: [
    { label: '맞선다', combat: 'troll', resultText: '영운은 지팡이를 들었다. 손이 떨렸지만 들긴 들었다.' },
    {
      label: '소리 없이 물러난다',
      check: { stat: 'agility', dc: 12 },
      gain: 2,
      outcomes: {
        critical: { effect: { agility: 1 }, text: '숨을 죽이고 한 걸음씩 물러났다. 그것은 끝까지 이쪽을 보지 못했다.' },
        success: { effect: { hp: -6 }, text: '물러나다 돌을 하나 찼다. 그것이 돌아봤지만 영운은 이미 모퉁이를 돌아 있었다.' },
        fail: { effect: { hp: -14 }, text: '몽둥이가 벽을 때렸다. 돌조각이 튀어 옆구리를 스쳤다. 뛰어서 도망쳤다.' },
        fumble: { effect: {}, text: '발이 미끄러졌다.', combat: 'troll' },
      },
    },
  ],
},


marsh_hinkypunk: {
  id: 'marsh_hinkypunk', pool: 'combat', weight: 10, progress: [10, 70], repeatable: true, gain: 3,
  text:
`호수 서쪽 습지. 지름길이라고 해서 왔는데 지름길이 아니었다.

앞쪽에서 등불이 흔들렸다. 사람이 든 등불처럼 딱 그 높이에서.

한 걸음 다가가자 등불도 한 걸음 물러났다.`,
  choices: [
    { label: '쫓아가지 않고 지팡이를 든다', combat: 'hinkypunk', resultText: '영운은 등불을 보지 않고 그 아래 어둠을 봤다.' },
    {
      label: '반대로 걷는다',
      check: { stat: 'intelligence', dc: 8 },
      gain: 1,
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 20 }, text: '등불이 이끄는 반대쪽으로 걸었다. 십 분 만에 마른 땅이 나왔다.' },
        success: { effect: {}, text: '한참 헤맸지만 결국 길을 찾았다. 신발이 젖었다.' },
        fail: { effect: { hp: -7 }, text: '무릎까지 빠졌다. 빠져나오는 데 한참 걸렸다.' },
        fumble: { effect: { hp: -12 }, text: '허리까지 빠졌다. 뭔가가 발목을 잡아당기는 느낌이 들었다.' },
      },
    },
  ],
},

grove_bowtruckle: {
  id: 'grove_bowtruckle', pool: 'combat', weight: 8, progress: [0, 50], repeatable: true, gain: 2,
  text:
`온실 뒤 지팡이나무 숲. 가지에서 뭔가가 영운을 노려보고 있었다.

보우트러클이다. 손가락처럼 생긴 것이 나뭇가지 사이에서 움직인다.

영운이 가지에 손을 뻗자 그것이 몸을 낮췄다.`,
  choices: [
    { label: '그냥 가지를 꺾는다', combat: 'bowtruckle', resultText: '보우트러클이 손등으로 뛰어올랐다.' },
    {
      label: '쥐며느리를 주고 달랜다',
      check: { stat: 'charm', dc: 8 },
      gain: 2,
      outcomes: {
        critical: { effect: { charm: 1, equipDrop: { slot: 'wand', tier: 1 }, exp: 24 }, text: '그것이 쥐며느리를 받아먹고는, 잠시 뒤 제일 좋은 가지 쪽으로 비켜줬다.' },
        success: { effect: { exp: 12 }, text: '그것이 옆으로 물러났다. 가지를 하나 얻었다.' },
        fail: { effect: { hp: -3 }, text: '손가락을 찔렸다. 아프기보다 얄미웠다.' },
        fumble: { effect: {}, text: '떼로 몰려왔다.', combat: 'bowtruckle' },
      },
    },
  ],
},

acromantula_nest: {
  id: 'acromantula_nest', pool: 'combat', weight: 8, progress: [55, 100], gain: 4,
  text:
`금지된 숲 깊은 쪽. 나무 사이에 흰 것이 걸려 있다.

거미줄이라기엔 두껍다. 밧줄에 가깝다.

발밑에서 뭔가 바스러졌다. 내려다보니 뼈였다. 사슴 것이었으면 좋겠다고 생각했다.`,
  choices: [
    { label: '맞선다', combat: 'acromantula', resultText: '나무 위쪽에서 다리 여덟 개가 한꺼번에 움직였다.' },
    {
      label: '숨을 죽이고 물러난다',
      check: { stat: 'agility', dc: 16 },
      gain: 2,
      outcomes: {
        critical: { effect: { agility: 2, exp: 40 }, text: '한 발짝씩, 밟았던 자리만 다시 밟으며 물러났다. 끝까지 들키지 않았다.' },
        success: { effect: { hp: -8, exp: 20 }, text: '나뭇가지를 밟았다. 뒤에서 소리가 났지만 뛰어서 빠져나왔다.' },
        fail: { effect: { hp: -18 }, text: '거미줄에 팔이 걸렸다. 소매를 찢고 도망쳤다.' },
        fumble: { effect: {}, text: '거미줄 한가운데를 밟았다.', combat: 'acromantula' },
      },
    },
    {
      label: '패트로누스를 시도한다',
      requiresSpell: 'expectoPatronum',
      check: { stat: 'courage', dc: 12 },
      gain: 3,
      outcomes: {
        critical: { effect: { courage: 2, exp: 44, equipDrop: { slot: 'accessory', tier: 3 } }, text: '은빛이 숲을 밝혔다. 그것들이 물러섰다. 물러선 자리에 오래된 물건이 하나 남아 있었다.' },
        success: { effect: { exp: 22 }, text: '은빛 안개가 퍼지자 나무 위쪽이 조용해졌다.' },
        fail: { effect: { hp: -12 }, text: '빛이 채 모이기 전에 흩어졌다.' },
        fumble: { effect: { hp: -16 }, text: '집중이 깨졌다. 그것들이 그 틈을 알아챘다.' },
      },
    },
  ],
},

deatheater_shade: {
  id: 'deatheater_shade', pool: 'combat', weight: 8, progress: [60, 100], gain: 4,
  text:
`복도 끝에 가면 쓴 형체가 서 있었다.

이십오 년 전에 이 성에서 죽은 자들의 흔적이 가끔 이런 모양으로 남는다고 한다. 사람은 아니고, 사람이었던 자리에 남은 습관 같은 것.

그것이 지팡이를 들었다. 그 동작만은 아주 정확했다.`,
  choices: [
    { label: '맞선다', combat: 'deathEater', resultText: '영운도 지팡이를 들었다.' },
    {
      label: '가면 아래를 본다',
      check: { stat: 'courage', dc: 16 },
      gain: 3,
      outcomes: {
        critical: { effect: { courage: 2, exp: 46, flag: 'sawUnderMask' }, text: '가면 아래에는 아무것도 없었다. 얼굴이 아니라 — 얼굴이 있어야 할 자리가 비어 있었다.\n\n이 자리에 있던 사람도 잊힌 것이다. 이십오 년 동안, 아주 천천히.\n\n형체가 흔들리더니 흩어졌다. 싸울 이유가 없었다.' },
        success: { effect: { exp: 24 }, text: '가면 아래가 비어 있었다. 형체가 스스로 흩어졌다.' },
        fail: { effect: { hp: -14 }, text: '가까이 간 게 실수였다. 지팡이 끝이 먼저 닿았다.' },
        fumble: { effect: {}, text: '눈이 마주쳤다. 그것이 반응했다.', combat: 'deathEater' },
      },
    },
    {
      label: '물러선다',
      check: { stat: 'agility', dc: 12 },
      gain: 1,
      outcomes: {
        critical: { effect: { agility: 1 }, text: '뒷걸음으로 모퉁이를 돌았다. 따라오지 않았다.' },
        success: { effect: { hp: -6 }, text: '한 발 늦었다. 어깨를 스쳤고 그 자리가 한참 저렸다.' },
        fail: { effect: { hp: -16 }, text: '등을 보인 게 잘못이었다.' },
        fumble: { effect: { hp: -22 }, text: '넘어졌다. 일어났을 때는 이미 복도 반대쪽이었고, 어떻게 왔는지 기억이 없었다.' },
      },
    },
  ],
},

werewolf_shade_hunt: {
  id: 'werewolf_shade_hunt', pool: 'combat', weight: 8, progress: [55, 100], gain: 4,
  text:
`보름달. 금지된 숲 쪽에서 소리가 났다.

늑대 울음은 아니었다. 늑대는 그렇게 오래 끌지 않는다.

나무 그림자가 하나 움직였다. 나무는 그대로였다.`,
  choices: [
    { label: '맞선다', combat: 'werewolfShade', resultText: '영운은 등을 나무에 붙이고 지팡이를 들었다.' },
    {
      label: '불을 피운다',
      check: { stat: 'intelligence', dc: 12 },
      gain: 3,
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 40, item: 'magicStone' }, text: '마른 가지를 모아 불을 피웠다. 그림자가 불빛 바깥으로 물러났다. 밤새 불을 지켰고, 아침에 재 속에서 결정 조각을 하나 주웠다.' },
        success: { effect: { hp: -6, exp: 20 }, text: '불을 피웠다. 그림자는 물러났지만 밤새 근처를 돌았다. 한숨도 못 잤다.' },
        fail: { effect: { hp: -14 }, text: '불이 붙지 않았다. 나무가 다 젖어 있었다.' },
        fumble: { effect: {}, text: '불꽃이 그것을 끌어당겼다.', combat: 'werewolfShade' },
      },
    },
  ],
},

riddle_shade_encounter: {
  id: 'riddle_shade_encounter', pool: 'combat', weight: 6, progress: [70, 100], gain: 5,
  text:
`필요의 방 안쪽, 물건 더미 사이에서 소년 하나가 서 있었다.

열여섯쯤. 교복이 낡았지만 단정하다. 얼굴은 잘생겼고, 표정은 없었다.

"여기까지 온 사람은 오랜만이군." 그가 말했다. "무엇을 찾나?"

그의 발밑에 그림자가 없었다.`,
  choices: [
    { label: '싸운다', combat: 'riddleShade', resultText: '영운이 지팡이를 들자 그가 처음으로 웃었다.' },
    {
      label: '"당신이 여기서 뭘 만들려고 했죠?"',
      check: { stat: 'intelligence', dc: 16, search: true },
      gain: 4,
      outcomes: {
        critical: { effect: { intelligence: 2, exp: 60, flag: 'knowsTheMethod' },
          text: '"기억되는 법." 그가 벽 쪽을 봤다. "육체가 안 죽는 것과 잊히지 않는 것은 다른 문제니까."\n\n"완성했어요?"\n\n"아니. 대가가 이상했어." 그가 고개를 갸웃했다. "하나를 새기려면 다른 하나를 놓아야 하더군. 나는 놓을 게 없었어. 아무것도 아끼지 않았으니까."\n\n그가 영운을 봤다.\n\n"그러니까 이건, 아끼는 게 있는 사람만 쓸 수 있는 마법이야. 그래서 버렸지. 쓸모가 없어서."' },
        success: { effect: { exp: 30, flag: 'knowsTheMethod' },
          text: '"기억되는 법이지." 그가 말했다. "대가가 이상해서 버렸어. 하나를 새기려면 다른 하나를 놓아야 하거든."' },
        fail: { effect: { hp: -12 }, text: '그가 대답하지 않았다. 대신 지팡이를 들었다.' },
        fumble: { effect: {}, text: '질문이 그를 흥미롭게 만들었다.', combat: 'riddleShade' },
      },
    },
    {
      label: '아무 말도 하지 않고 나간다',
      gain: 2,
      effect: { hp: -5 },
      resultText:
`영운은 돌아섰다.

"현명하군." 뒤에서 목소리가 들렸다. "다만 자네가 찾는 건 내가 아니야. 나는 그걸 버렸고, 누군가 주웠지."

돌아봤을 때 그는 없었다.`,
    },
  ],
},

corridor_ambush: {
  id: 'corridor_ambush', pool: 'combat', weight: 10, progress: [15, 75], repeatable: true, gain: 3,
  text:
`복도 모퉁이에서 셋이 기다리고 있었다.

"편입생." 가운데 애가 말했다. "너 요즘 이상한 거 캐고 다닌다며."

"누가 그래?"

"다들." 그 애가 지팡이를 꺼냈다. "그만 좀 해. 다들 불편해하니까."`,
  choices: [
    { label: '맞선다', combat: 'rivalStudent', resultText: '셋 중 하나가 먼저 쐈다.' },
    {
      label: '"왜 불편한데?"',
      check: { stat: 'charm', dc: 12 },
      gain: 2,
      outcomes: {
        critical: { effect: { charm: 2, exp: 34, flag: 'askedWhy' },
          text: '"…모르겠어." 가운데 애가 말했다. 지팡이가 조금 내려갔다. "그냥, 네가 뭘 찾을 때마다 뭔가 없어지는 것 같아서."\n\n"뭐가 없어져?"\n\n"몰라. 그게 문제야." 그 애가 지팡이를 넣었다. "우린 그냥 무서운 거야."' },
        success: { effect: { charm: 1, exp: 16 }, text: '몇 마디 오가다 흐지부지됐다. 셋 다 자기들도 왜 왔는지 잘 모르는 눈치였다.' },
        fail: { effect: {}, text: '말이 안 통했다.', combat: 'rivalStudent' },
        fumble: { effect: { hp: -6 }, text: '말하는 중에 맞았다.', combat: 'rivalStudent' },
      },
    },
    {
      label: '도망친다',
      check: { stat: 'agility', dc: 8 },
      gain: 1,
      outcomes: {
        critical: { effect: { agility: 1 }, text: '모퉁이를 세 번 돌아 따돌렸다.' },
        success: { effect: { hp: -4 }, text: '등에 한 방 맞았지만 빠져나왔다.' },
        fail: { effect: { hp: -10 }, text: '막다른 길이었다. 실컷 맞고 풀려났다.' },
        fumble: { effect: { hp: -14 }, text: '넘어졌다. 셋이 둘러쌌다.' },
      },
    },
  ],
},

flobberworm_chore: {
  id: 'flobberworm_chore', pool: 'combat', weight: 8, progress: [0, 40], repeatable: true, gain: 2,
  text:
`신비한 동물 돌보기. 오늘 몫은 플러버웜 우리 청소다.

플러버웜은 세상에서 제일 지루한 생물이라고들 한다. 움직이지도 않고 물지도 않는다.

그런데 오늘은 한 마리가 몸을 세우고 있었다. 플러버웜은 그러지 않는다.`,
  choices: [
    { label: '가까이 간다', combat: 'flobberworm', resultText: '그것이 예상보다 빠르게 움직였다.' },
    {
      label: '우리 밖에서 관찰한다',
      check: { stat: 'intelligence', dc: 8, search: true },
      gain: 2,
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 24 }, text: '그것은 우리 한구석만 계속 피하고 있었다. 아무것도 없는 구석을. 영운은 그 자리를 수첩에 그려뒀다.' },
        success: { effect: { exp: 12 }, text: '한 자리를 계속 피하고 있었다. 거기엔 아무것도 없었다.' },
        fail: { effect: {}, text: '십 분쯤 보다가 지루해졌다.' },
        fumble: { effect: { hp: -3 }, text: '우리에 기대다 문이 열렸다. 전부 기어 나왔고 다시 몰아넣는 데 한 시간이 걸렸다.' },
      },
    },
  ],
},

dark_temptation: {
  id: 'dark_temptation', pool: 'combat', weight: 8, progress: [45, 100], gain: 3,
  notFlag: 'refusedDark',
  text:
`금서 구역 철망 안쪽. 사슬이 걸려 있는데 자물쇠는 열려 있었다.

책 한 권이 펼쳐진 채 놓여 있다. 누가 방금까지 읽던 것처럼.

펼쳐진 쪽에 주문이 하나 적혀 있었다. 읽기만 해도 목 뒤가 서늘해지는 종류였다.

"빠르게 가는 길도 길이다." 누가 그렇게 말한 적이 있다. 누구였는지는 기억나지 않는다.`,
  choices: [
    {
      label: '읽는다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { learnSpell: 'sectumsempra', alignment: -12, exp: 34 },
          text: '글자가 눈에 박혔다. 잊히지 않는 종류의 글자였다.\n\n손이 저절로 움직였다. 배운 적 없는 동작인데 손이 알고 있었다.' },
        success: { effect: { learnSpell: 'sectumsempra', alignment: -15, hp: -6 },
          text: '읽었다. 머리가 아팠고 코피가 났다. 그래도 남았다.' },
        fail: { effect: { hp: -10, alignment: -5 }, text: '읽다가 눈앞이 하얘졌다. 정신을 차렸을 때는 바닥이었다.' },
        fumble: { effect: { hp: -18, alignment: -8 }, text: '책이 저 혼자 넘어갔다. 다음 쪽은 보지 말았어야 했다.' },
      },
    },
    {
      label: '책을 덮는다',
      effect: { alignment: 6, exp: 18, flag: 'refusedDark' },
      resultText:
`영운은 책을 덮었다.

빠른 길이 있다는 건 알겠다. 다만 그 길로 간 사람이 어떻게 됐는지를 지금 찾아다니는 중이다.

철망을 잠그고 나왔다.`,
    },
    {
      label: '누가 여기 있었는지 살핀다',
      check: { stat: 'agility', dc: 12, search: true },
      gain: 3,
      outcomes: {
        critical: { effect: { agility: 1, exp: 36, flag: 'someoneWasHere' }, text: '먼지에 발자국이 있었다. 한 사람 것. 여러 번 오간 자국.\n\n신발 크기가 어른 것이었다.' },
        success: { effect: { exp: 18, flag: 'someoneWasHere' }, text: '먼지에 어른 발자국이 여러 번 겹쳐 있었다.' },
        fail: { effect: {}, text: '먼지가 너무 두꺼웠다.' },
        fumble: { effect: { hp: -6 }, text: '사슬을 건드렸다. 요란한 소리가 울렸고 관리인이 달려왔다.' },
      },
    },
  ],
},

};
