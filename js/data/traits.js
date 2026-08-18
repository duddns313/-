/* ===================== 특성 (trait) =====================
 * 시작 시 하나. 진행도 35~65 구간의 승급 인카운터로 상위 특성이 된다.
 * 상위 특성은 「기록」에 남아 다음 판 선택지에 등장한다. */

const TRAITS = {
  /* ── 기본 ── */
  tenacious: {
    id: 'tenacious', name: '끈질김', tier: 1, upgradesTo: 'tenacious2',
    desc: '한번 잡은 것을 잘 놓지 않는다.',
    effect: '붙들기 판정 +10%',
  },
  keenEye: {
    id: 'keenEye', name: '눈썰미', tier: 1, upgradesTo: 'keenEye2',
    desc: '남들이 지나치는 이음매가 눈에 걸린다.',
    effect: '조건부 선택지가 스탯 2 낮아도 열린다',
  },
  bold: {
    id: 'bold', name: '담대함', tier: 1, upgradesTo: 'bold2',
    desc: '무서운 것 앞에서 발이 얼지 않는다.',
    effect: '용기 +3',
    bonus: { courage: 3 },
  },
  ordinary: {
    id: 'ordinary', name: '평범함', tier: 1, upgradesTo: null,
    desc: '특별할 것이 없다. 그래서 어디에도 걸리지 않는다.',
    effect: '시작 스탯 총합 +4 (승급 없음)',
    bonus: { intelligence: 1, courage: 1, charm: 1, agility: 1 },
  },

  /* ── 상위 ── */
  tenacious2: {
    id: 'tenacious2', name: '놓지 않는 손', tier: 2,
    desc: '놓는 법을 배우지 못했다.',
    effect: '붙들기 판정 +10% 추가 · 판당 1회 침식 무료 되돌림',
  },
  keenEye2: {
    id: 'keenEye2', name: '이음매를 읽는 눈', tier: 2,
    desc: '고쳐 쌓은 자리는 색이 다르다는 걸 안다.',
    effect: '조사 판정 전부 +8%',
  },
  bold2: {
    id: 'bold2', name: '두려움을 모르는', tier: 2,
    desc: '무서운 것을 만나도 손이 떨리지 않는다.',
    effect: '전투 대실패(굴림 1) 무효',
  },
};

const STARTER_TRAITS = ['tenacious', 'keenEye', 'bold', 'ordinary'];

function hasTrait(id) {
  return !!(state && state.traits && state.traits.indexOf(id) >= 0);
}

function grantTrait(id) {
  if (!state.traits) state.traits = [];
  if (state.traits.indexOf(id) >= 0) return;
  state.traits.push(id);
  const t = TRAITS[id];
  if (t && t.bonus) {
    Object.keys(t.bonus).forEach((k) => { if (state.stats[k] != null) state.stats[k] += t.bonus[k]; });
  }
}
