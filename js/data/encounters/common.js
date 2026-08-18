/* ===================== 인카운터 · 일상 =====================
 * 수업 · 복도 · 식사 · 기숙사. 진행도 초반의 주력 풀.
 * 여기서 주문을 배우고 사람을 명부에 올린다. */

const ENCOUNTERS_COMMON = {

class_charms: {
  id: 'class_charms', pool: 'common', weight: 22, progress: [0, 80], repeatable: true, gain: 1,
  text:
`플리트윅 교수의 교실은 늘 조금 시끄럽다. 깃털이 날고, 찻잔이 굴러다니고, 누군가의 지팡이에서 연기가 난다.

"오늘은 손목입니다!" 교수가 책 더미 위에서 외쳤다. "팔이 아니라 손목! 팔로 하려니까 다들 어깨가 아픈 거예요!"

영운은 지팡이를 고쳐 쥐었다. 손목만 쓰는 건 생각보다 어려웠다.`,
  choices: [
    {
      label: '교수의 말대로 손목만 써본다',
      check: { stat: 'intelligence', dc: 8 },
      outcomes: {
        critical: { effect: { learnSubject: 'charms', intelligence: 1 }, text: '세 번째 시도에서 손목이 알아서 움직였다. 깃털이 정확히 한 뼘 떠올라 멈췄다. 플리트윅이 손뼉을 쳤다.' },
        success: { effect: { learnSubject: 'charms' }, text: '깃털이 떠올랐다. 삐뚤빼뚤했지만 떠오르긴 했다.' },
        fail: { effect: { practice: 'charms' }, text: '깃털은 꿈쩍도 하지 않았다. 옆자리 애 것은 천장에 붙었다. 그래도 한 시간 내내 손목을 돌렸다.' },
        fumble: { effect: { hp: -3 }, text: '손목을 너무 세게 꺾었다. 지팡이 끝에서 불꽃이 튀어 소맷자락이 그을렸다.' },
      },
    },
    {
      label: '앞자리 학생이 하는 걸 관찰한다',
      check: { stat: 'agility', dc: 4 },
      outcomes: {
        critical: { effect: { learnSubject: 'charms', agility: 1 }, text: '앞자리 학생의 손이 어느 각도에서 멈추는지 보였다. 따라 하니 한 번에 됐다.' },
        success: { effect: { learnSubject: 'charms' }, text: '손목이 꺾이는 각도가 보였다. 흉내 내니 어설프게나마 됐다.' },
        fail: { effect: { practice: 'charms' }, text: '너무 빨라서 보이지 않았다. 대신 혼자 손목만 계속 돌려봤다.' },
        fumble: { effect: {}, text: '너무 빤히 보다가 눈이 마주쳤다. 그쪽이 몸을 돌려 가렸다.' },
      },
    },
    { label: '창밖을 본다', gain: 1, effect: {}, resultText: '호수 위로 안개가 걷히고 있었다. 수업이 끝날 때까지 영운은 그쪽만 봤다. 배운 건 없었지만 나쁘지 않은 시간이었다.' },
  ],
},

class_dada: {
  id: 'class_dada', pool: 'common', weight: 22, progress: [0, 80], repeatable: true, gain: 1,
  text:
`어둠의 마법 방어술 교실은 창을 다 열어놔도 어딘가 답답하다.

오늘은 방어막이었다. 둘씩 짝을 지어 한 명이 약한 충격 주문을 쏘고, 한 명이 막는다.

"막는 건 힘이 아닙니다." 교수가 말했다. "타이밍입니다. 늦으면 못 막고, 이르면 풀립니다."`,
  choices: [
    {
      label: '타이밍에 집중한다',
      check: { stat: 'intelligence', dc: 8 },
      outcomes: {
        critical: { effect: { learnSubject: 'dada', intelligence: 1 }, text: '상대의 어깨가 움직이는 순간에 맞춰 막았다. 충격이 손목까지 오지 않고 앞에서 멎었다.' },
        success: { effect: { learnSubject: 'dada' }, text: '두 번은 늦었고 세 번째에 맞았다. 교수가 고개를 끄덕였다.' },
        fail: { effect: { hp: -3, practice: 'dada' }, text: '계속 늦었다. 어깨에 여러 번 맞아 얼얼했다. 늦는 만큼은 배웠다.' },
        fumble: { effect: { hp: -6 }, text: '너무 이르게 펼쳐 방어막이 먼저 풀렸다. 그대로 맞고 뒤로 넘어졌다.' },
      },
    },
    {
      label: '아예 피하는 쪽을 연습한다',
      check: { stat: 'agility', dc: 8 },
      outcomes: {
        critical: { effect: { agility: 2, exp: 12 }, text: '막지 않고 옆으로 흘렸다. 교수가 눈썹을 올렸다. "그것도 방어입니다. 시험에는 안 나오지만."' },
        success: { effect: { learnSubject: 'dada', agility: 1 }, text: '몇 번은 피했다. 교수가 지나가며 한마디 했다. "막는 것도 배우세요." 그러고는 손목을 잡아 각도를 고쳐줬다.' },
        fail: { effect: { hp: -3, practice: 'dada' }, text: '피하려다 발이 엉켰다. 그래도 몇 번은 몸이 먼저 움직였다.' },
        fumble: { effect: { hp: -6 }, text: '피한다는 게 옆 조 쪽으로 들어갔다. 남의 주문까지 맞았다.' },
      },
    },
  ],
},

class_potions: {
  id: 'class_potions', pool: 'common', weight: 20, progress: [0, 80], repeatable: true, gain: 1,
  text:
`지하 교실은 늘 서늘하다. 솥에서 오르는 김만 따뜻하다.

오늘 것은 상처를 아물게 하는 약이었다. 재료는 여덟 가지, 넣는 순서가 정해져 있고, 젓는 방향이 중간에 바뀐다.

영운은 칠판을 두 번 확인했다.`,
  choices: [
    {
      label: '순서를 정확히 지킨다',
      check: { stat: 'intelligence', dc: 8 },
      outcomes: {
        critical: { effect: { learnSubject: 'potions', item: 'healPotion', intelligence: 1 }, text: '약이 정확히 은빛으로 가라앉았다. 교수가 한 병 덜어 가져가라고 했다.' },
        success: { effect: { learnSubject: 'potions' }, text: '색은 조금 탁했지만 굳지는 않았다.' },
        fail: { effect: { practice: 'potions' }, text: '중간에 젓는 방향을 놓쳤다. 약이 회색으로 굳어버렸다. 어디서 틀렸는지는 알 것 같았다.' },
        fumble: { effect: { hp: -4 }, text: '솥이 끓어 넘쳤다. 손등에 튀어 물집이 잡혔다.' },
      },
    },
    {
      label: '옆자리와 재료를 나눠 쓴다',
      check: { stat: 'charm', dc: 4 },
      outcomes: {
        critical: { effect: { learnSubject: 'potions', charm: 1, exp: 10 }, text: '옆자리 학생이 자기 몫의 좋은 뿌리를 나눠줬다. 덕분에 약이 제대로 나왔고, 이야기도 좀 했다.' },
        success: { effect: { learnSubject: 'potions', charm: 1 }, text: '재료를 나눠 쓰며 몇 마디 주고받았다. 덕분에 약도 그럭저럭 나왔다.' },
        fail: { effect: { practice: 'potions' }, text: '말을 걸었지만 상대가 바빴다. 혼자 순서를 두 번 더 외웠다.' },
        fumble: { effect: {}, text: '건네받다가 뿌리를 바닥에 떨어뜨렸다. 둘 다 망쳤다.' },
      },
    },
  ],
},

class_transfiguration: {
  id: 'class_transfiguration', pool: 'common', weight: 20, progress: [0, 80], repeatable: true, gain: 1,
  text:
`변신술 교실 책상마다 성냥이 한 개비씩 놓여 있었다.

"바늘로." 교수가 말했다. "오늘 안에 안 되면 내일도 성냥입니다."

영운은 성냥을 오래 봤다. 이걸 바늘이라고 생각해야 하는 건지, 바늘이 되라고 시켜야 하는 건지 아직 감이 안 왔다.`,
  choices: [
    {
      label: '성냥을 바늘이라고 믿어본다',
      check: { stat: 'intelligence', dc: 8 },
      outcomes: {
        critical: { effect: { learnSubject: 'transfiguration', intelligence: 1 }, text: '끝이 뾰족해지고 색이 은빛으로 돌았다. 완전한 바늘은 아니었지만 찌르면 아플 정도는 됐다.' },
        success: { effect: { learnSubject: 'transfiguration' }, text: '성냥 끝이 조금 뾰족해졌다. 교수가 지나가며 "됐습니다" 하고 말했다.' },
        fail: { effect: { practice: 'transfiguration' }, text: '성냥은 성냥이었다. 한 시간 내내 성냥이었다. 노려보기라도 했다.' },
        fumble: { effect: { hp: -3 }, text: '성냥에 불이 붙었다. 손가락을 데었다.' },
      },
    },
    {
      label: '옆자리에게 요령을 묻는다',
      check: { stat: 'charm', dc: 4 },
      outcomes: {
        critical: { effect: { learnSubject: 'transfiguration', charm: 1 }, text: '"믿는 게 아니라 기억하는 거래." 옆자리가 말했다. "원래 바늘이었던 걸로." 그 말이 이상하게 맞았다.' },
        success: { effect: { learnSubject: 'transfiguration' }, text: '요령을 몇 가지 들었다. 세 번째 시도에서 끝이 뾰족해졌다.' },
        fail: { effect: { practice: 'transfiguration' }, text: '"나도 몰라." 옆자리도 성냥을 노려보고 있었다. 둘이 같이 한참 노려봤다.' },
        fumble: { effect: {}, text: '떠들다가 교수와 눈이 마주쳤다.' },
      },
    },
  ],
},

hall_breakfast: {
  id: 'hall_breakfast', pool: 'common', weight: 12, progress: [0, 100], repeatable: true, gain: 1,
  text:
`아침 식사. 천장에는 오늘도 구름이 낮게 깔려 있다.

부엉이들이 우편을 떨어뜨리고 지나갔다. 영운 앞에는 아무것도 떨어지지 않았다. 편입생에게 편지를 보낼 사람은 아직 별로 없다.

토스트를 두 장 먹고, 홍차를 한 잔 마셨다.`,
  choices: [
    { label: '든든히 먹어둔다', effect: { hp: 12 }, resultText: '접시를 비웠다. 배가 부르니 조금 나았다.' },
    {
      label: '옆 테이블 이야기에 귀를 기울인다',
      check: { stat: 'charm', dc: 8 },
      outcomes: {
        critical: { effect: { charm: 1, exp: 14 }, text: '누가 어젯밤 복도에서 이상한 걸 봤다고 했다. 다른 애가 헛것이라고 했고, 첫 번째 애가 정색했다. "헛것이면 왜 내가 그 자리를 기억 못 해?"' },
        success: { effect: { exp: 8 }, text: '요즘 성 안이 좀 이상하다는 이야기가 오갔다. 구체적인 건 없었다.' },
        fail: { effect: {}, text: '시끄러워서 잘 들리지 않았다.' },
        fumble: { effect: {}, text: '너무 몸을 기울여서 눈치를 챘다. 그쪽이 목소리를 낮췄다.' },
      },
    },
  ],
},

corridor_moving_stairs: {
  id: 'corridor_moving_stairs', pool: 'common', weight: 10, progress: [0, 100], repeatable: true, gain: 1,
  text:
`계단이 움직였다.

가려던 곳과 다른 데로 붙었다. 여기 학생들은 이런 일에 익숙해서 그냥 내려서 다른 길로 간다. 영운은 아직 익숙하지 않다.

붙은 곳은 처음 보는 복도였다.`,
  choices: [
    {
      label: '이왕 온 김에 둘러본다',
      check: { stat: 'agility', dc: 8 },
      outcomes: {
        critical: { effect: { equipDrop: { slot: 'accessory', tier: 1 }, agility: 1 }, text: '벽감 안쪽에 누군가 두고 간 것이 있었다. 먼지가 두껍게 앉은 걸로 봐서 오래된 물건이었다.' },
        success: { effect: { gold: 8 }, text: '창틀 아래에서 갈레온 몇 닢을 주웠다. 떨어뜨린 사람은 오래전에 잊었을 것이다.' },
        fail: { effect: {}, text: '한 바퀴 돌았지만 아무것도 없었다. 돌아 나오는 데 시간이 좀 걸렸다.' },
        fumble: { effect: { hp: -4 }, text: '가짜 계단을 밟았다. 무릎까지 빠져서 한참을 낑낑댔다.' },
      },
    },
    { label: '기다렸다가 제 길로 간다', effect: {}, resultText: '계단이 다시 움직일 때까지 난간에 기대 기다렸다. 이 성은 서두르는 사람에게 친절하지 않다.' },
  ],
},

dorm_night: {
  id: 'dorm_night', pool: 'common', weight: 10, progress: [0, 100], repeatable: true, gain: 1,
  text:
`소등 후. 침대 커튼 안에서 지팡이 끝에 불을 켰다.

명부를 펼쳤다. 이름이 몇 개 적혀 있다. 오늘 만난 사람, 어제 만난 사람, 그리고 언제 적었는지 기억나지 않는 것 하나.

밖에서 누군가 뒤척이는 소리가 났다.`,
  choices: [
    { label: '명부를 처음부터 읽어본다', effect: { exp: 10 }, resultText: '한 줄씩 소리 없이 읽었다. 다 읽고 나니 조금 안심이 됐다. 다 읽을 수 있었으니까.' },
    { label: '그냥 잔다', effect: { hp: 15, mp: 10 }, resultText: '불을 껐다. 오늘은 아무 꿈도 꾸지 않았다.' },
    {
      label: '잠들지 않고 복도 소리를 듣는다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 20 }, text: '발소리가 지나갔다. 한 사람 것치고는 규칙이 이상했다 — 걷다가, 멈추고, 아주 오래 있다가, 다시 걷는다. 뭔가를 세고 있는 것 같았다.' },
        success: { effect: { exp: 10 }, text: '발소리가 복도 끝에서 한참 멈춰 있다가 사라졌다.' },
        fail: { effect: { hp: -3 }, text: '아무 소리도 나지 않았다. 잠만 설쳤다.' },
        fumble: { effect: { hp: -6 }, text: '한숨도 못 잤다. 아침에 눈이 뻑뻑했다.' },
      },
    },
  ],
},

meet_albus: {
  id: 'meet_albus', pool: 'common', weight: 12, progress: [0, 60], gain: 2, registers: ['albus'],
  text:
`도서관 구석 자리에 슬리데린 학생이 혼자 앉아 있었다.

{{albus}}. 이름은 들어봤다. 여기서는 그 성을 모르는 사람이 없다.

책은 펼쳐져 있는데 넘어간 흔적이 없었다. 한참을 같은 쪽만 보고 있었던 것 같다.

영운이 지나가자 그가 고개를 들었다.`,
  choices: [
    {
      label: '옆에 앉는다',
      check: { stat: 'charm', dc: 8, about: 'albus' },
      outcomes: {
        critical: { effect: { charm: 1, exp: 18 }, text: '"편입생?" 그가 물었다. 영운이 끄덕이자 그가 조금 웃었다. "좋겠다."\n\n"뭐가요."\n\n"아무도 네 아버지 얘기 안 하잖아."' },
        success: { effect: { exp: 10 }, text: '둘은 별말 없이 나란히 앉아 있었다. 그것도 나쁘지 않았다.' },
        fail: { effect: {}, text: '그가 책을 덮고 일어섰다. "먼저 갈게."' },
        fumble: { effect: {}, text: '영운이 앉으려는데 의자가 크게 끌리는 소리를 냈다. 사서가 쳐다봤고, 그가 조용히 자리를 옮겼다.' },
      },
    },
    { label: '그냥 지나간다', effect: {}, resultText: '영운은 지나갔다. 뒤에서 책장 넘어가는 소리가 났다. 한 장.' },
  ],
},

meet_rose: {
  id: 'meet_rose', pool: 'common', weight: 12, progress: [0, 60], gain: 2, registers: ['rose'],
  text:
`복도에서 누가 영운을 불러 세웠다.

{{rose}}. 그리핀도르, 6학년. 말이 빠르고 결론부터 말하는 편이다.

"너 편입생이지. 잘됐다."

"…뭐가요?"

"넌 여기 원래 어땠는지 모르잖아. 그러니까 뭐가 이상한지 물어보기 좋아."`,
  choices: [
    {
      label: '"뭐가 이상한데요?"',
      check: { stat: 'charm', dc: 8, about: 'rose' },
      outcomes: {
        critical: { effect: { charm: 1, exp: 18, flag: 'roseTip' }, text: '"작년 반 명단이랑 올해 걸 비교해봤는데." 로즈가 목소리를 낮췄다. "숫자가 안 맞아. 그런데 누가 없어졌는지를 못 짚겠어. 그게 말이 돼?"' },
        success: { effect: { exp: 10, flag: 'roseTip' }, text: '"숫자가 안 맞아." 로즈가 말했다. "그것만 알아둬."' },
        fail: { effect: {}, text: '로즈가 말하려다 말았다. "…아냐. 나중에."' },
        fumble: { effect: {}, text: '지나가던 교수가 둘을 흘끗 봤다. 로즈가 화제를 돌렸다.' },
      },
    },
    { label: '"저는 잘 모르겠는데요"', effect: {}, resultText: '"그렇겠지." 로즈가 어깨를 으쓱했다. "근데 모르는 게 나을 수도 있고."\n\n그러고는 가버렸다. 걸음이 빨랐다.' },
  ],
},

rest_courtyard: {
  id: 'rest_courtyard', pool: 'common', weight: 8, progress: [0, 100], repeatable: true, gain: 2,
  text:
`안뜰 회랑에 앉았다.

여기는 바람이 통해서 겨울에는 춥고 지금은 딱 좋다. 학생 몇이 지나가고, 고양이 한 마리가 기둥 사이를 지나갔다.

아무 일도 일어나지 않는 시간이 하루에 얼마 없다.`,
  choices: [
    { label: '한참 앉아 있는다', effect: { hp: 15, mp: 8 }, resultText: '아무것도 하지 않았다. 해가 기울 때까지 앉아 있다가 일어섰다. 몸이 조금 가벼워졌다.' },
    { label: '명부를 정리한다', effect: { exp: 12 }, resultText: '적어둔 것을 다시 옮겨 적었다. 손으로 쓰는 동안에는 잊히지 않는 것 같았다. 근거는 없었지만 그런 기분이 들었다.' },
  ],
},

};
