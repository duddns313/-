'use strict';
/* 1학년 · 갈림길 (코드 이름은 knot) — 원작의 우연들. 첫 번째 삶에서 호현과 내가 뒤에서 만들어 낸 것들.
   heavy: 큰 갈림길, 어긋나면 원작이 크게 틀어진다(결말을 가른다) · light: 작은 갈림길, 뒤의 큰 갈림길을 받친다
   neville: 🌱 네빌의 갈림길 — 네빌의 용기가 자랄 씨앗, 첫 번째 삶에서 우리가 놓친 것
   due: 이 주(turn)가 끝날 때까지 아무것도 하지 않으면 어긋난다 · ready: 이번 판에 사건이 준비된 갈림길 */

const KNOTS = {};
function defineKnots(list) { list.forEach((k, i) => { KNOTS[k.id] = Object.assign({ n: i + 1, year: 1 }, k); }); }

defineKnots([
  { id: 'k_platform', month: '9월 1일', title: '해리가 승강장에서 위즐리 가족을 만난다', weight: 'heavy', due: 0, ready: true,
    feeds: '론과의 우정 → 6월의 체스판', life: '첫 번째 삶에서는 내가 해리를 위즐리 부인 쪽으로 슬쩍 이끌었다. 해리는 지금도 그게 우연인 줄 안다.' },
  { id: 'k_trevor', month: '9월 1일', title: '트레버를 찾던 헤르미온느가 해리와 론의 칸에 들어간다', weight: 'light', neville: true, due: 0, ready: true,
    feeds: '셋의 첫 만남 · 네빌', life: '네빌이 울먹이며 칸마다 문을 열고 두꺼비를 찾던 그 복도. 첫 번째 삶의 나는 네빌의 얼굴조차 눈여겨보지 않았다.' },
  { id: 'k_card', month: '9월 1일', title: '해리가 개구리 초콜릿에서 덤블도어 카드를 뽑는다', weight: 'light', due: 0, ready: true,
    feeds: '카드 뒷면의 "니콜라스 플라멜" → 1월의 깨달음', life: '혼자서는 아무것도 아닌 카드 한 장이다. 하지만 1월에 해리가 "이 이름 어디서 봤는데!" 하고 떠올리려면, 지금 카드 뒷면을 읽어 둬야 한다.' },
  { id: 'k_hand', month: '9월 1일', title: '해리가 말포이의 악수를 거절한다', weight: 'heavy', due: 0, ready: true,
    feeds: '분류 모자 앞에서 "슬리데린은 싫어"', life: '분류 모자는 해리를 슬리데린에 넣을까 고민했다. 해리가 모자 앞에서 "슬리데린은 싫어" 하고 빌려면, 그 전에 말포이를 싫어하게 되어야 한다.' },
  { id: 'k_remembrall', month: '9월', title: '네빌의 리멤브럴 — 비행 수업에서 해리가 날아오른다', weight: 'heavy', neville: true, due: 2, ready: true,
    feeds: '해리가 수색꾼이 된다 → 11월 퀴디치 · 6월 날개 달린 열쇠', life: '네빌이 빗자루에서 떨어져 손목이 부러져야 후치 부인이 네빌을 의무실로 데려가며 자리를 비운다. 그 틈에 말포이가 리멤브럴을 던지고, 해리가 그걸 쫓아 날아오른다.' },
  { id: 'k_duel', month: '9월', title: '자정의 결투 — 넷이 4층 복도에서 플러피를 본다', weight: 'heavy', neville: true, due: 3, ready: true,
    feeds: '4층의 비밀 · 셋이 그 문 너머를 궁금해한다', life: '말포이는 결투하러 오지 않고 필치에게 일러바친다. 암호를 잊어 초상화 밖에 있던 네빌이 셋과 함께 필치를 피해 도망치다가, 넷이 잠긴 4층 문을 열게 된다.' },
  { id: 'k_troll', month: '10월 31일', title: '헤르미온느의 눈물과 트롤 — 셋이 친구가 된다', weight: 'heavy', due: 4, ready: true,
    feeds: '1년 내내 · 6월의 함정들', life: '헤르미온느는 오후 내내 화장실에서 울어야 한다. 아무도 달래 주면 안 된다. 그래야 트롤이 들어온 밤 해리와 론이 헤르미온느를 구하러 간다. 그게 제일 힘들었다.' },
  { id: 'k_snape_leg', month: '11월 1일', title: '해리가 스네이프의 물린 다리를 본다', weight: 'light', due: 5, ready: true,
    feeds: '셋은 스네이프를 의심한다 → 퀴렐이 경계를 늦춘다', life: '해리가 스네이프에게 빼앗긴 『퀴디치의 역사』를 돌려받으러 교무실에 가야, 물린 다리를 보게 된다.' },
  { id: 'k_quidditch', month: '11월', title: '헤르미온느가 스네이프의 망토에 불을 붙인다', weight: 'heavy', due: 5,
    ready: true,
    feeds: '해리가 산다', life: '헤르미온느가 스네이프에게 가다가 퀴렐을 밀쳐 넘어뜨린다. 퀴렐의 눈길이 해리의 빗자루에서 떨어지는 그 몇 초 동안 저주가 풀린다.' },
  { id: 'k_hagrid_slip', month: '11월', title: '해그리드가 "니콜라스 플라멜"을 흘린다', weight: 'light', due: 6,
    feeds: '플라멜을 찾는 겨울' },
  { id: 'k_mirror', month: '12월', title: '해리가 필치를 피해 소망의 거울을 찾는다', weight: 'heavy', due: 7,
    ready: true,
    feeds: '6월, 돌을 꺼내는 방법' },
  { id: 'k_leglock', month: '1월', title: '다리 묶기에 걸린 네빌 — "넌 말포이 열두 명 몫이야"', weight: 'heavy', neville: true, due: 8,
    feeds: '플라멜 깨달음 · 네빌의 용기' },
  { id: 'k_stands', month: '2월', title: '관중석에서 네빌이 크레이브와 고일에게 덤빈다', weight: 'light', neville: true, due: 9,
    feeds: '네빌의 용기' },
  { id: 'k_egg', month: '3월', title: '해그리드가 낯선 이에게서 용 알을 얻는다', weight: 'light', due: 10,
    feeds: '노버트 · 플러피를 잠재우는 법이 새어 나간다' },
  { id: 'k_norbert', month: '4월', title: '노버트가 떠나는 밤 — 150점, 그리고 경고하러 나온 네빌', weight: 'heavy', neville: true, due: 11,
    feeds: '벌칙 → 금지된 숲' },
  { id: 'k_forest', month: '5월', title: '금지된 숲 — 피렌체가 해리를 구한다', weight: 'heavy', due: 12,
    feeds: '해리가 볼드모트가 아직 살아 있다는 걸 알게 된다' },
  { id: 'k_realize', month: '6월', title: '해리가 해그리드의 실수를 깨닫는다', weight: 'heavy', due: 13,
    feeds: '그날 밤 뚜껑 문으로' },
  { id: 'k_neville', month: '6월', title: '네빌이 셋을 막아선다', weight: 'heavy', neville: true, due: 13,
    ready: true,
    feeds: '덤블도어의 10점 · 네빌의 용기' },
  { id: 'k_return', month: '6월', title: '덤블도어가 제때 돌아온다', weight: 'heavy', due: 13,
    ready: true,
    feeds: '해리가 산다' },
  { id: 'k_trapdoor', month: '6월', title: '셋이 함정을 지난다', weight: 'heavy', due: 13,
    ready: true,
    feeds: '1학년의 끝' },
]);

/* 6월을 위한 준비 — 마지막 밤의 함정을 셋이 스스로 지나가도록, 1년 내내 내가 심어 두는 것.
   flag 이름 그대로 S.flags에 선다. 없으면 그날 밤 내가 어둠 속에서 직접 손을 써야 한다(흔적이 남는다). */
const PREPS = {
  prep_snare:  { trap: '악마의 덫',        who: '헤르미온느', title: '헤르미온느가 불을 떠올린다',            how: '헤르미온느가 스프라우트 교수에게서 "어둡고 축축한 곳을 좋아하는 덩굴" 이야기를 듣게 하거나, 헤르미온느 앞에서 푸른 불꽃을 쓴다' },
  prep_keys:   { trap: '날개 달린 열쇠',   who: '해리',       title: '해리가 작고 빠른 것을 잡는 눈',          how: '해리가 수색꾼이 되고, 작고 빠른 것을 쫓는 연습을 한다' },
  prep_chess:  { trap: '마법사 체스',      who: '론',         title: '론이 자기를 내주는 수',                   how: '론과 체스를 두며 "가장 좋은 수가 내 말을 내주는 수"인 자리를 함께 본다' },
  prep_riddle: { trap: '일곱 개의 병',     who: '헤르미온느', title: '헤르미온느가 수수께끼를 푸는 머리',       how: '헤르미온느에게 책에 없는 논리 수수께끼를 건넨다 — 독수리 문고리, 병 수수께끼' },
  prep_owl:    { trap: '덤블도어의 귀환',  who: '헤르미온느', title: '무슨 일이 생기면 곧장 부엉이장으로',     how: '헤르미온느에게 부엉이장 가는 지름길을 알려 두고, "선생님께 먼저"라는 말을 마음에 심어 둔다' },
};
