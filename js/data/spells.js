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
    startWith: true, desc: '지팡이 끝에 빛을 밝힌다. 어둠에 사는 것들은 이 빛을 싫어한다.',
    status: { id: 'expose', turns: 3 }, flavor: '지팡이 끝에 불이 들어왔다.',
  },
  expelliarmus: {
    id: 'expelliarmus', name: '익스펠리아무스', line: 'attack', type: 'attack', power: 10, mpCost: 4, tier: 1,
    startWith: true, subject: 'charms', desc: '상대를 무장 해제하는 기본 공격 주문.',
    status: { id: 'disarm', turns: 2 }, flavor: '지팡이가 손에서 튕겨 나갔다.',
  },
  stupefy: {
    id: 'stupefy', name: '스터닝 스펠', line: 'attack', type: 'attack', power: 16, mpCost: 7, tier: 2,
    subject: 'charms', prereq: { spell: 'expelliarmus', mastery: 40 }, desc: '강한 충격으로 상대를 기절시키려는 주문.',
    status: { id: 'stun', turns: 1, chance: 0.5 }, flavor: '붉은 섬광이 정면으로 꽂혔다.',
  },
  confringo: {
    id: 'confringo', name: '콘프린고', line: 'attack', type: 'attack', power: 24, mpCost: 12, tier: 3,
    subject: 'charms', prereq: { spell: 'stupefy', mastery: 50 }, desc: '폭발을 일으키는 고위력 공격 주문.',
    status: { id: 'burn', turns: 3 }, flavor: '공기가 터지며 열기가 확 퍼졌다.',
  },
  bombarda: {
    id: 'bombarda', name: '봄바르다', line: 'attack', type: 'attack', power: 34, mpCost: 16, tier: 4,
    subject: 'charms', prereq: { spell: 'confringo', mastery: 50 }, desc: '강력한 폭발을 일으키는 최상급 공격 주문.',
    pierce: true, flavor: '굉음과 함께 앞이 통째로 밀려났다.',
  },

  protego: {
    id: 'protego', name: '프로테고', line: 'defense', type: 'defense', power: 0, mpCost: 5, tier: 1, shieldMult: 0.35,
    subject: 'dada', desc: '방어막을 펼쳐 다음 공격의 피해를 크게 줄인다.',
    flavor: '눈앞에 투명한 벽이 섰다.',
  },
  expectoPatronum: {
    id: 'expectoPatronum', name: '익스펙토 패트로눔', line: 'defense', type: 'attack', power: 22, mpCost: 14, tier: 2,
    subject: 'dada', prereq: { spell: 'protego', mastery: 40 }, bonusVs: ['dementor'], bonusMult: 3,
    status: { id: 'fear', turns: 2 }, flavor: '은빛 형체가 뻗어 나갔다.',
    desc: '수호신 주문. 디멘터류에게 압도적으로 강력하다.',
  },
  protegoTotalum: {
    id: 'protegoTotalum', name: '프로테고 토탈룸', line: 'defense', type: 'defense', power: 0, mpCost: 10, tier: 3, shieldMult: 0.15,
    subject: 'dada', prereq: { spell: 'expectoPatronum', mastery: 50 }, reflect: 0.3,
    desc: '한층 강력한 방어 결계. 막아낸 충격의 일부를 되돌려 보낸다.',
    flavor: '결계가 둥글게 부풀어 올랐다.',
  },

  avifors: {
    id: 'avifors', name: '아비포스', line: 'transform', type: 'attack', power: 8, mpCost: 5, tier: 1,
    subject: 'transfiguration', status: { id: 'confuse', turns: 2 },
    desc: '대상을 잠시 새떼로 착각하게 만들어 혼란시킨다.', flavor: '깃털이 사방에서 터져 나왔다.',
  },
  hardenSkin: {
    id: 'hardenSkin', name: '피부 경화술', line: 'transform', type: 'defense', power: 0, mpCost: 9, tier: 2, shieldMult: 0.2,
    subject: 'transfiguration', prereq: { spell: 'avifors', mastery: 40 }, lasting: 3,
    desc: '피부를 단단하게 바꾼다. 방어막이 여러 턴 유지된다.', flavor: '살갗이 돌처럼 굳었다.',
  },

  episkey: {
    id: 'episkey', name: '에피스키', line: 'support', type: 'heal', power: 0, healAmount: 26, mpCost: 8, tier: 1,
    subject: 'potions', desc: '상처를 치유하는 보조 주문.', cleanse: true,
    flavor: '살이 아무는 감각이 스쳤다.',
  },
  vulneraSanentur: {
    id: 'vulneraSanentur', name: '불네라 사넨투르', line: 'support', type: 'heal', power: 0, healAmount: 48, mpCost: 15, tier: 2,
    subject: 'potions', prereq: { spell: 'episkey', mastery: 40 }, cleanse: true,
    desc: '깊은 상처까지 치유하고 몸에 걸린 것을 씻어낸다.', flavor: '숨이 트였다.',
  },

  sectumsempra: {
    id: 'sectumsempra', name: '섹텀셈프라', line: 'curse', type: 'attack', power: 30, mpCost: 13, tier: 2,
    dark: true, alignment: -8, restrictedOnly: true,
    status: { id: 'bleed', turns: 4 }, flavor: '보이지 않는 날이 지나갔다.',
    desc: '스네이프가 만든 위험한 주문. 사용할 때마다 마음이 조금씩 어두워진다.',
  },
  avadaKedavra: {
    id: 'avadaKedavra', name: '아바다 케다브라', line: 'curse', type: 'attack', power: 70, mpCost: 28, tier: 3,
    dark: true, alignment: -35, restrictedOnly: true, prereq: { spell: 'sectumsempra', mastery: 50 },
    pierce: true, flavor: '초록빛이 복도를 가득 채웠다.',
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

/* ── 상태 효과 ──
 * 턴제 전투에서 "무엇을 쓰느냐"가 갈리게 하는 장치.
 * 위력만 다르면 제일 센 걸 반복해서 누르는 게 최적이 되어버린다. */
const STATUSES = {
  disarm:  { id: 'disarm',  name: '무장해제', on: 'enemy', desc: '공격력이 절반이 된다',        atkMult: 0.5 },
  stun:    { id: 'stun',    name: '기절',     on: 'enemy', desc: '이번 턴을 건너뛴다',          skipTurn: true },
  burn:    { id: 'burn',    name: '화상',     on: 'enemy', desc: '턴마다 피해를 입는다',        dot: 6 },
  bleed:   { id: 'bleed',   name: '출혈',     on: 'enemy', desc: '턴마다 피해를 입는다',        dot: 9 },
  confuse: { id: 'confuse', name: '혼란',     on: 'enemy', desc: '가끔 헛손질한다',             missChance: 0.35 },
  fear:    { id: 'fear',    name: '위축',     on: 'enemy', desc: '공격력이 크게 떨어진다',      atkMult: 0.6 },
  expose:  { id: 'expose',  name: '드러남',   on: 'enemy', desc: '받는 피해가 늘어난다',        takenMult: 1.25 },
};
