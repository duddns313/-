/* ===================== 인카운터 · 깊은 것 =====================
 *
 * stages를 가진 다단계 인카운터. 한 번에 끝나지 않는다.
 *
 * 각 단계에서 「더 들어간다」와 「여기서 멈춘다」를 고른다.
 * 깊이 들어갈수록 DC가 오르고 보상이 커진다. 얻은 것은 물러나도 남는다 —
 * 잃는 것은 더 갈 수 있었던 기회다. 그게 이 구조의 긴장이다. */

const ENCOUNTERS_DEEP = {

/* ══════════ 금지된 숲 — 안쪽으로 ══════════ */
forest_deeper: {
  id: 'forest_deeper', pool: 'combat', weight: 16, progress: [15, 100], gain: 3,
  stages: [
    {
      text:
`금지된 숲 가장자리. 여기까지는 벌점만 받고 끝난다.

여기서 안쪽으로 스무 걸음쯤 가면 나무가 갑자기 굵어진다. 굵어지는 지점이 눈에 보인다 — 어린 나무가 자라지 못하는 선이 있고, 그 너머는 오래된 것들만 서 있다.

바닥에는 은빛 액체가 몇 방울 떨어져 있었다. 유니콘의 피는 마르지 않는다고 들었다. 정말로 마르지 않고, 이끼 위에서 아직 굴러다니고 있었다.

방울이 이어진 방향은 안쪽이다.

여기서 돌아가면 아무 일도 없다. 다만 방울은 계속 안쪽을 가리키고 있다.`,
      choices: [
        {
          label: '핏자국을 따라 안으로 들어간다',
          check: { stat: 'courage', dc: 8 },
          deepen: true,
          outcomes: {
            critical: { effect: { courage: 1, exp: 24 }, deepen: true,
              text: '영운은 방울 사이 간격을 세며 걸었다. 간격이 점점 좁아진다. 다친 것이 속도를 잃고 있다는 뜻이다.\n\n스무 걸음, 서른 걸음. 어린 나무가 끊기는 선을 넘었다.' },
            success: { effect: { exp: 12 }, deepen: true,
              text: '나뭇가지가 옷을 잡아당겼다. 몇 번 걸리고 몇 번 풀면서 안쪽으로 들어갔다.' },
            fail: { effect: { hp: -6 }, deepen: true,
              text: '뿌리에 걸려 넘어졌다. 손바닥이 까졌고, 일어났을 때 왔던 방향을 잠깐 놓쳤다.' },
            fumble: { effect: { hp: -12 }, deepen: true,
              text: '가시덤불을 통째로 지나갔다. 팔이 온통 긁혔고 옷이 찢어졌다.' },
          },
        },
        {
          label: '핏자국만 수첩에 그려두고 돌아간다',
          effect: { exp: 14 },
          resultText:
`영운은 방울의 위치와 방향을 수첩에 그렸다. 나무 세 그루를 기준으로 삼아 표시해뒀다.

돌아 나오는 길은 짧았다. 스무 걸음이 그렇게 먼 거리는 아니었다.

다만 등 뒤에서 오래 아무 소리도 나지 않았다는 게 마음에 걸렸다. 숲은 원래 시끄러운 곳이다.`,
        },
      ],
    },
    {
      text:
`나무가 굵어졌다. 위를 봐도 하늘이 안 보인다.

핏자국은 여기서 넓어졌다. 방울이 아니라 자국이다. 무언가 여기서 한참 서 있었거나 쓰러져 있었다.

그 옆에 발자국이 있었다. 네 개가 아니라 여덟 개.

거미줄이 나무 사이에 걸려 있는데 두께가 밧줄에 가깝다. 아직 새것이다.

더 안쪽에서 뭔가 규칙적으로 움직이는 소리가 났다. 다리가 많은 것이 걸을 때 나는 소리다.`,
      gain: 4,
      choices: [
        {
          label: '소리 나는 쪽으로 더 들어간다',
          check: { stat: 'agility', dc: 12 },
          deepen: true,
          outcomes: {
            critical: { effect: { agility: 1, exp: 32, item: 'magicStone' }, deepen: true,
              text: '영운은 밟은 자리만 다시 밟으며 나아갔다. 거미줄을 건드리지 않았다.\n\n중간에 나무 밑동에서 뭔가 반짝였다. 결정 조각이었다. 이런 데 있을 물건이 아니다.' },
            success: { effect: { exp: 18 }, deepen: true,
              text: '거미줄을 두 번 스쳤지만 끊지는 않았다. 소리가 가까워졌다.' },
            fail: { effect: { hp: -10 }, deepen: true,
              text: '거미줄 한 가닥을 끊었다. 숲 전체가 잠깐 조용해졌다가, 다시 소리가 났다. 이번에는 이쪽을 향해서.' },
            fumble: { effect: { hp: -16 }, deepen: true,
              text: '거미줄에 어깨가 걸렸다. 뜯어내는 동안 소리가 아주 가까워졌다.' },
          },
        },
        {
          label: '거미줄 아래 떨어진 것을 챙기고 물러난다',
          check: { stat: 'luck', dc: 8 },
          gain: 3,
          outcomes: {
            critical: { effect: { equipDrop: { slot: 'accessory', tier: 2 }, luck: 1, exp: 24 },
              text: '거미줄 아래 낙엽을 헤치니 물건이 하나 나왔다. 오래 여기 있었던 것 같은데 상하지 않았다.\n\n챙겨서 왔던 길로 돌아 나왔다.' },
            success: { effect: { gold: 30, exp: 14 },
              text: '낙엽 아래에서 갈레온 몇 닢과 부러진 지팡이가 나왔다. 돈만 챙겨 돌아 나왔다.' },
            fail: { effect: { hp: -6 },
              text: '뒤지는 동안 뭔가가 손등을 물었다. 아무것도 못 건지고 돌아 나왔다.' },
            fumble: { effect: { hp: -12 },
              text: '낙엽 아래에 뼈가 있었다. 사슴 것이 아니었다. 뛰어서 나왔다.' },
          },
        },
      ],
    },
    {
      text:
`나무 사이가 넓어지며 공터가 나왔다.

바닥에 은빛이 흥건했다. 유니콘이었던 것이 누워 있었다. 아직 완전히 죽지는 않았다 — 옆구리가 아주 천천히 오르내린다.

그 위에 아크로만툴라가 있었다. 사람 키만 하다. 이쪽을 이미 보고 있었다.

움직이지 않고 보기만 한다. 사냥감이 하나 늘었을 뿐이라고 생각하는 것 같았다.

여기서 나가는 길은 뒤쪽 하나뿐이고, 그것도 알고 있는 눈치였다.`,
      gain: 5,
      choices: [
        { label: '맞선다', combat: 'acromantula',
          resultText: '영운은 유니콘 쪽으로 한 걸음 옮겨 섰다. 그것과 유니콘 사이에.' },
        {
          label: '유니콘을 먼저 살핀다',
          check: { stat: 'charm', dc: 16 },
          gain: 4,
          outcomes: {
            critical: { effect: { charm: 2, exp: 50, equipDrop: { slot: 'wand', tier: 3 }, hp: 20 },
              text: '영운은 거미를 보지 않고 무릎을 꿇었다. 유니콘의 목에 손을 얹었다.\n\n그것이 눈을 떴다. 아주 잠깐.\n\n그리고 공터가 밝아졌다. 아크로만툴라가 물러섰다 — 무서워서가 아니라, 갑자기 여기가 자기 자리가 아니게 된 것처럼.\n\n유니콘은 일어서지 못했다. 다만 갈기 한 줌이 영운의 손에 남았다.' },
            success: { effect: { charm: 1, exp: 26, hp: 12 },
              text: '영운이 손을 얹자 유니콘이 조용해졌다. 거미가 한 걸음 물러섰다. 그 틈에 뒤로 빠져나왔다.' },
            fail: { effect: { hp: -14 }, combat: 'acromantula',
              text: '무릎을 꿇는 순간 그것이 움직였다.' },
            fumble: { effect: { hp: -20 }, combat: 'acromantula',
              text: '유니콘이 발버둥 쳤고, 그 소리가 신호가 됐다.' },
          },
        },
        {
          label: '조용히 물러난다',
          check: { stat: 'agility', dc: 16 },
          gain: 3,
          outcomes: {
            critical: { effect: { agility: 2, exp: 34 }, text: '한 발짝씩, 밟았던 자리만 다시 밟으며 물러났다. 그것은 끝까지 따라오지 않았다.' },
            success: { effect: { hp: -8, exp: 18 }, text: '물러나다 가지를 밟았다. 뛰어서 숲을 빠져나왔다.' },
            fail: { effect: { hp: -20 }, text: '돌아서는 순간 다리 하나가 등을 스쳤다. 옷과 살이 같이 찢어졌다.' },
            fumble: { effect: {}, combat: 'acromantula', text: '한 걸음 만에 따라잡혔다.' },
          },
        },
      ],
      afterText: '숲을 나왔을 때 옷에 은빛이 묻어 있었다. 아무리 털어도 지워지지 않았다.',
    },
  ],
},

/* ══════════ 금서 구역 — 잠입 ══════════ */
restricted_section: {
  id: 'restricted_section', pool: 'search', weight: 14, progress: [25, 100], gain: 3,
  stages: [
    {
      text:
`도서관 폐관 후. 금서 구역은 쇠사슬로 묶여 있다.

사슬은 형식이다. 진짜 자물쇠는 책들 자신이다 — 잘못 건드리면 비명을 지르고, 그 소리는 성 전체에 들린다.

영운은 철망 앞에 섰다. 안쪽 서가는 세 줄. 첫 줄은 그냥 오래된 책, 둘째 줄부터가 진짜다.

관리인의 순찰은 방금 지나갔다. 다음까지 대략 스무 분.

첫 줄만 보고 나오면 스무 분으로 충분하다.`,
      choices: [
        {
          label: '철망을 넘어 첫 줄을 본다',
          check: { stat: 'agility', dc: 8, search: true },
          deepen: true,
          outcomes: {
            critical: { effect: { agility: 1, exp: 22, item: 'scrollProtego' }, deepen: true,
              text: '소리 없이 넘었다. 첫 줄에서 주문서 하나를 뽑아 품에 넣었다.\n\n둘째 줄은 여기서 팔을 뻗으면 닿는다.' },
            success: { effect: { exp: 12 }, deepen: true,
              text: '철망은 생각보다 낮았다. 첫 줄에는 볼 만한 게 없었다.' },
            fail: { effect: { hp: -4 }, deepen: true,
              text: '넘다가 철망이 삐걱거렸다. 한참 숨을 죽이고 기다려야 했다. 시간이 줄었다.' },
            fumble: { effect: { hp: -8, alignment: -2 }, deepen: true,
              text: '옷이 걸려 찢어졌다. 소리가 났고, 복도 끝에서 뭔가 멈췄다가 다시 멀어졌다.' },
          },
        },
        { label: '오늘은 그냥 돌아간다', effect: { exp: 8 },
          resultText: '영운은 철망에서 손을 뗐다.\n\n돌아 나오면서 한 번 더 봤다. 둘째 줄 어딘가에서 아주 약하게 빛이 새어 나오고 있었다.\n\n책이 빛날 이유는 없다.' },
      ],
    },
    {
      text:
`둘째 줄.

여기서부터는 제목이 안 읽힌다. 글자가 있는데 눈이 미끄러진다 — 명부의 흐려진 줄과 같은 느낌이다.

한 권만 다르다. 손으로 쓴 표지. 잉크가 바랬지만 글자는 또렷하다.

**손으로 쓴 것은 남는다.**

그 책을 뽑으려면 양옆 책을 건드려야 한다. 양옆은 비명을 지르는 쪽이다.

시간은 대략 십 분 남았다.`,
      gain: 4,
      choices: [
        {
          label: '양옆을 눌러둔 채 조심스럽게 빼낸다',
          check: { stat: 'agility', dc: 12 },
          deepen: true,
          outcomes: {
            critical: { effect: { agility: 1, exp: 34, item: 'oldDiary' }, deepen: true,
              text: '왼손으로 양옆을 누르고 오른손으로 뽑았다. 세 권이 동시에 움직였지만 소리는 나지 않았다.\n\n손으로 쓴 책이 손에 들어왔다. 표지 안쪽에 이름이 적혀 있었다. 읽으려는데 셋째 줄 쪽에서 빛이 새어 나왔다.' },
            success: { effect: { exp: 20, item: 'oldDiary' }, deepen: true,
              text: '한 권이 살짝 신음했지만 비명까지는 가지 않았다. 책을 품에 넣었다.' },
            fail: { effect: { hp: -8 }, deepen: true,
              text: '옆 책이 짧게 비명을 질렀다. 손으로 덮어 눌렀다. 복도 쪽에서 발소리가 났다가 멎었다.' },
            fumble: { effect: { hp: -14, alignment: -3 }, deepen: true,
              text: '세 권이 한꺼번에 비명을 질렀다. 영운은 서가 뒤로 몸을 붙였다. 발소리가 아주 가까이 왔다가, 이상하게도 그냥 지나갔다.' },
          },
        },
        {
          label: '손으로 쓴 책만 눈으로 읽고 나온다',
          check: { stat: 'intelligence', dc: 12, search: true },
          gain: 3,
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 30, fragment: 3 },
              text: '뽑지 않고 등을 펼쳐 읽었다. 목록이었다. 이름이 줄줄이.\n\n한 줄에서 눈이 미끄러지지 않았다. 손으로 쓴 것은 남는다.\n\n라—' },
            success: { effect: { exp: 16 }, text: '읽을 수 있는 몇 줄만 눈에 담고 물러났다.' },
            fail: { effect: {}, text: '각도가 안 나와 글자가 안 보였다. 시간만 썼다.' },
            fumble: { effect: { hp: -6 }, text: '무리하게 몸을 기울이다 서가를 밀었다. 관리인이 오기 전에 나와야 했다.' },
          },
        },
      ],
    },
    {
      text:
`셋째 줄.

빛은 여기서 나오고 있었다. 책이 아니라 서가 뒤쪽 벽에서.

벽에 자국이 있었다. 원 안에 원, 그 안에 이름 하나가 들어갈 만한 빈칸. 옆에는 시도한 흔적이 여러 개, 전부 지워졌다.

누가 오래전에 여기서 무언가를 만들려다 그만뒀다.

그리고 최근에 — 아주 최근에 — 누가 그 자국 위를 손으로 덧그렸다. 먼지가 그 선 위에만 없다.

관리인의 발소리가 복도 끝에서 났다. 이번에는 멀어지지 않는다.`,
      gain: 5,
      choices: [
        {
          label: '자국을 통째로 베껴 적는다',
          check: { stat: 'intelligence', dc: 16, search: true },
          gain: 5,
          outcomes: {
            critical: { effect: { intelligence: 2, exp: 60, flag: 'copiedTheMark', item: 'oldDiary' },
              text: '영운은 뜻을 이해하려 하지 않고 모양만 따라 그렸다. 손이 기억하게.\n\n다 그리고 나서 발소리 반대쪽 창으로 나왔다. 2층이었지만 화단이 받아줬다.\n\n방에 돌아와 펼쳤을 때, 종이 위의 도형은 여전히 거기 있었다. 이해하려 하지 않았기 때문에 마법이 손을 뻗지 못한 것이다.' },
            success: { effect: { exp: 32, flag: 'copiedTheMark' },
              text: '급하게 베꼈다. 절반쯤 되는 도형이 손에 남았다. 창으로 빠져나왔다.' },
            fail: { effect: { hp: -12 },
              text: '베끼다 손이 자꾸 멈췄다. 발소리가 서가 앞까지 왔을 때 종이를 접고 뛰었다.' },
            fumble: { effect: { hp: -18, alignment: -4 },
              text: '관리인과 정면으로 마주쳤다. 그는 아무 말도 하지 않았다. 다만 영운이 지나갈 때까지 비켜서 있었고, 그게 더 무서웠다.' },
          },
        },
        {
          label: '덧그린 손자국의 크기를 잰다',
          check: { stat: 'intelligence', dc: 16, search: true },
          gain: 5,
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 56, flag: 'measuredHand' },
              text: '먼지가 없는 선 옆에 손바닥 자국이 하나 찍혀 있었다. 벽을 짚었던 자리다.\n\n영운은 자기 손을 대봤다. 한참 컸다. 어른 손이다. 오른손.\n\n중지 바깥쪽에 굳은살이 눌린 자국까지 남아 있었다. 깃펜을 아주 오래 쥔 사람의 손.' },
            success: { effect: { exp: 30, flag: 'measuredHand' },
              text: '어른 손이었다. 오른손. 그것만 확인하고 나왔다.' },
            fail: { effect: { hp: -10 }, text: '먼지가 뭉개져 크기를 알 수 없게 됐다.' },
            fumble: { effect: { hp: -16 }, text: '벽에 손을 댄 순간 손바닥이 얼어붙는 것 같았다. 한동안 감각이 없었다.' },
          },
        },
        {
          label: '지금 당장 나간다',
          effect: { hp: -5, exp: 14 },
          gain: 3,
          resultText:
`영운은 아무것도 더 보지 않고 창으로 나왔다.

화단에 떨어지며 발목을 접질렸다.

방에 돌아와 누웠는데, 눈을 감으면 그 도형이 보였다. 이해하지 못한 채로.`,
        },
      ],
    },
  ],
},

/* ══════════ 호수 아래 ══════════ */
lake_descent: {
  id: 'lake_descent', pool: 'eerie', weight: 12, progress: [35, 100], gain: 3,
  stages: [
    {
      text:
`호수는 검다. 낮에도 검고, 지금은 더 검다.

물가에 신발 한 켤레가 나란히 놓여 있었다. 누가 벗어놓고 들어간 것처럼 가지런하게.

크기는 어른 것이다. 밑창이 닳은 자리를 보면 오래 걸어 다닌 사람이다.

물은 발목까지만 얕고 그다음부터 갑자기 깊어진다. 여기 애들은 다 안다. 그래서 아무도 안 들어간다.

수면 아래에서 뭔가 희미하게 빛났다. 물풀은 빛나지 않는다.`,
      choices: [
        {
          label: '발목까지만 들어가 본다',
          check: { stat: 'courage', dc: 8 },
          deepen: true,
          outcomes: {
            critical: { effect: { courage: 1, exp: 24 }, deepen: true,
              text: '물은 얼음처럼 찼다. 발목까지 들어가자 아래쪽 빛이 조금 또렷해졌다.\n\n사각형이다. 액자나 상자 같은 것.' },
            success: { effect: { exp: 12, hp: -4 }, deepen: true,
              text: '차가웠다. 아래쪽에 뭔가 있는 건 확실했다.' },
            fail: { effect: { hp: -8 }, deepen: true,
              text: '발이 미끄러졌다. 허리까지 젖었고 이가 딱딱 부딪혔다.' },
            fumble: { effect: { hp: -14 }, deepen: true,
              text: '뭔가가 발목을 스쳤다. 물풀이었을 것이다. 물풀이었어야 한다.' },
          },
        },
        {
          label: '신발만 챙겨서 관리인에게 가져다준다',
          effect: { exp: 16, alignment: 3 },
          resultText:
`영운은 신발을 들고 성으로 돌아왔다.

관리인은 한참 신발을 봤다.

"이거 어디서 났나."

"호숫가요."

그가 신발을 받아 들고는 아무 말 없이 안으로 들어갔다. 분실물함에 넣지는 않았다.

다음 날 확인해보니 관리인실 창가에 그대로 놓여 있었다. 나란히, 가지런하게.`,
        },
      ],
    },
    {
      text:
`가슴까지 왔다.

호수 바닥이 발밑에서 갑자기 사라졌다. 여기가 그 선이다.

빛나는 것은 팔 하나쯤 아래에 있다. 손을 뻗으면 닿을 것 같은데, 물속에서 거리는 늘 거짓말을 한다.

물 아래에서 뭔가 이쪽을 지나갔다. 크기가 사람만 했고 사람 모양은 아니었다.

인어들은 침입자를 좋아하지 않는다고 배웠다. 좋아하지 않는다는 게 정확히 무슨 뜻인지는 안 배웠다.`,
      gain: 4,
      choices: [
        {
          label: '숨을 참고 잠수한다',
          check: { stat: 'courage', dc: 12 },
          deepen: true,
          outcomes: {
            critical: { effect: { courage: 2, exp: 36, item: 'magicStone' }, deepen: true,
              text: '한 번에 닿았다. 액자였다. 유리가 깨져 있고 안쪽은 물에 불어 형체가 없다.\n\n올라오면서 바닥에서 결정 조각도 하나 집었다. 폐가 터질 것 같았지만 둘 다 놓지 않았다.' },
            success: { effect: { exp: 20, hp: -8 }, deepen: true,
              text: '두 번 잠수해서 겨우 잡았다. 액자다. 무겁다.' },
            fail: { effect: { hp: -14 }, deepen: true,
              text: '손끝이 스쳤을 뿐이다. 숨이 모자라 올라와야 했다.' },
            fumble: { effect: { hp: -22 }, deepen: true,
              text: '물을 먹었다. 올라오는 방향을 잠깐 잃었고, 그 몇 초가 아주 길었다.' },
          },
        },
        {
          label: '여기서 돌아 나온다',
          effect: { hp: -6, exp: 18 },
          resultText:
`영운은 돌아섰다.

물가로 나오는 데 생각보다 오래 걸렸다. 젖은 옷이 무거웠고 다리에 감각이 없었다.

뭍에 올라 돌아봤을 때, 아래쪽 빛은 아까보다 얕아 보였다. 올라오고 있는 건지, 아니면 처음부터 그 자리였는지 알 수 없었다.`,
        },
      ],
    },
    {
      text:
`액자를 안고 물가로 나왔다.

유리는 깨졌고 그림은 물에 불어 아무것도 아니다. 다만 액자 뒤판에 이름표가 붙어 있었다. 손바느질로 꿰맨 천 조각.

실은 색이 다 빠졌는데 글자는 또렷하다.

그리고 물속에서 뭔가 올라오고 있었다. 이번에는 확실히 이쪽을 향해서.

발밑에서 물이 뒤로 빨려 나갔다.`,
      gain: 5,
      choices: [
        {
          label: '이름표를 읽고 나서 도망친다',
          check: { stat: 'intelligence', dc: 16, search: true },
          gain: 5,
          outcomes: {
            critical: { effect: { intelligence: 2, exp: 60, fragment: 4 },
              text: '영운은 서서 읽었다. 뒤에서 물이 갈라지는 소리가 나는 동안.\n\n초상화였다. 이름표에 화가와 대상이 같이 적혀 있었다. 대상 쪽 글자가 손으로 꿰맨 것이라 남아 있었다.\n\n얼굴은 물에 불어 사라졌는데, 이름표의 글자 모양이 대신 남았다. 눈을 감아도 남았다.\n\n그러고 나서 뛰었다.' },
            success: { effect: { fragment: 4, exp: 30, hp: -10 },
              text: '읽으면서 뒷걸음질 쳤다. 글자 모양이 남았다. 발목까지 물이 차올랐을 때 돌아서 뛰었다.' },
            fail: { effect: { hp: -18 }, text: '읽으려다 늦었다. 물이 무릎까지 차올랐고, 뭔가가 발목을 잡았다가 놓았다.' },
            fumble: { effect: { hp: -26 }, text: '이름표를 놓쳤다. 물이 그것을 도로 가져갔다.' },
          },
        },
        { label: '액자를 버리고 뛴다', gain: 3, effect: { hp: -6 },
          resultText: '영운은 액자를 던지고 뛰었다.\n\n등 뒤에서 물이 크게 한 번 소리를 냈고, 그다음은 조용했다.\n\n성까지 오는 동안 한 번도 뒤돌아보지 않았다.' },
        {
          label: '맞선다',
          combat: 'darkCreature',
          resultText: '영운은 액자를 내려놓고 지팡이를 들었다. 물이 허벅지까지 차 있었다.',
        },
      ],
      afterText: '그날 이후로 신발은 관리인실 창가에서 사라졌다. 아무도 치웠다고 말하지 않았다.',
    },
  ],
},

/* ══════════ 지하 통로 — 아래로 ══════════ */
cellar_descent: {
  id: 'cellar_descent', pool: 'combat', weight: 14, progress: [30, 100], gain: 3,
  stages: [
    {
      text:
`지하 3층. 여기까지는 지도에 있다.

벽에 횃불이 걸려 있는데 절반은 꺼져 있다. 켜져 있는 쪽도 파랗다. 파란 불은 열이 없다.

바닥에 발자국이 있었다. 먼지가 두꺼운데 발자국은 한 방향뿐이다. 내려간 사람은 있고 올라온 사람은 없다.

발자국 크기는 어른 것. 오른발 쪽이 조금 더 깊다.

계단은 더 아래로 이어진다. 지도에 없는 쪽으로.`,
      choices: [
        {
          label: '발자국을 따라 내려간다',
          check: { stat: 'courage', dc: 8 },
          deepen: true,
          outcomes: {
            critical: { effect: { courage: 1, exp: 24 }, deepen: true,
              text: '계단은 스물세 칸이었다. 세면서 내려갔다.\n\n마지막 칸에서 공기가 바뀌었다. 지하인데 바람이 있다. 어딘가 뚫려 있다는 뜻이다.' },
            success: { effect: { exp: 12 }, deepen: true, text: '어두워서 벽을 짚으며 내려갔다. 벽이 축축했다.' },
            fail: { effect: { hp: -6 }, deepen: true, text: '한 칸을 헛디뎌 서너 칸을 미끄러졌다. 팔꿈치가 까졌다.' },
            fumble: { effect: { hp: -12 }, deepen: true, text: '중간에서 굴렀다. 아래까지 그대로 내려갔고 한참 못 일어났다.' },
          },
        },
        {
          label: '횃불이 왜 파란지 살핀다',
          check: { stat: 'intelligence', dc: 8, search: true },
          gain: 2,
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 26, learnSubject: 'charms' },
              text: '불에 손을 가까이 대봤다. 뜨겁지 않다. 이건 열 없는 불이다 — 수업에서 이론만 배운 것.\n\n한참 들여다보고 나니 손목의 각도가 이해됐다.' },
            success: { effect: { exp: 14 }, text: '열이 없는 불이었다. 누가 오래전에 켜두고 간 것이다.' },
            fail: { effect: {}, text: '그냥 파란 불이었다.' },
            fumble: { effect: { hp: -4 }, text: '너무 가까이 댔다. 열은 없는데 손끝이 얼었다.' },
          },
        },
      ],
    },
    {
      text:
`지도에 없는 층.

천장이 낮아 허리를 굽혀야 한다. 벽은 다듬은 돌이 아니라 파낸 자국 그대로다. 여기는 지어진 게 아니라 뚫린 곳이다.

발자국은 계속 이어진다. 그런데 여기서부터는 보폭이 이상하다. 걷다가, 멈추고, 아주 오래 있다가, 다시 걷는다.

멈춘 자리마다 먼지가 눌려 있다. 한 번이 아니라 여러 번. 같은 자리에 여러 번.

냄새가 났다. 젖은 돌 냄새가 아니라 다른 것.`,
      gain: 4,
      choices: [
        {
          label: '멈춘 자리를 세면서 더 간다',
          check: { stat: 'intelligence', dc: 12, search: true },
          deepen: true,
          outcomes: {
            critical: { effect: { intelligence: 1, exp: 36, flag: 'countedStops' }, deepen: true,
              text: '멈춘 자리는 여섯 군데. 간격이 일정하다.\n\n영운은 여섯 번째 자리에 서서 앞을 봤다. 벽이다. 아무것도 없는 벽.\n\n그런데 이 자리에서 보면, 벽의 돌 색이 위아래가 다르다. 아래 세 줄만 밝다.\n\n지상의 동쪽 벽과 같은 자리다. 여기까지 무너졌었다는 뜻이다.' },
            success: { effect: { exp: 20 }, deepen: true, text: '여섯 군데였다. 간격이 일정했다. 누가 뭔가를 세고 있었다.' },
            fail: { effect: { hp: -8 }, deepen: true, text: '세다가 놓쳤다. 천장에 머리를 부딪혔다.' },
            fumble: { effect: { hp: -14 }, deepen: true, text: '넘어지면서 뭔가를 밟았다. 뼈였다.' },
          },
        },
        {
          label: '냄새가 나는 쪽을 피해 돌아 나온다',
          effect: { exp: 20, hp: -4 },
          resultText:
`영운은 돌아섰다.

올라오는 길에 한 가지를 확인했다. 내려간 발자국 옆에, 아주 흐리게, 올라온 발자국도 있었다.

먼지에 거의 묻혀 있었다. 여러 번 오간 자국이 겹치면 이렇게 된다.

한 사람이 여기를 몇 번이나 오르내렸다.`,
        },
      ],
    },
    {
      text:
`여섯 번째 자리 너머.

통로가 넓어지며 방이 나왔다. 방이라기보다 무너진 자리를 대충 치운 공간이다.

가운데에 산 트롤이 있었다. 앉아 있다. 이십오 년 전에 이 성에 들어왔던 것들 중 하나가, 나가는 길을 못 찾고 여기 남았다.

배가 홀쭉하다. 오래 굶었다.

그 뒤 벽에 자국이 있었다. 원 안에 원. 위쪽 서고에서 본 것과 같은 도형이다. 이쪽이 훨씬 오래됐다.

트롤이 고개를 들었다.`,
      gain: 5,
      choices: [
        { label: '맞선다', combat: 'troll',
          resultText: '영운은 지팡이를 들었다. 좁은 데서 저만한 것과 싸우는 건 처음이다.' },
        {
          label: '먹을 것을 던져주고 벽으로 다가간다',
          requiresItem: 'chocolateFrog',
          check: { stat: 'charm', dc: 12 },
          gain: 5,
          outcomes: {
            critical: { effect: { consume: 'chocolateFrog', charm: 2, exp: 54, flag: 'sawTheMark', equipDrop: { slot: 'robe', tier: 3 } },
              text: '영운은 초콜릿을 굴려 보냈다.\n\n트롤이 그것을 한참 봤다. 그리고 먹었다. 먹는 동안 영운은 벽으로 갔다.\n\n도형은 완성되지 않았다. 가운데 이름이 들어갈 자리가 비어 있다.\n\n돌아 나오는 길에 무너진 돌더미에서 천 뭉치를 하나 건졌다. 두껍고, 아직 멀쩡했다.' },
            success: { effect: { consume: 'chocolateFrog', exp: 30, flag: 'sawTheMark' },
              text: '트롤이 먹는 동안 벽을 봤다. 도형 가운데가 비어 있다. 이름이 들어갈 자리.' },
            fail: { effect: { consume: 'chocolateFrog', hp: -14 }, text: '트롤이 초콜릿을 무시했다. 몽둥이가 벽을 때렸고 돌조각이 튀었다.' },
            fumble: { effect: { consume: 'chocolateFrog' }, combat: 'troll', text: '던진 게 얼굴에 맞았다.' },
          },
        },
        {
          label: '소리 없이 물러난다',
          check: { stat: 'agility', dc: 16 },
          gain: 3,
          outcomes: {
            critical: { effect: { agility: 2, exp: 34 }, text: '숨을 죽이고 여섯 걸음. 그것은 끝까지 못 봤다.' },
            success: { effect: { hp: -8, exp: 18 }, text: '돌을 하나 찼다. 뛰어서 계단까지 갔다.' },
            fail: { effect: { hp: -18 }, text: '몽둥이가 등 뒤 벽을 때렸다. 돌조각에 뒤통수를 맞았다.' },
            fumble: { effect: {}, combat: 'troll', text: '좁은 데서 발이 미끄러졌다.' },
          },
        },
      ],
      afterText: '올라오는 계단은 스물세 칸이었다. 내려갈 때와 같았다. 그게 이상하게 안심이 됐다.',
    },
  ],
},

};
