/* ===================== 인카운터 · 조사 =====================
 * 단서 · 기록 · 인물. 이름 조각이 나오는 풀. */

const ENCOUNTERS_SEARCH = {

memorial_visit: {
  id: 'memorial_visit', pool: 'search', weight: 14, progress: [5, 100], repeatable: true, gain: 2,
  registers: ['lavinia', 'fred', 'lupin', 'colin'],
  text:
`기념비 앞에는 아무도 없었다. 5월이 아니면 대개 그렇다.

돌에 이름이 줄줄이 새겨져 있다. 세 번째 줄에는 여섯 개. 아니, 다섯 개인가.

세어보면 매번 다르다. 눈으로 훑으면 여섯인데 손가락으로 짚으면 다섯이다.`,
  choices: [
    {
      label: '손가락으로 짚어가며 센다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { fragment: 1, intelligence: 1 }, text: '다섯 번째와 여섯 번째 사이. 손끝에 아주 얕은 홈이 걸렸다. 글자가 있었던 자리다.\n\n마지막 두 글자만 남아 있었다. 애슈.' },
        success: { effect: { fragment: 1 }, text: '사이에 무언가 있었다. 두 글자쯤 되는 흔적 — 애슈.' },
        fail: { effect: {}, text: '아무리 세어도 숫자가 맞지 않았다. 결국 포기했다.' },
        fumble: { effect: { hp: -3 }, text: '너무 오래 서 있었다. 바람이 차가웠고 돌아오는 길에 기침이 났다.' },
      },
    },
    {
      label: '이름을 하나씩 소리 내어 읽는다',
      check: { stat: 'courage', dc: 8 },
      outcomes: {
        critical: { effect: { courage: 1, exp: 24 }, text: '한 명씩 소리 내어 읽었다. 다 읽고 나니 목이 아팠다.\n\n읽는 동안 이름들이 조금 더 또렷해진 것 같았다. 기분 탓일 수도 있다. 아닐 수도 있다.' },
        success: { effect: { exp: 12 }, text: '한 명씩 읽었다. 아무도 듣지 않았지만 그래도 읽었다.' },
        fail: { effect: {}, text: '중간에 목이 메어 그만뒀다.' },
        fumble: { effect: { hp: -3 }, text: '읽다가 한 이름에서 막혔다. 분명 방금 읽었는데 다시 보니 처음 보는 것 같았다.' },
      },
    },
    { label: '조용히 서 있다가 돌아온다', gain: 1, effect: { exp: 6 }, resultText: '아무것도 하지 않았다. 그냥 한참 서 있다가 돌아왔다.' },
  ],
},

library_yearbook: {
  id: 'library_yearbook', pool: 'search', weight: 12, progress: [10, 100], gain: 2,
  text:
`도서관 서가 맨 아래, 연도별 학적부가 꽂혀 있다.

1998년 것을 뽑았다. 표지가 다른 해보다 낡았다. 많이 펼쳐졌다는 뜻이다.

사진이 붙어 있는 쪽을 폈다. 단체 사진이었다.`,
  choices: [
    {
      label: '사진의 구도를 살핀다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { fragment: 4, intelligence: 1 }, text: '이상한 건 얼굴이 아니라 구도였다.\n\n앞줄 가운데 두 사람이 서로에게 몸을 기울이고 있다. 그 사이에 한 사람 몫의 공간이 비어 있다. 둘 다 아무도 없는 쪽을 보며 웃고 있었다.\n\n영운은 그 빈 공간의 모양을 오래 봤다. 어깨 높이, 머리 위치. 앉은 사람이었다.' },
        success: { effect: { fragment: 4 }, text: '앞줄 가운데가 이상했다. 두 사람이 아무도 없는 쪽을 보며 웃고 있었다.' },
        fail: { effect: {}, text: '그냥 오래된 사진이었다. 웃는 얼굴들이 조금 어색했지만 옛날 사진은 다 그렇다.' },
        fumble: { effect: {}, text: '책장을 넘기다 사진 한 장이 떨어져 나갔다. 다시 끼워 넣으면서 어느 쪽이었는지 잊었다.' },
      },
    },
    {
      label: '명단 쪽과 사진 속 인원을 대조한다',
      check: { stat: 'intelligence', dc: 16, search: true },
      outcomes: {
        critical: { effect: { intelligence: 2, exp: 40, flag: 'countMismatch' }, text: '사진 속 인원 스물여덟. 명단 스물여덟. 맞는다.\n\n그런데 뒷장 필사본 출석부는 스물아홉이었다.\n\n영운은 세 번 세고 나서 수첩에 적었다. **28 / 28 / 29.**' },
        success: { effect: { exp: 20, flag: 'countMismatch' }, text: '인쇄본과 필사본의 숫자가 하나 달랐다. 하나.' },
        fail: { effect: {}, text: '세다가 자꾸 놓쳤다. 처음부터 다시 세기를 세 번 하고 덮었다.' },
        fumble: { effect: { hp: -4 }, text: '오래 들여다보다 머리가 아팠다. 사서가 문 닫는다고 했다.' },
      },
    },
  ],
},

greylady_stairs: {
  id: 'greylady_stairs', pool: 'search', weight: 10, progress: [20, 100], gain: 2, registers: ['greyLady'],
  text:
`레번클로 탑 계단에서 냉기가 지나갔다.

회색 여인이었다. 유령치고도 말이 없는 편이라, 마주치는 것만으로도 드문 일이다.

그것이 지나가다 멈췄다. 영운 쪽을 보는 것 같기도 하고 아닌 것 같기도 했다.`,
  choices: [
    {
      label: '말을 걸어본다',
      check: { stat: 'charm', dc: 12, about: 'lavinia' },
      outcomes: {
        critical: { effect: { fragment: 2, charm: 1 }, text: '"자네는 아직 읽을 수 있군." 그것이 말했다.\n\n"뭘요?"\n\n"내가 아는 애가 하나 있었어. 여기 탑에 살았지. 늘 같은 자리에 앉아서 뭔가 적었어." 유령이 계단 위쪽을 봤다. "이제 그 자리에 아무도 안 앉아."' },
        success: { effect: { fragment: 2 }, text: '"여기 살던 애가 하나 있었어." 유령이 말했다. "레번클로였지."\n\n그러고는 벽 안으로 들어갔다.' },
        fail: { effect: {}, text: '유령은 대답하지 않고 지나갔다. 지나간 자리가 한참 차가웠다.' },
        fumble: { effect: { hp: -4 }, text: '너무 가까이 다가갔다. 냉기가 뼈까지 스며서 한참 떨었다.' },
      },
    },
    { label: '지나가게 둔다', gain: 1, effect: {}, resultText: '영운은 벽 쪽으로 붙어 섰다. 유령이 지나갔다. 뒤돌아보지 않았다.' },
  ],
},

edith_notebook: {
  id: 'edith_notebook', pool: 'search', weight: 12, progress: [15, 100], gain: 3, registers: ['edith'],
  requiresFlag: null,
  text:
`{{edith}}가 도서관 자기 자리에서 수첩을 넘기고 있었다.

앞장부터 뒷장까지, 뭔가를 찾는 것처럼 빠르게.

"뭐 찾아?"

"…모르겠어." 그 애가 말했다. "찾는 게 뭔지를 모르겠어. 근데 여기 있었던 건 확실해."`,
  choices: [
    {
      label: '같이 넘겨본다',
      check: { stat: 'intelligence', dc: 8, search: true },
      outcomes: {
        critical: { effect: { item: 'oldDiary', intelligence: 1, exp: 24, flag: 'hasNotebookLead' }, text: '중간쯤에 잉크가 번진 쪽이 있었다. 번진 게 아니라 — 글씨 위에 다시 쓴 자국이었다. 같은 줄을 여러 번 덧쓴.\n\n"이거 네 글씨야?"\n\n{{edith}}가 오래 봤다. "…응. 근데 왜 이렇게 여러 번 썼는지 모르겠어."' },
        success: { effect: { exp: 12, flag: 'hasNotebookLead' }, text: '한 쪽에 같은 줄을 여러 번 덧쓴 자국이 있었다. 무슨 글자인지는 읽히지 않았다.' },
        fail: { effect: {}, text: '수백 장이었다. 한참 넘기다 둘 다 지쳐서 그만뒀다.' },
        fumble: { effect: {}, text: '넘기다 종이가 찢어졌다. {{edith}}가 아무 말 없이 수첩을 가져갔다.' },
      },
    },
    {
      label: '"왜 다 적어?"',
      check: { stat: 'charm', dc: 4, about: 'edith' },
      outcomes: {
        critical: { effect: { charm: 1, exp: 16, flag: 'hasNotebookLead' }, text: '"안 적으면 없어지니까."\n\n너무 당연하다는 듯이 말해서 영운은 되묻지 못했다. 잠시 뒤에 그 애가 덧붙였다.\n\n"…다들 안 그래?"' },
        success: { effect: { exp: 8 }, text: '"안 적으면 없어지잖아." 그 애가 말했다. 농담인 줄 알았는데 웃지 않았다.' },
        fail: { effect: {}, text: '"그냥." 그 애가 말했다. 그러고는 다시 수첩으로 돌아갔다.' },
        fumble: { effect: {}, text: '그 애가 수첩을 덮었다. "…별로 재밌는 얘기 아니야."' },
      },
    },
  ],
},

portrait_gap: {
  id: 'portrait_gap', pool: 'search', weight: 10, progress: [10, 100], gain: 2, notFlag: 'sawPortraitGap',
  text:
`이층 층계참 왼쪽 벽.

초상화가 줄지어 걸려 있는데 한 자리만 비어 있다. 못 자국이 남아 있고, 그 주변만 벽지 색이 진하다. 오래 걸려 있었다는 뜻이다.

옆 초상화의 노인이 영운을 보더니 눈을 돌렸다.`,
  choices: [
    {
      label: '옆 초상화에게 묻는다',
      check: { stat: 'charm', dc: 8 },
      outcomes: {
        critical: { effect: { charm: 1, exp: 22, flag: 'sawPortraitGap' }, text: '"저기 뭐가 걸려 있었어요?"\n\n노인이 한참 있다가 말했다. "…모르겠군."\n\n"모르시는 게 아니라 기억이 안 나시는 거예요?"\n\n그가 처음으로 영운을 똑바로 봤다. "그 둘이 다른가?"' },
        success: { effect: { exp: 12, flag: 'sawPortraitGap' }, text: '"모르겠군." 노인이 말했다. "저기는 원래 비어 있었어."\n\n그런데 못 자국은 남아 있었다.' },
        fail: { effect: { flag: 'sawPortraitGap' }, text: '노인은 자는 척했다. 눈꺼풀이 떨리는 걸 보니 자는 게 아니었다.' },
        fumble: { effect: { flag: 'sawPortraitGap' }, text: '초상화들이 일제히 조용해졌다. 복도 전체가 숨을 죽인 것 같아서 영운은 서둘러 지나갔다.' },
      },
    },
    {
      label: '벽지 색이 진한 부분의 크기를 잰다',
      requiresStat: { intelligence: 10 },
      effect: { exp: 18, flag: 'sawPortraitGap' },
      resultText:
`영운은 손뼘으로 재봤다. 가로 네 뼘, 세로 여섯 뼘.

다른 초상화들과 견줘보니 인물화 크기였다. 풍경화가 아니라 사람 그림이 걸려 있었던 자리다.

그런데 여기 사람들은 아무도 그 그림을 기억하지 못한다.`,
    },
  ],
},

};
