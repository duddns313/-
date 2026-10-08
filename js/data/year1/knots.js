'use strict';
/* 1학년 · 운명의 매듭 — 원작의 우연들. 첫 번째 삶에서 호현과 내가 뒤에서 만들어 낸 것들.
   heavy: 끊기면 원작이 크게 어긋난다(결말을 가른다) · light: 뒤의 무거운 매듭을 먹여 살린다
   neville: 🌱 네빌의 용기가 자랄 씨앗 — 첫 번째 삶에서 우리가 놓친 것
   due: 이 주(turn)가 끝날 때까지 아무것도 하지 않으면 끊긴다 · ready: 이번 판에 사건이 준비된 매듭 */

const KNOTS = {};
function defineKnots(list) { list.forEach((k, i) => { KNOTS[k.id] = Object.assign({ n: i + 1, year: 1 }, k); }); }

defineKnots([
  { id: 'k_platform', month: '9월 1일', title: '해리가 승강장에서 위즐리 가족을 만난다', weight: 'heavy', due: 0, ready: true,
    feeds: '론과의 우정 → 6월의 체스판', life: '그때는 내가 몰리 아줌마 쪽으로 슬쩍 길을 텄다. 해리는 그게 우연인 줄 안다.' },
  { id: 'k_trevor', month: '9월 1일', title: '트레버를 찾던 헤르미온느가 해리와 론의 칸에 들어간다', weight: 'light', neville: true, due: 0, ready: true,
    feeds: '셋의 첫 만남 · 네빌', life: '네빌이 울먹이며 두꺼비를 찾던 그 복도. 그때 나는 네빌의 얼굴을 기억하지 못했다.' },
  { id: 'k_card', month: '9월 1일', title: '해리가 개구리 초콜릿에서 덤블도어 카드를 뽑는다', weight: 'light', due: 0, ready: true,
    feeds: '카드 뒷면의 "니콜라스 플라멜" → 1월의 깨달음', life: '혼자서는 아무것도 아닌 카드 한 장. 하지만 1월에 해리가 "이 이름 어디서 봤는데!" 하려면 지금 읽어 둬야 한다.' },
  { id: 'k_hand', month: '9월 1일', title: '해리가 말포이의 악수를 거절한다', weight: 'heavy', due: 0, ready: true,
    feeds: '분류 모자 앞에서 "슬리데린은 싫어"', life: '모자는 해리를 슬리데린에 넣고 싶어 했다. 해리가 말포이를 싫어해야 한다.' },
  { id: 'k_remembrall', month: '9월', title: '네빌의 기억구슬 — 비행 수업에서 해리가 날아오른다', weight: 'heavy', neville: true, due: 2, ready: true,
    feeds: '해리가 수색꾼이 된다 → 11월 퀴디치 · 6월 날개 달린 열쇠', life: '네빌은 떨어져 손목이 부러진다. 그래야 후치 부인이 자리를 비운다. 그래야 해리가 난다.' },
  { id: 'k_duel', month: '9월', title: '자정의 결투 — 넷이 4층 복도에서 플러피를 본다', weight: 'heavy', neville: true, due: 3, ready: true,
    feeds: '4층의 비밀 · 셋이 그 문 너머를 궁금해한다', life: '말포이는 오지 않는다. 필치가 온다. 네빌은 암호를 잊고 초상화 밖에 있어야 한다.' },
  { id: 'k_troll', month: '10월 31일', title: '헤르미온느의 눈물과 트롤 — 셋이 친구가 된다', weight: 'heavy', due: 4, ready: true,
    feeds: '1년 내내 · 6월의 함정들', life: '헤르미온느는 오후 내내 화장실에서 울어야 한다. 아무도 달래 주면 안 된다. 그게 제일 힘들었다.' },
  { id: 'k_snape_leg', month: '11월 1일', title: '해리가 스네이프의 물린 다리를 본다', weight: 'light', due: 5, ready: true,
    feeds: '셋은 스네이프를 의심한다 → 퀴렐이 경계를 늦춘다', life: '해리가 『퀴디치의 역사』를 돌려받으러 교무실에 가야 한다.' },
  { id: 'k_quidditch', month: '11월', title: '헤르미온느가 스네이프의 망토에 불을 붙인다', weight: 'heavy', due: 5,
    feeds: '해리가 산다', life: '퀴렐의 눈길이 끊기는 단 몇 초.' },
  { id: 'k_hagrid_slip', month: '11월', title: '해그리드가 "니콜라스 플라멜"을 흘린다', weight: 'light', due: 6,
    feeds: '플라멜을 찾는 겨울' },
  { id: 'k_mirror', month: '12월', title: '해리가 필치를 피해 소망의 거울을 찾는다', weight: 'heavy', due: 7,
    feeds: '6월, 돌을 꺼내는 방법' },
  { id: 'k_leglock', month: '1월', title: '다리 묶기에 걸린 네빌 — "넌 말포이 열두 명 몫이야"', weight: 'heavy', neville: true, due: 8,
    feeds: '플라멜 깨달음 · 네빌의 용기' },
  { id: 'k_stands', month: '2월', title: '관중석에서 네빌이 크래브와 고일에게 덤빈다', weight: 'light', neville: true, due: 9,
    feeds: '네빌의 용기' },
  { id: 'k_egg', month: '3월', title: '해그리드가 낯선 이에게서 용 알을 얻는다', weight: 'light', due: 10,
    feeds: '노버트 · 플러피를 달래는 법이 새어 나간다' },
  { id: 'k_norbert', month: '4월', title: '노버트가 떠나는 밤 — 150점, 그리고 경고하러 나온 네빌', weight: 'heavy', neville: true, due: 11,
    feeds: '벌칙 → 금지된 숲' },
  { id: 'k_forest', month: '5월', title: '금지된 숲 — 피렌체가 해리를 구한다', weight: 'heavy', due: 12,
    feeds: '해리가 볼드모트가 살아 있다는 걸 안다' },
  { id: 'k_realize', month: '6월', title: '해리가 해그리드의 실수를 깨닫는다', weight: 'heavy', due: 13,
    feeds: '그날 밤 뚜껑 문으로' },
  { id: 'k_neville', month: '6월', title: '네빌이 셋을 막아선다', weight: 'heavy', neville: true, due: 13,
    feeds: '덤블도어의 10점 · 네빌의 용기' },
  { id: 'k_return', month: '6월', title: '덤블도어가 제때 돌아온다', weight: 'heavy', due: 13,
    feeds: '해리가 산다' },
  { id: 'k_trapdoor', month: '6월', title: '셋이 함정을 지난다', weight: 'heavy', due: 13,
    feeds: '1학년의 끝' },
]);
