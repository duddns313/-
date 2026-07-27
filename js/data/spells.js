/* ===================== 주문 · 과목 데이터 ===================== */
/* 자동 레벨업 습득은 폐지되었다. 모든 주문은 수업/주문서/사사/금서/보스 드랍을 통해서만 얻는다. */

const SUBJECTS = {
  charms: { id: 'charms', name: '마법주문학', line: 'attack' },
  dada: { id: 'dada', name: '어둠의 마법 방어술', line: 'defense' },
  transfiguration: { id: 'transfiguration', name: '변신술', line: 'transform' },
  potions: { id: 'potions', name: '마법약학', line: 'support' },
};

const SPELLS = {
  lumos: {
    id: 'lumos', name: '루모스', line: 'utility', type: 'utility', mpCost: 1, tier: 0,
    startWith: true, desc: '지팡이 끝에 빛을 밝힌다.',
  },
  expelliarmus: {
    id: 'expelliarmus', name: '익스펠리아무스', line: 'attack', type: 'attack', power: 10, mpCost: 4, tier: 1,
    startWith: true, subject: 'charms', desc: '상대를 무장 해제하는 기본 공격 주문.',
  },
  stupefy: {
    id: 'stupefy', name: '스터닝 스펠', line: 'attack', type: 'attack', power: 16, mpCost: 7, tier: 2,
    subject: 'charms', prereq: { spell: 'expelliarmus', mastery: 40 }, desc: '강한 충격으로 상대를 기절시키려는 주문.',
  },
  confringo: {
    id: 'confringo', name: '콘프린고', line: 'attack', type: 'attack', power: 24, mpCost: 12, tier: 3,
    subject: 'charms', prereq: { spell: 'stupefy', mastery: 50 }, desc: '폭발을 일으키는 고위력 공격 주문.',
  },

  protego: {
    id: 'protego', name: '프로테고', line: 'defense', type: 'defense', power: 0, mpCost: 5, tier: 1,
    subject: 'dada', desc: '방어막을 펼쳐 다음 공격의 피해를 크게 줄인다.',
  },
  expectoPatronum: {
    id: 'expectoPatronum', name: '익스펙토 패트로눔', line: 'defense', type: 'attack', power: 22, mpCost: 14, tier: 2,
    subject: 'dada', prereq: { spell: 'protego', mastery: 40 }, bonusVs: ['dementor'], bonusMult: 3,
    desc: '수호신 주문. 디멘터류에게 압도적으로 강력하다.',
  },

  avifors: {
    id: 'avifors', name: '아비포스', line: 'transform', type: 'attack', power: 8, mpCost: 5, tier: 1,
    subject: 'transfiguration', desc: '대상을 잠시 새떼로 착각하게 만들어 혼란시킨다.',
  },

  episkey: {
    id: 'episkey', name: '에피스키', line: 'support', type: 'heal', power: 0, healAmount: 26, mpCost: 8, tier: 1,
    subject: 'potions', desc: '상처를 치유하는 보조 주문.',
  },

  sectumsempra: {
    id: 'sectumsempra', name: '섹텀셈프라', line: 'curse', type: 'attack', power: 30, mpCost: 13, tier: 2,
    dark: true, alignment: -8, restrictedOnly: true,
    desc: '스네이프가 만든 위험한 주문. 사용할 때마다 마음이 조금씩 어두워진다.',
  },
  avadaKedavra: {
    id: 'avadaKedavra', name: '아바다 케다브라', line: 'curse', type: 'attack', power: 70, mpCost: 28, tier: 3,
    dark: true, alignment: -35, restrictedOnly: true, prereq: { spell: 'sectumsempra', mastery: 50 },
    desc: '용서받을 수 없는 저주. 압도적인 위력이지만 영혼을 크게 어둡힌다.',
  },
};

/* 숙련도 구간: 0-29 미숙 / 30-59 능숙 / 60-89 숙달 / 90-100 통달 */
const SPELL_MASTERY_TIERS = [
  { min: 0, max: 29, label: '미숙', failChance: 0.15, powerMult: 1.0, mpMult: 1.0 },
  { min: 30, max: 59, label: '능숙', failChance: 0, powerMult: 1.0, mpMult: 0.9 },
  { min: 60, max: 89, label: '숙달', failChance: 0, powerMult: 1.2, mpMult: 0.8 },
  { min: 90, max: 100, label: '통달', failChance: 0, powerMult: 1.4, mpMult: 0.8, critBonus: 0.15 },
];
