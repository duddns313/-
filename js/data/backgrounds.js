/* ===================== 배경 (background) =====================
 * 시작 시 하나를 고르고 판이 끝날 때까지 바꿀 수 없다.
 * 배경은 고정 비트의 진입 경로와 전용 엔딩을 결정한다 — 재플레이의 축.
 *
 * startRegister는 「만난 적 없는 사람」을 담지 않는다.
 * 명부는 만나서 적는 것이고, 그래야 잃을 때 아프다. 처음부터 급우 여섯 명이
 * 적혀 있으면 그건 명부가 아니라 등장인물 목록이다.
 * 그래서 여기 들어가는 건 성에 오기 전부터 이미 아는 이름뿐이다 —
 * 기념비 벽에서 자랐거나, 여름 내내 같이 일했거나. 나머지는 만나서 적는다. */

const BACKGROUNDS = {
  transfer: {
    id: 'transfer',
    name: '편입생',
    tagline: '아무것도 놓고 오지 않은 자',
    desc: '스코틀랜드에 아는 사람이 하나도 없다. 그게 약점이자, 나중에 밝혀지듯 유일한 자격이다.',
    freePoints: 5,
    startRegister: [],
    erosionShift: 0,
    bonus: {},
    perk: '스탯 5점 자유 분배',
    cost: '아는 이름이 하나도 없다 — 명부가 비어 있다',
  },

  bereaved: {
    id: 'bereaved',
    name: '유족',
    tagline: '기념비 앞에서 자란 아이',
    desc: '조부의 이름이 저 벽에 있다. 해마다 5월이면 이 성에 왔고, 해마다 사람이 줄었다.',
    freePoints: 0,
    /* 급우가 아니다. 기념비 벽에서 외운 이름이다 — 해마다 5월에 읽었다. */
    startRegister: ['colin', 'fred', 'lupin'],
    erosionShift: 3,          /* 침식 주기가 3턴 길어진다 */
    bonus: { courage: 2 },
    protectedName: 'colin',   /* 이 이름을 잃으면 즉시 엔딩 */
    perk: '침식 주기 +3턴 · 기념비의 이름 셋을 이미 안다',
    cost: '지키는 이름(콜린)을 잃으면 그 자리에서 끝난다',
  },

  archivist: {
    id: 'archivist',
    name: '기록관 견습',
    tagline: '잉크는 잊지 않는다',
    desc: '여름 내내 서고에서 목록을 옮겨 적었다. 손으로 쓴 것과 인쇄된 것이 다를 때가 있다는 걸 안다.',
    freePoints: 0,
    /* 여름 내내 서고에서 같이 일한 사람 하나. 그 이상은 모른다. */
    startRegister: ['simon'],
    erosionShift: 0,
    bonus: { intelligence: 3, maxHp: -10 },
    seesHandwriting: true,    /* 손글씨 단서 선택지가 추가로 노출된다 */
    perk: '지식 +3 · 손글씨 단서 추가 노출 · 서고 관리인을 안다',
    cost: '최대 체력 −10',
  },

  touched: {
    id: 'touched',
    name: '잔영에 닿은 아이',
    tagline: '한 번 먹혔다 돌아왔다',
    desc: '작년 겨울에 사흘을 잃었다. 아무도 그 사흘을 기억하지 못하고, 본인도 마찬가지다.',
    freePoints: 0,
    /* 사흘을 잃었다. 그 사흘에 있던 이름도 같이 갔다. */
    startRegister: [],
    erosionShift: -1,         /* 침식이 1턴 빨라진다 */
    bonus: { courage: 1, luck: 2 },
    darkUnlocked: true,       /* 어둠 계열 주문을 처음부터 배울 수 있다 */
    sensesShade: true,        /* 잔영의 징후를 미리 본다 */
    perk: '어둠 주문 해금 · 잔영 감지',
    cost: '침식 주기 −1턴 · 명부가 비어 있다',
  },
};

const BACKGROUND_LIST = Object.values(BACKGROUNDS);
