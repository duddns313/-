/* ===================== 배경 (background) =====================
 * 시작 시 하나를 고르고 판이 끝날 때까지 바꿀 수 없다.
 * 배경은 고정 비트의 진입 경로와 전용 엔딩을 결정한다 — 재플레이의 축. */

const BACKGROUNDS = {
  transfer: {
    id: 'transfer',
    name: '편입생',
    tagline: '아무것도 놓고 오지 않은 자',
    desc: '스코틀랜드에 아는 사람이 하나도 없다. 그게 약점이자, 나중에 밝혀지듯 유일한 자격이다.',
    freePoints: 5,
    startRegister: ['albus', 'rose', 'scorpius'],
    erosionShift: 0,
    bonus: {},
    perk: '스탯 5점 자유 분배',
    cost: '시작 명부 3명 (가장 적다)',
  },

  bereaved: {
    id: 'bereaved',
    name: '유족',
    tagline: '기념비 앞에서 자란 아이',
    desc: '조부의 이름이 저 벽에 있다. 해마다 5월이면 이 성에 왔고, 해마다 사람이 줄었다.',
    freePoints: 0,
    startRegister: ['albus', 'rose', 'edith', 'fred', 'lupin', 'colin'],
    erosionShift: 3,          /* 침식 주기가 3턴 길어진다 */
    bonus: { courage: 2 },
    protectedName: 'colin',   /* 이 이름을 잃으면 즉시 엔딩 */
    perk: '침식 주기 +3턴 · 시작 명부 6명',
    cost: '지키는 이름을 잃으면 그 자리에서 끝난다',
  },

  archivist: {
    id: 'archivist',
    name: '기록관 견습',
    tagline: '잉크는 잊지 않는다',
    desc: '여름 내내 서고에서 목록을 옮겨 적었다. 손으로 쓴 것과 인쇄된 것이 다를 때가 있다는 걸 안다.',
    freePoints: 0,
    startRegister: ['edith', 'albus', 'simon'],
    erosionShift: 0,
    bonus: { intelligence: 3, maxHp: -10 },
    seesHandwriting: true,    /* 손글씨 단서 선택지가 추가로 노출된다 */
    perk: '지식 +3 · 손글씨 단서 추가 노출',
    cost: '최대 체력 −10',
  },

  touched: {
    id: 'touched',
    name: '잔영에 닿은 아이',
    tagline: '한 번 먹혔다 돌아왔다',
    desc: '작년 겨울에 사흘을 잃었다. 아무도 그 사흘을 기억하지 못하고, 본인도 마찬가지다.',
    freePoints: 0,
    startRegister: ['albus', 'scorpius', 'edith'],
    erosionShift: -1,         /* 침식이 1턴 빨라진다 */
    bonus: { courage: 1, luck: 2 },
    darkUnlocked: true,       /* 어둠 계열 주문을 처음부터 배울 수 있다 */
    sensesShade: true,        /* 잔영의 징후를 미리 본다 */
    perk: '어둠 주문 해금 · 잔영 감지',
    cost: '침식 주기 −1턴',
  },
};

const BACKGROUND_LIST = Object.values(BACKGROUNDS);
