/* ===================== 인카운터 · 일상 =====================
 * 수업 · 복도 · 식사 · 기숙사. 진행도 초반의 주력 풀.
 * 여기서 주문을 배우고 사람을 명부에 올린다. */

const ENCOUNTERS_COMMON = {

class_charms: {
  id: 'class_charms', pool: 'common', kind: 'class', weight: 22, progress: [0, 80], repeatable: true, gain: 1,
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
  id: 'class_dada', pool: 'common', kind: 'class', weight: 22, progress: [0, 80], repeatable: true, gain: 1,
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
  id: 'class_potions', pool: 'common', kind: 'class', weight: 20, progress: [0, 80], repeatable: true, gain: 1,
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
  id: 'class_transfiguration', pool: 'common', kind: 'class', weight: 20, progress: [0, 80], repeatable: true, gain: 1,
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


/* ══════════ 호그스미드 · 상점 ══════════
 * 갈레온의 유일한 출구. 이게 없으면 전리품이 숫자로만 쌓인다. */

hogsmeade_honeydukes: {
  id: 'hogsmeade_honeydukes', pool: 'common', weight: 14, progress: [10, 100], repeatable: true, gain: 2,
  text:
`호그스미드 주말. 허니듀크스는 사람이 너무 많아서 계산대까지 가는 데만 한참 걸린다.

설탕 깃털, 초콜릿 개구리, 산성 사탕. 천장에 매달린 유리병에서 뭔가가 계속 색을 바꾸고 있다.

안쪽 선반에는 약이 있다. 달지 않은 쪽.`,
  choices: [
    { label: '회복 물약을 산다  (15G)', requiresGold: 15, effect: { gold: -15, item: 'healPotion' },
      resultText: '점원이 종이에 싸서 건넸다. 주머니에 넣으니 묵직했다.' },
    { label: '초콜릿 개구리를 산다  (6G)', requiresGold: 6, effect: { gold: -6, item: 'chocolateFrog' },
      resultText: '개구리가 손에서 한 번 뛰고 얌전해졌다. 디멘터를 만난 뒤에 좋다고들 한다.' },
    { label: '마나 물약을 산다  (18G)', requiresGold: 18, effect: { gold: -18, item: 'manaPotion' },
      resultText: '병 안쪽에 푸른 것이 천천히 돌고 있었다.' },
    { label: '마법석을 산다  (20G)', requiresGold: 20, effect: { gold: -20, item: 'magicStone' },
      resultText: '장비를 손보는 데 쓰는 결정석이다. 점원이 "깨먹어도 환불 안 됩니다" 하고 말했다.' },
    { label: '뒷방에서 파는 것을 본다  (150G)', requiresGold: 150, notFlag: 'hasMap',
      effect: { gold: -150, item: 'marauderMap', flag: 'hasMap' },
      resultText: '점원이 뒷방으로 데려갔다. 낡은 양피지 한 장. "장난은 시작된다고 말해보세요."\n\n말했더니 선이 돋아났다. 성 전체가, 그 안의 이름들이 전부.' },
    { label: '구경만 하고 나온다', gain: 1, effect: { hp: 6 },
      resultText: '아무것도 안 샀다. 사람 많은 데를 한 바퀴 돌고 나오니 이상하게 기분이 나아졌다.' },
  ],
},

hogsmeade_ollivander: {
  id: 'hogsmeade_ollivander', pool: 'common', weight: 10, progress: [20, 100], repeatable: true, gain: 2,
  text:
`올리밴더 분점은 좁고 먼지가 많다. 상자가 천장까지 쌓여 있고, 사다리는 혼자 움직인다.

"지팡이를 고치러 왔나, 바꾸러 왔나."

노인이 안경 너머로 봤다. 대답을 기다리는 것 같지도 않았다.

"둘 다 아니면 재료를 보고 가게."`,
  choices: [
    { label: '주문서를 뒤져본다  (70G)', requiresGold: 70,
      effect: { gold: -70, item: 'scrollStupefy' },
      resultText: '상자 밑에서 낡은 양피지를 하나 꺼내줬다. "읽을 수 있으면 자네 거야."' },
    { label: '지팡이를 하나 본다  (140G)', requiresGold: 140,
      effect: { gold: -140, equipDrop: { slot: 'wand', tier: 2 } },
      resultText: '몇 개를 쥐어봤다. 세 번째 것이 손에서 조금 따뜻해졌다.' },
    { label: '로브를 본다  (130G)', requiresGold: 130,
      effect: { gold: -130, equipDrop: { slot: 'robe', tier: 2 } },
      resultText: '두꺼운 천이 팔에 묵직하게 걸렸다. 이런 건 맞고 나서야 값을 안다.' },
    {
      label: '재료를 만져본다',
      check: { stat: 'luck', dc: 8 },
      gain: 1,
      outcomes: {
        critical: { effect: { equipDrop: { slot: 'accessory', tier: 2 }, luck: 1 },
          text: '상자 하나에 손이 갔다. 노인이 눈썹을 올렸다. "그건 십 년째 아무도 안 집었는데." 안에 있던 것을 그냥 줬다.' },
        success: { effect: { item: 'magicStone' },
          text: '깨진 결정 조각 하나를 얻었다. "쓸 데는 있을 거야."' },
        fail: { effect: {}, text: '아무것도 반응하지 않았다. 노인이 다시 장부로 눈을 돌렸다.' },
        fumble: { effect: { hp: -4 }, text: '상자 더미를 건드렸다. 절반이 무너져 발등을 찍었다.' },
      },
    },
    { label: '그냥 나온다', gain: 1, effect: {}, resultText: '문을 열자 종이 울렸다. 노인은 고개를 들지 않았다.' },
  ],
},

hogsmeade_threebroomsticks: {
  id: 'hogsmeade_threebroomsticks', pool: 'common', weight: 12, progress: [10, 100], repeatable: true, gain: 2,
  registers: ['rose'],
  text:
`세 자루 빗자루는 늘 김이 서려 있다.

{{rose}}가 창가 자리를 잡아뒀다. 버터맥주 두 잔이 벌써 나와 있었다.

"앉아. 나 물어볼 거 있어."`,
  choices: [
    {
      label: '앉아서 듣는다',
      check: { stat: 'charm', dc: 8, about: 'rose' },
      outcomes: {
        critical: { effect: { charm: 1, hp: 12, exp: 24, flag: 'roseTip' },
          text: '"너 명부 같은 거 쓰지." {{rose}}가 잔을 밀어줬다. "나도 써. 근데 내 건 자꾸 틀려."\n\n"틀린다니?"\n\n"어제 적은 게 오늘 보면 다른 이름이야. 글씨는 내 건데."' },
        success: { effect: { hp: 10, exp: 12 },
          text: '한참 이야기했다. 별 소득은 없었지만 따뜻했다.' },
        fail: { effect: { hp: 8 },
          text: '{{rose}}가 무슨 말을 하려다 말았다. "…아냐. 다음에."' },
        fumble: { effect: { hp: 4 },
          text: '엉뚱한 대답을 했다. {{rose}}가 웃고 화제를 돌렸다.' },
      },
    },
    { label: '버터맥주만 마신다', gain: 1, effect: { hp: 14 }, resultText: '뜨겁고 달았다. 창밖에는 눈이 오기 시작했다.' },
  ],
},

/* ══════════ 그 밖의 일상 ══════════ */

owlery_letter: {
  id: 'owlery_letter', pool: 'common', weight: 10, progress: [0, 100], repeatable: true, gain: 1,
  text:
`부엉이장은 춥고 냄새가 난다. 바닥이 온통 깃털과 뼈다.

집에 편지를 쓰려고 올라왔는데, 막상 깃펜을 들자 쓸 말이 없었다.

잘 지내요. 그리고?`,
  choices: [
    {
      label: '명부에 적어둔 것을 그대로 옮겨 쓴다',
      effect: { exp: 14 },
      resultText:
`영운은 오늘 본 것을 적었다. 빈자리, 매끄러운 돌, 초점이 미끄러지는 이름.

다 쓰고 나서 읽어보니 미친 사람이 쓴 것 같았다. 그래도 보냈다.

손으로 쓴 건 남으니까.`,
    },
    { label: '잘 지낸다고만 쓴다', gain: 1, effect: { hp: 6 }, resultText: '세 줄을 썼다. 부엉이가 발목을 내밀었다.' },
    {
      label: '부엉이들을 구경한다',
      check: { stat: 'charm', dc: 4 },
      outcomes: {
        critical: { effect: { charm: 1, item: 'chocolateFrog' }, text: '가장 늙은 부엉이가 어깨에 내려앉았다. 한참 있다가 갔다. 자리에 초콜릿 개구리가 하나 떨어져 있었다. 어디서 났는지는 모르겠다.' },
        success: { effect: { hp: 8 }, text: '털을 고르는 걸 한참 봤다. 나쁘지 않은 시간이었다.' },
        fail: { effect: {}, text: '전부 자고 있었다.' },
        fumble: { effect: { hp: -3 }, text: '한 마리가 손등을 쪼았다. 피가 났다.' },
      },
    },
  ],
},

greenhouse_class: {
  id: 'greenhouse_class', pool: 'common', weight: 12, progress: [0, 90], repeatable: true, gain: 1,
  registers: ['neville'],
  text:
`온실 3호. 유리에 물방울이 맺혀 밖이 안 보인다.

{{neville}} 교수가 화분을 하나씩 나눠줬다. 안에서 뭔가 규칙적으로 움직이고 있었다.

"귀마개 하세요. 이건 아직 어려서 안 죽습니다. 그래도 기절은 합니다."`,
  choices: [
    {
      label: '시키는 대로 뽑는다',
      check: { stat: 'courage', dc: 8 },
      outcomes: {
        critical: { effect: { courage: 1, item: 'healPotion', exp: 22 }, text: '한 번에 뽑아 새 화분에 옮겼다. 교수가 다가와 "손이 좋네요" 하고는 여분의 약을 한 병 줬다.' },
        success: { effect: { exp: 12 }, text: '비명이 들렸지만 귀마개 덕에 견딜 만했다. 뿌리가 발버둥 쳤다.' },
        fail: { effect: { hp: -4 }, text: '귀마개가 한쪽으로 밀렸다. 반쯤 들은 비명에 한참 어지러웠다.' },
        fumble: { effect: { hp: -8 }, text: '화분을 놓쳤다. 온실 절반이 아수라장이 됐다.' },
      },
    },
    {
      label: '교수에게 옛날 이야기를 묻는다',
      check: { stat: 'charm', dc: 12 },
      outcomes: {
        critical: { effect: { charm: 1, exp: 30, flag: 'nevilleTalk' },
          text: '"그해 5월에요." 교수가 화분을 내려놓았다. "여기 이 자리에 다 뉘였어요. 온실이 제일 따뜻했으니까."\n\n한참 있다가 덧붙였다.\n\n"몇 명이었는지는… 이상하게 매번 다르게 기억나요."' },
        success: { effect: { exp: 16 }, text: '"오래된 얘긴데." 교수가 웃었다. "지금 학생들은 잘 안 물어봐요."' },
        fail: { effect: {}, text: '교수가 화제를 돌렸다. 흙 이야기를 한참 들었다.' },
        fumble: { effect: {}, text: '수업 중에 물을 게 아니었다. 교수가 곤란해했다.' },
      },
    },
  ],
},

quidditch_match: {
  id: 'quidditch_match', pool: 'common', weight: 10, progress: [10, 90], gain: 2,
  text:
`관중석은 발 디딜 틈이 없다. 목도리와 깃발과 고함.

경기는 이미 30분째다. 스니치는 아직 안 나왔다.

영운은 경기를 보다가 관중석 쪽으로 눈을 돌렸다. 한 구역이 이상하게 헐렁했다. 만석인데 그 줄만 사람 사이가 벌어져 있다.`,
  choices: [
    {
      label: '경기에 집중한다',
      check: { stat: 'agility', dc: 4 },
      outcomes: {
        critical: { effect: { agility: 1, exp: 20, gold: 15 }, text: '누가 옆에서 내기를 걸었고, 영운이 고른 쪽이 이겼다. 갈레온 몇 닢이 손에 쥐어졌다.' },
        success: { effect: { hp: 10, exp: 10 }, text: '오랜만에 아무 생각 없이 두 시간을 보냈다.' },
        fail: { effect: {}, text: '너무 시끄러워서 두통이 왔다.' },
        fumble: { effect: { hp: -4 }, text: '난간에서 밀렸다. 아래 줄 사람 위로 넘어졌다.' },
      },
    },
    {
      label: '헐렁한 줄을 세어본다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 34, flag: 'countMismatch' }, text: '좌석은 스물, 앉은 사람은 열아홉. 그런데 아무도 자리를 옮겨 앉지 않는다. 빈자리 양옆 두 사람이 서로에게 몸을 기울인 채 앉아 있었다. 한참을.' },
        success: { effect: { exp: 16 }, text: '한 자리가 비어 있는데 아무도 그리로 옮기지 않았다.' },
        fail: { effect: {}, text: '세다가 놓쳤다. 사람이 계속 움직였다.' },
        fumble: { effect: { hp: -3 }, text: '뭘 세고 있었는지 잊었다. 그 사이 골이 두 번 들어갔다.' },
      },
    },
  ],
},

library_late: {
  id: 'library_late', pool: 'common', weight: 12, progress: [0, 100], repeatable: true, gain: 1,
  text:
`도서관 폐관 30분 전. 사서가 등을 하나씩 끄며 지나간다.

읽던 책의 여백에 누가 연필로 뭘 적어놨다. 오래된 글씨다.

*"3층 서가 뒤쪽, 창문 밑."*`,
  choices: [
    {
      label: '적힌 곳에 가본다',
      check: { stat: 'agility', dc: 8 },
      outcomes: {
        critical: { effect: { agility: 1, item: 'oldDiary', exp: 24 }, text: '창틀 아래 벽돌 하나가 헐거웠다. 안에 낡은 공책이 있었다. 누가 언제 넣었는지는 알 수 없었다.' },
        success: { effect: { gold: 12, exp: 10 }, text: '먼지 속에서 갈레온 몇 닢과 말라붙은 사탕을 찾았다.' },
        fail: { effect: {}, text: '아무것도 없었다. 사서에게 걸려 쫓겨났다.' },
        fumble: { effect: { hp: -4 }, text: '서가에 어깨를 부딪혀 책이 쏟아졌다. 정리하는 데 한 시간이 걸렸다.' },
      },
    },
    {
      label: '자습을 마저 한다',
      check: { stat: 'intelligence', dc: 4 },
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 20 }, text: '집중이 잘 되는 날이었다. 두 시간이 이십 분처럼 지났다.' },
        success: { effect: { exp: 10 }, text: '진도를 조금 나갔다.' },
        fail: { effect: {}, text: '같은 문단을 네 번 읽었다.' },
        fumble: { effect: { hp: -3 }, text: '책상에 엎드려 잤다. 사서가 깨웠을 때는 목이 굳어 있었다.' },
      },
    },
    { label: '나간다', gain: 1, effect: { hp: 6 }, resultText: '등이 하나씩 꺼졌다. 마지막 등이 꺼지기 전에 나왔다.' },
  ],
},

common_room_night: {
  id: 'common_room_night', pool: 'common', weight: 12, progress: [0, 100], repeatable: true, gain: 1,
  registers: ['scorpius'],
  text:
`휴게실 벽난로. 다들 자러 가고 둘만 남았다.

{{scorpius}}가 불 앞에 앉아 있었다. 책을 들고 있었지만 읽는 것 같지는 않았다.

"안 자?"

"자야죠." 그가 말했다. 그러고는 안 갔다.`,
  choices: [
    {
      label: '옆에 앉는다',
      check: { stat: 'charm', dc: 8, about: 'scorpius' },
      outcomes: {
        critical: { effect: { charm: 1, hp: 12, exp: 24 },
          text: '"저는요." 한참 뒤에 그가 말했다. "사람들이 저를 잊어버리면 좀 편할 것 같다고 생각한 적이 있어요."\n\n"…지금도 그래?"\n\n"아뇨." 그가 불을 봤다. "요즘은 그게 무섭습니다."' },
        success: { effect: { hp: 10, exp: 12 }, text: '둘 다 별말 없이 불만 봤다. 장작이 두 번 무너졌다.' },
        fail: { effect: { hp: 6 }, text: '그가 곧 일어나 갔다. "먼저 자겠습니다."' },
        fumble: { effect: {}, text: '말을 잘못 골랐다. 그가 지나치게 공손하게 사과하고 자리를 떴다.' },
      },
    },
    { label: '그냥 자러 간다', effect: { hp: 15, mp: 10 }, resultText: '계단을 올라가다 돌아봤다. 그는 아직 앉아 있었다.' },
  ],
},

duel_club: {
  id: 'duel_club', pool: 'common', weight: 14, progress: [10, 100], repeatable: true, gain: 2,
  text:
`결투 동아리. 대연회장 식탁을 치우고 긴 단을 놓았다.

"규칙은 하나입니다." 플리트윅이 말했다. "상대를 다치게 하지 마세요. 그 외에는 뭘 써도 됩니다."

영운의 차례가 왔다.`,
  choices: [
    {
      label: '배운 주문을 실전에서 써본다',
      check: { stat: 'intelligence', dc: 8 },
      outcomes: {
        critical: { effect: { practice: 'charms', practiceAmount: 25, intelligence: 1, exp: 26 },
          text: '세 합 만에 상대 지팡이가 날아갔다. 손이 저절로 움직였다 — 수업에서 백 번 한 동작이 처음으로 몸에서 나왔다.' },
        success: { effect: { practice: 'charms', practiceAmount: 18, exp: 14 },
          text: '한 번 맞고 한 번 맞혔다. 무승부로 끝났지만 손에 남는 게 있었다.' },
        fail: { effect: { hp: -5 }, text: '먼저 맞았다. 단 아래로 굴러떨어졌다.' },
        fumble: { effect: { hp: -10 }, text: '주문이 엉뚱한 데로 나갔다. 심판이 경기를 멈췄다.' },
      },
    },
    {
      label: '방어만 연습한다',
      check: { stat: 'agility', dc: 8 },
      outcomes: {
        critical: { effect: { practice: 'dada', practiceAmount: 25, agility: 1, exp: 26 }, text: '한 대도 안 맞았다. 상대가 지쳐서 먼저 손을 들었다.' },
        success: { effect: { practice: 'dada', practiceAmount: 18, exp: 14 }, text: '거의 다 막았다. 막는 감각이 조금 붙었다.' },
        fail: { effect: { hp: -5 }, text: '방어막이 늦었다. 어깨에 여러 번 맞았다.' },
        fumble: { effect: { hp: -10 }, text: '막는다는 게 눈을 감아버렸다.' },
      },
    },
    { label: '구경만 한다', gain: 1, effect: { exp: 8 }, resultText: '남들이 하는 걸 봤다. 이기는 쪽은 대개 먼저 움직이지 않는 쪽이었다.' },
  ],
},

detention_trophy: {
  id: 'detention_trophy', pool: 'common', weight: 10, progress: [5, 100], gain: 2,
  text:
`벌점을 받았다. 이유는 사소했다.

트로피실 명패를 전부 닦는 것이 오늘 몫이다. 마법 없이, 손으로.

명패에는 이름이 새겨져 있다. 퀴디치 우승, 우수 학생, 특별 공로. 오래된 것부터 새것까지.`,
  choices: [
    {
      label: '이름을 하나씩 읽으며 닦는다',
      check: { stat: 'intelligence', dc: 8, search: true },
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 30, fragment: 2 },
          text: '1943년 우수 학생 명패. 레번클로 칸에 이름이 셋 있어야 하는데 둘만 있었다. 셋째 자리는 광이 나 있었다. 아무것도 안 새겨진 자리인데 누가 계속 닦아온 것처럼.\n\n영운은 그 자리를 오래 닦았다.' },
        success: { effect: { exp: 16 }, text: '오래된 명패 하나가 유독 반들거렸다. 누가 자주 만진 자국이다.' },
        fail: { effect: { hp: -4 }, text: '세 시간 동안 닦기만 했다. 손목이 나갔다.' },
        fumble: { effect: { hp: -8 }, text: '진열장을 넘어뜨렸다. 벌점이 하나 더 늘었다.' },
      },
    },
    { label: '빨리 끝내고 나간다', effect: { hp: -4, exp: 8 }, resultText: '대충 문질러 놓고 나왔다. 관리인이 뒤에서 뭐라고 했지만 못 들은 척했다.' },
  ],
},

snow_first: {
  id: 'snow_first', pool: 'common', weight: 8, progress: [25, 100], gain: 1,
  text:
`첫눈이 왔다.

수업이 하나 취소됐고, 아무도 그걸 아쉬워하지 않았다. 안뜰에서 눈싸움이 벌어졌다.

영운은 회랑 기둥에 기대 그걸 봤다. 발자국이 안뜰을 온통 뒤덮었다.`,
  choices: [
    { label: '끼어든다', effect: { hp: 15, charm: 1, exp: 14 }, resultText: '한참 뛰어다녔다. 목도리를 잃어버렸고 신발이 젖었고, 오랜만에 아무 생각도 안 났다.' },
    {
      label: '발자국을 본다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { intelligence: 1, exp: 32 },
          text: '안뜰 한가운데, 지름 두어 걸음쯤 되는 원 안에만 발자국이 없었다. 사람들이 그 자리를 무의식적으로 비켜 갔다.\n\n눈은 거기도 똑같이 쌓여 있었다.' },
        success: { effect: { exp: 16 }, text: '한 자리만 눈이 그대로였다. 아무도 밟지 않았다.' },
        fail: { effect: { hp: -3 }, text: '한참 서 있다가 손이 곱았다.' },
        fumble: { effect: { hp: -6 }, text: '눈덩이가 뒤통수에 맞았다. 누가 던졌는지도 못 봤다.' },
      },
    },
  ],
},

meet_edith_study: {
  id: 'meet_edith_study', pool: 'common', weight: 12, progress: [0, 70], gain: 2, registers: ['edith'],
  text:
`{{edith}}는 도서관 같은 자리에 늘 앉는다. 3층 창가, 왼쪽에서 두 번째.

오늘도 거기 있었다. 수첩 세 권을 펼쳐놓고 뭔가를 옮겨 적고 있었다.

"왜 세 권이야?"

"하나는 원본, 하나는 사본, 하나는 사본의 사본."`,
  choices: [
    {
      label: '"왜 그렇게까지 해?"',
      check: { stat: 'charm', dc: 8, about: 'edith' },
      outcomes: {
        critical: { effect: { charm: 1, exp: 24, flag: 'edithMethod' },
          text: '"하나만 있으면 그게 맞는지 알 수가 없잖아." 그 애가 세 권을 나란히 놓았다. "세 개가 다 같으면 맞는 거고, 하나만 다르면 그게 틀린 거고."\n\n"셋 다 다르면?"\n\n{{edith}}가 잠깐 조용해졌다. "…그런 적 있어."' },
        success: { effect: { exp: 12 }, text: '"버릇이야." 그 애가 말했다. 별로 버릇처럼 들리지 않았다.' },
        fail: { effect: {}, text: '"그냥." 그 애가 다시 옮겨 적기 시작했다.' },
        fumble: { effect: {}, text: '수첩을 들여다보려다 팔꿈치로 잉크를 엎었다. 한 권이 통째로 번졌다.' },
      },
    },
    {
      label: '같이 옮겨 적어준다',
      effect: { exp: 16, hp: -3 },
      resultText:
`두 시간 동안 말없이 베껴 썼다. 손목이 아팠다.

다 하고 나서 {{edith}}가 말했다. "고마워. 이제 넷이야."`,
    },
  ],
},

exam_week: {
  id: 'exam_week', pool: 'common', weight: 10, progress: [30, 100], gain: 2,
  text:
`시험 주간. 도서관 자리가 없어서 복도 바닥에 앉은 애들까지 있다.

영운도 앉았다. 노트를 폈는데, 첫 장에 적어둔 이름 하나가 눈에 걸렸다.

지금 이걸 외우고 있을 때가 맞나 싶었다.`,
  choices: [
    {
      label: '시험 공부를 한다',
      check: { stat: 'intelligence', dc: 8 },
      outcomes: {
        critical: { effect: { intelligence: 2, exp: 30 }, text: '머리에 잘 들어오는 날이었다. 새벽 두 시까지 앉아 있었고 다음 날 시험이 쉬웠다.' },
        success: { effect: { intelligence: 1, exp: 16 }, text: '외울 건 외웠다.' },
        fail: { effect: { hp: -5 }, text: '밤을 새웠는데 남은 게 없었다.' },
        fumble: { effect: { hp: -10 }, text: '시험장에서 백지를 냈다. 아는 걸 하나도 못 썼다.' },
      },
    },
    {
      label: '노트를 덮고 명부를 편다',
      effect: { exp: 20, alignment: 3 },
      resultText:
`영운은 노트를 덮었다.

성적은 나빠질 것이다. 그건 나중에 만회할 수 있다.

명부를 폈다. 한 줄씩 소리 내어 읽었다. 복도 애들이 이상하게 쳐다봤다.`,
    },
  ],
},

};
