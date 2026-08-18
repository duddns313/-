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

};
