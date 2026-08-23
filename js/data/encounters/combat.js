/* ===================== 인카운터 · 전투 조우 =====================
 * 전투도 에피소드다. 규칙은 다른 풀과 같다.
 *
 *   1. 결과 문장은 한 줄이 아니라 장면이다
 *   2. 앞 단계에서 한 일이 effect.mark로 남고, 뒤 단계가 그걸 읽는다
 *   3. 마지막 단계에는 값이 나가는 것이 있다
 *
 * 전투 풀에만 있는 규칙이 하나 더 있다.
 *
 *   4. 이긴 자리와 진 자리는 같은 장면이 아니다.
 *      choice.branch = { win: n, lose: n, flee: n } 으로 갈라진다.
 *
 * 그리고 전투 인카운터에는 반드시 「물러선다」가 있다.
 * 싸울지 말지가 선택이어야, 준비한 것이 의미를 갖는다. */

const ENCOUNTERS_COMBAT = {

/* ── 픽시 · 3단계 ─────────────────────────────────────────
 * 초반 전투 교재. 이기고 나면 왜 열려 있었는지가 남는다. */
pixie_loose: {
  id: 'pixie_loose', pool: 'combat', weight: 12, progress: [0, 45], repeatable: true, gain: 3,
  text:
`교실 문을 열자마자 뭔가 얼굴 옆을 스쳐 지나갔다.

파란 것 하나. 그리고 또 하나.

누가 픽시 상자를 열어놓고 갔다. 잉크병이 뒤집혀 있고 커튼이 반쯤 뜯겨 있었다. 상자 뚜껑은 부서진 게 아니라 곱게 열려 있었다 — 밖에서.`,
  stages: [
    {
      choices: [
        {
          label: '문틈으로 안을 먼저 살핀다',
          check: { stat: 'intelligence', dc: 8, search: true },
          deepen: true,
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 24, mark: 'counted' }, deepen: true,
              text:
`영운은 문을 반쯤만 열고 세었다.

넷. 다섯. 여섯. 여섯 마리가 천장 근처에서 원을 그리고 있었다.

픽시는 무리를 짓지 않는다. 원을 그리지도 않는다. 저것들은 뭔가를 둘러싸고 있었다 — 아무것도 없는 천장 한가운데를.

영운은 그 자리를 눈에 새겨뒀다.` },
            success: { effect: { exp: 12, mark: 'counted' }, deepen: true,
              text:
`문틈으로 봤다. 대여섯 마리. 전부 천장 근처에 몰려 있다.

바닥에는 한 마리도 없었다. 픽시는 원래 아무 데나 앉는데.` },
            fail: { effect: {}, deepen: true,
              text:
`문틈으로 봤지만 파란 것이 너무 빨리 지나가서 몇 마리인지 세지 못했다.

한 마리일 수도, 열 마리일 수도 있다.` },
            fumble: { effect: { hp: -2 }, deepen: true,
              text:
`문틈에 눈을 대는 순간 반대쪽에서 문을 밀었다.

이마를 찧었다. 안에서 웃음소리 같은 게 났다.` },
          },
        },
        {
          label: '그냥 들어간다',
          effect: {},
          deepen: true,
          resultText:
`영운은 문을 활짝 열고 들어섰다.

파란 것들이 한꺼번에 이쪽을 봤다. 여섯 쌍의 눈이 동시에 돌아가는 건 생각보다 무서운 광경이었다.

등 뒤에서 문이 저절로 닫혔다.` },
        {
          label: '문을 닫고 물러선다',
          check: { stat: 'agility', dc: 8 },
          gain: 1,
          outcomes: {
            critical: { effect: { agility: 1 },
              text:
`문을 닫고 손잡이를 붙들었다. 안쪽에서 뭔가 몇 번 부딪혔고, 그러다 그쳤다.

한참 뒤에 손을 뗐다. 문은 열리지 않았다.

복도를 걸어 나오면서 생각했다. 저 상자를 연 건 픽시가 아니다.` },
            success: { effect: {},
              text: '문을 닫았다. 누군가 나중에 처리할 것이다.\n\n다만 그 "누군가"가 오늘 안에 올 것 같지는 않았다. 이 성에는 아무도 안 오는 교실이 너무 많다.' },
            fail: { effect: { hp: -3 },
              text: '문틈으로 두 마리가 빠져나와 머리카락을 잡아당겼다. 떼어내는 데 한참 걸렸다.' },
            fumble: { effect: { hp: -5 },
              text: '문을 닫다 손가락이 끼었다. 비명을 삼키는 사이 픽시들이 그 틈으로 우르르 나왔다.' },
          },
        },
      ],
    },
    {
      text: (s) => (s.episode && s.episode.counted)
        ? `영운은 세어둔 자리 — 천장 한가운데 — 를 보면서 들어갔다.\n\n파란 것들이 흩어졌다. 흩어진 자리에 정말로 아무것도 없었다.\n\n아무것도 없는 자리를 여섯 마리가 둘러싸고 있었던 것이다.`
        : `파란 것 하나가 얼굴 앞에서 멈췄다.\n\n픽시가 사람 얼굴을 정면으로 보는 일은 드물다. 그것은 영운을 한참 봤다.\n\n그러더니 귀를 잡아당겼다.`,
      choices: [
        { label: '잡는다', combat: 'pixie', branch: { win: 2, lose: 3, flee: 3 },
          resultText: '영운은 지팡이를 들었다.' },
        {
          label: '창문을 연다',
          check: { stat: 'agility', dc: 12 },
          gain: 2,
          branch: { win: 2, lose: 3 },
          outcomes: {
            critical: { effect: { agility: 1, exp: 30 },
              text:
`영운은 벽을 따라 돌아 창문 걸쇠를 풀었다.

찬 바람이 들어오자 파란 것들이 한꺼번에 그쪽으로 빨려 나갔다. 픽시는 바람을 좋아한다. 그것만은 교과서에 적혀 있는 대로였다.

교실이 조용해졌다. 뒤집힌 잉크병 옆에, 잉크로 쓴 글자 하나가 반쯤 지워진 채 남아 있었다.` },
            success: { effect: { exp: 14 },
              text: '창문을 열자 절반쯤이 나갔다. 나머지는 커튼 뒤에 숨었지만, 더는 덤비지 않았다.' },
            fail: { effect: { hp: -4 },
              text: '걸쇠가 녹슬어 있었다. 씨름하는 동안 등에 대여섯 번 부딪혔다.', combat: 'pixie' },
            fumble: { effect: { hp: -5 },
              text: '창틀에 올라선 순간 발목을 잡혔다.', combat: 'pixie' },
          },
        },
      ],
    },
    {
      /* 승리 후 */
      gain: 2,
      text:
`마지막 한 마리를 상자에 밀어 넣고 뚜껑을 닫았다.

교실이 조용해지자 뒤집힌 잉크병이 눈에 들어왔다. 잉크가 책상 위로 번졌는데, 그 번진 자국이 이상했다. 가운데가 비어 있다.

누가 잉크가 마르기 전에 거기 뭔가를 올려놨다가 치운 것이다.`,
      choices: [
        {
          label: '빈 자국의 모양을 본다',
          check: { stat: 'intelligence', dc: 12, search: true },
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 34, item: 'inkBottle' },
              text:
`네모난 자국이었다. 손바닥만 하고, 한쪽 모서리가 닳아 둥글다.

수첩이다. 이 성에서 수첩을 들고 다니는 사람은 많지만, 모서리가 저렇게 닳도록 오래 쓴 사람은 많지 않다.

영운은 자기 수첩을 꺼내 잉크 자국 위에 올려봤다. 크기가 거의 같았다.

깨지지 않은 잉크병 하나를 챙겨 나왔다.` },
            success: { effect: { exp: 18 },
              text:
`네모난 자국. 수첩만 한 크기다.

누군가 여기서 뭔가를 적고 있었고, 픽시 상자를 연 채로 나갔다.` },
            fail: { effect: {},
              text: '들여다봤지만 잉크가 이미 번져서 모양을 알 수 없게 됐다.' },
            fumble: { effect: { hp: -2 },
              text: '책상에 손을 짚었다가 잉크를 뒤집어썼다. 자국은 그걸로 끝이었다.' },
          },
        },
        {
          label: '상자를 챙겨 교무실에 가져다 놓는다',
          effect: { gold: 12, alignment: 3, exp: 16 },
          resultText:
`영운은 상자를 안고 교무실까지 갔다.

담당 교수는 상자를 받아 들고 한참 말이 없었다.

"이 상자, 작년에 폐기했는데."

"…예?"

"목록에서 지웠어. 그런데 여기 있네." 교수가 상자 옆면을 손톱으로 긁었다. 지운 자국 아래 이름표가 있었다. 이름은 읽을 수 없었다.

교수는 수고비라며 갈레온 몇 개를 쥐여줬고, 상자를 다시 어딘가에 넣었다.` },
      ],
    },
    {
      /* 패배 · 회피 후 */
      gain: 2,
      text:
`영운은 복도에 앉아 숨을 골랐다.

교실 문 안쪽에서는 여전히 뭔가 부딪히는 소리가 났다. 지나가던 상급생 하나가 문을 힐끗 보고 그냥 갔다.

"저기 픽시 있어요."

"응." 그 애가 걸음을 멈추지 않고 대답했다. "거긴 원래 그래."

원래 그렇다는 말은, 아무도 안 고친 지 오래됐다는 뜻이다.`,
      choices: [
        {
          label: '"언제부터요?"',
          check: { stat: 'charm', dc: 8 },
          outcomes: {
            critical: { effect: { charm: 1, exp: 26, register: 'simon' },
              text:
`그 애가 그제서야 멈췄다.

"글쎄. 내가 1학년 때부터 그랬으니까… 근데 이상하네."

"뭐가요?"

"1학년 때 누가 나한테 그랬거든. 저 교실은 들어가지 말라고." 그 애가 이마를 문질렀다. "누가 그랬는지가 기억이 안 나."

그 애는 잠깐 서 있다가 갔다. 영운은 수첩에 그 애 이름을 적었다.` },
            success: { effect: { exp: 14 },
              text:
`"내가 1학년 때부터." 그 애가 어깨를 으쓱했다. "누가 조심하라고 했던 것 같은데, 누군지는 기억 안 나."

그 애는 그 말을 하고도 이상하다고 생각하지 않는 눈치였다.` },
            fail: { effect: {},
              text: '그 애는 대답하지 않고 갔다. 바쁜 척하는 걸음이었다.' },
            fumble: { effect: { hp: -2 },
              text: '말을 붙이려다 벽에 기댔는데, 하필 아까 부딪힌 자리였다. 눈앞이 잠깐 하얘졌다.' },
          },
        },
        {
          label: '문에 표시를 남기고 간다',
          effect: { exp: 14, alignment: 2 },
          resultText:
`영운은 수첩을 찢어 문에 붙였다.

「안에 픽시. 열지 말 것. — 영운」

이름까지 쓴 건 습관이었다. 손으로 쓴 것은 남는다. 그게 이 성에서 유일하게 확실한 규칙이다.

복도 끝에서 한 번 돌아봤다. 종이는 그대로 붙어 있었다.` },
      ],
    },
  ],
},

/* ── 결투 신청 · 3단계 ────────────────────────────────────
 * 규칙대로 하는 결투. 이기든 지든 상대가 왜 걸었는지가 남는다. */
duel_challenge: {
  id: 'duel_challenge', pool: 'combat', weight: 10, progress: [5, 60], gain: 3,
  text:
`복도에서 누가 앞을 막았다.

"편입생이라며."

이런 건 어느 학교에나 있다. 영운은 짐작이 갔다.

"결투 신청. 규칙대로. 여기서."

구경꾼이 벌써 몇 모였다. 모이는 속도가 이상하게 빨랐다 — 미리 알고 있었던 것처럼.`,
  stages: [
    {
      choices: [
        {
          label: '구경꾼 쪽을 먼저 본다',
          check: { stat: 'intelligence', dc: 12, search: true },
          deepen: true,
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 30, mark: 'sawCrowd' }, deepen: true,
              text:
`영운은 상대가 아니라 뒤쪽을 봤다.

구경꾼 일곱. 그중 넷이 벽에 기대 서 있는데, 넷 다 같은 자세다. 팔짱을 끼고 왼발을 앞으로. 마치 같은 사람을 여러 번 복사해 놓은 것처럼.

그리고 아무도 웃고 있지 않았다. 결투 구경에 모인 애들이 웃지 않는 건 처음 봤다.

"뭘 봐." 상대가 말했다. 목소리가 조금 흔들렸다.` },
            success: { effect: { exp: 16, mark: 'sawCrowd' }, deepen: true,
              text:
`구경꾼들이 이상했다. 아무도 떠들지 않는다.

결투 구경은 원래 시끄러운 것이다. 이건 구경이 아니라 참관에 가까웠다.` },
            fail: { effect: {}, deepen: true,
              text: '뒤를 힐끗 봤지만 그냥 애들이었다. 그중 하나와 눈이 마주쳤고, 그 애가 시선을 피했다.' },
            fumble: { effect: { hp: -2 }, deepen: true,
              text: '고개를 돌린 순간 상대가 쐈다. 어깨가 얼얼했다.\n\n"규칙 위반이야." 누가 말했지만 아무도 말리지 않았다.' },
          },
        },
        {
          label: '"규칙대로면, 입회인은?"',
          check: { stat: 'charm', dc: 8 },
          deepen: true,
          outcomes: {
            critical: { effect: { charm: 1, exp: 26, mark: 'askedRules' }, deepen: true,
              text:
`상대가 말문이 막혔다.

"…필요해?"

"규칙대로 하자며." 영운은 구경꾼 쪽을 봤다. "누가 할래?"

아무도 손을 들지 않았다. 일곱 명이 전부 다른 데를 봤다.

결국 상대가 짜증을 내며 말했다. "됐어. 그냥 하자."

규칙대로 하자던 쪽이 규칙을 먼저 버렸다.` },
            success: { effect: { exp: 14, mark: 'askedRules' }, deepen: true,
              text: '"…그냥 하자." 상대가 말했다.\n\n규칙대로 하자던 쪽이 규칙을 먼저 접었다. 영운은 그걸 기억해두기로 했다.' },
            fail: { effect: {}, deepen: true,
              text: '"입회인 같은 소리 하네." 상대가 지팡이를 들었다. 구경꾼 중 하나가 짧게 웃었다.' },
            fumble: { effect: { hp: -2 }, deepen: true,
              text: '말하는 중에 첫 주문이 날아왔다. 규칙은 처음부터 없었던 것이다.' },
          },
        },
      ],
    },
    {
      text: (s) => (s.episode && s.episode.sawCrowd)
        ? `상대가 세 걸음 물러섰다.\n\n구경꾼 넷이 동시에 팔짱을 풀었다. 같은 순간에.\n\n영운은 상대의 눈을 봤다. 그 애도 무서워하고 있었다.`
        : `상대가 세 걸음 물러서고 지팡이를 들었다.\n\n"준비."\n\n영운은 발을 옮겼다. 마룻바닥이 미끄러웠다.`,
      choices: [
        { label: '지팡이를 든다', combat: 'rivalStudent', branch: { win: 2, lose: 2, flee: 2 },
          resultText: '영운도 지팡이를 들었다. 손이 차가웠다.' },
        {
          label: '말로 넘긴다',
          check: { stat: 'charm', dc: 12 },
          gain: 2,
          branch: { win: 2, lose: 2 },
          outcomes: {
            critical: { effect: { charm: 2, exp: 34, mark: 'talkedDown' },
              text:
`"네가 이기면 뭐가 좋아지는데?"

상대가 대답을 못 했다. 입을 열었다가 다시 다물었다.

"…모르겠어."

"나도 몰라." 영운이 지팡이를 내렸다. "그러면 안 해도 되는 거 아니야?"

구경꾼 하나가 웃었고, 그 웃음이 옮았다. 분위기가 풀렸다. 상대도 지팡이를 내렸다 — 안심한 얼굴이었다.` },
            success: { effect: { charm: 1, mark: 'talkedDown' },
              text: '몇 마디 주고받다 보니 흐지부지됐다. 구경꾼들이 시시하다며 흩어졌다.\n\n상대는 마지막까지 영운을 노려봤지만, 노려보는 것 말고는 아무것도 하지 않았다.' },
            fail: { effect: {}, text: '말이 통하지 않았다. 결국 지팡이를 들어야 했다.', combat: 'rivalStudent' },
            fumble: { effect: { hp: -2 }, text: '말이 헛나왔다. 상대가 먼저 쐈다.', combat: 'rivalStudent' },
          },
        },
      ],
    },
    {
      gain: 2,
      text: (s) => (s.episode && s.episode.talkedDown)
        ? `구경꾼이 흩어진 뒤에도 그 애는 남아 있었다.\n\n"야."\n\n영운이 돌아봤다.\n\n"…아까 그거. 왜 걸었는지 진짜로 모르겠어." 그 애가 자기 손을 내려다봤다. "아침에 일어났을 때는 알았던 것 같은데."`
        : `구경꾼이 흩어졌다. 둘 다 마룻바닥에 앉아 있었다.\n\n누가 이겼는지는 이제 아무래도 상관없어 보였다. 둘 다 코피가 났으니까.\n\n"야."\n\n영운이 돌아봤다.\n\n"…내가 왜 너한테 결투를 걸었지?" 그 애가 물었다. 비꼬는 말투가 아니었다. 정말로 묻는 말투였다.`,
      choices: [
        {
          label: '같이 생각해본다',
          check: { stat: 'intelligence', dc: 12 },
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 40, register: 'simon', fragment: 4 },
              text:
`영운은 그 애 옆에 앉았다.

"오늘 아침에 누구랑 얘기했어?"

"…했지. 아침 먹으면서." 그 애가 눈썹을 찌푸렸다. "누구랑 했는지가 기억이 안 나."

"뭐라고 했는데?"

"편입생 조심하라고. 걔가 뭘 찾고 다니는데 그러면 안 된다고." 그 애가 천천히 말했다. "…목소리는 기억나. 여자애였어. 좀 낮고, 말 끝을 조금 끄는."

영운은 수첩을 꺼냈다. 「말 끝을 끄는 목소리. 여자. 아침 식당.」

그 애가 옆에서 그걸 봤다. "너 그런 거 왜 적어?"

"안 적으면 없어지니까."

그 애는 대답하지 않았다. 하지만 자기 손등에 뭔가를 적어보려다, 펜이 없어서 그만뒀다.` },
            success: { effect: { exp: 22, register: 'simon' },
              text:
`"오늘 아침에 누가 나한테 말했어. 너 조심하라고." 그 애가 말했다. "근데 누구였는지가 기억이 안 나."

"목소리는?"

"여자애." 그 애가 잠깐 생각했다. "그것만."

영운은 그 애 이름을 물어보고 수첩에 적었다.` },
            fail: { effect: {},
              text: '"됐어. 됐다고." 그 애가 일어나서 갔다.\n\n가는 뒷모습이 아까보다 작아 보였다.' },
            fumble: { effect: { hp: -2 },
              text: '"됐어!" 그 애가 밀치고 갔다.\n\n벽에 부딪힌 어깨가 아까 맞은 자리였다.' },
          },
        },
        {
          label: '이름만 물어보고 적어둔다',
          effect: { register: 'simon', exp: 18 },
          resultText:
`"이름이 뭐야?"

그 애가 이상하다는 얼굴을 했다. "왜?"

"적어두려고."

"…뭐 하려고?"

영운은 대답 대신 수첩을 폈다. 이미 이름이 여럿 적혀 있었고, 그중 몇 개는 잉크가 번져 있었다.

그 애가 그걸 보더니 자기 이름을 말했다. 두 번 말했다. 두 번째는 철자까지 불러줬다.

왜 두 번 말하는지 서로 묻지 않았다.` },
      ],
    },
  ],
},

/* ── 숲 가장자리 · 3단계 ──────────────────────────────────
 * 사슴 모양을 한 것. 이겨도 정체는 안 나오고, 물러서도 뭔가는 남는다. */
forest_edge: {
  id: 'forest_edge', pool: 'combat', weight: 10, progress: [20, 100], repeatable: true, gain: 4,
  text:
`금지된 숲 가장자리. 여기까지는 벌점만 받고 끝난다.

나무 사이에서 뭔가 움직였다. 처음엔 사슴인 줄 알았다.

사슴은 그렇게 오래 서서 사람을 보지 않는다.`,
  stages: [
    {
      choices: [
        {
          label: '루모스로 비춰본다',
          requiresSpell: 'lumos',
          check: { stat: 'courage', dc: 8 },
          deepen: true,
          outcomes: {
            critical: { effect: { courage: 1, exp: 30, mark: 'sawShape' }, deepen: true,
              text:
`빛이 닿자 그것이 물러섰다. 물러서면서 형태가 잠깐 흐트러졌다.

짐승이 아니었다. 짐승 모양을 하고 있었을 뿐이다.

흐트러진 반 초 동안 영운이 본 것은 — 사람 어깨였다. 교복을 입은.

빛을 조금 낮추자 다시 사슴이 됐다.` },
            success: { effect: { exp: 16, mark: 'sawShape' }, deepen: true,
              text:
`빛이 닿자 그것이 나무 뒤로 물러났다. 물러서는 동작이 짐승 같지 않았다.

네 다리로 걷는 것이 저렇게 어깨를 먼저 움직이지는 않는다.` },
            fail: { effect: { hp: -4 }, deepen: true,
              text: '빛이 닿았는데도 물러서지 않았다. 오히려 한 걸음 가까워졌다. 빛 안에서 그것은 완벽하게 사슴이었다.' },
            fumble: { effect: { hp: -6 }, deepen: true,
              text: '빛이 그것을 자극했다. 나무 사이에서 뭔가가 한꺼번에 이쪽으로 움직였다.' },
          },
        },
        {
          label: '가만히 서서 지켜본다',
          check: { stat: 'courage', dc: 12 },
          deepen: true,
          outcomes: {
            critical: { effect: { courage: 2, exp: 32, mark: 'waited' }, deepen: true,
              text:
`영운은 움직이지 않았다.

일 분. 이 분. 그것도 움직이지 않았다.

오 분쯤 지나서 그것이 먼저 고개를 돌렸다. 고개를 돌린 방향이 성 쪽이었다. 그것은 숲이 아니라 성을 보고 있었다.

숲에서 온 것이 아니라, 성에서 나온 것이다.` },
            success: { effect: { exp: 18, mark: 'waited' }, deepen: true,
              text:
`한참 서로 봤다. 그것이 먼저 고개를 돌렸고, 돌린 쪽은 숲이 아니라 성이었다.` },
            fail: { effect: { hp: -3 }, deepen: true,
              text: '오래 서 있었더니 다리가 저렸다. 발을 옮기는 순간 그것이 반응했다.' },
            fumble: { effect: { hp: -5 }, deepen: true,
              text: '눈을 깜빡였다. 눈을 떴을 때 그것은 반쯤 가까워져 있었다.' },
          },
        },
        {
          label: '천천히 뒷걸음질 친다',
          check: { stat: 'agility', dc: 12 },
          gain: 1,
          outcomes: {
            critical: { effect: { agility: 1, exp: 20 },
              text:
`눈을 떼지 않은 채로 물러났다. 그것도 따라오지 않았다.

서로 지켜보다가, 나무 사이가 완전히 어두워졌을 때 영운은 돌아섰다.

돌아선 뒤에도 등에 시선이 남아 있었다. 성 문에 닿을 때까지.` },
            success: { effect: { hp: -2 }, text: '물러나는 동안 나뭇가지에 긁혔다. 그것은 따라오지 않았다.' },
            fail: { effect: { hp: -6 }, text: '돌아서는 순간 뭔가가 등을 스쳤다. 뛰어서 성까지 왔다.' },
            fumble: { effect: {}, text: '나무뿌리에 걸려 넘어졌다.', combat: 'darkCreature', branch: { win: 1, lose: 2 } },
          },
        },
      ],
    },
    {
      text: (s) => (s.episode && s.episode.sawShape)
        ? `영운은 지팡이를 들었다.\n\n그것을 사슴으로 보지 않기로 하자 사슴처럼 움직이지 않았다.\n\n한 번 어깨가 먼저 나갔다.`
        : `그것이 천천히 다가왔다.\n\n발굽 소리가 나지 않았다. 낙엽 위를 걷는데 낙엽이 눌리지 않았다.`,
      choices: [
        { label: '지팡이를 든다', combat: 'darkCreature', branch: { win: 2, lose: 3, flee: 3 },
          resultText: '영운은 지팡이를 들었다.' },
        {
          label: '이름을 불러본다',
          check: { stat: 'charm', dc: 16 },
          gain: 3,
          branch: { win: 2, lose: 3 },
          outcomes: {
            critical: { effect: { charm: 2, exp: 46, fragment: 2, mark: 'named' },
              text:
`영운은 수첩을 폈다. 적어둔 이름 중 하나를 골랐다.

소리 내어 불렀다.

그것이 멈췄다. 완전히 멈췄다 — 숨 쉬는 것처럼 보이던 옆구리의 움직임까지.

그러더니 아주 천천히, 고개를 아래로 내렸다. 짐승이 하는 동작이 아니었다. 사람이 고개를 숙일 때 하는 동작이었다.

몇 초 뒤 그것은 형태를 잃고 나무 사이로 흩어졌다. 흩어진 자리 낙엽 위에 잉크로 쓴 글자 조각 하나가 남아 있었다.` },
            success: { effect: { exp: 26, fragment: 2 },
              text:
`영운이 이름 하나를 부르자 그것이 멈췄다.

한참 서 있다가 흩어졌다. 낙엽 위에 종이 조각이 하나 남았다.` },
            fail: { effect: { hp: -5 },
              text: '부른 이름이 틀렸다. 그것이 고개를 들었다.', combat: 'darkCreature', branch: { win: 2, lose: 3 } },
            fumble: { effect: { hp: -7 },
              text: '영운은 이름을 부르려다 — 아무 이름도 떠오르지 않는다는 걸 알았다.\n\n수첩을 열려는 사이 그것이 뛰었다.', combat: 'darkCreature', branch: { win: 2, lose: 3 } },
          },
        },
      ],
    },
    {
      gain: 3,
      text:
`그것이 쓰러진 자리에 아무것도 남지 않았다. 피도, 털도, 자국도.

낙엽만 조금 눌려 있었는데, 그 눌린 모양이 발굽이 아니라 신발이었다.

한 사람 몫. 성 쪽을 향하고 있었다.`,
      choices: [
        {
          label: '발자국을 따라가 본다',
          check: { stat: 'agility', dc: 16, search: true },
          outcomes: {
            critical: { effect: { agility: 1, exp: 48, equipDrop: { slot: 'accessory', tier: 2 } },
              text:
`영운은 자국을 따라 걸었다.

자국은 숲 가장자리를 따라 이어지다 성벽 아래에서 끊겼다. 벽에는 문이 없다.

끊긴 자리 아래, 이끼 사이에 뭔가 반짝였다. 파묻힌 지 오래된 물건이었다.

파내서 소매로 닦았다. 학생 물건이다. 이름이 새겨져 있었는데 절반이 닳아 없어졌다.

남은 절반을 수첩에 옮겨 적었다.` },
            success: { effect: { exp: 26, equipDrop: { slot: 'accessory', tier: 1 } },
              text:
`자국은 성벽 아래에서 끊겼다. 벽에는 문이 없다.

끊긴 자리에서 낡은 물건을 하나 주웠다.` },
            fail: { effect: { hp: -4 },
              text: '스무 걸음쯤 따라가다 잃어버렸다. 낙엽이 두꺼웠고, 돌아오는 길에 발을 접질렸다.' },
            fumble: { effect: { hp: -7 },
              text: '자국을 보느라 앞을 안 봤다. 도랑이었다. 젖은 채로 한참 걸어야 했다.' },
          },
        },
        {
          label: '자국의 크기를 재고 돌아간다',
          effect: { exp: 20, intelligence: 1 },
          resultText:
`영운은 자기 발을 자국 옆에 나란히 놓았다.

거의 같았다. 반 치수쯤 작을까.

학생 것이다. 어른 것이 아니다.

수첩에 자국 모양을 그리고 크기를 적었다. 「숲 가장자리. 학생 신발. 성을 향함.」

돌아오는 길 내내, 자기 발자국이 아까 그 자국과 겹치는지 자꾸 뒤를 돌아봤다.` },
      ],
    },
    {
      gain: 2,
      text:
`영운은 숲 가장자리 돌 위에 앉아 있었다.

어떻게 여기까지 왔는지가 애매하다. 뛰었던 것 같은데 숨은 이미 가라앉아 있다.

무릎이 까졌고 소매가 찢어졌다. 지팡이는 손에 쥐고 있다 — 그것만은 놓지 않았다.

숲은 조용했다.`,
      choices: [
        {
          label: '수첩을 확인한다',
          check: { stat: 'intelligence', dc: 8 },
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 28 },
              text:
`수첩을 폈다.

마지막 쪽에 자기 글씨로 뭔가 적혀 있었다. 방금 적은 것처럼 잉크가 덜 말랐다.

「사슴 아님」

세 글자뿐이다. 언제 적었는지 기억이 없다. 도망치면서 적었을 리는 없다.

영운은 그 아래에 시각을 적어뒀다. 다음번에는 비교할 것이 있어야 한다.` },
            success: { effect: { exp: 16 },
              text: '수첩 마지막 쪽에 「사슴 아님」이라고 적혀 있었다. 잉크가 아직 덜 말랐다.\n\n적은 기억이 없다.' },
            fail: { effect: {},
              text: '수첩을 폈지만 손이 떨려서 글자가 눈에 안 들어왔다. 그냥 덮었다.' },
            fumble: { effect: { hp: -2 },
              text: '수첩을 떨어뜨렸다. 주우려고 몸을 굽히자 갈비뼈가 아팠다.' },
          },
        },
        {
          label: '성으로 돌아간다',
          effect: { hp: -2, exp: 12 },
          resultText:
`영운은 일어났다.

성까지는 걸어서 십 분. 그 십 분 동안 한 번도 뒤를 보지 않았다.

문 앞에서 관리인이 흘끗 보더니 아무 말 없이 비켜줬다. 이 성에서는 밤에 흙투성이로 돌아오는 학생이 특별한 일이 아니다.

그것도 이상한 일이다.` },
      ],
    },
  ],
},

/* ── 보가트 · 3단계 ───────────────────────────────────────
 * 무서운 게 없는 게 아니라 아직 잃어본 게 없는 것. 그게 이 판의 주제다. */
boggart_closet: {
  id: 'boggart_closet', pool: 'combat', weight: 8, progress: [10, 70], gain: 3,
  text:
`빈 교실 뒤편 벽장이 혼자 덜컹거렸다.

보가트다. 성 안에 늘 몇 마리쯤 있고, 대개는 아무도 안 쓰는 가구 안에 산다.

문고리에 손을 댔더니 안쪽에서 조용해졌다. 기다리는 것이다.`,
  stages: [
    {
      choices: [
        {
          label: '무엇이 나올지 먼저 생각해둔다',
          check: { stat: 'courage', dc: 12 },
          deepen: true,
          outcomes: {
            critical: { effect: { courage: 2, exp: 34, mark: 'nothingCame' }, deepen: true,
              text:
`영운은 눈을 감고 생각했다. 무엇이 제일 무서운가.

떠오르는 게 없었다.

그게 이상해서 한참 생각했다. 어릴 때 무서웠던 것들을 하나씩 꺼내봤다 — 어두운 계단, 개, 물. 전부 이제는 안 무섭다.

지금 잃으면 못 견딜 게 뭐가 있나.

한참 생각했는데 하나도 안 나왔다. 무서운 게 없는 게 아니라, 아직 잃어본 게 없다는 뜻이었다.

문고리를 잡은 손이 오히려 차분해졌다.` },
            success: { effect: { courage: 1, exp: 16, mark: 'nothingCame' }, deepen: true,
              text:
`무엇이 나올지 몇 가지 떠올려봤다. 어느 것도 확실하지 않았다.

무서운 게 없는 건 아닐 텐데, 이름이 안 붙는다.` },
            fail: { effect: { hp: -2 }, deepen: true,
              text: '생각하는 사이 벽장이 한 번 크게 덜컹였다. 문이 반쯤 열렸다.' },
            fumble: { effect: { hp: -4 }, deepen: true,
              text: '떠올린 것이 그대로 문틈으로 새어 나왔다. 형태를 갖추기 전인데도 목이 조였다.' },
          },
        },
        {
          label: '벽장 주변을 살핀다',
          check: { stat: 'intelligence', dc: 12, search: true },
          deepen: true,
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 32, mark: 'foundChalk' }, deepen: true,
              text:
`영운은 벽장에서 손을 떼고 주위를 봤다.

벽장 앞 바닥에 분필 자국이 있었다. 거의 지워졌지만 반원 모양이다. 누가 여기 서서 보가트를 상대하는 연습을 한 것이다 — 여러 번.

그리고 벽장 옆면, 눈높이보다 낮은 자리에 칼로 새긴 글자가 있었다.

「나오는 것을 적어둘 것」

글씨가 서툴다. 어린 학생 손이다.` },
            success: { effect: { exp: 18, mark: 'foundChalk' }, deepen: true,
              text:
`바닥에 지워진 분필 자국이 있었다. 반원. 여기 서서 연습한 사람이 있었다.

벽장 옆면에 「나오는 것을 적어둘 것」이라고 새겨져 있었다.` },
            fail: { effect: {}, deepen: true,
              text: '먼지뿐이었다. 이 교실은 오래 안 쓴 티가 났다.' },
            fumble: { effect: { hp: -2 }, deepen: true,
              text: '벽장을 짚고 몸을 숙였는데 그 진동에 문이 튀어 열렸다.' },
          },
        },
        {
          label: '그냥 둔다', gain: 1, effect: {},
          resultText:
`영운은 손을 뗐다.

벽장이 다시 덜컹거리기 시작했다. 아까보다 조금 세게.

복도로 나올 때까지 소리가 따라왔다. 문을 두 개 지나서야 안 들렸다.

안 들리게 된 자리에서 잠깐 서 있었다. 저 안에 있는 게 뭔지 끝내 모르는 편이 나은지, 영운은 확신이 없었다.` },
      ],
    },
    {
      text: (s) => (s.episode && s.episode.nothingCame)
        ? `영운은 문을 열었다.\n\n안에서 나온 것은 — 아무것도 아니었다.\n\n형태 없는 회색 덩어리가 문틀 안에서 뒤척였다. 무엇이 될지 정하지 못한 것이다.\n\n그것도 당황한 것처럼 보였다.`
        : `영운은 문을 열었다.\n\n안쪽 어둠이 천천히 부풀었다. 뭔가 형태를 잡아가고 있었다.\n\n그 형태는 사람이었고, 등을 돌리고 서 있었다.`,
      choices: [
        { label: '맞선다', combat: 'boggart', branch: { win: 2, lose: 3, flee: 3 },
          resultText: '영운은 지팡이를 들었다.' },
        {
          label: '「나오는 것을 적어둘 것」 — 수첩을 편다',
          requiresMark: 'foundChalk',
          check: { stat: 'intelligence', dc: 12 },
          gain: 4,
          branch: { win: 2, lose: 3 },
          outcomes: {
            critical: { effect: { intelligence: 2, exp: 50, fragment: 5, mark: 'wroteIt' },
              text:
`영운은 지팡이 대신 수첩을 폈다.

그것을 보면서, 보이는 대로 적었다.

「등을 돌린 사람. 교복. 여자. 머리를 하나로 묶음. 왼손에 잉크병.」

적는 동안 그것은 움직이지 않았다. 적히고 있다는 걸 아는 것 같았다.

마지막 글자를 쓰자 그것이 흐트러졌다. 소리 없이, 종이에 물이 번지듯이.

벽장 안은 비어 있었다. 수첩에는 방금 쓴 글자가 남아 있었다. 손으로 쓴 것은 남는다.

그 다섯 줄 아래에 영운은 한 줄을 더 적었다. 「이 사람이 여기서 연습했다.」` },
            success: { effect: { exp: 30, fragment: 5, mark: 'wroteIt' },
              text:
`영운은 수첩을 펴고 보이는 대로 적었다.

「등을 돌린 사람. 교복. 하나로 묶은 머리.」

적자 그것이 흐트러졌다. 벽장은 비었고, 글자는 남았다.` },
            fail: { effect: { hp: -5 },
              text: '펜을 대는 순간 형체가 돌아섰다. 얼굴이 있어야 할 자리를 보고 손이 멎었다.', combat: 'boggart', branch: { win: 2, lose: 3 } },
            fumble: { effect: { hp: -7 },
              text: '수첩이 손에서 떨어졌다. 형체가 그 위를 밟고 나왔다.', combat: 'boggart', branch: { win: 2, lose: 3 } },
          },
        },
        {
          label: '문을 도로 닫는다', gain: 1, effect: { hp: -2 },
          resultText:
`영운은 문을 밀어 닫았다.

닫히기 직전, 문틈으로 그것이 고개를 돌렸다. 반쯤 돌아간 옆얼굴이 보였고, 그 얼굴을 영운은 본 적이 있는 것 같았다.

어디서 봤는지는 떠오르지 않았다.

문은 닫혔다. 손목이 삐끗했다.` },
      ],
    },
    {
      gain: 3,
      text:
`형체가 흩어진 자리에 옷가지처럼 뭔가 남아 있었다.

보가트는 아무것도 남기지 않는다. 그게 보가트의 정의다. 형태를 흉내 낼 뿐이니까.

그런데 벽장 바닥에 뭔가 있었다.`,
      choices: [
        {
          label: '집어 든다',
          check: { stat: 'courage', dc: 12 },
          outcomes: {
            critical: { effect: { courage: 1, exp: 44, equipDrop: { slot: 'robe', tier: 2 }, fragment: 6 },
              text:
`머리끈이었다. 검은 것. 오래돼서 고무가 삭았다.

그 아래에 접힌 종이가 하나. 펴보니 연습 기록이었다.

「3월 9일 — 나온 것: 물. 실패.
 3월 16일 — 나온 것: 물. 실패.
 3월 23일 — 나온 것: 물. 성공.
 4월 6일 — 나온 것: 아무것도 안 나옴. ?」

마지막 줄 옆에 물음표가 크게 그려져 있었다. 그 아래로는 백지다.

영운은 종이를 접어 안주머니에 넣었다. 벽장 안에 걸려 있던 낡은 외투도 함께 챙겼다. 주인이 안 찾으러 온 지 오래된 물건이다.` },
            success: { effect: { exp: 24, equipDrop: { slot: 'robe', tier: 1 } },
              text:
`머리끈 하나와 접힌 종이. 종이에는 날짜와 「나온 것」이 적혀 있었다.

마지막 줄은 「아무것도 안 나옴」이었고, 그 뒤로는 백지였다.

벽장 안의 낡은 외투를 함께 챙겼다.` },
            fail: { effect: {},
              text: '손을 뻗었는데 만져지는 게 먼지뿐이었다. 아까 본 것이 뭐였는지 알 수 없게 됐다.' },
            fumble: { effect: { hp: -3 },
              text: '벽장 안으로 몸을 넣는 순간 문이 저절로 닫혔다. 안에서 밀어 여는 데 한참 걸렸다.' },
          },
        },
        {
          label: '벽장 옆면에 한 줄 더 새긴다',
          effect: { exp: 26, alignment: 3, courage: 1 },
          resultText:
`영운은 주머니칼을 꺼냈다.

「나오는 것을 적어둘 것」 아래에, 자기 글씨로 새겼다.

「적었음. 영운.」

새기는 데 오래 걸렸다. 나무가 단단했고 손이 아팠다.

다 새기고 나서 뒤로 물러나 봤다. 두 줄이 나란히 있었다. 서로 다른 두 사람의 손글씨가.

이 성에서 남는 건 이런 것뿐이다.` },
      ],
    },
    {
      gain: 2,
      text:
`영운은 교실 바닥에 앉아 있었다.

벽장 문은 닫혀 있고 안쪽은 조용하다. 무릎이 떨렸다.

무엇을 봤는지는 이미 흐릿하다. 보가트가 원래 그렇다 — 사라지면서 자기가 뭐였는지도 데려간다.

다만 목이 아팠다. 소리를 지른 모양이다.`,
      choices: [
        {
          label: '기억나는 것만이라도 적는다',
          check: { stat: 'intelligence', dc: 8 },
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 30, fragment: 5 },
              text:
`영운은 수첩을 폈다. 손이 떨려서 글씨가 삐뚤었다.

「등. 묶은 머리. 안 돌아봄.」

세 조각뿐이지만 적어놓으니 남았다. 다시 읽으니 조금 더 떠올랐다. 왼손에 뭔가 들고 있었다는 것.

「왼손 — 병 같은 것.」

거기까지가 한계였다. 그래도 백지보다는 낫다.` },
            success: { effect: { exp: 18 },
              text: '「등. 묶은 머리. 안 돌아봄.」\n\n적어놓고 나니 그것만은 지워지지 않았다.' },
            fail: { effect: {},
              text: '펜을 들었는데 아무것도 떠오르지 않았다. 백지에 잉크만 한 방울 떨어뜨렸다.' },
            fumble: { effect: { hp: -2 },
              text: '일어서다 어지러워 책상 모서리에 부딪혔다. 수첩은 결국 펴지도 못했다.' },
          },
        },
        {
          label: '벽장에 못을 박고 나온다',
          effect: { exp: 16, courage: 1, gold: -8 },
          resultText:
`영운은 교실 구석에서 널판과 못을 찾아 벽장 문을 가로질러 박았다.

관리인 창고에서 빌린 것이라 나중에 값을 물어줘야 한다.

다 박고 나서 문 앞에 섰다.

안쪽은 조용하다. 조용한 게 더 이상했다.

교실을 나오면서 문에 종이를 붙였다. 「열지 말 것. 안에 보가트. — 영운」

이름을 쓰는 데 한참 걸렸다. 손이 아직 떨렸다.` },
      ],
    },
  ],
},

/* ── 트롤 · 3단계 ─────────────────────────────────────────
 * 있을 리 없는 것. 이십오 년 전에는 있었다. */
troll_cellar: {
  id: 'troll_cellar', pool: 'combat', weight: 8, progress: [40, 100], gain: 4,
  text:
`지하 통로에서 냄새가 났다. 젖은 돌 냄새가 아니라 다른 것.

모퉁이를 돌자 천장에 머리가 닿을 듯한 것이 서 있었다.

산 트롤. 성 안에 있을 리가 없는 것이다. 이십오 년 전에는 있었다고 한다.`,
  stages: [
    {
      choices: [
        {
          label: '왜 여기 있는지 살핀다',
          check: { stat: 'intelligence', dc: 16, search: true },
          deepen: true,
          outcomes: {
            critical: { effect: { intelligence: 2, exp: 42, mark: 'sawCollar' }, deepen: true,
              text:
`영운은 모퉁이 뒤에 숨어 그것을 봤다.

트롤은 움직이지 않았다. 서 있는 게 아니라 서 있는 자세로 멈춰 있었다.

목에 뭔가 감겨 있었다. 밧줄이 아니라 — 쇠사슬도 아니고 — 종이였다. 두꺼운 종이 띠가 목에 둘려 있고, 거기 글자가 적혀 있다.

너무 어두워 읽을 수 없지만, 손으로 쓴 글자다. 그건 확실했다.

이건 길 잃은 짐승이 아니다. 누가 여기 세워놓은 것이다.` },
            success: { effect: { intelligence: 1, exp: 24, mark: 'sawCollar' }, deepen: true,
              text:
`트롤이 움직이지 않는다. 목에 종이 띠 같은 것이 둘려 있었다.

거기 손글씨가 적혀 있다. 읽을 수는 없었다.` },
            fail: { effect: { hp: -4 }, deepen: true,
              text: '어둠에 눈이 익기 전에 그것이 몸을 돌렸다. 냄새 때문이었을 것이다.' },
            fumble: { effect: { hp: -7 }, deepen: true,
              text: '숨어 있던 자리가 하필 물웅덩이였다. 첨벙 소리가 통로 전체에 울렸다.' },
          },
        },
        {
          label: '소리 없이 물러난다',
          check: { stat: 'agility', dc: 12 },
          gain: 2,
          outcomes: {
            critical: { effect: { agility: 1, exp: 24 },
              text:
`숨을 죽이고 한 걸음씩 물러났다. 발끝부터 놓고, 뒤꿈치를 마지막에.

그것은 끝까지 이쪽을 보지 못했다.

계단까지 나와서야 숨을 쉬었다. 그리고 계단 벽에 분필로 표시를 남겼다. 다음에 여길 지날 사람을 위해서.

다음에 지날 사람이 자기 자신일 가능성이 제일 높다는 것도, 그때는 알고 있었다.` },
            success: { effect: { hp: -4 }, text: '물러나다 돌을 하나 찼다. 그것이 돌아봤지만 영운은 이미 모퉁이를 돌아 있었다.' },
            fail: { effect: { hp: -8 }, text: '몽둥이가 벽을 때렸다. 돌조각이 튀어 옆구리를 스쳤다. 뛰어서 도망쳤다.' },
            fumble: { effect: {}, text: '발이 미끄러졌다.', combat: 'troll', branch: { win: 1, lose: 2 } },
          },
        },
      ],
    },
    {
      text: (s) => (s.episode && s.episode.sawCollar)
        ? `영운은 통로로 나섰다.\n\n그것이 고개를 돌렸다. 목의 종이 띠가 그 동작에 따라 흔들렸다.\n\n띠에 적힌 글자가 잠깐 보였다. 이름이었다. 사람 이름.\n\n트롤이 몽둥이를 들었다.`
        : `그것이 고개를 돌렸다.\n\n작은 눈이 어둠 속에서 영운을 찾았다. 찾는 데 시간이 걸렸다 — 눈이 나쁜 것이다.\n\n찾고 나서는 빨랐다.`,
      choices: [
        { label: '맞선다', combat: 'troll', branch: { win: 2, lose: 3, flee: 3 },
          resultText: '영운은 지팡이를 들었다. 손이 떨렸지만 들긴 들었다.' },
        {
          label: '목의 띠를 노린다',
          requiresMark: 'sawCollar',
          check: { stat: 'agility', dc: 16 },
          gain: 5,
          branch: { win: 2, lose: 3 },
          outcomes: {
            critical: { effect: { agility: 2, exp: 56, fragment: 1, mark: 'cutCollar' },
              text:
`영운은 몸통이 아니라 목을 겨눴다.

주문이 종이 띠를 끊었다.

트롤이 멈췄다. 들어 올린 몽둥이가 그대로 공중에 섰다.

그러더니 아주 천천히, 몽둥이를 내렸다. 그리고 돌아섰다. 통로 안쪽 어둠으로 들어가서 다시 나오지 않았다.

끊어진 띠가 바닥에 떨어져 있었다. 주워서 폈다.

손으로 쓴 이름이 하나. 그리고 그 아래 한 줄.

「여기서 나가지 말 것」

명령이었다. 트롤에게 내린 명령이 아니라 — 트롤을 시켜 지키게 한 명령이었다.` },
            success: { effect: { exp: 34, fragment: 1 },
              text:
`주문이 목의 띠를 끊었다.

트롤이 멈추더니 돌아서서 어둠으로 들어갔다.

바닥에 떨어진 띠에는 손글씨로 이름 하나와 「여기서 나가지 말 것」이 적혀 있었다.` },
            fail: { effect: { hp: -8 },
              text: '겨냥이 빗나갔다. 어깨를 스쳤을 뿐이고, 그것은 그걸 알아챘다.', combat: 'troll', branch: { win: 2, lose: 3 } },
            fumble: { effect: { hp: -12 },
              text: '겨누는 데 시간을 너무 썼다. 몽둥이가 먼저 왔다.', combat: 'troll', branch: { win: 2, lose: 3 } },
          },
        },
      ],
    },
    {
      gain: 3,
      text:
`그것이 쓰러진 자리에서 냄새가 더 심해졌다.

영운은 소매로 코를 막고 통로 안쪽을 봤다. 트롤이 서 있던 자리 뒤로 통로가 이어진다.

바닥에 뼈가 몇 개 있었다. 사람 것은 아니었다. 그건 다행이었다.

그 너머에 문이 하나 있다. 나무 문. 자물쇠는 없고, 대신 문틀 전체에 종이가 붙어 있었다.`,
      choices: [
        {
          label: '문에 붙은 종이를 읽는다',
          check: { stat: 'intelligence', dc: 16, search: true },
          outcomes: {
            critical: { effect: { intelligence: 2, exp: 60, fragment: 2, flag: 'sawSealedDoor' },
              text:
`종이는 수십 장이었다. 문틀을 따라 위에서 아래까지 겹겹이.

전부 손으로 쓴 것이다. 잉크 색이 제각각인 걸 보면 여러 번, 여러 해에 걸쳐 붙인 것이다.

내용은 전부 같았다.

「여기 있던 것을 기억할 것.」

같은 문장을 수십 번. 필체는 하나다. 한 사람이 몇 년 동안 같은 문장을 계속 써서 붙인 것이다.

제일 아래, 제일 낡은 종이 한 장만 문장이 달랐다.

「내가 잊으면 이 문이 열린다.」

영운은 그 종이를 떼지 않았다. 대신 자기 수첩에 옮겨 적었다.` },
            success: { effect: { exp: 34, flag: 'sawSealedDoor' },
              text:
`손으로 쓴 종이 수십 장. 전부 같은 문장이다.

「여기 있던 것을 기억할 것.」

제일 낡은 한 장만 달랐다. 「내가 잊으면 이 문이 열린다.」` },
            fail: { effect: { hp: -5 },
              text: '가까이 가는 순간 종이들이 한꺼번에 펄럭였다. 바람이 없는데도. 영운은 물러섰다.' },
            fumble: { effect: { hp: -8 },
              text: '종이 한 장에 손을 댔다. 손끝이 데인 것처럼 아팠고, 그 자리 글자가 지워졌다.\n\n지워진 만큼 문이 조금 열렸다. 영운은 있는 힘껏 다시 밀어 닫았다.' },
          },
        },
        {
          label: '뼈를 챙기고 돌아간다',
          effect: { exp: 24, gold: 30, item: 'magicStone' },
          resultText:
`영운은 문 쪽으로 가지 않았다.

바닥의 뼈 중 몇 개는 마법 재료가 된다. 트롤 뼈는 값이 나간다. 아는 사람은 다 아는 얘기다.

세 개를 골라 천에 싸서 가방에 넣었다. 그중 하나에는 결정 같은 것이 박혀 있었다.

돌아 나오면서 한 번 뒤를 봤다. 문에 붙은 종이들이 어둠 속에서 하얗게 보였다.

오늘은 아니다. 오늘은 아니다, 라고 생각하면서 계단을 올랐다.` },
      ],
    },
    {
      gain: 2,
      text:
`영운은 계단 중간에 주저앉아 있었다.

어떻게 여기까지 올라왔는지 기억이 흐리다. 갈비뼈 쪽이 숨 쉴 때마다 아프다.

아래쪽 통로에서는 아무 소리도 안 난다. 따라오지 않은 것이다.

트롤은 원래 끝까지 쫓는다. 안 쫓았다는 건 — 그 자리를 떠날 수 없다는 뜻이다.`,
      choices: [
        {
          label: '지금 본 것을 적는다',
          check: { stat: 'intelligence', dc: 8 },
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 32, flag: 'trollGuards' },
              text:
`영운은 계단에 앉은 채로 수첩을 폈다.

「지하 통로. 산 트롤. 도망친 나를 안 쫓아옴.
 → 쫓지 못하는 것. 지키는 중.
 무엇을 지키나. 통로 안쪽에 뭐가 있나.」

거기까지 적고 나서 한 줄을 더했다.

「목에 종이. 손글씨.」

손글씨. 이 성에서 손으로 쓴 것은 남는다. 남는 것으로 짐승을 묶어둔 사람이 있다는 뜻이다.

계단을 마저 올라가면서 영운은 그 생각을 놓지 않으려고 애썼다.` },
            success: { effect: { exp: 20, flag: 'trollGuards' },
              text:
`「트롤이 안 쫓아옴 → 지키는 중.」

적어두고 나니 도망친 게 조금 덜 부끄러웠다. 알아낸 게 있으니까.` },
            fail: { effect: {},
              text: '펜을 잡았는데 손이 말을 안 들었다. 몇 자 쓰다가 그만뒀다.' },
            fumble: { effect: { hp: -2 },
              text: '수첩을 놓쳤다. 계단 아래로 굴러갔고, 주우러 내려갈 엄두가 나지 않았다.\n\n한참 뒤에 내려가서 주웠다. 아무 일도 없었지만, 그 몇 걸음이 제일 무서웠다.' },
          },
        },
        {
          label: '계단 벽에 표시를 남긴다',
          effect: { exp: 18, alignment: 2 },
          resultText:
`영운은 분필을 꺼내 계단 벽에 X를 그렸다.

그 옆에 작게 썼다. 「아래 · 트롤 · 5월」

분필은 지워진다. 지워질 걸 알면서도 그렸다.

다만 그 위에 수첩을 대고 같은 것을 한 번 더 그렸다. 종이에 그린 건 안 지워진다.

두 개를 다 남기고 올라갔다. 하나는 남들을 위해, 하나는 자기를 위해.` },
      ],
    },
  ],
},

/* ── 매복 · 2단계 ─────────────────────────────────────────
 * 왜 불편한지 본인들도 모른다. 그게 세계 규칙 1의 증상이다. */
corridor_ambush: {
  id: 'corridor_ambush', pool: 'combat', weight: 10, progress: [15, 75], repeatable: true, gain: 3,
  text:
`복도 모퉁이에서 셋이 기다리고 있었다.

"편입생." 가운데 애가 말했다. "너 요즘 이상한 거 캐고 다닌다며."

"누가 그래?"

"다들." 그 애가 지팡이를 꺼냈다. "그만 좀 해. 다들 불편해하니까."`,
  stages: [
    {
      choices: [
        {
          label: '"왜 불편한데?"',
          check: { stat: 'charm', dc: 12 },
          deepen: true,
          outcomes: {
            critical: { effect: { charm: 2, exp: 34, mark: 'theyDoubt' }, deepen: true,
              text:
`"…모르겠어." 가운데 애가 말했다. 지팡이가 조금 내려갔다.

"그냥, 네가 뭘 찾을 때마다 뭔가 없어지는 것 같아서."

"뭐가 없어져?"

"몰라. 그게 문제야." 그 애가 다른 둘을 봤다. 둘 다 대답하지 않았다. "우린 그냥 무서운 거야."

셋 다 지팡이를 완전히 내리지는 않았다. 무서운 건 사라지지 않았으니까.` },
            success: { effect: { charm: 1, exp: 16, mark: 'theyDoubt' }, deepen: true,
              text:
`"몰라." 가운데 애가 말했다. "그냥 불편해."

세 명 다 자기들이 왜 여기 서 있는지 잘 모르는 눈치였다.` },
            fail: { effect: {}, deepen: true,
              text: '"핑계 대지 마." 그 애가 지팡이를 들었다. 뒤의 둘도 따라 들었다.' },
            fumble: { effect: { hp: -4 }, deepen: true,
              text: '말하는 중에 옆에서 하나가 쐈다. 셋이 동시에 놀랐다 — 쏜 애까지도.' },
          },
        },
        {
          label: '셋의 얼굴을 하나씩 본다',
          check: { stat: 'intelligence', dc: 12, search: true },
          deepen: true,
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 32, mark: 'knowsFace' }, deepen: true,
              text:
`영운은 셋을 차례로 봤다.

왼쪽 애는 안다. 지난주에 도서관에서 같은 책상에 앉았다. 이름도 안다.

가운데도 안다. 마주칠 때마다 인사하는 사이다.

오른쪽 — 오른쪽 애는 처음 보는 얼굴이다. 그런데 교복 소매에 잉크 자국이 있다. 영운의 잉크병에서 나는 것과 같은 색.

"너 나 알아?" 영운이 오른쪽 애에게 물었다.

그 애가 대답하지 않았다. 대신 한 걸음 뒤로 물러났다.` },
            success: { effect: { exp: 18, mark: 'knowsFace' }, deepen: true,
              text:
`셋 중 둘은 아는 얼굴이다. 오른쪽 하나는 처음 본다.

처음 보는 그 애의 소매에 잉크 자국이 있었다.` },
            fail: { effect: {}, deepen: true,
              text: '셋 다 낯이 익은 것도 같고 아닌 것도 같았다. 이 성에서는 흔한 일이다.' },
            fumble: { effect: { hp: -3 }, deepen: true,
              text: '너무 오래 봤다. "뭘 봐." 하고는 하나가 밀쳤다. 벽에 등을 부딪혔다.' },
          },
        },
        {
          label: '도망친다',
          check: { stat: 'agility', dc: 8 },
          gain: 1,
          outcomes: {
            critical: { effect: { agility: 1, exp: 18 },
              text:
`영운은 말 대신 뛰었다.

모퉁이를 세 번 돌아 따돌렸다. 뒤에서 누가 이름을 불렀는데, 부른 이름이 영운의 이름이 아니었다.

멈춰서 들으려 했지만 이미 멀었다.` },
            success: { effect: { hp: -2 }, text: '등에 한 방 맞았지만 빠져나왔다. 뛰는 동안 뒤에서 누가 뭐라고 외쳤는데 알아듣지 못했다.' },
            fail: { effect: { hp: -6 }, text: '막다른 길이었다. 실컷 맞고 풀려났다.' },
            fumble: { effect: { hp: -8 }, text: '넘어졌다. 셋이 둘러쌌다.' },
          },
        },
      ],
    },
    {
      text: (s) => (s.episode && s.episode.knowsFace)
        ? `오른쪽 애가 또 한 걸음 물러났다.\n\n그러자 가운데 애가 돌아봤다. "…너 누구야?"\n\n셋이 서로를 봤다. 아무도 대답하지 못했다.\n\n그 순간 오른쪽 애가 먼저 쐈다.`
        : `가운데 애가 지팡이를 고쳐 쥐었다.\n\n"마지막 경고야."\n\n마지막 경고라는 말은, 처음 경고가 언제였는지 아무도 모른다는 뜻이다.`,
      choices: [
        { label: '맞선다', combat: 'rivalStudent', branch: { win: 2, lose: 2 },
          resultText: '셋 중 하나가 먼저 쐈다.' },
        {
          label: '수첩을 꺼내 셋의 이름을 적는다',
          requiresMark: 'theyDoubt',
          check: { stat: 'charm', dc: 12 },
          gain: 3,
          branch: { win: 2, lose: 2 },
          outcomes: {
            critical: { effect: { charm: 1, exp: 40, register: 'simon', mark: 'wroteThem' },
              text:
`영운은 지팡이 대신 수첩을 꺼냈다.

"이름 뭐야."

"…뭐?"

"셋 다. 이름."

가운데 애가 어이없다는 표정을 지었다가, 영운이 정말로 펜을 들고 기다리는 걸 보고 말했다. 나머지 둘도 말했다.

영운은 셋의 이름을 적었다. 철자를 물어가면서.

"이게 뭐 하는 건데."

"너희가 없어지면 내가 찾을 수 있게." 영운이 수첩을 덮었다. "누가 없어지고 있어. 나도 누군지 몰라. 그래서 적는 거야."

셋이 서로를 봤다. 지팡이는 어느새 다 내려가 있었다.

가운데 애가 마지막으로 말했다. "…나도 적어줄까? 네 이름."

영운은 잠깐 말이 없다가, 고개를 끄덕였다.` },
            success: { effect: { exp: 24, register: 'simon', mark: 'wroteThem' },
              text:
`영운은 수첩을 꺼내 셋의 이름을 물어 적었다.

"이게 뭐 하는 건데."

"너희가 없어지면 찾을 수 있게."

셋 다 대꾸하지 못했다. 지팡이가 내려갔다.` },
            fail: { effect: { hp: -4 }, text: '"미쳤나 봐." 하나가 수첩을 쳐서 떨어뜨렸다.', combat: 'rivalStudent', branch: { win: 2, lose: 2 } },
            fumble: { effect: { hp: -6 }, text: '수첩을 꺼내는 동작을 지팡이로 오해했다.', combat: 'rivalStudent', branch: { win: 2, lose: 2 } },
          },
        },
      ],
    },
    {
      gain: 2,
      text: (s) => (s.episode && s.episode.wroteThem)
        ? `셋은 갔다.\n\n영운은 복도에 남아 수첩을 봤다. 이름 세 개가 나란히 적혀 있다.\n\n그중 하나 — 오른쪽에 서 있던 애 이름 — 의 잉크가 벌써 조금 흐려 보였다.\n\n기분 탓일 것이다. 기분 탓이어야 한다.`
        : `복도가 비었다.\n\n영운은 벽에 기대 숨을 골랐다. 입술 안쪽이 찢어져서 피 맛이 났다.\n\n바닥에 뭔가 떨어져 있었다. 누가 흘린 것이다.`,
      choices: [
        {
          label: '떨어진 것을 줍는다',
          check: { stat: 'agility', dc: 8 },
          outcomes: {
            critical: { effect: { agility: 1, exp: 34, equipDrop: { slot: 'accessory', tier: 2 } },
              text:
`배지였다. 기숙사 배지인데, 뒷면에 이름이 새겨져 있다.

이름은 읽을 수 있었다. 다만 그 이름이 방금 여기 있던 셋 중 누구의 것도 아니었다.

영운은 배지를 소매에 달았다. 주인이 나타나면 돌려줄 생각이었다.

주인이 나타날 것 같지는 않았다.` },
            success: { effect: { exp: 18, equipDrop: { slot: 'accessory', tier: 1 } },
              text: '기숙사 배지였다. 뒷면에 새겨진 이름은 방금 그 셋 중 누구의 것도 아니었다.\n\n일단 챙겼다.' },
            fail: { effect: {},
              text: '주우려고 몸을 굽히다 어지러웠다. 다시 봤을 때는 아무것도 없었다.' },
            fumble: { effect: { hp: -2 },
              text: '굽히는 순간 갈비뼈가 아팠다. 주저앉아서 한참 있었다.' },
          },
        },
        {
          label: '그냥 간다',
          effect: { exp: 14, hp: -2 },
          resultText:
`영운은 벽에서 등을 뗐다.

복도 끝까지 걸어가는 동안, 아까 그 셋이 왜 왔는지 계속 생각했다.

"다들 불편해한다"는 말은 이상하다. 이 성에서 영운을 아는 사람은 얼마 안 된다. 다들이라고 할 만큼은 아니다.

누군가 "다들"이라는 말을 그 애들 입에 넣어준 것이다.

그 누군가가 누군지는, 그 애들도 모른다.` },
      ],
    },
  ],
},

/* ── 아크로만툴라 · 2단계 ─────────────────────────────────
 * 깊은 숲. 위험도가 높고 보상도 높다. */
acromantula_nest: {
  id: 'acromantula_nest', pool: 'combat', weight: 8, progress: [55, 100], gain: 4,
  text:
`금지된 숲 깊은 쪽. 나무 사이에 흰 것이 걸려 있다.

거미줄이라기엔 두껍다. 밧줄에 가깝다.

발밑에서 뭔가 바스러졌다. 내려다보니 뼈였다. 사슴 것이었으면 좋겠다고 생각했다.`,
  stages: [
    {
      choices: [
        {
          label: '뼈를 확인한다',
          check: { stat: 'courage', dc: 12, search: true },
          deepen: true,
          outcomes: {
            critical: { effect: { courage: 2, exp: 40, mark: 'sawBones' }, deepen: true,
              text:
`영운은 쪼그려 앉아 뼈를 봤다.

사슴이었다. 세 마리쯤. 다행이다.

다행이 아닌 건 그 옆이었다. 뼈 무더기 가장자리에 천 조각이 하나 섞여 있었다. 교복 천이다. 색이 바랬지만 짜임은 안다 — 매일 입는 옷이니까.

주머니 자리가 남아 있었다. 주머니 안에 종이가 접혀 들어 있었다.

꺼내려다 손이 멈췄다. 위쪽에서 뭔가 움직였기 때문이다.` },
            success: { effect: { courage: 1, exp: 22, mark: 'sawBones' }, deepen: true,
              text:
`사슴 뼈다. 그리고 그 사이에 교복 천 조각이 하나.

주머니 자리가 남아 있고, 안에 종이가 접혀 있었다.` },
            fail: { effect: { hp: -4 }, deepen: true,
              text: '몸을 숙이는 순간 위에서 실 한 가닥이 내려왔다. 목덜미에 닿았다.' },
            fumble: { effect: { hp: -7 }, deepen: true,
              text: '뼈 무더기에 손을 짚었는데 안쪽이 비어 있었다. 팔이 팔꿈치까지 빠졌다.' },
          },
        },
        {
          label: '숨을 죽이고 물러난다',
          check: { stat: 'agility', dc: 16 },
          gain: 2,
          outcomes: {
            critical: { effect: { agility: 2, exp: 40 },
              text:
`한 발짝씩, 밟았던 자리만 다시 밟으며 물러났다.

끝까지 들키지 않았다.

숲 가장자리에 닿아서야 뒤를 봤다. 나무 사이 흰 것이 조금 흔들렸다. 바람은 없었다.` },
            success: { effect: { hp: -5, exp: 20 }, text: '나뭇가지를 밟았다. 뒤에서 소리가 났지만 뛰어서 빠져나왔다.' },
            fail: { effect: { hp: -11 }, text: '거미줄에 팔이 걸렸다. 소매를 찢고 도망쳤다.' },
            fumble: { effect: {}, text: '거미줄 한가운데를 밟았다.', combat: 'acromantula', branch: { win: 1 } },
          },
        },
      ],
    },
    {
      text: (s) => (s.episode && s.episode.sawBones)
        ? `나무 위쪽에서 다리 여덟 개가 한꺼번에 움직였다.\n\n영운은 종이를 쥔 손을 주머니에 넣었다. 그것만은 놓지 않기로 했다.\n\n다른 손으로 지팡이를 들었다.`
        : `나무 위쪽에서 다리 여덟 개가 한꺼번에 움직였다.\n\n하나가 아니었다. 나무마다 하나씩이었다.`,
      choices: [
        { label: '맞선다', combat: 'acromantula', branch: { win: 2 },
          resultText: '영운은 등을 나무에 붙였다.' },
        {
          label: '패트로누스를 시도한다',
          requiresSpell: 'expectoPatronum',
          check: { stat: 'courage', dc: 12 },
          gain: 4,
          branch: { win: 2 },
          outcomes: {
            critical: { effect: { courage: 2, exp: 50, equipDrop: { slot: 'accessory', tier: 3 } },
              text:
`은빛이 숲을 밝혔다.

그것들이 물러섰다. 빛을 싫어하는 게 아니라 — 빛 안에 있는 무언가를 싫어하는 것처럼 보였다.

영운의 패트로누스는 형태가 흐렸다. 무엇인지 알아볼 수 없는 짐승. 다만 그것이 나무 위쪽을 향해 고개를 들었고, 그러자 다리 여덟 개들이 전부 물러났다.

물러선 자리, 나무 밑동에 오래된 물건이 하나 걸려 있었다. 거미줄에 감긴 채로 몇 년쯤.` },
            success: { effect: { exp: 26 },
              text: '은빛 안개가 퍼지자 나무 위쪽이 조용해졌다. 영운은 뒷걸음으로 그 자리를 빠져나왔다.' },
            fail: { effect: { hp: -7 }, text: '빛이 채 모이기 전에 흩어졌다.', combat: 'acromantula', branch: { win: 2 } },
            fumble: { effect: { hp: -10 }, text: '집중이 깨졌다. 그것들이 그 틈을 알아챘다.', combat: 'acromantula', branch: { win: 2 } },
          },
        },
      ],
    },
    {
      gain: 4,
      text: (s) => (s.episode && s.episode.sawBones)
        ? `조용해진 뒤 영운은 주머니에서 종이를 꺼냈다.\n\n오래돼서 손을 대면 부서질 것 같았다. 조심스럽게 폈다.`
        : `조용해진 뒤 영운은 나무 밑동을 봤다.\n\n거미줄에 감긴 채 뭔가 걸려 있었다. 사람 물건이다.\n\n줄을 걷어내고 꺼냈다. 낡은 가방이었고, 안에 종이 한 장이 남아 있었다.`,
      choices: [
        {
          label: '읽는다',
          check: { stat: 'intelligence', dc: 12 },
          outcomes: {
            critical: { effect: { intelligence: 2, exp: 56, fragment: 3 },
              text:
`손으로 쓴 편지였다. 부치지 못한 것이다.

「엄마에게.

여기 온 지 반년이 지났어요. 잘 지내요.

한 가지만 이상해요. 같은 방 애 이름을 자꾸 잊어버려요. 아침에 일어나면 없어져 있어요. 그래서 손등에 적어두는데, 씻으면 지워지고, 다시 물어보기가 창피해서 못 물어봐요.

그 애도 제 이름을 잊는 것 같아요. 어제는 저를 보고 "너 몇 학년이야?"라고 물었어요. 같은 방을 쓰는데.

이 편지는 부치지 않을 거예요. 부치면 엄마가 걱정하니까. 그냥 적어두려고요.

적어두면 남는다고 누가 그랬어요. 그게 누구였는지도 지금은 기억이 안 나요.」

서명 자리는 비어 있었다. 자기 이름을 쓰지 않은 것이다.

아니면 — 쓸 때 이미 잊어버렸거나.` },
            success: { effect: { intelligence: 1, exp: 32, fragment: 3 },
              text:
`부치지 못한 편지였다.

같은 방 친구의 이름을 자꾸 잊는다는 내용. 손등에 적어두는데 씻으면 지워진다는 내용.

「적어두면 남는다고 누가 그랬어요. 그게 누구였는지도 지금은 기억이 안 나요.」

서명 자리는 비어 있었다.` },
            fail: { effect: { hp: -2 },
              text: '펴는 순간 종이가 부서졌다. 손바닥 위에 조각만 남았다.\n\n한 조각에 「이름」이라는 글자가 보였다. 그게 전부였다.' },
            fumble: { effect: { hp: -5 },
              text: '손이 떨려서 종이를 놓쳤다. 낙엽 사이로 떨어졌고, 아무리 뒤져도 못 찾았다.\n\n무릎을 꿇고 한참 뒤졌다. 그러다 뒤에서 소리가 나서 일어나야 했다.' },
          },
        },
        {
          label: '읽지 않고 가져 나온다',
          effect: { exp: 30, item: 'oldDiary', alignment: 2 },
          resultText:
`영운은 종이를 접었다.

여기서 읽지 않기로 했다. 이런 건 밝은 데서 읽어야 한다. 그리고 옮겨 적을 준비가 됐을 때 읽어야 한다.

한 번 읽고 잊어버리면 아무 소용이 없으니까.

가방째 챙겨서 숲을 나왔다. 나오는 길에 한 번도 안 쉬었다.` },
      ],
    },
  ],
},

/* ── 가면 · 2단계 ─────────────────────────────────────────
 * 가면 아래가 비어 있다. 잊힌 것은 사람만이 아니다. */
deatheater_shade: {
  id: 'deatheater_shade', pool: 'combat', weight: 8, progress: [60, 100], gain: 4,
  text:
`복도 끝에 가면 쓴 형체가 서 있었다.

이십오 년 전에 이 성에서 죽은 자들의 흔적이 가끔 이런 모양으로 남는다고 한다. 사람은 아니고, 사람이었던 자리에 남은 습관 같은 것.

그것이 지팡이를 들었다. 그 동작만은 아주 정확했다.`,
  stages: [
    {
      choices: [
        {
          label: '가면 아래를 본다',
          check: { stat: 'courage', dc: 16 },
          deepen: true,
          outcomes: {
            critical: { effect: { courage: 2, exp: 46, flag: 'sawUnderMask', mark: 'sawEmpty' }, deepen: true,
              text:
`가면 아래에는 아무것도 없었다.

얼굴이 아니라 — 얼굴이 있어야 할 자리가 비어 있었다. 검지도 않고 하얗지도 않은, 그냥 없음.

이 자리에 있던 사람도 잊힌 것이다. 이십오 년 동안, 아주 천천히.

지팡이를 든 자세만 남았다. 그것만 아무도 잊지 않았으니까 — 그 밤에 그 자세를 본 사람이 너무 많았으니까.

형체가 흔들렸다.` },
            success: { effect: { exp: 24, mark: 'sawEmpty' }, deepen: true,
              text:
`가면 아래가 비어 있었다. 얼굴이 있어야 할 자리에 아무것도 없다.

남은 것은 지팡이를 든 자세뿐이었다.` },
            fail: { effect: { hp: -8 }, deepen: true,
              text: '가까이 간 게 실수였다. 지팡이 끝이 먼저 닿았다.' },
            fumble: { effect: { hp: -12 }, deepen: true,
              text: '눈이 마주쳤다. 마주칠 눈이 없는데도 마주쳤다는 느낌이 들었고, 그 순간 몸이 굳었다.' },
          },
        },
        {
          label: '물러선다',
          check: { stat: 'agility', dc: 12 },
          gain: 1,
          outcomes: {
            critical: { effect: { agility: 1, exp: 20 },
              text:
`뒷걸음으로 모퉁이를 돌았다. 따라오지 않았다.

모퉁이 뒤에서 한참 서 있다가 다시 내다봤다. 형체는 같은 자리에 같은 자세로 서 있었다.

지팡이를 든 채로. 아무도 없는 복도를 향해서.

이십오 년 동안 저러고 있었던 것이다.` },
            success: { effect: { hp: -4 }, text: '한 발 늦었다. 어깨를 스쳤고 그 자리가 한참 저렸다.' },
            fail: { effect: { hp: -10 }, text: '등을 보인 게 잘못이었다.' },
            fumble: { effect: { hp: -13 }, text: '넘어졌다. 일어났을 때는 이미 복도 반대쪽이었고, 어떻게 왔는지 기억이 없었다.' },
          },
        },
      ],
    },
    {
      text: (s) => (s.episode && s.episode.sawEmpty)
        ? `형체가 흔들리면서도 지팡이를 내리지 않았다.\n\n비어 있는 자리로 영운을 겨누고 있다.\n\n싸울 이유는 없다. 다만 저것은 그걸 모른다.`
        : `그것이 지팡이를 겨눴다.\n\n조준이 정확했다. 살아 있는 사람보다 정확했다.\n\n그것은 이 동작을 아주 여러 번 했을 것이다.`,
      choices: [
        { label: '맞선다', combat: 'deathEater', branch: { win: 2, lose: 2, flee: 2 },
          resultText: '영운도 지팡이를 들었다.' },
        {
          label: '이름을 물어본다',
          requiresMark: 'sawEmpty',
          check: { stat: 'charm', dc: 16 },
          gain: 5,
          branch: { win: 2, lose: 2 },
          outcomes: {
            critical: { effect: { charm: 2, exp: 60, fragment: 6, mark: 'asked' },
              text:
`"이름이 뭐예요?"

영운은 지팡이를 내리고 물었다.

형체가 멈췄다. 겨눈 지팡이가 흔들렸다.

한참 아무 일도 없었다. 그러다 가면 안쪽에서 소리가 났다. 목소리는 아니었다. 목소리가 났던 자리에서 나는 소리였다.

무언가 말하려는 것이었다. 자기 이름을.

말하지 못했다. 세 번 시도하고, 세 번 다 실패했다.

네 번째에 형체가 무너졌다. 복도 바닥에 가면이 떨어졌고, 가면 안쪽에 글자가 새겨져 있었다. 손으로 새긴 것이다. 오래전에.

읽을 수 있는 글자는 몇 개뿐이었다. 영운은 그것들을 수첩에 옮겨 적었다.

이 성에서 잊힌 것은 학생만이 아니다.` },
            success: { effect: { exp: 34, fragment: 6 },
              text:
`"이름이 뭐예요?"

형체가 멈췄다. 대답하려다 실패하고, 무너졌다.

떨어진 가면 안쪽에 손으로 새긴 글자가 몇 개 남아 있었다. 영운은 그것을 옮겨 적었다.` },
            fail: { effect: { hp: -8 },
              text: '질문이 그것을 자극했다. 이름을 묻는 건 이 성에서 제일 위험한 질문이다.', combat: 'deathEater', branch: { win: 2, lose: 2 } },
            fumble: { effect: { hp: -12 },
              text: '입을 여는 순간 주문이 왔다. 그것은 질문을 기다려주지 않았다.', combat: 'deathEater', branch: { win: 2, lose: 2 } },
          },
        },
      ],
    },
    {
      gain: 3,
      text:
`복도가 조용해졌다.

형체가 있던 자리에 먼지가 남았다. 아주 고운 먼지. 발로 흩으면 없어질 정도의.

벽 쪽에 뭔가 기대 있었다. 지팡이다. 부러지지 않은 채로 이십오 년.`,
      choices: [
        {
          label: '지팡이를 살펴본다',
          check: { stat: 'intelligence', dc: 16, search: true },
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 50, equipDrop: { slot: 'wand', tier: 3 } },
              text:
`영운은 지팡이를 집어 들었다. 차가웠고, 생각보다 가벼웠다.

손잡이 쪽에 이름을 새기는 자리가 있다. 지팡이 장인들이 늘 남기는 자리다.

그 자리가 파여 있었다. 새긴 게 아니라 파낸 것이다. 누가 칼로 이름을 도려냈다.

도려낸 자국이 깊고 서툴다. 급하게 한 것이다.

이름을 지우려고 한 사람이 있었다는 뜻이고 — 그리고 그 방법이 통했다는 뜻이다.

영운은 지팡이를 가방에 넣었다. 무기로 쓸 생각은 아니었다. 증거로 쓸 생각이었다.` },
            success: { effect: { exp: 30, equipDrop: { slot: 'wand', tier: 2 } },
              text:
`손잡이의 이름 새기는 자리가 칼로 도려내져 있었다. 서툴고 깊게.

누가 이름을 지우려고 했고, 통했다.

영운은 지팡이를 챙겼다.` },
            fail: { effect: { hp: -5 },
              text: '집어 든 순간 손끝이 저렸다. 놓쳤고, 바닥에 닿자 지팡이가 재처럼 부서졌다.' },
            fumble: { effect: { hp: -8 },
              text: '손이 닿는 순간 팔 전체가 얼어붙었다. 풀리는 데 몇 분 걸렸고, 그동안 아무것도 못 했다.\n\n풀렸을 때 지팡이는 없었다.' },
          },
        },
        {
          label: '먼지를 쓸어 담는다',
          effect: { exp: 26, item: 'inkBottle', alignment: 4 },
          resultText:
`영운은 지팡이를 건드리지 않았다.

대신 수첩 한 장을 찢어 접고, 바닥의 먼지를 그 위에 쓸어 담았다.

무엇을 하려는 건지 자기도 잘 몰랐다. 다만 사람이었던 것을 복도에 그냥 두고 가는 게 싫었다.

접은 종이를 안주머니에 넣고, 겉에 적었다.

「이름 모름. 5월. 3층 서쪽 복도.」

이름을 모르면 자리라도 적어두는 수밖에 없다.

돌아가는 길에 잉크가 떨어져서 창고에 들렀다. 잉크는 요즘 자꾸 떨어진다.` },
      ],
    },
  ],
},

/* ── 리들의 그림자 · 2단계 ────────────────────────────────
 * 방법을 버린 자. 대가를 못 치러서 버린 것이다. */
riddle_shade_encounter: {
  id: 'riddle_shade_encounter', pool: 'combat', weight: 6, progress: [70, 100], gain: 5,
  text:
`필요의 방 안쪽, 물건 더미 사이에서 소년 하나가 서 있었다.

열여섯쯤. 교복이 낡았지만 단정하다. 얼굴은 잘생겼고, 표정은 없었다.

"여기까지 온 사람은 오랜만이군." 그가 말했다. "무엇을 찾나?"

그의 발밑에 그림자가 없었다.`,
  stages: [
    {
      choices: [
        {
          label: '"당신이 여기서 뭘 만들려고 했죠?"',
          check: { stat: 'intelligence', dc: 16, search: true },
          deepen: true,
          outcomes: {
            critical: { effect: { intelligence: 2, exp: 60, flag: 'knowsTheMethod', mark: 'toldMethod' }, deepen: true,
              text:
`"기억되는 법." 그가 벽 쪽을 봤다. "육체가 안 죽는 것과 잊히지 않는 것은 다른 문제니까."

"완성했어요?"

"아니. 대가가 이상했어." 그가 고개를 갸웃했다. "하나를 새기려면 다른 하나를 놓아야 하더군. 나는 놓을 게 없었어. 아무것도 아끼지 않았으니까."

그가 영운을 봤다.

"그러니까 이건, 아끼는 게 있는 사람만 쓸 수 있는 마법이야. 그래서 버렸지. 쓸모가 없어서."` },
            success: { effect: { exp: 30, flag: 'knowsTheMethod', mark: 'toldMethod' }, deepen: true,
              text:
`"기억되는 법이지." 그가 말했다. "대가가 이상해서 버렸어. 하나를 새기려면 다른 하나를 놓아야 하거든."

"놓는다는 게 무슨 뜻이에요?"

"직접 해보면 알아." 그가 웃지 않고 말했다.` },
            fail: { effect: { hp: -7 }, deepen: true,
              text: '그가 대답하지 않았다. 대신 천천히 지팡이를 들었다.\n\n"질문이 잘못됐어."' },
            fumble: { effect: { hp: -10 }, deepen: true,
              text: '질문이 그를 흥미롭게 만들었다.\n\n"자네가 왜 그걸 묻는지가 더 궁금하군." 그가 다가왔다.' },
          },
        },
        {
          label: '아무 말도 하지 않고 나간다',
          gain: 2, effect: { hp: -3 },
          resultText:
`영운은 돌아섰다.

"현명하군." 뒤에서 목소리가 들렸다. "다만 자네가 찾는 건 내가 아니야. 나는 그걸 버렸고, 누군가 주웠지."

돌아봤을 때 그는 없었다.

문까지 가는 몇 걸음 동안 등 뒤가 계속 서늘했다. 문을 닫고 나서야 그 말이 무슨 뜻인지 생각할 여유가 생겼다.

누군가 주웠다. 이십오 년 전이 아니라, 그 뒤에.` },
      ],
    },
    {
      text: (s) => (s.episode && s.episode.toldMethod)
        ? `"그런데 자네."\n\n그가 지팡이를 들었다. 대화는 끝났다는 뜻이었다.\n\n"아끼는 게 있나?"\n\n영운은 대답하지 않았다. 수첩에 적힌 이름들이 갑자기 무겁게 느껴졌다.`
        : `"이야기는 여기까지."\n\n그가 지팡이를 들었다. 동작에 군더더기가 없었다.\n\n"여기까지 온 사람은 오랜만이라고 했지. 그건 반가운 뜻이 아니었네."`,
      choices: [
        { label: '싸운다', combat: 'riddleShade', branch: { win: 2, lose: 2, flee: 2 },
          resultText: '영운이 지팡이를 들자 그가 처음으로 웃었다.' },
        {
          label: '"당신은 누구한테 기억되고 싶었어요?"',
          requiresMark: 'toldMethod',
          check: { stat: 'charm', dc: 16 },
          gain: 5,
          branch: { win: 2, lose: 2 },
          outcomes: {
            critical: { effect: { charm: 2, intelligence: 1, exp: 70, fragment: 4 },
              text:
`그가 멈췄다.

지팡이가 반쯤 올라간 채로 멈췄고, 처음으로 표정 비슷한 것이 얼굴에 지나갔다.

"…무슨 뜻이지."

"기억되는 법을 찾았다면서요. 누구한테요?"

침묵이 길었다. 물건 더미 어딘가에서 뭔가 넘어지는 소리가 났다.

"모두에게." 그가 말했다.

"모두는 아무도 아니에요."

그가 영운을 봤다. 아주 오래 봤다.

"…그래서 안 됐던 건가."

그가 지팡이를 내렸다. 그리고 물건 더미 쪽으로 걸어가더니, 뭔가를 꺼내 영운 쪽으로 던졌다. 종이 뭉치였다.

"가져가. 나한테는 쓸모없었으니까."

돌아봤을 때 그는 없었다.` },
            success: { effect: { charm: 1, exp: 40, fragment: 4 },
              text:
`"모두에게." 그가 말했다.

"모두는 아무도 아니에요."

그가 한참 말이 없다가 지팡이를 내렸다. 물건 더미에서 종이 뭉치를 하나 꺼내 던져주고는 사라졌다.` },
            fail: { effect: { hp: -8 },
              text: '"건방지군."\n\n그가 웃음을 거뒀다.', combat: 'riddleShade', branch: { win: 2, lose: 2 } },
            fumble: { effect: { hp: -11 },
              text: '말이 끝나기도 전에 주문이 왔다. 그는 질문을 두 번 듣지 않는다.', combat: 'riddleShade', branch: { win: 2, lose: 2 } },
          },
        },
      ],
    },
    {
      gain: 4,
      text:
`방이 조용해졌다.

물건 더미가 아까보다 낮아진 것 같았다. 필요의 방은 필요한 만큼만 보여준다고 한다.

발밑에 종이 뭉치가 있었다. 손으로 쓴 것이다. 여러 사람 필체가 섞여 있다.`,
      choices: [
        {
          label: '뭉치를 넘겨본다',
          check: { stat: 'intelligence', dc: 16, search: true },
          outcomes: {
            critical: { effect: { intelligence: 2, exp: 66, fragment: 1, learnSubject: 'charms' },
              text:
`연구 기록이었다. 최소 세 사람의 필체.

제일 오래된 필체는 단정하고 기울어져 있다 — 방금 그 소년의 것이다. 주문의 뼈대를 세우다 만 흔적이 있고, 마지막 쪽에 크게 가로줄이 그어져 있다. 「불가. 대가 지불 불가」

두 번째 필체는 급하다. 같은 주문을 다시 세우려 한 흔적. 그리고 「대가는 지불 가능. 다만 방향이 반대」

세 번째 필체는 — 영운은 그 필체를 안다. 어디서 봤는지 떠오르지 않는데, 안다.

세 번째 필체는 한 줄만 썼다.

「이름 하나에 이름 하나. 공평하다.」

영운은 뭉치를 접어 가방에 넣었다. 손이 조금 떨렸다.

여기 적힌 것은 방법이다. 누가 그것을 쓰고 있는지는 아직 모른다. 다만 이제 세 사람이 아니라 한 사람을 찾으면 된다는 건 알겠다.` },
            success: { effect: { intelligence: 1, exp: 40, fragment: 1 },
              text:
`세 사람의 필체가 섞인 연구 기록이었다.

첫 번째: 「불가. 대가 지불 불가」
두 번째: 「대가는 지불 가능. 다만 방향이 반대」
세 번째: 「이름 하나에 이름 하나. 공평하다.」

세 번째 필체를 영운은 어디선가 본 적이 있었다.` },
            fail: { effect: { hp: -6 },
              text: '넘기는 순간 종이가 손에서 미끄러졌다. 뭉치가 흩어졌고, 필요의 방이 그것을 삼켰다.\n\n한 장만 손에 남았다. 백지였다.' },
            fumble: { effect: { hp: -10 },
              text: '읽기 시작하자마자 머리가 아팠다. 눈을 뜨니 방 밖 복도였다.\n\n손에는 아무것도 없었다. 시간이 얼마나 지났는지도 알 수 없었다.' },
          },
        },
        {
          label: '읽지 않고 통째로 옮겨 적는다',
          effect: { exp: 44, item: 'oldDiary', intelligence: 1, alignment: 3 },
          resultText:
`영운은 뭉치를 펴놓고 수첩을 꺼냈다.

읽으면 잊는다. 옮겨 적으면 남는다. 이 성에서 배운 것 중 제일 확실한 규칙이다.

한 시간을 앉아서 베꼈다. 무슨 뜻인지 생각하지 않고, 보이는 대로만.

다 베끼고 나서 원본을 봤다. 원본은 이미 흐려지고 있었다 — 필요의 방이 회수하는 중이다.

베낀 쪽은 그대로였다.

영운은 수첩을 덮고 방을 나왔다. 무슨 내용인지는 아직 모른다. 하지만 이제 아무 때나 읽을 수 있다.` },
      ],
    },
  ],
},

/* ── 짧은 조우들 ──────────────────────────────────────────
 * 전부 3단계로 만들면 판이 늘어지기만 한다.
 * 아래 넷은 2단계로 짧게 가되, 결과 문장만은 장면으로 쓴다. */

marsh_hinkypunk: {
  id: 'marsh_hinkypunk', pool: 'combat', weight: 10, progress: [10, 70], repeatable: true, gain: 3,
  text:
`호수 서쪽 습지. 지름길이라고 해서 왔는데 지름길이 아니었다.

앞쪽에서 등불이 흔들렸다. 사람이 든 등불처럼 딱 그 높이에서.

한 걸음 다가가자 등불도 한 걸음 물러났다.`,
  stages: [
    {
      choices: [
        {
          label: '등불이 아니라 그 아래를 본다',
          check: { stat: 'intelligence', dc: 12, search: true },
          deepen: true,
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 30, mark: 'sawUnder' }, deepen: true,
              text:
`영운은 빛을 보지 않으려고 애썼다. 빛을 보면 눈이 어둠에 안 익는다.

등불 아래 한 뼘쯤을 봤다.

거기 그림자가 있었다. 등불을 든 손이 아니라 — 등불이 그 자체로 몸인 것의 그림자.

그리고 그 그림자가 밟고 선 자리는 물이 아니었다. 마른 흙이다.

물 한가운데 마른 흙이 한 뼘. 저기까지 가는 길이 있다는 뜻이다.` },
            success: { effect: { exp: 16, mark: 'sawUnder' }, deepen: true,
              text:
`빛 아래를 봤다. 그것이 서 있는 자리만 마른 흙이다.

물 한가운데에.` },
            fail: { effect: { hp: -3 }, deepen: true,
              text: '눈이 빛에 익어버렸다. 발밑이 안 보이게 됐고, 한 걸음에 무릎까지 빠졌다.' },
            fumble: { effect: { hp: -6 }, deepen: true,
              text: '빛을 정면으로 봤다. 잔상이 오래 남았고, 그 잔상 안에서 뭔가 움직이는 것 같았다.' },
          },
        },
        {
          label: '반대로 걷는다',
          check: { stat: 'intelligence', dc: 8 },
          gain: 1,
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 24 },
              text:
`등불이 이끄는 반대쪽으로 걸었다. 십 분 만에 마른 땅이 나왔다.

돌아보니 등불은 아직 그 자리에서 흔들리고 있었다. 사람을 기다리는 높이에서.

저것은 누굴 기다리는 걸까. 걸으면서 그 생각을 했다.` },
            success: { effect: {}, text: '한참 헤맸지만 결국 길을 찾았다. 신발이 젖었고 발가락이 얼었다.' },
            fail: { effect: { hp: -4 }, text: '무릎까지 빠졌다. 빠져나오는 데 한참 걸렸다.' },
            fumble: { effect: { hp: -7 }, text: '허리까지 빠졌다. 뭔가가 발목을 잡아당기는 느낌이 들었다.' },
          },
        },
      ],
    },
    {
      text: (s) => (s.episode && s.episode.sawUnder)
        ? `영운은 마른 흙 자리를 향해 걸었다.\n\n등불이 처음으로 물러나지 않았다. 오히려 다가왔다.\n\n들킨 것이다.`
        : `등불이 갑자기 가까워졌다.\n\n한 걸음 물러나던 것이 세 걸음 다가왔다. 규칙이 바뀐 게 아니라, 규칙이 원래 그랬던 것이다.`,
      choices: [
        { label: '지팡이를 든다', combat: 'hinkypunk', branch: { win: 2 },
          resultText: '영운은 등불을 보지 않고 그 아래 어둠을 봤다.' },
        {
          label: '불을 끈다',
          requiresSpell: 'lumos',
          check: { stat: 'agility', dc: 12 },
          gain: 3,
          branch: { win: 2 },
          outcomes: {
            critical: { effect: { agility: 1, exp: 34, item: 'magicStone' },
              text:
`영운은 제 지팡이에 불을 켰다. 더 밝게.

두 개의 빛이 습지에 섰다. 그러자 그것이 흔들렸다 — 빛은 저것의 유일한 무기다. 유일한 무기가 흔해지면 쓸모가 없어진다.

그것이 물러났다. 물러난 자리에 뭔가 반짝였다.` },
            success: { effect: { exp: 20 }, text: '지팡이에 불을 켜자 그것이 물러났다. 빛이 흔해지면 저것은 힘을 잃는다.' },
            fail: { effect: { hp: -5 }, text: '불이 흔들렸다. 흔들리는 빛은 저것을 오히려 부른다.', combat: 'hinkypunk', branch: { win: 2 } },
            fumble: { effect: { hp: -7 }, text: '불을 켜는 순간 발이 미끄러졌다.', combat: 'hinkypunk', branch: { win: 2 } },
          },
        },
      ],
    },
    {
      gain: 2,
      text:
`등불이 꺼진 자리로 걸어갔다.

마른 흙이 정말로 한 뼘 있었다. 그 위에 뭔가 놓여 있다.

신발 한 짝이다. 학생 신발. 오래됐지만 썩지 않았다 — 마른 자리에 있었으니까.`,
      choices: [
        {
          label: '신발 안을 본다',
          check: { stat: 'courage', dc: 12 },
          outcomes: {
            critical: { effect: { courage: 1, exp: 36, fragment: 2, equipDrop: { slot: 'accessory', tier: 2 } },
              text:
`영운은 신발을 뒤집었다.

안창 아래에 종이가 접혀 있었다. 젖지 않았다.

「이 길로 가지 말 것. — 」

이름이 있어야 할 자리가 물에 번져 있었다. 아니, 물이 아니다. 잉크가 저 혼자 번진 것이다.

번진 자국 안에서 글자 한 조각만 남았다. 영운은 그것을 수첩에 옮겼다.

신발은 두고 왔다. 다른 한 짝을 신은 사람이 언젠가 찾으러 올지도 모르니까.

대신 안창을 챙겼다. 종이가 든 채로.` },
            success: { effect: { exp: 22, fragment: 2 },
              text:
`안창 아래에 접힌 종이. 「이 길로 가지 말 것. —」

이름 자리는 번져 있었다. 한 조각만 남았고, 영운은 그것을 옮겨 적었다.` },
            fail: { effect: { hp: -2 },
              text: '뒤집는 순간 신발이 삭아 부서졌다. 안에 뭐가 있었는지 알 수 없게 됐다.' },
            fumble: { effect: { hp: -5 },
              text: '손을 넣었다가 뭔가에 물렸다. 꺼내 보니 아무것도 없었지만 이빨 자국은 있었다.' },
          },
        },
        {
          label: '그 자리에 표시를 세우고 나온다',
          effect: { exp: 20, alignment: 3 },
          resultText:
`영운은 신발을 건드리지 않았다.

대신 나뭇가지를 하나 주워 마른 흙에 꽂고, 수첩 한 장을 찢어 묶었다.

「여기 신발 한 짝. 건드리지 말 것. — 영운」

종이는 비에 젖을 것이다. 하지만 오늘 밤은 안 온다.

돌아 나오는 길은 아까보다 짧았다. 습지가 길을 내준 건지, 그냥 길을 외운 건지는 알 수 없었다.` },
      ],
    },
  ],
},

grove_bowtruckle: {
  id: 'grove_bowtruckle', pool: 'combat', weight: 8, progress: [0, 50], repeatable: true, gain: 2,
  text:
`온실 뒤 지팡이나무 숲.

숲이라고 부르지만 나무 열댓 그루가 전부다. 그래도 지팡이 재료가 나오는 나무라 학교에서 관리한다.

가지가 낮게 뻗어서 손이 닿는다. 그래서 학생들이 몰래 꺾어 간다.

꺾어 가면 벌점인데, 벌점을 받고도 꺾는 애들이 있다. 좋은 가지는 지팡이 가게에서 값을 쳐주니까.

영운은 가지가 필요했다. 사려면 갈레온이 든다.

가지에 손을 뻗었다.

그 순간 뭔가가 영운을 노려보고 있다는 걸 알았다.

보우트러클이다.

손가락처럼 생긴 것이 나뭇가지 사이에서 움직인다. 나무와 색이 같아서 움직이기 전에는 안 보인다.

한 마리가 아니었다. 손을 멈추고 자세히 보니 가지마다 하나씩 있었다.

열댓 마리.

전부 영운을 보고 있었다.

보우트러클은 나무를 지킨다. 그게 이 생물의 유일한 일이다.

영운이 가지에 손을 뻗자 제일 가까운 것이 몸을 낮췄다.

싸울 자세다.

작은 것이 자기보다 열 배 큰 것 앞에서 싸울 자세를 잡는 걸 보는 건 이상한 기분이다.

이길 리가 없는데.

이길 생각도 없는 것 같았다. 그냥 안 비키겠다는 것이었다.`,
  stages: [
    {
      choices: [
        {
          label: '쥐며느리를 주고 달랜다',
          check: { stat: 'charm', dc: 8 },
          deepen: true,
          outcomes: {
            critical: { effect: { charm: 1, exp: 26, mark: 'befriended' }, deepen: true,
              text:
`영운은 주머니를 뒤져 쥐며느리 두 마리를 꺼냈다. 이런 걸 들고 다니게 된 지 오래됐다.

손바닥을 폈다.

그것이 한참 보다가 내려왔다. 손가락 같은 팔로 한 마리를 집어 들고, 나머지 한 마리는 두고 갔다.

그러더니 나무를 타고 올라가 제일 좋은 가지 쪽으로 비켜섰다. 여기를 꺾으라는 뜻이었다.

이 숲에서 처음으로 뭔가가 영운을 도왔다.` },
            success: { effect: { exp: 14, mark: 'befriended' }, deepen: true,
              text: `영운은 손바닥을 폈다. 쥐며느리 두 마리.

그것이 한참 봤다.

그리고 아주 천천히 가지를 타고 내려왔다. 한 걸음씩. 언제든 도망칠 수 있는 자세로.

손바닥까지 와서 또 한참 봤다.

손가락 같은 팔로 한 마리를 집어 들었다.

먹지 않고 들고만 있었다. 그러고는 위쪽으로 올라가더니, 더 작은 것에게 줬다.

새끼였다.

돌아 내려와서 나머지 한 마리를 자기가 먹었다.

먹고 나서 옆으로 물러났다.

비켜준 자리가 제일 좋은 가지 쪽이었다.

영운은 그 가지를 꺾었다.

꺾으면서 미안하다고 말했다. 나무한테 한 건지 그것한테 한 건지는 자기도 몰랐다.` },
            fail: { effect: { hp: -2 }, deepen: true,
              text: `쥐며느리를 내밀었는데 그것이 안 받았다.

한참 봤다. 손바닥 위의 쥐며느리를 봤다가, 영운의 얼굴을 봤다가, 다시 쥐며느리를 봤다.

그리고 손가락을 찔렀다.

아프기보다 얄미웠다.

"야."

그것이 가지 위로 물러났다. 그러고는 영운을 계속 봤다. 가지를 등지고.

받을 생각이 없는 게 아니라 — 받으면 비켜줘야 하니까 안 받은 것이다.

영운은 쥐며느리를 나무 밑동에 놓고 물러났다.

물러나서 봤더니 아무도 안 내려왔다.

먹을 것보다 나무가 먼저인 것들이었다.` },
            fumble: { effect: { hp: -4 }, deepen: true,
              text: `손을 뻗은 순간 가지가 흔들렸다.

대여섯 마리가 한꺼번에 얼굴로 뛰어내렸다.

영운은 소리를 지르고 뒤로 넘어졌다. 온실 뒤는 흙바닥이라 다치지는 않았는데 로브가 엉망이 됐다.

그것들이 얼굴에서 목으로, 목에서 소매 안으로 들어갔다.

털어내는 데 십 분이 걸렸다.

털어내고 나서 앉아 숨을 골랐다.

팔뚝에 찔린 자국이 열댓 개.

나무를 봤다.

전부 제자리로 돌아가 있었다. 아무 일도 없었던 것처럼.

한 마리만 제일 낮은 가지에 앉아 영운을 봤다.

영운도 봤다.

"…알았어."

일어나서 흙을 털고 온실 쪽으로 갔다.

가면서 한 번 돌아봤다. 그것이 아직 보고 있었다.` },
          },
        },
        {
          label: '그냥 가지를 꺾는다', combat: 'bowtruckle', gain: 3, branch: { win: 1 },
          resultText: `영운은 가지를 잡았다.

보우트러클이 손등으로 뛰어올랐다.

작다. 손가락 두 마디쯤. 무게는 거의 없다.

그런데 문다.

이빨이 있는 게 아니라 손끝이 날카로운 것이다. 찌른다는 쪽이 맞다.

영운은 손을 털었다. 털어도 안 떨어졌다. 소매를 붙잡고 매달렸다.

그리고 위쪽 가지에서 나머지가 내려오기 시작했다.` },
      ],
    },
    {
      gain: 2,
      text: (s) => (s.episode && s.episode.befriended)
        ? `가지를 꺾자 그것이 지켜봤다. 말리지 않았다.\n\n꺾은 자리에서 수액이 나왔는데, 색이 이상했다. 나무 수액이 아니라 잉크에 가까웠다.\n\n그것이 그 자리를 손가락으로 가리켰다.`
        : `그것들이 물러간 뒤 가지를 살폈다.\n\n꺾인 자리에서 나온 수액 색이 이상했다. 나무 수액이 아니라 잉크에 가깝다.\n\n지팡이나무는 이런 걸 내지 않는다.`,
      choices: [
        {
          label: '수액을 받는다',
          check: { stat: 'intelligence', dc: 12, search: true },
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 34, item: 'inkBottle', equipDrop: { slot: 'wand', tier: 1 } },
              text:
`영운은 빈 병을 대고 수액을 받았다.

병 안에서 그것은 완전히 잉크였다. 진하고, 검고, 조금 푸르다.

이 나무는 잉크를 만든다. 아니 — 이 나무 아래에 잉크가 있고, 나무가 그걸 빨아올린 것이다.

영운은 나무 밑동을 봤다. 흙이 조금 꺼져 있었다. 뭔가 묻혀 있다.

파낼 도구가 없어서 오늘은 위치만 적어뒀다. 대신 좋은 가지를 하나 얻었다.` },
            success: { effect: { exp: 18, item: 'inkBottle' },
              text: '빈 병에 수액을 받았다. 병 안에서 그것은 잉크였다.\n\n나무 밑동의 흙이 조금 꺼져 있었다. 위치를 적어뒀다.' },
            fail: { effect: {},
              text: '병을 대기 전에 수액이 굳었다. 굳은 것은 그냥 나뭇진이었다.' },
            fumble: { effect: { hp: -2 },
              text: '수액이 손등에 묻었다. 씻어도 안 지워졌다. 사흘쯤 갈 것 같다.' },
          },
        },
        {
          label: '가지만 챙겨 돌아간다',
          effect: { exp: 14, equipDrop: { slot: 'wand', tier: 1 } },
          resultText:
`영운은 가지를 챙겨 온실 쪽으로 걸었다.

돌아보니 그것이 아직 가지에 앉아 있었다. 이쪽을 보고 있다.

손을 한 번 들어 보였다. 그것도 팔 하나를 들었다 — 흉내 낸 건지, 원래 하던 동작인지는 알 수 없었다.

이 성에서 인사를 받은 게 오랜만이었다.` },
      ],
    },
  ],
},

werewolf_shade_hunt: {
  id: 'werewolf_shade_hunt', pool: 'combat', weight: 8, progress: [55, 100], gain: 4,
  text:
`보름달. 금지된 숲 쪽에서 소리가 났다.

늑대 울음은 아니었다. 늑대는 그렇게 오래 끌지 않는다.

나무 그림자가 하나 움직였다. 나무는 그대로였다.`,
  stages: [
    {
      choices: [
        {
          label: '불을 피운다',
          check: { stat: 'intelligence', dc: 12 },
          deepen: true,
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 36, mark: 'madeFire' }, deepen: true,
              text:
`영운은 마른 가지를 모았다. 젖지 않은 것만 골라내는 데 시간이 걸렸다.

불이 붙자 그림자가 불빛 바깥으로 물러났다. 물러났을 뿐 가지는 않았다.

영운은 불 옆에 앉아 밤을 셌다.

그림자는 불빛 경계선을 따라 천천히 돌았다. 몇 바퀴인지 세다가 그만뒀다. 세는 게 무서워졌기 때문이다.

새벽 세 시쯤, 그것이 불빛 안으로 한쪽 발을 들여놨다. 발이 아니라 발 모양의 어둠이었다.

영운은 가지를 하나 더 던졌다. 불이 커졌고, 그것이 발을 뺐다.

그런 식으로 아침이 왔다.` },
            success: { effect: { hp: -4, exp: 22, mark: 'madeFire' }, deepen: true,
              text:
`불을 피웠다. 그림자는 물러났지만 밤새 근처를 돌았다.

한숨도 못 잤다. 아침이 왔을 때 손끝이 얼어 있었다.` },
            fail: { effect: { hp: -8 }, deepen: true,
              text: '불이 붙지 않았다. 나무가 다 젖어 있었다. 성냥이 떨어졌을 때 그림자가 가까워졌다.' },
            fumble: { effect: {}, deepen: true,
              text: '불꽃이 오히려 그것을 끌어당겼다.' },
          },
        },
        {
          label: '달을 등지고 선다',
          check: { stat: 'courage', dc: 12 },
          deepen: true,
          outcomes: {
            critical: { effect: { courage: 2, exp: 38, mark: 'usedMoon' }, deepen: true,
              text:
`영운은 달을 등지고 섰다. 자기 그림자가 앞으로 길게 뻗었다.

그러자 그것이 멈췄다.

두 그림자가 마주 섰다. 하나는 영운의 것이고, 하나는 주인이 없다.

그것이 영운의 그림자 쪽으로 다가왔다. 닿으려고 하는 것 같았다.

영운은 한 걸음 옆으로 비켰다. 그림자도 따라 움직였고, 그것은 빈자리를 더듬었다.

저것은 사냥하는 게 아니다. 자기 몸을 찾는 것이다.` },
            success: { effect: { courage: 1, exp: 24, mark: 'usedMoon' }, deepen: true,
              text:
`달을 등지고 서자 그림자가 길게 뻗었다.

그것이 멈추더니 영운의 그림자 쪽으로 다가왔다. 사냥하는 동작이 아니었다.` },
            fail: { effect: { hp: -7 }, deepen: true,
              text: '달을 등진 건 좋았는데 뒤쪽 나무 그림자까지 계산하지 못했다. 그것이 그 안으로 들어왔다.' },
            fumble: { effect: { hp: -11 }, deepen: true,
              text: '구름이 달을 가렸다. 그림자가 전부 사라졌고, 그 순간 그것도 사라졌다 — 눈앞에서만.' },
          },
        },
      ],
    },
    {
      text: (s) => (s.episode && s.episode.usedMoon)
        ? `그것이 영운의 그림자를 더듬다가, 고개를 들었다.\n\n영운 쪽을 봤다. 눈이 없는데도 봤다는 걸 알 수 있었다.\n\n자기 몸을 못 찾겠으면 남의 몸이라도 되는 것이다.`
        : `그림자가 불빛 경계를 넘었다.\n\n넘어오면서 형태가 잡혔다. 네 발로 서 있는데 어깨가 사람 것이다.\n\n둘 중 어느 쪽도 아닌 것이 제일 위험하다.`,
      choices: [
        { label: '맞선다', combat: 'werewolfShade', branch: { win: 2 },
          resultText: '영운은 등을 나무에 붙이고 지팡이를 들었다.' },
        {
          label: '불을 크게 키운다',
          requiresMark: 'madeFire',
          check: { stat: 'intelligence', dc: 12 },
          gain: 4,
          branch: { win: 2 },
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 44, item: 'magicStone' },
              text:
`영운은 모아둔 가지를 전부 불에 넣었다.

불이 사람 키만큼 솟았다. 숲 전체가 잠깐 낮이 됐다.

그림자가 없어졌다. 빛이 사방에서 오면 그림자는 설 자리가 없다.

불이 사그라들 때까지 앉아 있었다. 재 속에서 결정 조각을 하나 주웠다 — 그것이 남긴 것인지, 원래 거기 있었던 것인지는 알 수 없었다.` },
            success: { effect: { exp: 26 },
              text: '불을 키우자 그림자가 물러났다. 빛이 사방에서 오면 그림자는 설 자리가 없다.' },
            fail: { effect: { hp: -7 }, text: '가지가 모자랐다. 불이 커지다 말았다.', combat: 'werewolfShade', branch: { win: 2 } },
            fumble: { effect: { hp: -10 }, text: '불에 손을 데었다. 그 비명이 그것을 불렀다.', combat: 'werewolfShade', branch: { win: 2 } },
          },
        },
      ],
    },
    {
      gain: 3,
      text:
`아침이 왔다.

밤새 있었던 자리에 그을린 원이 남았다. 원 바깥에 발자국이 있었다 — 원을 따라 빙 돌아가면서.

발자국은 늑대 것이 아니었다. 맨발이었다. 사람 맨발.

크기가 학생 것이다.`,
      choices: [
        {
          label: '발자국을 수첩에 그린다',
          check: { stat: 'intelligence', dc: 8 },
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 40, fragment: 3 },
              text:
`영운은 수첩을 펴고 발자국을 그렸다. 크기를 재고, 걸음 폭을 재고, 방향을 적었다.

발자국은 원을 열한 바퀴 돌았다. 열한 바퀴째에서 원 바깥으로 나갔고, 나간 방향이 성이었다.

그리고 한 가지 더.

발자국은 왼발밖에 없었다. 오른발 자국이 하나도 없다.

한 발로 열한 바퀴를 돌 수는 없다. 그러니까 오른발은 — 닿지 않았던 것이다.

영운은 그것도 적었다. 「왼발만. 오른쪽 없음.」

적고 나서 자기 오른발을 한참 내려다봤다.` },
            success: { effect: { exp: 24, fragment: 3 },
              text:
`발자국을 그렸다. 원을 열한 바퀴 돌고 성 쪽으로 나갔다.

왼발 자국만 있었다. 오른발은 없다.` },
            fail: { effect: {},
              text: '그리는 사이 아침 이슬에 자국이 뭉개졌다. 반쯤 그리다 말았다.' },
            fumble: { effect: { hp: -2 },
              text: '수첩을 펴려다 어제 데인 손이 아팠다. 펜을 놓쳤고, 다시 주웠을 때는 자국이 사라져 있었다.' },
          },
        },
        {
          label: '재를 묻고 성으로 돌아간다',
          effect: { exp: 22, hp: -2, alignment: 2 },
          resultText:
`영운은 재를 흙으로 덮었다.

숲에 불을 낸 자국을 남기면 벌점이 아니라 퇴학이다. 그런 걸 신경 쓸 정신이 남아 있다는 게 스스로도 신기했다.

덮으면서 봤다. 재 아래 흙에 뭔가 눌린 자국이 있었다. 사람이 누웠던 자국 같았다.

오래된 자국이다. 어젯밤 것이 아니다.

영운은 그 위에 흙을 마저 덮고 성으로 걸었다. 아침 종이 울리고 있었다.` },
      ],
    },
  ],
},

flobberworm_chore: {
  id: 'flobberworm_chore', pool: 'combat', weight: 8, progress: [0, 40], repeatable: true, gain: 2,
  text:
`신비한 동물 돌보기. 오늘 몫은 플러버웜 우리 청소다.

플러버웜은 세상에서 제일 지루한 생물이라고들 한다. 움직이지도 않고 물지도 않는다.

그런데 오늘은 한 마리가 몸을 세우고 있었다. 플러버웜은 그러지 않는다.`,
  stages: [
    {
      choices: [
        {
          label: '우리 밖에서 관찰한다',
          check: { stat: 'intelligence', dc: 8, search: true },
          deepen: true,
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 26, mark: 'foundCorner' }, deepen: true,
              text:
`영운은 우리 밖에 쪼그려 앉아 지켜봤다.

십 분. 이십 분. 그것들은 거의 안 움직였지만, 안 움직이는 방식이 균일하지 않았다.

우리 한구석 — 북쪽 모서리 — 만 비어 있다. 열두 마리가 전부 그 구석에서 최소한 두 뼘씩 떨어져 있었다.

거기엔 아무것도 없다. 짚도 없고 물그릇도 없고 그냥 흙이다.

영운은 그 자리를 수첩에 그렸다. 우리 도면을 그리고, 그 구석에 X를 쳤다.` },
            success: { effect: { exp: 14, mark: 'foundCorner' }, deepen: true,
              text:
`한 자리를 계속 피하고 있었다. 우리 북쪽 구석.

거기엔 아무것도 없다. 영운은 그 자리를 수첩에 그려뒀다.` },
            fail: { effect: {}, deepen: true,
              text: '십 분쯤 보다가 지루해졌다. 플러버웜은 원래 지루한 생물이다.' },
            fumble: { effect: { hp: -2 }, deepen: true,
              text: '우리에 기대다 문이 열렸다. 전부 기어 나왔고 다시 몰아넣는 데 한 시간이 걸렸다.' },
          },
        },
        {
          label: '가까이 간다', combat: 'flobberworm', gain: 3, branch: { win: 1 },
          resultText: '그것이 예상보다 빠르게 움직였다.' },
      ],
    },
    {
      gain: 2,
      text: (s) => (s.episode && s.episode.foundCorner)
        ? `영운은 우리에 들어가 북쪽 구석에 섰다.\n\n열두 마리가 동시에 몸을 세웠다. 전부 이쪽을 향해서.\n\n플러버웜에게는 눈이 없다.`
        : `우리 안이 조용해졌다.\n\n청소를 마치고 나오려는데, 북쪽 구석 흙이 다른 데보다 색이 진했다.\n\n젖은 것이다. 물그릇은 반대쪽에 있는데.`,
      choices: [
        {
          label: '구석을 파본다',
          check: { stat: 'courage', dc: 12, search: true },
          outcomes: {
            critical: { effect: { courage: 1, exp: 34, fragment: 5, item: 'inkBottle' },
              text:
`영운은 삽 대신 손으로 팠다. 삽을 쓰면 부술 것 같아서였다.

한 뼘쯤 파자 유리가 나왔다.

잉크병이다. 깨지지 않았고, 안에 아직 잉크가 있다. 병 옆면에 종이 딱지가 붙어 있었고, 거기 이름이 적혀 있었다.

이름의 첫 글자만 읽을 수 있었다. 나머지는 흙물에 번졌다.

영운은 그 글자를 수첩에 옮겼다.

병을 꺼내자 플러버웜들이 몸을 낮췄다. 전부 동시에. 구석으로 다시 흩어졌다.

무서워하던 것이 없어진 것이다.` },
            success: { effect: { exp: 20, fragment: 5 },
              text:
`한 뼘쯤 파자 잉크병이 나왔다. 깨지지 않았고 이름 딱지가 붙어 있었다.

첫 글자만 읽을 수 있었다. 영운은 그것을 옮겨 적었다.` },
            fail: { effect: { hp: -2 },
              text: '팠는데 흙뿐이었다. 손톱 밑에 흙이 들어가 쓰라렸다.' },
            fumble: { effect: { hp: -5 },
              text: '팠더니 안쪽에서 냄새가 올라왔다. 오래된 것 냄새였고, 그 자리에서 토했다.\n\n덮고 나왔다.' },
          },
        },
        {
          label: '담당 교수에게 알린다',
          effect: { exp: 22, gold: 15, alignment: 3, register: 'simon' },
          resultText:
`영운은 우리를 나와 담당 교수를 찾아갔다.

"북쪽 구석을 다들 피해요."

교수가 손을 멈췄다. "…뭘 피해?"

"플러버웜이요. 한 구석만."

교수는 한참 말이 없다가 물었다. "네가 오늘 처음 봤니?"

"예."

"그래." 교수가 장갑을 벗었다. "나는 삼 년 봤다."

삼 년 동안 이상하다고 생각했으면서 아무한테도 말하지 않았다는 뜻이다. 왜냐고 묻자 교수가 대답했다.

"말할 때마다 잊어버렸어. 말하고 돌아서면 무슨 말을 했는지가 없어져."

교수는 수고비를 주고 영운을 보냈다. 보내면서 한 마디 덧붙였다.

"너는 적어둬라."` },
      ],
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
  stages: [
    {
      choices: [
        {
          label: '누가 여기 있었는지 살핀다',
          check: { stat: 'agility', dc: 12, search: true },
          deepen: true,
          outcomes: {
            critical: { effect: { agility: 1, exp: 36, flag: 'someoneWasHere', mark: 'tracks' }, deepen: true,
              text:
`영운은 책을 건드리지 않고 바닥을 봤다.

먼지에 발자국이 있었다. 한 사람 것. 여러 번 오간 자국.

신발 크기가 어른 것이었다. 그리고 자국이 겹친 방식이 이상하다 — 들어온 자국은 여럿인데 나간 자국은 하나뿐이다.

여러 번 들어와서 한 번 나갔다는 뜻이 아니다. 나갈 때마다 자국을 지웠다는 뜻이다.

마지막 한 번만 지우는 걸 잊었다.` },
            success: { effect: { exp: 18, flag: 'someoneWasHere', mark: 'tracks' }, deepen: true,
              text:
`먼지에 어른 발자국이 여러 번 겹쳐 있었다.

들어온 자국은 여럿인데 나간 자국은 하나뿐이다.` },
            fail: { effect: {}, deepen: true,
              text: '먼지가 너무 두꺼웠다. 뭐가 뭔지 알 수 없었다.' },
            fumble: { effect: { hp: -4 }, deepen: true,
              text: '사슬을 건드렸다. 요란한 소리가 울렸고 관리인이 달려왔다. 숨는 데는 성공했지만 심장이 한참 뛰었다.' },
          },
        },
        {
          label: '책을 덮는다',
          effect: { alignment: 6, exp: 18, flag: 'refusedDark' },
          resultText:
`영운은 책을 덮었다.

빠른 길이 있다는 건 알겠다. 다만 그 길로 간 사람이 어떻게 됐는지를 지금 찾아다니는 중이다.

덮으면서 표지를 봤다. 제목이 없다. 도서관 번호도 없다.

이 책은 목록에 없는 책이다. 목록에 없으면 아무도 안 찾고, 아무도 안 찾으면 여기 있다는 걸 아무도 모른다.

영운은 표지에 자기 수첩 한 장을 찢어 끼웠다. 「5월 · 영운 · 이 책 여기 있음」

철망을 잠그고 나왔다.` },
      ],
    },
    {
      text: (s) => (s.episode && s.episode.tracks)
        ? `영운은 책 앞에 섰다.\n\n어른 하나가 여러 번 와서 이걸 읽었다. 그리고 자기 자국을 지우고 갔다.\n\n펼쳐진 쪽은 언제나 같은 쪽일 것이다.`
        : `책이 저 혼자 한 장 넘어갔다.\n\n바람은 없다.\n\n넘어간 쪽에도 주문이 하나 적혀 있었다. 아까 것보다 짧다.`,
      choices: [
        {
          label: '읽는다',
          check: { stat: 'intelligence', dc: 12, search: true },
          gain: 4,
          outcomes: {
            critical: { effect: { learnSpell: 'sectumsempra', alignment: -12, exp: 40 },
              text:
`글자가 눈에 박혔다. 잊히지 않는 종류의 글자였다.

손이 저절로 움직였다. 배운 적 없는 동작인데 손이 알고 있었다.

한 번 그어보고 손을 멈췄다. 공기가 갈라진 자리가 한참 아물지 않았다.

책 여백에 누가 연필로 써놓은 게 있었다. 아주 작게.

「세 번째부터는 손이 먼저 움직인다」

영운은 책을 덮고 한참 앉아 있었다. 지금 자기가 한 것이 몇 번째인지 세어봤다.

첫 번째였다. 첫 번째라고 생각했다.` },
            success: { effect: { learnSpell: 'sectumsempra', alignment: -15, hp: -4 },
              text:
`읽었다. 머리가 아팠고 코피가 났다. 그래도 남았다.

여백에 연필로 「세 번째부터는 손이 먼저 움직인다」고 적혀 있었다.

누구 글씨인지는 모른다.` },
            fail: { effect: { hp: -6, alignment: -5 },
              text: '읽다가 눈앞이 하얘졌다. 정신을 차렸을 때는 바닥이었고, 책은 덮여 있었다.\n\n덮은 기억이 없다.' },
            fumble: { effect: { hp: -11, alignment: -8 },
              text: '책이 저 혼자 넘어갔다. 다음 쪽은 보지 말았어야 했다.\n\n일어났을 때 소매가 찢어져 있었다. 안쪽에서 찢어진 모양이었다.' },
          },
        },
        {
          label: '책을 통째로 베낀다',
          check: { stat: 'intelligence', dc: 16 },
          gain: 4,
          outcomes: {
            critical: { effect: { intelligence: 2, exp: 50, item: 'oldDiary', alignment: 2, fragment: 4 },
              text:
`영운은 읽지 않기로 했다. 대신 베끼기로 했다.

읽으면 들어온다. 베끼면 종이에 남는다. 그 차이가 이 성에서는 전부다.

한 글자씩, 뜻을 생각하지 않고 모양만 옮겼다. 두 시간이 걸렸다.

다 베끼고 나서 원본을 덮었다. 머리는 아프지 않았고 코피도 안 났다.

그리고 베낀 종이를 봤다. 마지막 쪽 여백에, 옮긴 적 없는 한 줄이 있었다.

「너도 이렇게 했구나」

영운은 그 줄을 오래 봤다. 자기 필체였다.` },
            success: { effect: { intelligence: 1, exp: 30, item: 'oldDiary', alignment: 2 },
              text:
`영운은 읽지 않고 베꼈다. 뜻을 생각하지 않고 모양만.

두 시간이 걸렸지만 머리는 아프지 않았다.

베낀 종이를 접어 넣었다. 언제 읽을지는 나중에 정하기로 했다.` },
            fail: { effect: { hp: -5, alignment: -3 },
              text: '베끼는 사이 뜻이 들어왔다. 모양만 옮기려 해도 손이 뜻을 알아버렸다.\n\n절반쯤에서 그만뒀다.' },
            fumble: { effect: { hp: -8, alignment: -6 },
              text: '베끼던 종이에 잉크가 번졌다. 번진 자리에서 글자가 저 혼자 이어졌다.\n\n영운이 쓰지 않은 글자였다.' },
          },
        },
        {
          label: '철망을 잠그고 나온다',
          gain: 1,
          effect: { alignment: 4, exp: 16, flag: 'refusedDark' },
          resultText:
`영운은 사슬을 다시 걸고 자물쇠를 채웠다.

채우고 나서 열쇠 구멍을 봤다. 긁힌 자국이 많다. 이 자물쇠는 여러 번 열렸다.

열쇠로 연 자국이 아니라 주문으로 연 자국이다.

잠가봐야 소용없다는 뜻이지만, 그래도 잠갔다.

돌아 나오면서 생각했다. 누가 이걸 계속 여는지 알아내는 편이, 안에 뭐가 있는지 아는 것보다 중요하다.` },
      ],
    },
  ],
},

};
