/* ===================== 인카운터 · 괴이 =====================
 * 잔영의 징후. 진행도 후반의 주력 풀.
 * 여기서는 대개 이기지 못한다. 보는 것이 목적이다. */

const ENCOUNTERS_EERIE = {

empty_desk: {
  id: 'empty_desk', pool: 'eerie', weight: 12, progress: [25, 100], repeatable: true, gain: 2,
  text:
`수업이 끝나고 교실에 혼자 남았다.

책상 하나에 물건이 그대로 있었다. 깃펜, 잉크, 반쯤 쓴 양피지. 누가 곧 돌아올 것처럼.

양피지의 글씨는 문장 중간에서 끊겨 있었다. 마침표도 없이.

교수에게 물었더니 이렇게 말했다. "거긴 원래 비어 있는데."`,
  choices: [
    {
      label: '양피지를 읽어본다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 34 }, text: '읽는 동안에는 문장이 있었다. 분명히 있었다.\n\n고개를 들었다 다시 보니 양피지는 백지였다. 잉크 자국조차 없었다.\n\n다만 손끝에 눌린 자국이 남아 있었다. 종이 뒷면이 오돌토돌했다. 무언가 쓰였던 자리다.' },
        success: { effect: { exp: 16 }, text: '읽는 동안은 문장이었다가, 고개를 드니 백지였다.' },
        fail: { effect: { hp: -3 }, text: '글자를 따라가는데 눈이 자꾸 미끄러졌다. 두통이 왔다.' },
        fumble: { effect: { hp: -6 }, text: '읽으려 애쓰다 코피가 났다. 양피지에 몇 방울 떨어졌고, 그건 지워지지 않았다.' },
      },
    },
    {
      label: '물건을 챙겨서 분실물함에 둔다',
      effect: { exp: 10 },
      resultText:
`영운은 깃펜과 잉크를 챙겨 분실물함에 넣었다.

다음 날 가보니 거기 없었다. 관리인은 아무것도 들어온 게 없다고 했다.`,
    },
    { label: '건드리지 않는다', gain: 1, effect: {}, resultText: '영운은 그대로 두고 나왔다. 문을 닫으면서 한 번 더 봤다. 여전히 누가 곧 돌아올 것 같았다.' },
  ],
},

map_blank_label: {
  id: 'map_blank_label', pool: 'eerie', weight: 10, progress: [35, 100], gain: 3,
  requiresFn: (s) => !!s.itemStacks.marauderMap || s.progress >= 50,
  text:
`복도 끝에서 발소리가 났다. 사람은 없었다.

한 번이 아니었다. 세 번째부터 세기 시작했다.

걷다가, 멈추고, 아주 오래 있다가, 다시 걷는다. 규칙적이었다. 무언가를 세는 것처럼.`,
  choices: [
    {
      label: '소리를 따라간다',
      check: { stat: 'courage', dc: 12 },
      outcomes: {
        critical: { effect: { courage: 1, exp: 34, flag: 'followedSteps' }, text: '따라가니 기념비 앞이었다.\n\n발소리가 거기서 멈춰 있었다. 오래. 한 자리에서 오래.\n\n영운이 다가가자 소리가 사라졌다. 바닥의 먼지에 발자국이 남아 있었다. 같은 자리를 수없이 밟은 자국이었다.' },
        success: { effect: { exp: 16, flag: 'followedSteps' }, text: '따라가니 기념비 앞에서 소리가 멎었다. 바닥에 발자국이 겹겹이 남아 있었다.' },
        fail: { effect: { hp: -5 }, text: '따라가다 길을 잃었다. 정신을 차려보니 처음 자리로 돌아와 있었다.' },
        fumble: { effect: { hp: -10 }, text: '모퉁이를 도는 순간 무언가와 부딪혔다. 아무것도 없었는데 부딪혔다. 숨이 막혔다.' },
      },
    },
    { label: '반대쪽으로 간다', gain: 1, effect: { hp: -2 }, resultText: '영운은 반대쪽으로 걸었다. 발소리가 따라오지는 않았다. 다만 멀어지지도 않았다.' },
  ],
},

mirror_wrong: {
  id: 'mirror_wrong', pool: 'eerie', weight: 10, progress: [40, 100], gain: 3,
  text:
`세면장 거울 앞.

거울 속 자기 뒤로 복도가 비친다. 복도에는 아무도 없다.

그런데 거울 속 복도에는 문이 하나 더 있었다.`,
  choices: [
    {
      label: '뒤를 돌아본다',
      check: { stat: 'courage', dc: 8 },
      outcomes: {
        critical: { effect: { courage: 1, exp: 22 }, text: '돌아봤다. 문은 없었다.\n\n다시 거울을 봤다. 거울 속에도 이제 없었다.\n\n다만 벽지 색이 그 자리만 진했다. 오래 무언가 있었던 자리.' },
        success: { effect: { exp: 12 }, text: '돌아봤다. 아무것도 없었다. 거울로 눈을 돌리니 거울에도 없었다.' },
        fail: { effect: { hp: -4 }, text: '돌아보는 순간 등 뒤가 서늘했다. 한참 동안 거울을 다시 보지 못했다.' },
        fumble: { effect: { hp: -8 }, text: '돌아봤을 때 복도가 훨씬 길어 보였다. 끝이 보이지 않았다. 뛰어서 나왔다.' },
      },
    },
    {
      label: '거울 속 문을 자세히 본다',
      check: { stat: 'intelligence', dc: 16, search: true },
      outcomes: {
        critical: { effect: { intelligence: 2, exp: 48, fragment: 4 }, text: '문이 아니었다. 액자였다.\n\n초상화가 걸려 있었다. 거울 속에서만. 얼굴이 이쪽을 보고 있었다.\n\n영운은 그 얼굴을 오래 봤다. 눈을 감아도 남았다. 그게 중요했다 — 이번에는 남았다.' },
        success: { effect: { fragment: 4, exp: 24 }, text: '문이 아니라 액자였다. 초상화 속 얼굴이 이쪽을 보고 있었다. 눈을 감아도 그 얼굴이 남았다.' },
        fail: { effect: { hp: -5 }, text: '오래 볼수록 형체가 흐려졌다. 나중에는 문인지 액자인지도 알 수 없었다.' },
        fumble: { effect: { hp: -12 }, text: '거울에 얼굴을 가까이 댔다. 김이 서렸다. 김이 걷혔을 때 거울 속 영운은 아직 눈을 감고 있었다.' },
      },
    },
  ],
},

dementor_cold: {
  id: 'dementor_cold', pool: 'eerie', weight: 8, progress: [55, 100], gain: 4,
  text:
`복도 온도가 떨어졌다. 숨이 하얗게 보였다.

9월이었다.

창유리에 서리가 안쪽부터 끼기 시작했다.`,
  choices: [
    { label: '맞선다', combat: 'dementor', resultText: '영운은 지팡이를 들었다.' },
    {
      label: '따뜻한 것을 떠올린다',
      check: { stat: 'courage', dc: 12 },
      gain: 2,
      outcomes: {
        critical: { effect: { courage: 2, exp: 34 }, text: '떠올릴 것을 찾다가, 명부에 적힌 이름들이 떠올랐다. 아직 다 읽을 수 있는 이름들이.\n\n냉기가 물러갔다.' },
        success: { effect: { exp: 16, hp: -4 }, text: '무언가 떠올렸다. 확실하지 않았지만 냉기가 조금 물러갔다.' },
        fail: { effect: { hp: -12 }, text: '아무것도 떠오르지 않았다. 무릎이 꺾였다. 정신을 차렸을 때는 바닥이었다.' },
        fumble: { effect: { hp: -20 }, text: '떠올린 것이 하필 잃어버린 쪽이었다. 그것이 그쪽으로 파고들었다.' },
      },
    },
    {
      label: '초콜릿을 먹고 버틴다',
      requiresItem: 'chocolateFrog',
      gain: 2,
      effect: { consume: 'chocolateFrog', hp: 10 },
      resultText: '영운은 초콜릿을 입에 넣고 벽에 붙어 섰다. 냉기가 지나갈 때까지 세 번 숨을 쉬었다. 지나갔다.',
    },
  ],
},

};
