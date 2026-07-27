/* ===================== 장소 · 상점 데이터 ===================== */
/* risk: 지역 위험도. 드랍 품질과 판정 난이도 보정에 사용된다. */

const LOCATIONS = {
  commonRoom: {
    id: 'commonRoom', name: '기숙사 휴게실',
    desc: '아늑한 벽난로 앞, 하루의 피로를 녹일 수 있는 곳.',
    tag: 'safe', risk: 0, connections: ['greatHall', 'library', 'corridors'],
  },
  greatHall: {
    id: 'greatHall', name: '대연회장',
    desc: '천장에 밤하늘이 펼쳐진 웅장한 홀. 학생들이 모여 식사를 한다.',
    tag: 'safe', risk: 0, connections: ['commonRoom', 'library', 'corridors', 'headmasterOffice'],
  },
  library: {
    id: 'library', name: '도서관',
    desc: '끝없이 늘어선 책장들. 지식과 단서가 잠들어 있다.',
    tag: 'library', risk: 0, connections: ['greatHall', 'corridors'],
  },
  classroom: {
    id: 'classroom', name: '주문학 교실',
    desc: '이곳에서 과목을 수강하며 새로운 주문의 진도를 쌓을 수 있다.',
    tag: 'training', risk: 0, connections: ['corridors'],
  },
  corridors: {
    id: 'corridors', name: '성의 복도',
    desc: '끝없이 이어지는 호그와트의 복도. 계단이 제멋대로 움직인다.',
    tag: 'corridor', risk: 1, connections: ['greatHall', 'library', 'classroom', 'hogsmeade', 'forbiddenForest', 'headmasterOffice'],
  },
  headmasterOffice: {
    id: 'headmasterOffice', name: '교장실',
    desc: '덤블도어 교수가 머무는 곳. 중요한 이야기는 이곳에서 이루어진다.',
    tag: 'quest', risk: 0, connections: ['greatHall', 'corridors'],
  },
  hogsmeade: {
    id: 'hogsmeade', name: '호그스미드 마을',
    desc: '학생들이 자유롭게 오갈 수 있는 유일한 마을. 상점들이 늘어서 있다.',
    tag: 'village', risk: 1, connections: ['corridors', 'honeydukes', 'ollivanders'],
  },
  honeydukes: {
    id: 'honeydukes', name: '허니듀크스',
    desc: '온갖 마법 과자와 물약을 파는 상점.', shop: 'honeydukes',
    tag: 'shop', risk: 0, connections: ['hogsmeade'],
  },
  ollivanders: {
    id: 'ollivanders', name: '올리밴더 지팡이 상점',
    desc: '지팡이와 방어구, 주문서를 파는 유서 깊은 상점. 지팡이 뽑기도 가능하다.', shop: 'ollivanders',
    tag: 'shop', risk: 0, connections: ['hogsmeade'],
  },
  forbiddenForest: {
    id: 'forbiddenForest', name: '금지된 숲',
    desc: '학생 출입 금지 구역. 위험하지만 강력한 존재와 귀한 전리품이 숨어있다.',
    tag: 'forest', risk: 2, connections: ['corridors'],
  },
  chamberOfSecrets: {
    id: 'chamberOfSecrets', name: '비밀의 방',
    desc: '전설로만 전해지던 장소. 차갑고 축축한 공기가 감돈다.',
    tag: 'chamber', risk: 3, connections: ['corridors'], locked: true,
  },
};

const SHOPS = {
  honeydukes: {
    name: '허니듀크스',
    items: ['healPotion', 'manaPotion', 'chocolateFrog', 'elixir'],
  },
  ollivanders: {
    name: '올리밴더 상점',
    items: ['magicStone', 'scrollStupefy', 'scrollEpiskey', 'scrollAvifors'],
    equipment: ['rowanWand', 'mahoganyWand', 'ebonyWand', 'travelerRobe', 'dragonhideRobe', 'merpeopleRobe', 'rabbitFoot', 'silverCharm', 'manaRing'],
    gacha: true,
  },
};
