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


clock_wrong: {
  id: 'clock_wrong', pool: 'eerie', weight: 10, progress: [25, 100], repeatable: true, gain: 2,
  text:
`시계탑 종이 울렸다. 열두 번.

영운은 세었다. 열한 번이었다.

옆에 있던 학생에게 물었더니 열두 번이라고 했다. 다른 학생도 열두 번이라고 했다.

영운만 열한 번을 들었다.`,
  choices: [
    {
      label: '다음 정각까지 기다려 다시 센다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 34 },
          text: '한 시간을 기다렸다. 한 시 종이 울렸다. 한 번.\n\n두 시. 한 번. 두 번.\n\n세 시. 한 번. 두 번. 세 번.\n\n다 맞았다. 열두 시만 하나 모자란다. 하나 있어야 할 자리가 비어 있다.' },
        success: { effect: { exp: 18 }, text: '다른 시각은 다 맞았다. 열두 시만 하나 모자랐다.' },
        fail: { effect: { hp: -3 }, text: '한 시간을 서서 기다렸다가 세는 걸 놓쳤다.' },
        fumble: { effect: { hp: -6 }, text: '기다리다 잠들었다. 깼을 때는 새벽이었고 몸이 굳어 있었다.' },
      },
    },
    { label: '잘못 들었다고 생각한다', gain: 1, effect: {}, resultText: '영운은 그냥 넘겼다. 그런 날도 있다.' },
  ],
},

extra_stair: {
  id: 'extra_stair', pool: 'eerie', weight: 10, progress: [30, 100], gain: 2,
  text:
`북쪽 탑 계단은 예순두 칸이다. 처음 온 날 세어뒀다.

오늘은 예순세 칸이었다.

한 칸이 늘었다. 어디가 늘었는지는 알 수 없었다. 다시 내려가며 세니 예순두 칸이었다.`,
  choices: [
    {
      label: '한 칸씩 밟아가며 확인한다',
      check: { stat: 'agility', dc: 12, search: true },
      outcomes: {
        critical: { effect: { agility: 1, exp: 34, flag: 'foundExtraStair' },
          text: '스물아홉 번째 칸에서 발이 이상했다.\n\n밟히긴 하는데 소리가 다르다. 다른 칸은 돌 소리가 나고 그 칸만 아무 소리가 안 난다.\n\n무릎을 꿇고 손으로 짚었다. 손도 닿는다. 그런데 거기 아무것도 없는 것 같았다.' },
        success: { effect: { exp: 18 }, text: '한 칸만 밟는 소리가 달랐다. 스물아홉 번째쯤.' },
        fail: { effect: { hp: -4 }, text: '세다가 발을 헛디뎠다. 다섯 칸을 굴렀다.' },
        fumble: { effect: { hp: -10 }, text: '있는 줄 알았던 칸이 없었다. 계단참까지 굴러떨어졌다.' },
      },
    },
    { label: '뛰어서 올라간다', gain: 1, effect: { hp: -3 }, resultText: '세지 않고 뛰어 올라갔다. 위층에 도착했을 때 숨이 찼고, 몇 칸이었는지는 알 수 없었다.' },
  ],
},

own_handwriting: {
  id: 'own_handwriting', pool: 'eerie', weight: 12, progress: [35, 100], gain: 3,
  text:
`명부를 폈는데 모르는 줄이 있었다.

영운의 글씨다. 확실하다. ㄹ 쓰는 버릇까지 똑같다.

그런데 무슨 내용인지 모르겠다. 언제 썼는지도 모르겠다.

읽으면 문장이 되는데, 고개를 들면 무슨 문장이었는지 사라진다.`,
  choices: [
    {
      label: '옆에 베껴 쓴다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 38, fragment: 3 },
          text: '보면서 그대로 옮겨 적었다. 뜻을 이해하려 하지 않고 모양만 따라 그렸다.\n\n다 쓰고 나서 두 줄을 나란히 놓았다. 원본과 사본.\n\n사본은 읽혔다. 이해하려 하지 않았기 때문에 마법이 손을 뻗지 못한 것이다.\n\n첫 글자가 남았다. 라—' },
        success: { effect: { exp: 20, fragment: 3 },
          text: '모양만 따라 그렸다. 사본은 읽혔다. 첫 글자가 남았다. 라—' },
        fail: { effect: { hp: -4 }, text: '베끼다 손이 자꾸 멈췄다. 다 쓰고 보니 그냥 낙서였다.' },
        fumble: { effect: { hp: -8 }, text: '베끼는 동안 원본 글자가 흐려졌다. 사본도 같이 흐려졌다.' },
      },
    },
    {
      label: '소리 내어 읽는다',
      check: { stat: 'courage', dc: 8 },
      outcomes: {
        critical: { effect: { courage: 1, exp: 28 }, text: '소리 내어 읽는 동안은 붙들렸다. 목소리로 나온 것은 흩어지지 않았다. 다만 다 읽고 나자 목이 아팠고 아무것도 남지 않았다. 그래도 잠깐은 알았다.' },
        success: { effect: { exp: 14 }, text: '읽는 동안은 알았다. 다 읽자 사라졌다.' },
        fail: { effect: { hp: -4 }, text: '입이 움직이지 않았다.' },
        fumble: { effect: { hp: -8 }, text: '읽는 도중 목소리가 자기 것 같지 않았다. 그만뒀다.' },
      },
    },
    { label: '그 장을 찢는다', gain: 2, effect: { alignment: -5, hp: 5 }, resultText: '영운은 그 장을 찢어 태웠다.\n\n한결 편해졌다. 그게 무서웠다.' },
  ],
},

two_reflections: {
  id: 'two_reflections', pool: 'eerie', weight: 10, progress: [45, 100], gain: 3,
  text:
`창유리에 비친 복도.

영운 뒤로 아무도 없다. 그런데 유리에는 둘이 비친다.

돌아보면 하나다. 다시 유리를 보면 둘이다.

두 번째 것은 영운을 보고 있지 않았다. 벽 쪽을 보고 있었다.`,
  choices: [
    {
      label: '유리 속 그것이 보는 쪽을 본다',
      check: { stat: 'courage', dc: 12 },
      outcomes: {
        critical: { effect: { courage: 1, exp: 40, flag: 'sawWhatItSaw' },
          text: '벽이었다. 아무것도 없는 벽.\n\n그런데 그 벽에 못 자국이 하나 있었다. 오래된 못 자국.\n\n유리 속 두 번째 형체는 그 못 자국을 보고 있었다. 아주 오래 봤던 사람처럼.' },
        success: { effect: { exp: 20 }, text: '벽에 오래된 못 자국이 하나 있었다. 그것뿐이었다.' },
        fail: { effect: { hp: -6 }, text: '돌아본 순간 유리 속도 비었다. 등이 오래 서늘했다.' },
        fumble: { effect: { hp: -12 }, text: '유리에 얼굴을 가까이 댔다. 유리 저쪽에서도 그렇게 했다. 다만 타이밍이 반 박자 늦었다.' },
      },
    },
    { label: '커튼을 친다', gain: 1, effect: { hp: -3 }, resultText: '커튼을 쳤다. 천 너머에서 한동안 아무 소리도 나지 않았다.' },
  ],
},

song_no_one_knows: {
  id: 'song_no_one_knows', pool: 'eerie', weight: 8, progress: [30, 100], gain: 2,
  text:
`휴게실에서 누가 흥얼거리고 있었다.

영운도 아는 곡이었다. 어디서 들었는지는 모르겠는데 다음 소절이 뭔지 알았다.

"그거 무슨 노래야?"

흥얼거리던 애가 멈췄다. "뭐가?"

"방금 부른 거."

"…내가 불렀어?"`,
  choices: [
    {
      label: '다음 소절을 불러본다',
      check: { stat: 'charm', dc: 12 },
      outcomes: {
        critical: { effect: { charm: 1, exp: 34, fragment: 2 },
          text: '영운이 이어 불렀다. 휴게실이 조용해졌다.\n\n"그거 레번클로 애들 노래인데." 누가 말했다. "우리 기숙사 노래를 왜 알아?"\n\n영운도 몰랐다. 다만 그 곡을 누가 자주 불렀던 것 같았다. 아주 오래전에, 이 자리에서.' },
        success: { effect: { fragment: 2, exp: 18 },
          text: '이어 불렀더니 누가 말했다. "그거 레번클로 노래야." 영운은 그 기숙사에 아는 사람이 없다.' },
        fail: { effect: {}, text: '입을 열자 가사가 사라졌다.' },
        fumble: { effect: { hp: -3 }, text: '음이 하나도 안 맞았다. 다들 웃었고 영운은 왜 웃긴지 몰랐다.' },
      },
    },
    { label: '잊어버린다', gain: 1, effect: {}, resultText: '영운은 화제를 돌렸다. 그날 밤 잠들기 전까지 그 곡이 머릿속을 맴돌았고, 아침에는 사라져 있었다.' },
  ],
},

cold_dormitory: {
  id: 'cold_dormitory', pool: 'eerie', weight: 10, progress: [50, 100], repeatable: true, gain: 3,
  text:
`새벽에 깼다. 방이 추웠다.

침대는 다섯 개다. 넷은 커튼이 쳐져 있고 안에서 숨소리가 난다.

다섯 번째 침대는 커튼이 열려 있고 비어 있다.

여긴 원래 네 명이 쓰는 방이다. 그렇게 알고 있었다.`,
  choices: [
    {
      label: '빈 침대를 살핀다',
      check: { stat: 'courage', dc: 12, search: true },
      outcomes: {
        critical: { effect: { courage: 1, exp: 38, flag: 'fifthBed' },
          text: '시트가 접혀 있었다. 오래 안 쓴 침대처럼 각지게.\n\n그런데 베개에 자국이 있었다. 머리 자국. 눌린 지 얼마 안 된.\n\n손을 대봤다. 아직 따뜻했다.' },
        success: { effect: { exp: 20, flag: 'fifthBed' }, text: '시트는 각지게 접혀 있는데 베개에는 눌린 자국이 있었다. 아직 따뜻했다.' },
        fail: { effect: { hp: -5 }, text: '가까이 가니 더 추웠다. 이불을 뒤집어쓰고 아침까지 뜬눈으로 있었다.' },
        fumble: { effect: { hp: -10 }, text: '침대에 앉는 순간 뭔가가 등 뒤에서 일어나는 느낌이 들었다. 돌아보지 않았다.' },
      },
    },
    {
      label: '룸메이트를 깨워 물어본다',
      check: { stat: 'charm', dc: 8 },
      outcomes: {
        critical: { effect: { charm: 1, exp: 26 }, text: '"몇 명이 쓰는 방이야?"\n\n"넷." 그가 잠결에 말했다. 그러고는 눈을 떴다. "…아니, 다섯인가? 왜 헷갈리지."' },
        success: { effect: { exp: 12 }, text: '"넷." 그가 대답하고는 잠깐 멈췄다. "…맞나?"' },
        fail: { effect: { hp: -3 }, text: '욕을 먹고 다시 누웠다.' },
        fumble: { effect: { hp: -5 }, text: '아무도 안 깼다. 흔들어도 안 깼다. 숨은 쉬고 있었다.' },
      },
    },
    { label: '커튼을 치고 잔다', gain: 2, effect: { hp: 8 }, resultText: '영운은 자기 커튼을 치고 눈을 감았다. 추위는 아침까지 갔다.' },
  ],
},

shade_close: {
  id: 'shade_close', pool: 'eerie', weight: 10, progress: [65, 100], gain: 4,
  text:
`복도 온도가 떨어진 게 아니었다.

소리가 없어졌다. 초상화도, 갑옷도, 바람도. 발소리조차 안 났다.

앞쪽 공기가 얇다. 그쪽만 세상이 덜 그려져 있다.

명부가 주머니 안에서 무거워진 것 같았다. 기분 탓이겠지만.`,
  choices: [
    {
      label: '명부를 꺼내 이름을 부른다',
      check: { stat: 'courage', dc: 12, hold: true },
      outcomes: {
        critical: { effect: { courage: 2, exp: 44, flag: 'heldAgainstShade' },
          text: '영운은 명부를 펴고 첫 줄부터 소리 내어 읽었다.\n\n한 줄, 두 줄, 세 줄.\n\n읽는 동안 그것이 다가오지 못했다. 소리가 나는 쪽으로는 못 오는 것 같았다.\n\n다 읽고 나니 복도에 소리가 돌아와 있었다.' },
        success: { effect: { exp: 24, hp: -4 }, text: '이름을 소리 내어 읽었다. 목이 갈라질 때까지. 그것이 물러났다.' },
        fail: { effect: { hp: -14 }, text: '목소리가 나오지 않았다. 그것이 스쳐 지나갔고, 지나간 자리에서 뭔가 가벼워졌다.' },
        fumble: { effect: { hp: -20, erosion: 'albus' }, text: '명부를 펴는 순간 손이 미끄러졌다. 주우려는데 그것이 이미 위에 있었다.\n\n한 줄이 흐려졌다.' },
      },
    },
    {
      label: '벽에 붙어 지나가기를 기다린다',
      check: { stat: 'agility', dc: 12 },
      gain: 2,
      outcomes: {
        critical: { effect: { agility: 1, exp: 26 }, text: '숨을 멈추고 벽에 붙었다. 그것이 바로 앞을 지나갔다. 알아채지 못했다.' },
        success: { effect: { hp: -6 }, text: '스치듯 지나갔다. 그 자리가 오래 시렸다.' },
        fail: { effect: { hp: -16 }, text: '너무 늦게 붙었다. 정면으로 지나갔다.' },
        fumble: { effect: { hp: -22 }, text: '움직이지 못했다. 얼마나 그러고 있었는지 모르겠다.' },
      },
    },
    { label: '뛴다', gain: 2, effect: { hp: -10 }, resultText: '영운은 뒤도 안 보고 뛰었다. 계단을 두 층 내려와서야 소리가 돌아왔다.' },
  ],
},

register_extra_line: {
  id: 'register_extra_line', pool: 'eerie', weight: 10, progress: [40, 100], gain: 3,
  text:
`명부를 세어봤다.

어제 열두 줄이었다. 오늘도 열두 줄이다.

그런데 세 번째 줄을 읽고 네 번째 줄로 눈을 옮기는 사이가 이상하게 길다.

손가락으로 짚으며 세면 열두 줄인데, 눈으로 훑으면 열세 줄쯤 되는 느낌이다.`,
  choices: [
    {
      label: '줄 사이를 손톱으로 긁어본다',
      check: { stat: 'intelligence', dc: 16, search: true },
      outcomes: {
        critical: { effect: { intelligence: 2, exp: 46, fragment: 3 },
          text: '세 번째와 네 번째 줄 사이. 종이가 미세하게 눌려 있었다.\n\n잉크는 없는데 펜이 지나간 자국은 있다. 누가 여기 뭔가 썼고, 잉크만 사라졌다.\n\n영운은 연필을 눕혀 그 위를 문질렀다. 눌린 자국이 하얗게 떠올랐다.\n\n첫 글자가 읽혔다.' },
        success: { effect: { exp: 24, fragment: 3 },
          text: '연필을 눕혀 문지르니 눌린 자국이 떠올랐다. 잉크는 없어도 펜 자국은 남는다. 첫 글자가 읽혔다.' },
        fail: { effect: {}, text: '종이만 상했다.' },
        fumble: { effect: { hp: -5 }, text: '종이가 찢어졌다. 그 줄이 통째로 없어졌다.' },
      },
    },
    {
      label: '명부를 통째로 새 공책에 옮겨 적는다',
      effect: { exp: 26, hp: -6 },
      resultText:
`영운은 밤새 옮겨 적었다. 열두 줄을 한 줄씩, 순서대로.

다 쓰고 세어보니 열세 줄이었다.

세 번째와 네 번째 사이에 한 줄이 더 있었다. 영운의 글씨로, 읽을 수 없는 글자가.

손이 알고 있었던 것이다.`,
    },
  ],
},

memorial_smooth: {
  id: 'memorial_smooth', pool: 'eerie', weight: 10, progress: [55, 100], gain: 3,
  registers: ['lavinia'],
  text:
`기념비에 다시 갔다.

지난번에는 세 번째 줄 다섯 번째와 여섯 번째 사이가 매끈했다.

오늘은 네 번째와 다섯 번째 사이도 매끈했다.

번지고 있다.`,
  choices: [
    {
      label: '남은 이름들을 전부 소리 내어 읽는다',
      check: { stat: 'courage', dc: 12 },
      outcomes: {
        critical: { effect: { courage: 2, exp: 44, flag: 'readAllNames' },
          text: '영운은 첫 줄부터 끝까지 읽었다. 쉰세 개.\n\n목이 갈라졌고 손이 떨렸다. 다 읽는 데 이십 분이 걸렸다.\n\n다 읽고 손을 대보니 네 번째와 다섯 번째 사이에 아주 얕은 홈이 돌아와 있었다. 글자는 아니었다. 글자가 있었다는 자국이었다.\n\n읽는 게 소용이 있다.' },
        success: { effect: { courage: 1, exp: 24, hp: -5 },
          text: '전부 읽었다. 목이 갈라졌다. 매끈해지던 자리가 조금 거칠어진 것도 같았다.' },
        fail: { effect: { hp: -8 }, text: '중간에 이름 하나에서 막혔다. 방금 읽었는데 다시 보니 처음 보는 것 같았다. 거기서 그만뒀다.' },
        fumble: { effect: { hp: -14 }, text: '읽는 도중 자기 목소리가 낯설어졌다. 무슨 이름을 읽고 있었는지 잊었다.' },
      },
    },
    {
      label: '매끈해진 자리를 손으로 문지른다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { fragment: 1, intelligence: 1, exp: 34 }, text: '문지르자 손끝이 걸렸다. 마지막 두 글자. 애—슈.\n\n그리고 문지른 자리가 조금 따뜻해졌다.' },
        success: { effect: { fragment: 1, exp: 18 }, text: '손끝에 두 글자가 걸렸다. 애슈.' },
        fail: { effect: { hp: -4 }, text: '손이 얼어붙을 만큼 차가웠다.' },
        fumble: { effect: { hp: -8 }, text: '손을 뗐을 때 손바닥에 자국이 남아 있었다. 글자 모양이 아니라, 아무 모양도 아닌 것이.' },
      },
    },
    { label: '보지 않고 돌아간다', gain: 2, effect: { alignment: -3 }, resultText: '영운은 돌아섰다. 등 뒤에서 아무 소리도 나지 않았다.\n\n돌아가는 길에 한 번도 뒤돌아보지 않은 게, 나중에 오래 마음에 걸렸다.' },
  ],
},

no_one_answers: {
  id: 'no_one_answers', pool: 'eerie', weight: 8, progress: [60, 100], gain: 3,
  text:
`복도에서 아는 얼굴을 봤다.

이름을 불렀다. 그쪽이 돌아봤다.

"…누구세요?"

명부를 꺼내 확인했다. 이름은 거기 있다. 어제 같이 밥도 먹었다.

그쪽 눈에는 아무것도 없었다.`,
  choices: [
    {
      label: '기억나게 해보려 한다',
      check: { stat: 'charm', dc: 16 },
      outcomes: {
        critical: { effect: { charm: 2, exp: 46, flag: 'broughtBackOne' },
          text: '"어제 도서관 3층. 네가 창가 자리 잡아줬잖아. 버터맥주 얘기 했고."\n\n상대가 눈을 깜빡였다.\n\n"…아."\n\n돌아왔다. 전부는 아니고 일부만. 그래도 돌아왔다.\n\n먹힌 것을 되찾는 방법이 있다. 소리 내어, 구체적으로, 붙들고 있는 사람이 말해주면.' },
        success: { effect: { exp: 26 }, text: '몇 가지를 구체적으로 말해주자 상대가 "아" 하고 말했다. 반쯤 돌아왔다.' },
        fail: { effect: { hp: -8 }, text: '아무리 말해도 통하지 않았다. 상대가 곤란해하며 자리를 떴다.' },
        fumble: { effect: { hp: -12 }, text: '붙잡고 늘어졌다. 사람들이 모여들었고, 결국 영운이 이상한 사람이 됐다.' },
      },
    },
    {
      label: '명부에 그 사람 이름을 다시 진하게 쓴다',
      effect: { exp: 22, hp: -4 },
      resultText:
`영운은 그 자리에서 명부를 폈다. 이미 적혀 있는 이름 위에 한 번 더, 진하게 덧썼다.

펜이 종이를 뚫을 정도로.

그쪽은 이미 가버렸다. 그래도 적었다.`,
    },
    { label: '아무 말도 못 하고 보낸다', gain: 2, effect: { alignment: -3, hp: -3 }, resultText: '영운은 아무 말도 못 했다.\n\n그쪽이 지나갔다. 스치면서 미안하다는 듯 살짝 웃었다. 모르는 사람에게 하는 웃음이었다.' },
  ],
},

};
