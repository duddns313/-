/* ===================== 인물 등재부 (명부) =====================
 * 장면 본문에서는 {{id}} 자리표시자를 쓰고, 렌더 시 veilName()으로 치환한다.
 * 그래야 침식(잊힘)이 이미 쓰인 문장에도 소급 적용된다. */

/* erodible — 잔영이 먹을 수 있는 이름.
 * 기념비의 이름도 먹힌다. 라비니아가 그렇게 먹혔다(startErosion: 3). */
const PEOPLE = {
  /* ── 동료 ── */
  albus: {
    id: 'albus', name: '알버스 포터', given: '알버스', surname: '포터',
    houseId: 'slytherin', year: 6, companion: true, erodible: true,
    note: '해리 포터의 둘째. 조용하고 생각이 많다.',
  },
  rose: {
    id: 'rose', name: '로즈 그레인저-위즐리', given: '로즈', surname: '그레인저-위즐리',
    houseId: 'gryffindor', year: 6, companion: true, erodible: true,
    note: '마법부 장관의 딸. 빠르고 정확하고 자주 앞서간다.',
  },
  scorpius: {
    id: 'scorpius', name: '스콜피우스 말포이', given: '스콜피우스', surname: '말포이',
    houseId: 'slytherin', year: 6, companion: true, erodible: true,
    note: '지나치게 공손하다. 미움받지 않으려 애쓴다.',
  },
  edith: {
    id: 'edith', name: '이디스 파넬', given: '이디스', surname: '파넬',
    houseId: 'ravenclaw', year: 6, companion: true, erodible: true,
    note: '모든 것을 수첩에 적는다. 잉크는 잊지 않는다.',
  },

  /* ── 성 안의 어른 ── */
  mcgonagall: { id: 'mcgonagall', name: '미네르바 맥고나걸', given: '미네르바', surname: '맥고나걸', note: '교장.' },
  dumbledore: { id: 'dumbledore', name: '알버스 덤블도어', given: '알버스', surname: '덤블도어', note: '교장실의 초상화.' },
  neville: { id: 'neville', name: '네빌 롱보텀', given: '네빌', surname: '롱보텀', note: '약초학 교수.' },
  flitwick: { id: 'flitwick', name: '필리우스 플리트윅', given: '필리우스', surname: '플리트윅', note: '마법 주문학 교수. 레번클로 담임.' },
  simon: { id: 'simon', name: '시몬 애슈', given: '시몬', surname: '애슈', note: '서고 관리인. 조용하고 친절하다.' },
  greyLady: { id: 'greyLady', name: '회색 여인', given: '회색', surname: '여인', note: '레번클로의 유령.' },

  /* ── 기념비 (전사자) ── */
  lavinia: {
    id: 'lavinia', name: '라비니아 애슈', given: '라비니아', surname: '애슈',
    memorial: true, startErosion: 3,
    note: '기념비 세 번째 줄. 이름이 있어야 할 자리가 비어 있다.',
  },
  fred: { id: 'fred', name: '프레드 위즐리', given: '프레드', surname: '위즐리', memorial: true, erodible: true },
  lupin: { id: 'lupin', name: '리머스 루핀', given: '리머스', surname: '루핀', memorial: true, erodible: true },
  tonks: { id: 'tonks', name: '님파도라 통스', given: '님파도라', surname: '통스', memorial: true },
  colin: { id: 'colin', name: '콜린 크리비', given: '콜린', surname: '크리비', memorial: true, erodible: true },
  lavender: { id: 'lavender', name: '라벤더 브라운', given: '라벤더', surname: '브라운', memorial: true },
};

const MEMORIAL_ROW3 = ['colin', 'lavinia', 'lavender'];
