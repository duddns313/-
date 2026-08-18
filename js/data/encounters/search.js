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


dumbledore_portrait: {
  id: 'dumbledore_portrait', pool: 'search', weight: 12, progress: [25, 100], gain: 3,
  registers: ['dumbledore', 'mcgonagall'],
  text:
`교장실 나선 계단은 이름을 대야 열린다. 오늘은 열려 있었다.

{{mcgonagall}} 교장은 자리에 없었다. 벽에는 역대 교장들의 초상화가 걸려 있고, 대부분은 자는 척하고 있었다.

한 사람만 깨어 있었다. 은빛 수염의 노인.

"기다리고 있었다고 하면 거짓말이겠지." 초상화가 말했다. "다만 요즘 이 방에 오는 학생이 드물어서."`,
  choices: [
    {
      label: '1943년에 대해 묻는다',
      check: { stat: 'charm', dc: 12, search: true },
      outcomes: {
        critical: { effect: { charm: 1, exp: 40, flag: 'portraitGap' },
          text: '"1943년이라." 초상화가 안경을 고쳐 썼다. "그해에… 나는 변신술을 가르치고 있었지."\n\n그가 말을 멈췄다. 아주 오래.\n\n"이상하군. 그해 겨울에 무슨 일이 있었는데. 누가 나를 두 번 찾아왔던 것 같은데."\n\n"누가요?"\n\n"…모르겠네." 초상화가 처음으로 당황한 얼굴을 했다. "나는 초상화일세. 그린 사람이 알던 것만 알아. 그런데 그린 사람이 그때 이미 잊었다면—"\n\n그가 말을 맺지 않았다.' },
        success: { effect: { exp: 20, flag: 'portraitGap' },
          text: '"그해 겨울에 누가 나를 찾아왔던 것 같은데." 초상화가 말했다. "기억이 안 나는군. 초상화가 기억을 못 한다는 게 말이 되나."' },
        fail: { effect: {}, text: '"오래된 일일세." 초상화가 눈을 감았다. 자는 척이었다.' },
        fumble: { effect: {}, text: '옆 초상화들이 웅성거렸다. 무례하다는 소리가 들렸고, 계단이 저절로 아래로 움직였다.' },
      },
    },
    {
      label: '기념비의 이름 명단을 묻는다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 36, item: 'oldDiary' },
          text: '"기념비는 갱신되는 마법일세. 해마다 추모로." 초상화가 말했다. "누가 기억하는 한 글자가 유지되지."\n\n"기억이 끊기면요?"\n\n"글자가 스스로 매끈해지네. 벽이 그 이름을 잊는 거야."\n\n그가 책상 서랍 쪽을 눈으로 가리켰다. 오래된 명부 사본이 하나 있었다.' },
        success: { effect: { exp: 18 }, text: '"기념비는 추모로 갱신되는 마법일세. 기억이 끊기면 글자가 스스로 매끈해지지."' },
        fail: { effect: {}, text: '"교장에게 물어보게." 초상화가 말했다. 교장은 없었다.' },
        fumble: { effect: { hp: -3 }, text: '계단이 갑자기 움직였다. 난간을 붙잡느라 팔이 꺾였다.' },
      },
    },
  ],
},

simon_tea: {
  id: 'simon_tea', pool: 'search', weight: 12, progress: [20, 90], repeatable: true, gain: 2,
  registers: ['simon'],
  text:
`서고 안쪽에 작은 탁자가 있다. {{simon}}이 늘 거기서 차를 마신다.

"앉게." 그가 잔을 하나 더 꺼냈다. "혼자 마시면 식어서."

차는 진하고 조금 썼다. 설탕은 없었다.`,
  choices: [
    {
      label: '그가 하는 이야기를 듣는다',
      check: { stat: 'charm', dc: 8 },
      outcomes: {
        critical: { effect: { charm: 1, exp: 28, hp: 8, flag: 'simonTalk' },
          text: '"학생은 형제가 있나."\n\n"없어요."\n\n"그래." 그가 잔을 두 손으로 감쌌다. "있으면 좋아. 하나라도."\n\n한참 있다가 그가 덧붙였다. "물론 있다가 없어지면 곤란하지만."\n\n그러고는 웃었다. 웃는 얼굴이 오래 남았다.' },
        success: { effect: { exp: 14, hp: 6 }, text: '오래된 책 이야기를 들었다. 그는 이 서고의 거의 모든 책을 읽은 것 같았다.' },
        fail: { effect: { hp: 4 }, text: '별말 없이 차만 마셨다. 그것도 나쁘지 않았다.' },
        fumble: { effect: {}, text: '차를 엎었다. 그가 조용히 닦았다.' },
      },
    },
    {
      label: '그의 손을 본다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 34, flag: 'simonHands' },
          text: '오른손 중지 바깥쪽에 굳은살이 두껍게 앉아 있었다. 깃펜을 아주 오래 쥔 사람의 손이다.\n\n서고 관리인이니 당연하다. 다만 목록 정리에 쓰는 만큼이 아니었다. 같은 것을 수없이 반복해 쓴 손이었다.' },
        success: { effect: { exp: 16 }, text: '깃펜 굳은살이 유난히 두꺼웠다. 손가락 마디도 굵었다.' },
        fail: { effect: {}, text: '그가 잔을 내려놓으며 손을 무릎으로 내렸다.' },
        fumble: { effect: {}, text: '너무 빤히 봤다. 그가 알아채고 손을 감췄다. "…뭐 묻었나."' },
      },
    },
    { label: '고맙다고 하고 나온다', gain: 1, effect: { hp: 6 }, resultText: '잔을 비우고 일어섰다. 그가 문까지 배웅했다.' },
  ],
},

roll_call: {
  id: 'roll_call', pool: 'search', weight: 12, progress: [15, 100], gain: 2,
  text:
`수업 시작 전 출석. 교수가 명단을 읽어 내려갔다.

이름, 대답. 이름, 대답.

한 번, 이름을 부르고 아무도 대답하지 않았다. 교수가 잠깐 멈췄다가 그냥 다음 이름으로 넘어갔다.

아무도 이상해하지 않았다.`,
  choices: [
    {
      label: '방금 그 이름을 기억해두려 한다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 36, fragment: 3 },
          text: '영운은 즉시 명부를 꺼내 적었다. 손이 먼저 움직였다.\n\n적고 나서 읽었다. 첫 글자가 남았다. 나머지는 종이 위에서 흐려졌다.\n\n라—' },
        success: { effect: { exp: 18 }, text: '적으려고 깃펜을 들었는데 이미 늦었다. 뭘 적으려 했는지 떠오르지 않았다.' },
        fail: { effect: {}, text: '이름은 귀를 스치고 지나갔다. 붙잡을 새가 없었다.' },
        fumble: { effect: { hp: -3 }, text: '따라 부르려다 자기 차례를 놓쳤다. 결석 처리됐다.' },
      },
    },
    {
      label: '교수에게 방금 이름이 누구냐고 묻는다',
      check: { stat: 'charm', dc: 12 },
      outcomes: {
        critical: { effect: { charm: 1, exp: 32, flag: 'askedRoll' },
          text: '교수가 명단을 다시 봤다. 한참 봤다.\n\n"…없는데요."\n\n"방금 부르셨잖아요."\n\n"제가요?" 교수가 명단을 영운 쪽으로 돌렸다. 이름과 이름 사이에 아무것도 없었다.\n\n그런데 종이가 그 자리만 아주 살짝 눌려 있었다.' },
        success: { effect: { exp: 16 }, text: '"그런 이름 없는데요." 교수가 명단을 확인하고 말했다. 정말로 없었다.' },
        fail: { effect: {}, text: '교수가 웃어넘겼다. "수업합시다."' },
        fumble: { effect: { hp: -3 }, text: '뒷자리에서 누가 웃었다. 얼굴이 달아올랐다.' },
      },
    },
  ],
},

ghost_gathering: {
  id: 'ghost_gathering', pool: 'search', weight: 10, progress: [30, 100], gain: 2,
  registers: ['greyLady'],
  text:
`밤중 복도에서 유령 셋이 모여 있었다. 목이 반쯤 잘린 것, 수도사 차림, 그리고 회색 여인.

산 사람이 오면 대개 흩어지는데 오늘은 안 흩어졌다.

"…또 하나 줄었어." 수도사가 말했다.

"세어봤나?"

"셀 필요가 있나. 자리가 비면 아는 거지."`,
  choices: [
    {
      label: '끼어들어 묻는다',
      check: { stat: 'charm', dc: 12, about: 'lavinia' },
      outcomes: {
        critical: { effect: { charm: 1, exp: 38, fragment: 2 },
          text: '"자네들은 왜 안 잊나요?"\n\n"산 사람이 아니니까." 목이 잘린 유령이 말했다. "먹을 게 없거든, 우리한테는."\n\n"그런데 왜 아무도 이름을 말 안 해요?"\n\n셋이 서로를 봤다.\n\n"애초에 주의를 안 기울였으니까." 회색 여인이 말했다. "나만 빼고. 레번클로였어, 그 애는. 내 탑에 살았지."' },
        success: { effect: { fragment: 2, exp: 20 },
          text: '"우리는 안 잊어." 회색 여인이 말했다. "다만 대부분은 애초에 안 봤지. 나는 봤고. 레번클로였어."' },
        fail: { effect: {}, text: '유령들이 벽 속으로 사라졌다. 복도가 갑자기 추워졌다.' },
        fumble: { effect: { hp: -6 }, text: '셋이 동시에 지나갔다. 냉기가 뼈까지 스몄다.' },
      },
    },
    { label: '숨어서 더 듣는다', gain: 2, effect: { exp: 18 }, resultText: '기둥 뒤에서 한참 들었다. 대화는 곧 다른 데로 흘렀다. 다만 "또"라는 말이 세 번 나왔다.' },
  ],
},

photo_album: {
  id: 'photo_album', pool: 'search', weight: 12, progress: [20, 100], gain: 2,
  text:
`휴게실 서랍에서 낡은 사진첩이 나왔다. 표지에 1998이라고 적혀 있다.

마법 사진이라 사람들이 움직인다. 웃고, 손을 흔들고, 서로를 밀친다.

한 장에서 손이 멈췄다.`,
  choices: [
    {
      label: '그 사진을 오래 본다',
      check: { stat: 'intelligence', dc: 8, search: true },
      outcomes: {
        critical: { effect: { fragment: 4, intelligence: 1, exp: 32 },
          text: '앞줄 두 사람이 자꾸 가운데 쪽으로 몸을 기울인다. 사진 속에서, 몇 초마다 반복해서.\n\n거기엔 아무도 없다.\n\n그런데 둘의 시선 높이가 맞는다. 앉은 사람 얼굴 높이에. 영운은 그 높이를, 그 자리의 모양을 오래 봤다. 눈을 감아도 남았다.' },
        success: { effect: { fragment: 4, exp: 18 },
          text: '앞줄 두 사람이 아무도 없는 쪽을 보며 웃고 있었다. 시선 높이가 정확히 맞았다.' },
        fail: { effect: {}, text: '오래된 사진은 원래 좀 어색하다. 그렇게 생각하기로 했다.' },
        fumble: { effect: {}, text: '사진첩을 떨어뜨렸다. 사진 몇 장이 빠져 순서가 엉켰다.' },
      },
    },
    {
      label: '사진 뒷면을 본다',
      check: { stat: 'agility', dc: 8, search: true },
      outcomes: {
        critical: { effect: { exp: 30, item: 'oldDiary' }, text: '뒷면에 연필로 이름이 줄줄이 적혀 있었다. 왼쪽부터 순서대로. 한 자리만 글씨가 지워져 있었는데, 지운 게 아니라 종이가 그 부분만 하얗게 바래 있었다.' },
        success: { effect: { exp: 14 }, text: '뒷면에 이름 목록이 있었다. 하나가 비었다.' },
        fail: { effect: {}, text: '뒷면은 백지였다.' },
        fumble: { effect: {}, text: '사진이 찢어졌다. 붙여놨지만 티가 났다.' },
      },
    },
  ],
},

kitchen_elves: {
  id: 'kitchen_elves', pool: 'search', weight: 10, progress: [15, 100], gain: 2,
  text:
`주방은 대연회장 바로 아래다. 배 그림의 서양배를 간지럽히면 문이 열린다.

집요정 수십이 한꺼번에 움직이고 있었다. 상을 차리는 순서가 정해져 있는 모양이었다.

영운이 물었다. "자리는 어떻게 세요?"

가장 가까이 있던 집요정이 멈췄다.`,
  choices: [
    {
      label: '자리 세는 법을 자세히 묻는다',
      check: { stat: 'charm', dc: 8, search: true },
      outcomes: {
        critical: { effect: { charm: 1, exp: 34, flag: 'elfCount' },
          text: '"세지 않습니다." 집요정이 말했다. "느낍니다. 앉을 사람이 있으면 접시가 갑니다."\n\n"틀린 적은 없어요?"\n\n집요정의 귀가 아래로 처졌다.\n\n"요즘…" 그것이 아주 작게 말했다. "가끔 접시를 들고 서 있게 됩니다. 어디 놔야 할지 모르겠어서요. 그런 자리가 있습니다."' },
        success: { effect: { exp: 18 }, text: '"앉을 사람이 있으면 접시가 갑니다." 집요정이 말했다. "요즘 가끔 헷갈립니다."' },
        fail: { effect: { item: 'chocolateFrog' }, text: '집요정이 질문을 못 알아듣고 대신 먹을 것을 잔뜩 안겨줬다.' },
        fumble: { effect: { hp: -3 }, text: '집요정들이 당황했다. 하나가 자기 손등을 때리기 시작해서 말리느라 진땀을 뺐다.' },
      },
    },
    { label: '먹을 것만 얻어서 나온다', gain: 1, effect: { hp: 18, item: 'chocolateFrog' }, resultText: '거절할 수가 없었다. 양손 가득 안고 나왔다.' },
  ],
},

carved_desk: {
  id: 'carved_desk', pool: 'search', weight: 10, progress: [10, 100], gain: 2,
  text:
`빈 교실 뒤쪽 책상. 상판에 이름이 잔뜩 새겨져 있다.

수십 년 치다. 칼로 판 것, 지팡이로 지진 것, 잉크로 쓴 것.

그중 하나만 유독 깊다. 여러 번 덧새긴 것처럼.`,
  choices: [
    {
      label: '깊이 새겨진 이름을 손끝으로 따라 읽는다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { fragment: 1, intelligence: 1, exp: 34 },
          text: '눈으로는 안 읽혔다. 홈만 있고 글자는 없는 것처럼 보였다.\n\n손끝으로 따라가니 읽혔다. 마지막 두 글자. 애—슈.\n\n누군가 이 이름을 여러 해에 걸쳐 계속 덧새겼다. 지워질 때마다 다시.' },
        success: { effect: { fragment: 1, exp: 18 },
          text: '손끝으로 따라가자 마지막 두 글자가 잡혔다. 애슈.' },
        fail: { effect: {}, text: '홈은 있는데 글자가 안 잡혔다.' },
        fumble: { effect: { hp: -3 }, text: '나뭇결에 손가락이 찔렸다. 가시가 박혔다.' },
      },
    },
    {
      label: '내 이름을 새긴다',
      effect: { exp: 14, alignment: 2 },
      resultText:
`영운은 지팡이 끝으로 자기 이름을 새겼다. 깊게.

그러고는 잠깐 생각하다가, 옆에 한 줄을 더 팠다. 아직 무슨 글자인지 모르는 자리에.

언젠가 채울 수 있을 것 같아서.`,
    },
  ],
},

lost_and_found: {
  id: 'lost_and_found', pool: 'search', weight: 10, progress: [10, 100], repeatable: true, gain: 2,
  text:
`관리인실 옆 분실물함. 상자 세 개가 넘치도록 차 있다.

목도리, 장갑, 교과서, 짝 잃은 신발.

주인이 안 찾아간 물건은 학기 말에 버린다고 했다. 그런데 상자 하나는 유난히 오래된 것들만 들어 있었다.`,
  choices: [
    {
      label: '오래된 상자를 뒤진다',
      check: { stat: 'luck', dc: 8 },
      outcomes: {
        critical: { effect: { equipDrop: { slot: 'accessory', tier: 2 }, luck: 1, exp: 24 }, text: '바닥에서 뭔가 반짝였다. 아무도 안 찾아간 지 오래된 물건이었다.' },
        success: { effect: { gold: 20, exp: 10 }, text: '주머니가 달린 로브에서 갈레온이 나왔다. 이십오 년쯤 묵은 돈이다.' },
        fail: { effect: {}, text: '먼지만 마셨다.' },
        fumble: { effect: { hp: -3 }, text: '상자 바닥에서 뭔가 손을 물었다. 아직 살아 있는 것이 들어 있었다.' },
      },
    },
    {
      label: '이름표가 붙은 물건을 찾아본다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { exp: 30, item: 'oldDiary', intelligence: 1 },
          text: '대부분은 이름이 지워졌거나 애초에 없었다. 하나만 남아 있었다 — 손으로 꿰맨 이름표.\n\n실은 색이 바랬는데 글자는 또렷했다. 손으로 한 것은 남는다.' },
        success: { effect: { exp: 16 }, text: '손바느질한 이름표가 하나 나왔다. 실이 바랬지만 글자는 또렷했다.' },
        fail: { effect: {}, text: '이름표는 다 지워져 있었다.' },
        fumble: { effect: {}, text: '관리인이 왔다. 남의 물건 뒤진다고 한참 혼났다.' },
      },
    },
  ],
},

memorial_ceremony: {
  id: 'memorial_ceremony', pool: 'search', weight: 10, progress: [40, 100], gain: 3,
  registers: ['simon', 'mcgonagall'],
  text:
`추모식 예행. 5월은 아직 멀었지만 해마다 미리 한 번 맞춰본다고 했다.

명단을 낭독할 사람이 단상에 섰다. 이름을 하나씩 읽어 내려갔다.

세 번째 줄에서 발음이 뭉개졌다. 낭독자는 고치지 않고 넘어갔다.

맨 뒷줄에 {{simon}}이 서 있었다. 그 한 사람만 서 있었다 — 다른 사람들은 다 앉아 있었다.`,
  choices: [
    {
      label: '낭독자에게 발음이 틀렸다고 말한다',
      check: { stat: 'courage', dc: 12, about: 'lavinia' },
      outcomes: {
        critical: { effect: { courage: 2, exp: 40, flag: 'correctedName' },
          text: '"세 번째 줄, 방금 그거 틀렸어요."\n\n낭독자가 명단을 봤다. "어디요?"\n\n영운이 짚었다. 짚은 자리에는 아무 이름도 없었다.\n\n뒷줄에서 발소리가 났다. 돌아보니 {{simon}}이 이쪽을 보고 있었다. 처음으로, 그가 놀란 얼굴을 하고 있었다.' },
        success: { effect: { courage: 1, exp: 22, flag: 'correctedName' },
          text: '"방금 그거 틀렸어요." 낭독자가 명단을 확인하고는 고개를 저었다. 그래도 뒷줄에서 누가 이쪽을 보는 게 느껴졌다.' },
        fail: { effect: {}, text: '말하려는데 목소리가 안 나왔다. 무슨 말을 하려 했는지도 곧 잊었다.' },
        fumble: { effect: { hp: -5 }, text: '엉뚱한 이름을 지적했다. 사람들이 웅성거렸고 교장이 조용히 하라고 했다.' },
      },
    },
    {
      label: '뒷줄의 그를 지켜본다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 34, flag: 'watchedSimon' },
          text: '그는 명단을 보지 않았다. 낭독자를 보지도 않았다.\n\n입술만 움직이고 있었다. 소리 없이. 같은 길이의 말을, 계속 반복해서.\n\n네 음절. 그리고 잠깐 쉬고, 다시 네 음절.' },
        success: { effect: { exp: 18 }, text: '그는 낭독 내내 입술을 움직이고 있었다. 소리는 나지 않았다.' },
        fail: { effect: {}, text: '사람들에 가려 잘 보이지 않았다.' },
        fumble: { effect: { hp: -3 }, text: '눈이 마주쳤다. 그가 웃었다. 영운은 그 웃음을 오래 잊지 못했다.' },
      },
    },
    { label: '조용히 서 있는다', gain: 2, effect: { exp: 12, alignment: 2 }, resultText: '영운도 일어섰다. 앉아 있는 사람들 사이에서 둘만 서 있었다.' },
  ],
},

marauder_map_hint: {
  id: 'marauder_map_hint', pool: 'search', weight: 8, progress: [45, 100], gain: 3,
  requiresFn: (s) => !!s.itemStacks.marauderMap,
  text:
`도둑 지도를 폈다.

성 안 사람들의 이름표가 각자 자리에서 움직인다. 교수들, 학생들, 유령들.

3층 복도에 이름표가 하나 있는데, 이름이 없다.

빈 이름표가 천천히 움직이고 있었다.`,
  choices: [
    {
      label: '따라가본다',
      check: { stat: 'courage', dc: 16 },
      outcomes: {
        critical: { effect: { courage: 2, exp: 48, fragment: 5 },
          text: '빈 이름표를 따라 3층까지 갔다. 복도 끝, 아무도 없는 자리에서 이름표가 멈춰 있었다.\n\n그 자리 바닥에 먼지가 없었다. 누가 오래 서 있던 자국.\n\n영운이 지도를 다시 봤을 때, 빈 이름표 옆에 글자가 잠깐 떠올랐다 사라졌다. 지도는 손으로 만든 것이다. 손으로 만든 것은 안다.\n\n라비니아.' },
        success: { effect: { exp: 26, fragment: 5 },
          text: '따라가니 복도 끝이었다. 지도 위에서 빈 이름표 옆에 글자가 아주 잠깐 떠올랐다. 라비니아.' },
        fail: { effect: { hp: -8 }, text: '따라가다 놓쳤다. 복도를 몇 바퀴 돌다 지쳐 돌아왔다.' },
        fumble: { effect: { hp: -14 }, text: '모퉁이에서 무언가와 부딪혔다. 아무것도 없었는데 부딪혔고, 숨이 한참 막혔다.' },
      },
    },
    { label: '지도를 접는다', gain: 1, effect: {}, resultText: '영운은 지도를 접었다. "장난은 끝났다." 종이가 백지가 됐다.' },
  ],
},

teacher_lounge: {
  id: 'teacher_lounge', pool: 'search', weight: 8, progress: [25, 100], gain: 2,
  registers: ['flitwick'],
  text:
`교무실 문이 조금 열려 있었다. 안에서 목소리가 났다.

"…올해도 두 명이 안 왔어요."
"휴학 처리는 했나?"
"그게, 휴학계가 없어요. 그런데 명단에도 없고요."
"그럼 처음부터 없던 거겠지."
"…그러니까요. 그럼 제가 왜 두 명이라고 생각했을까요."

침묵이 길었다.`,
  choices: [
    {
      label: '문을 두드리고 들어간다',
      check: { stat: 'courage', dc: 12 },
      outcomes: {
        critical: { effect: { courage: 1, exp: 34, flag: 'teachersKnow' },
          text: '{{flitwick}} 교수가 영운을 오래 봤다.\n\n"자네도 느끼나."\n\n"…네."\n\n"그럼 적어두게." 그가 말했다. "손으로. 마법으로 하지 말고 손으로. 그게 유일하게 남는 방식이야."' },
        success: { effect: { exp: 18 }, text: '교수들이 화제를 바꿨다. 다만 나가는 영운을 {{flitwick}}이 오래 봤다.' },
        fail: { effect: {}, text: '"수업 시간 아닌가?" 그걸로 대화가 끝났다.' },
        fumble: { effect: { hp: -3 }, text: '문이 크게 열리며 벽에 부딪혔다. 교수들이 전부 돌아봤고, 벌점을 받았다.' },
      },
    },
    { label: '더 듣는다', gain: 2, effect: { exp: 20 }, resultText: '문틈에 붙어 한참 들었다. 두 사람은 결국 결론을 못 내고 각자 수업에 갔다.' },
  ],
},

room_of_requirement: {
  id: 'room_of_requirement', pool: 'search', weight: 8, progress: [50, 100], gain: 3,
  text:
`7층 복도. 벽 앞을 세 번 지나갔다.

문이 생겼다.

안은 방이라기보다 창고였다. 수백 년치 물건이 산처럼 쌓여 있고, 통로가 미로처럼 나 있다.

한쪽 벽에 무언가 새겨져 있었다. 오래된 자국이다.`,
  choices: [
    {
      label: '벽의 자국을 살핀다',
      check: { stat: 'intelligence', dc: 16, search: true },
      outcomes: {
        critical: { effect: { intelligence: 2, exp: 50, flag: 'sawTheMark' },
          text: '글자가 아니었다. 도형이었다. 원 안에 원, 그 안에 이름 하나가 들어갈 만한 빈칸.\n\n칠판에 문제를 풀다 만 것처럼, 옆에 시도한 흔적이 여러 개 있었다. 전부 지워졌다.\n\n하나만 지워지지 않고 남아 있었다. 완성되지 못한 것.\n\n누가 오래전에 여기서 무언가를 만들려다 그만뒀다.' },
        success: { effect: { exp: 26, flag: 'sawTheMark' },
          text: '원 안에 원, 그 안에 이름이 들어갈 만한 빈칸. 누가 여기서 뭔가를 만들려다 그만둔 자국이었다.' },
        fail: { effect: {}, text: '오래된 낙서 같았다. 읽을 수는 없었다.' },
        fumble: { effect: { hp: -8 }, text: '자국에 손을 댔다. 손바닥이 얼어붙는 것 같았고, 한동안 감각이 없었다.' },
      },
    },
    {
      label: '쌓인 물건을 뒤진다',
      check: { stat: 'luck', dc: 12 },
      outcomes: {
        critical: { effect: { equipDrop: { slot: 'wand', tier: 3 }, luck: 1, exp: 30 }, text: '천으로 싼 것이 하나 나왔다. 풀어보니 손에 딱 맞았다.' },
        success: { effect: { equipDrop: { slot: 'robe', tier: 2 }, exp: 16 }, text: '먼지 아래에서 쓸 만한 것을 하나 건졌다.' },
        fail: { effect: {}, text: '전부 부서지거나 썩어 있었다.' },
        fumble: { effect: { hp: -10 }, text: '더미가 무너졌다. 빠져나오는 데 한참 걸렸다.' },
      },
    },
    { label: '나온다', gain: 1, effect: {}, resultText: '문을 닫자 벽만 남았다. 다시 지나가도 문은 생기지 않았다.' },
  ],
},

};
