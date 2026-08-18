/* ===================== 인카운터 · 특수 =====================
 * special: true 인 것은 랜덤 추첨에 들어가지 않는다.
 * 스케줄러가 조건을 보고 직접 꽂아 넣는다. */

const ENCOUNTERS_SPECIAL = {

/* 침식 2턴 전 경보 — 손 쓸 기회 없이 이름을 잃는 일이 없도록 */
warn_fading: {
  id: 'warn_fading', pool: 'eerie', special: true, repeatable: true, gain: 1,
  text: (s) => {
    const target = fadingCandidate();
    const name = target ? veilName(target) : '누군가';
    return `명부를 펼쳤는데 한 줄이 눈에 걸렸다.

«${name}».

글씨가 번진 것도 아니고 지워진 것도 아닌데, 보고 있으면 초점이 자꾸 미끄러진다. 옆 줄은 멀쩡하다. 그 줄만 그렇다.

영운은 손끝으로 그 줄을 짚었다. 종이는 그대로였다.

무언가가 이 이름을 향해 오고 있다.`;
  },
  choices: [
    {
      label: '지금 소리 내어 불러둔다',
      check: { stat: 'courage', dc: 8, hold: true },
      outcomes: {
        critical: { effect: { courage: 1, exp: 26, flag: 'erosionDelayed' },
          text: '영운은 소리 내어 불렀다. 한 번, 두 번, 세 번.\n\n세 번째에 글씨가 또렷해졌다. 그리고 한동안 그대로였다.' },
        success: { effect: { exp: 14, flag: 'erosionDelayed' },
          text: '영운은 소리 내어 불렀다. 목이 아팠지만 글씨가 다시 또렷해졌다.' },
        fail: { effect: { hp: -4 },
          text: '불러봤지만 소리가 목 안에서 멎었다. 이름이 입 밖으로 나오지 않았다.' },
        fumble: { effect: { hp: -8 },
          text: '부르려는데 그 이름이 뭐였는지 순간 떠오르지 않았다. 명부를 다시 봐야 했다. 그 사이에 무언가 한 뼘 더 가까워졌다.' },
      },
    },
    {
      label: '수첩에 옮겨 적어둔다',
      effect: { exp: 12 },
      resultText:
`영운은 명부의 그 줄을 수첩에 한 번 더 옮겨 적었다.

잉크는 잊지 않는다고 했다. 그게 무슨 뜻인지는 아직 잘 모르겠지만, 적어두는 편이 안 적는 것보다 나을 것 같았다.`,
    },
    { label: '덮는다', effect: {}, resultText: '영운은 명부를 덮었다. 덮고 나니 방금 무엇이 이상했는지 잘 떠오르지 않았다.' },
  ],
  onEnter: (s) => { s.flags.erosionWarned = true; },
},

/* ── 특성 승급 (진행도 35~65) ── */

trait_up_tenacious: {
  id: 'trait_up_tenacious', pool: 'common', weight: 20, progress: [35, 65], gain: 2,
  requiresTrait: 'tenacious', notFlag: 'traitUpDone',
  text:
`밤에 명부를 붙들고 있었다. 벌써 세 번째 이름이었다.

손가락이 저렸다. 목이 갈라졌다. 그런데 놓아지지가 않았다.

이상한 건 힘든 게 아니라, 놓는 방법이 떠오르지 않는다는 것이었다. 어떻게 하면 놓는 거지. 손을 펴면 되나. 그런 문제가 아닌 것 같았다.`,
  choices: [
    {
      label: '끝까지 붙든다',
      check: { stat: 'courage', dc: 12 },
      outcomes: {
        critical: { effect: { trait: 'tenacious2', flag: 'traitUpDone', courage: 1 },
          text: '영운은 아침까지 붙들고 있었다.\n\n해가 들 무렵 손을 폈다. 이름은 그대로 있었다.\n\n그때 알았다. 놓는 법을 배운 적이 없는 게 아니라, 배우지 않기로 한 것이었다.' },
        success: { effect: { trait: 'tenacious2', flag: 'traitUpDone' },
          text: '영운은 끝까지 붙들었다. 아침이 됐을 때 이름은 그대로였고, 손은 여전히 저렸다.' },
        fail: { effect: { hp: -8 },
          text: '새벽에 손이 풀렸다. 이름은 남았지만 무언가 놓친 것 같았다.' },
        fumble: { effect: { hp: -12 },
          text: '무리했다. 아침에 일어나지 못했고, 하루 종일 손이 떨렸다.' },
      },
    },
    { label: '오늘은 여기까지 한다', effect: { hp: 8 }, resultText: '영운은 명부를 덮고 잤다. 아침에는 손이 괜찮았다.' },
  ],
},

trait_up_keeneye: {
  id: 'trait_up_keeneye', pool: 'search', weight: 20, progress: [35, 65], gain: 2,
  requiresTrait: 'keenEye', notFlag: 'traitUpDone',
  text:
`동쪽 벽 아래.

위쪽 돌은 오래 비를 맞아 거무스름한데 아래 세 줄은 아직 밝다. 이십오 년 전에 무너졌고 다시 쌓았다는 뜻이다.

여기 사람들은 아무도 그쪽을 보지 않는다. 나고 자란 사람에게는 그냥 벽이니까.

영운은 이음매를 손끝으로 따라갔다. 그러다 멈췄다.

한 군데, 색이 위쪽과 같은데 이음매가 있는 자리가 있었다.`,
  choices: [
    {
      label: '그 이음매를 끝까지 따라간다',
      check: { stat: 'intelligence', dc: 12, search: true },
      outcomes: {
        critical: { effect: { trait: 'keenEye2', flag: 'traitUpDone', intelligence: 1 },
          text: '이음매는 벽을 돌아 기념비 뒤까지 이어졌다.\n\n고쳐 쌓은 자리는 색이 다르다. 그런데 이 자리는 색을 맞춰놨다. 맞추려면 누가 그렇게 하려고 해야 한다.\n\n영운은 그날 이후로 색이 맞는 자리를 먼저 보게 됐다.' },
        success: { effect: { trait: 'keenEye2', flag: 'traitUpDone' },
          text: '이음매가 기념비 뒤까지 이어졌다. 색을 일부러 맞춰놓은 자리였다.' },
        fail: { effect: {},
          text: '따라가다 놓쳤다. 다시 찾으려니 어디였는지 알 수 없었다.' },
        fumble: { effect: { hp: -6 },
          text: '벽을 짚고 몸을 기울이다 미끄러졌다. 손바닥이 까졌다.' },
      },
    },
    { label: '그냥 벽이라고 생각한다', effect: { exp: 8 }, resultText: '영운은 손을 뗐다. 벽은 벽이다. 그렇게 생각하는 편이 편했다.' },
  ],
},

trait_up_bold: {
  id: 'trait_up_bold', pool: 'eerie', weight: 20, progress: [35, 65], gain: 2,
  requiresTrait: 'bold', notFlag: 'traitUpDone',
  text:
`복도 끝에 그것이 서 있었다.

형체는 없고, 있어야 할 자리에 아무것도 없다는 느낌만 있었다. 눈으로 보는 게 아니라 그쪽만 세상이 얇았다.

도망칠 수 있었다. 뒤에 계단이 있고, 계단 아래는 사람이 많은 홀이다.

영운은 서 있었다.`,
  choices: [
    {
      label: '그쪽으로 한 걸음 간다',
      check: { stat: 'courage', dc: 16 },
      outcomes: {
        critical: { effect: { trait: 'bold2', flag: 'traitUpDone', courage: 2 },
          text: '영운은 한 걸음 갔다. 그리고 또 한 걸음.\n\n그것이 물러섰다.\n\n그때 알았다. 저것도 무언가를 무서워한다. 무서운 것들이 다 그렇듯이.' },
        success: { effect: { trait: 'bold2', flag: 'traitUpDone', hp: -6 },
          text: '영운은 한 걸음 갔다. 그것이 물러섰다. 손이 떨렸지만 발은 떨리지 않았다.' },
        fail: { effect: { hp: -12 },
          text: '발이 떨어지지 않았다. 한참을 서 있다가 결국 뒤로 물러났다.' },
        fumble: { effect: { hp: -18 },
          text: '한 걸음 갔는데 그것이 오히려 다가왔다. 부딪혔을 때 몸에서 무언가 빠져나갔다.' },
      },
    },
    { label: '물러선다', effect: {}, resultText: '영운은 계단 쪽으로 물러났다. 아래층 홀의 소리가 들리자 그것은 사라져 있었다.' },
  ],
},

};
