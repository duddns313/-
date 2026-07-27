/* ===================== 기숙사 데이터 ===================== */

const HOUSES = {
  gryffindor: {
    id: 'gryffindor',
    name: '그리핀도르',
    animal: '사자',
    trait: '용기와 대담함',
    desc: '용기와 배짱을 중시하는 기숙사. 위험 앞에서 물러서지 않는다.',
    bonus: { hp: 15, courage: 6, atk: 2, agility: 2 },
  },
  slytherin: {
    id: 'slytherin',
    name: '슬리데린',
    animal: '뱀',
    trait: '야망과 지략',
    desc: '야망과 자존심, 그리고 목적을 위한 수단을 중시하는 기숙사.',
    bonus: { hp: 5, atk: 4, def: 2, intelligence: 3, charm: 2 },
  },
  ravenclaw: {
    id: 'ravenclaw',
    name: '레번클로',
    animal: '독수리',
    trait: '지혜와 재치',
    desc: '지식과 재치, 배움을 향한 갈증을 중시하는 기숙사.',
    bonus: { hp: 5, def: 2, intelligence: 8, charm: 1, maxMp: 10 },
  },
  hufflepuff: {
    id: 'hufflepuff',
    name: '후플푸프',
    animal: '오소리',
    trait: '성실과 우정',
    desc: '충직함과 인내, 공정함을 중시하는 기숙사.',
    bonus: { hp: 10, courage: 2, def: 4, charm: 4, luck: 4 },
  },
};

/* 5대 능력치 메타데이터 (표시용) */
const STAT_META = {
  intelligence: { label: '지식', short: '知' },
  courage: { label: '용기', short: '勇' },
  charm: { label: '매력', short: '魅' },
  agility: { label: '민첩', short: '敏' },
  luck: { label: '행운', short: '運' },
};
