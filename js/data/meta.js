'use strict';
/* 게임 전역에서 쓰는 고정 데이터: 자원·기숙사·장소·주문·소지품·인물·카드·기억 */

/* ❤️ 체력 · 💭 정신력: 한도 5, 0이 되면 게임 오버 · ⭐ 평판: 1~5단계 · 🪙 갈레온 */
const RESOURCES = {
  hp:      { name: '체력',   icon: '❤️', max: 5 },
  mind:    { name: '정신력', icon: '💭', max: 5 },
  rep:     { name: '평판',   icon: '⭐', max: 5 },
  galleon: { name: '갈레온', icon: '🪙' },
};

const HOUSES = {
  gryffindor: { name: '그리핀도르',   color: '#9c2a2a', animal: '사자',   head: '맥고나걸 교수', ghost: '목이 달랑달랑한 닉', common: '그리핀도르 탑' },
  ravenclaw:  { name: '래번클로', color: '#24467a', animal: '독수리', head: '플리트윅 교수', ghost: '회색 숙녀',         common: '래번클로 탑' },
  hufflepuff: { name: '후플푸프', color: '#b88a1b', animal: '오소리', head: '스프라우트 교수', ghost: '뚱뚱한 수도사',   common: '후플푸프 휴게실' },
  slytherin:  { name: '슬리데린', color: '#2c6b45', animal: '뱀',     head: '스네이프 교수', ghost: '피투성이 남작',      common: '슬리데린 지하 휴게실' },
};

/* 행선지 카드. safe=쉬어가는 곳, danger=위험할 수 있는 곳 */
const PLACES = {
  common:     { name: '기숙사 휴게실',     icon: '🛋️', desc: '난롯가에서 숨을 돌린다', safe: true },
  great_hall: { name: '대연회장',          icon: '🕯️', desc: '네 개의 긴 식탁, 천 개의 촛불' },
  classroom:  { name: '교실',              icon: '📖', desc: '수업 시간. 배우는 만큼 강해진다' },
  library:    { name: '도서관',            icon: '📚', desc: '핀스 부인이 지켜보는 조용한 서가' },
  corridors:  { name: '복도와 계단',       icon: '🪜', desc: '움직이는 계단, 숨은 문, 피브스', danger: true },
  hagrid:     { name: '해그리드의 오두막', icon: '🛖', desc: '숲 가장자리의 따뜻한 굴뚝 연기' },
  lake:       { name: '검은 호수',         icon: '🌊', desc: '물가의 바람과 대왕오징어' },
  pitch:      { name: '퀴디치 경기장',     icon: '🧹', desc: '빗자루와 바람' },
  owlery:     { name: '부엉이장',          icon: '🦉', desc: '집으로 편지를 보낸다' },
  greenhouse: { name: '온실',              icon: '🌱', desc: '흙냄새와 이상한 식물들' },
  astronomy:  { name: '천문탑',            icon: '🔭', desc: '성에서 가장 높은 곳', night: true },
  dungeons:   { name: '지하 감옥',         icon: '🧪', desc: '스네이프 교수의 영역', danger: true },
  kitchen:    { name: '주방',              icon: '🍐', desc: '배 그림을 간지럽히면…' },
  myrtle:     { name: '2층 여자 화장실',   icon: '🚿', desc: '아무도 쓰지 않는 화장실' },
  trophy:     { name: '트로피 진열실',     icon: '🏆', desc: '먼지 쌓인 영광들', danger: true, night: true },
};

const SPELLS = {
  lumos:       { name: '루모스',               desc: '지팡이 끝에 불을 밝힌다', back: '지팡이 끝이 처음으로 내 말을 들었다. 칠 년 동안 수천 번 켠 불인데, 이 손으로는 처음이었다.' },
  nox:         { name: '녹스',                 desc: '지팡이 끝의 불을 끈다. 어둠 속에 숨을 때', back: '켜는 것보다 끄는 게 어려웠다. 지팡이는 아직 나를 다 믿지 않는다.' },
  reparo:      { name: '레파로',               desc: '깨지고 부러진 것을 고친다 (오쿨루스 레파로 — 안경도)', back: '갈라진 금이 저절로 붙었다. 머리는 알고 있었다. 손이 따라오는 데 시간이 걸렸을 뿐.' },
  wingardium:  { name: '윙가르디움 레비오사',  desc: '물건을 공중에 띄운다', back: '휘두르고, 튕기고. 열한 살의 손목은 생각보다 느렸다. 그래도 떴다.' },
  alohomora:   { name: '알로호모라',           desc: '잠긴 자물쇠를 연다', back: '찰칵. 자물쇠보다 내 손이 먼저 풀린 것 같았다.' },
  petrificus:  { name: '페트리피쿠스 토탈루스', desc: '상대를 통나무처럼 굳힌다', back: '1학년이 쓸 주문이 아니다. 아무도 없는 데서만 꺼내야 한다.' },
  bluebell:    { name: '푸른 불꽃',            desc: '병에 담아 들고 다닐 수 있는 푸른 불을 피운다', back: '푸른 불이 병 속에서 흔들렸다. 6월의 어둠을 아는 불.' },
  locomotor:   { name: '로코모토르 모르티스',  desc: '다리 묶기 저주. 두 다리가 딱 붙는다', back: '말포이가 이 주문을 누구에게 쓰는지 안다. 그래서 되찾았다.' },
  finite:      { name: '피니테 인칸타템',      desc: '걸린 마법을 푼다 — 다리 묶기도, 전신 마비도', back: '풀어 주는 주문. 이번 삶에서 가장 많이 쓰게 될 것 같았다.' },
};

/* use: 소지품에서 먹는 1회용 효과 · price/shop: 부엉이 주문서 · hint: 쓰임새
   열쇠로 쓰일 때 사라지는지(consume)는 결과에서만 알 수 있다 */
const ITEMS = {
  frog:        { name: '개구리 초콜릿',       icon: '🐸', desc: '한 번 뛰어오르니 재빨리 잡을 것. 안에는 유명한 마법사 카드가 들어 있다.', use: { mind: 1, card: 'random' }, price: 2, shop: 'honeydukes', hint: '먹으면 💭+1 · 카드 수집' },
  beans:       { name: '버티 보트의 온갖 맛이 나는 젤리', icon: '🫘', desc: '정말로 온갖 맛이 난다. 정말로.', use: { beans: true }, price: 1, shop: 'honeydukes', hint: '운에 맡기는 간식' },
  pasty:       { name: '호박 파이',           icon: '🥧', desc: '아직 따뜻하다.', use: { hp: 1 }, price: 2, shop: 'honeydukes', hint: '먹으면 ❤️+1' },
  pepperup:    { name: '페퍼업 물약',         icon: '🧪', desc: '마시면 귀에서 김이 난다. 대신 기운이 펄펄 난다.', use: { hp: 2 }, price: 5, shop: 'apothecary', hint: '마시면 ❤️+2' },
  gimbap:      { name: '엄마의 김밥',         icon: '🍙', desc: '은박지에 싼 김밥 한 줄. 참기름 냄새가 난다.', use: { hp: 1, mind: 1 } },
  rockcake:    { name: '해그리드의 바위과자', icon: '🪨', desc: '이름 그대로다. 이가 성할 때 먹을 것. 던지면 무기도 된다.', use: { hp: 1 } },
  yakgwa:      { name: '약과',               icon: '🍯', desc: '엄마가 보낸 약과. 누군가와 나눠 먹기 좋다.', use: { mind: 1 } },
  hogwarts_history: { name: '『호그와트의 역사』', icon: '📕', desc: '헤르미온느가 강력히 추천한 책. 성에 대한 거의 모든 것이 들어 있다.', price: 2, shop: 'owl', hint: '성의 비밀·조사 판정에 도움' },
  dungbomb:    { name: '똥폭탄',             icon: '💩', desc: '터지면 지독한 냄새가 난다. 주의를 돌리는 데는 이만한 게 없다.', price: 2, shop: 'twins', hint: '주의 돌리기 · 들키지 않기' },
  fireworks:   { name: '필리버스터 폭죽',     icon: '🎆', desc: '물에 젖어도, 열이 없어도 터지는 폭죽. 소리가 아주 크다.', price: 4, shop: 'twins', hint: '신호 보내기 · 크게 시선 끌기' },
  gum:         { name: '드루블의 풍선껌',     icon: '🫧', desc: '절대 터지지 않는 블루벨색 풍선껌. 무엇에든 끈질기게 들러붙는다.', price: 1, shop: 'honeydukes', hint: '붙이고 막기' },
  gloves:      { name: '용가죽 장갑',         icon: '🧤', desc: '불에도 이빨에도 끄떡없는 장갑. 약초학 필수품.', price: 6, shop: 'owl', hint: '물고 뜨거운 것 다루기' },
  bezoar:      { name: '베조아르',            icon: '🟤', desc: '염소 위장에서 나온 돌. 대부분의 독을 해독한다.', price: 5, shop: 'apothecary', hint: '독 · 마법약' },
  spellotape:  { name: '스펠로테이프',        icon: '🩹', desc: '마법사용 접착테이프. 부러진 것도 일단은 붙여 준다.', price: 2, shop: 'owl', hint: '망가진 것 고치기' },
  biscuits:    { name: '개 비스킷 한 봉지',   icon: '🦴', desc: '해그리드가 팽에게 주는 것과 같은 비스킷. 큰 개일수록 좋아한다.', price: 1, shop: 'owl', hint: '개 달래기' },
  wintercloak: { name: '두꺼운 겨울 망토',    icon: '🧥', desc: '안감에 양털을 덧댄 망토. 한겨울 탑 위에서도 따뜻하다.', price: 4, shop: 'owl', hint: '추운 곳 · 밤의 바깥' },
  sweater:     { name: '손뜨개 스웨터',       icon: '🧶', desc: '엄마가 서툰 솜씨로 떠서 보낸 스웨터. 소매 길이가 서로 다르다.' },
  chess_knight:{ name: '론의 체스 기사',      icon: '♞', desc: '론이 할아버지에게 물려받은 마법사 체스의 기사 말. "작전 짤 때 쥐고 있어. 머리가 잘 돌아가."' },
  hohyeon_cap: { name: '찌그러진 병뚜껑',    icon: '🪙', desc: '호현이 늘 주머니에 넣고 다니던 식혜 병뚜껑. 기차에서 내 손에 쥐여 주었다. 첫 번째 삶에서도 그랬다. "부적이야." 무엇을 막아 주는 부적인지는 말하지 않았다.' },
  cloak_note:  { name: '해리의 쪽지',         icon: '📝', desc: '"필요하면 말해. —H" 투명 망토를 한 번 빌릴 수 있다는 뜻이다.' },
};

/* 부엉이 주문서의 가게들 */
const SHOPS = {
  owl:        { name: '다이애건 앨리 부엉이 주문', icon: '🦉', desc: '학교 부엉이에게 주문서를 묶어 보내면 다음 날 아침 우편으로 온다.' },
  honeydukes: { name: '허니듀크스 과자 주문',     icon: '🍬', desc: '호그스미드의 과자 가게. 1학년도 부엉이 주문은 된다.' },
  apothecary: { name: '슬러그 앤 지거스 약재상',  icon: '⚗️', desc: '다이애건 앨리의 약재상. 냄새는 지독하지만 물건은 확실하다.' },
  twins:      { name: '쌍둥이의 가방',            icon: '🎒', desc: '프레드와 조지가 휴게실 구석에서 몰래 파는 물건들.', needs: { any: [{ rel: { twins: 10 } }, { flag: 'kitchen_known' }] } },
};

const PETS = {
  owl:  { name: '보리',   kind: '가면올빼미' },
  cat:  { name: '먹물',   kind: '검은 고양이' },
  toad: { name: '꾸물이', kind: '두꺼비' },
};

const WANDS = {
  willow: { name: '버드나무, 유니콘 털, 10과 1/4인치, 잘 휘어짐' },
  ebony:  { name: '흑단, 용의 심금, 11인치, 단단함' },
  cherry: { name: '벚나무, 불사조 깃털, 10과 3/4인치, 유연함' },
  hazel:  { name: '개암나무, 용의 심금, 9와 1/2인치, 고집이 셈' },
};

const PEOPLE = {
  hohyeon:   { name: '이호현', short: '호현' },
  hermione:  { name: '헤르미온느 그레인저', short: '헤르미온느' },
  ron:       { name: '론 위즐리', short: '론' },
  harry:     { name: '해리 포터', short: '해리' },
  neville:   { name: '네빌 롱바텀', short: '네빌' },
  hagrid:    { name: '루비우스 해그리드', short: '해그리드' },
  twins:     { name: '프레드와 조지 위즐리', short: '쌍둥이' },
  draco:     { name: '드레이코 말포이', short: '말포이' },
  mcgonagall:{ name: '맥고나걸 교수', short: '맥고나걸 교수' },
  snape:     { name: '스네이프 교수', short: '스네이프 교수' },
  myrtle:    { name: '울보 머틀', short: '머틀' },
  housemate: { name: '그리핀도르 친구들', short: '그리핀도르 친구들' },
};

/* 개구리 초콜릿 카드 */
const CARDS = {
  dumbledore: { name: '알버스 덤블도어', text: '현재 호그와트 교장. 1945년 어둠의 마법사 그린델왈드를 물리치고, 용의 피의 열두 가지 용도를 발견했으며, 동업자 니콜라스 플라멜과 함께 연금술 연구로 유명하다. 실내악과 볼링을 좋아한다.' },
  morgana:    { name: '모르가나', text: '중세의 마녀. 멀린의 맞수였으며 모습을 바꾸는 데 능했다.' },
  merlin:     { name: '멀린', text: '역사상 가장 유명한 마법사. 슬리데린 출신이라는 사실을 아는 사람은 생각보다 적다.' },
  circe:      { name: '키르케', text: '뱃사람들을 돼지로 바꾼 일로 이름을 남긴 고대 그리스의 마녀.' },
  paracelsus: { name: '파라켈수스', text: '르네상스 시대의 연금술사. 호그와트에 그의 흉상이 있는데, 피브스가 자꾸 떨어뜨리려 한다.' },
  cliodna:    { name: '클리오드나', text: '아일랜드의 드루이드 여사제. 바닷새로 변신할 수 있었다.' },
  agrippa:    { name: '아그리파', text: '르네상스 시대의 마법사. 그의 카드는 좀처럼 나오지 않아 수집가들의 애를 태운다.' },
  ptolemy:    { name: '프톨레마이오스', text: '고대 이집트의 천문학자이자 마법사.' },
  hengist:    { name: '우드크로프트의 헹기스트', text: '머글의 박해를 피해 마을을 세웠다고 전해지는 마법사. 그 마을이 오늘날의 호그스미드다.' },
  bowman:     { name: '보먼 라이트', text: '골든 스니치를 발명한 금속 세공 마법사. 덕분에 퀴디치 경기는 영원히 길어졌다.' },
  flamel:     { name: '니콜라스 플라멜', text: '연금술사. 이 카드는 너무 오래된 판이라 초상화 속 인물이 대체로 졸고 있다.' },
  newt:       { name: '뉴트 스캐맨더', text: '『신비한 동물 사전』의 저자. 호그와트 교재 목록에 그의 책이 빠진 해는 없다.' },
  gryffindor: { name: '고드릭 그리핀도르', text: '호그와트 창립자. 용맹을 무엇보다 높이 샀다.' },
  hufflepuff: { name: '헬가 후플푸프', text: '호그와트 창립자. 누구도 내치지 않았다. 요리 마법으로도 유명하다.' },
  ravenclaw:  { name: '로웨나 래번클로', text: '호그와트 창립자. 성의 움직이는 계단 상당수가 그녀의 설계라고 한다.' },
  slytherin:  { name: '살라자르 슬리데린', text: '호그와트 창립자. 뱀과 대화할 수 있었다.' },
};

/* 기억 — 1학년에 얻을 수 있는 열쇠가 되는 순간들. 그 밖의 작은 일들은 flag로 남긴다. */
const MEMORIES = {
  last_fold:        { name: '마지막 접기', desc: '1998년 5월, 호현이 남은 모든 것으로 세상을 1991년까지 접었다. 나만 기억한다. 이번엔 네빌부터.' },
  hermione_book:    { name: '서점의 헤르미온느', desc: '플러리시 앤 블러츠에서 책 더미 너머의 헤르미온느를 만났다.' },
  hohyeon_line:     { name: '호현이 그은 선', desc: '기차에서 말포이가 "머글 음식" 냄새라며 코를 찡그렸을 때, 호현이 처음으로 웃지 않았다. 나는 그 옆에 섰다.' },
  gimbap_shared:    { name: '나눠 먹은 김밥', desc: '기차에서 엄마의 김밥을 친구들과 나눠 먹었다.' },
  trevor_friend:    { name: '두꺼비 트레버', desc: '네빌의 두꺼비를 함께 찾아 주었다.' },
  first_spark:      { name: '처음 일으킨 마법', desc: '지팡이 끝에서 처음으로 마법이 제대로 일어났다.' },
  stood_up:         { name: '물러서지 않은 날', desc: '누군가를 위해 말포이 앞에서 물러서지 않았다.' },
  troll_warning:    { name: '트롤의 밤', desc: '핼러윈 밤, 트롤과 헤르미온느 사이에서 해야 할 일을 했다.' },
  hermione_alone:   { name: '화장실 문 앞에서', desc: '울고 있는 헤르미온느를 혼자 두지 않았다.' },
  hermione_question:{ name: '질문 공책', desc: '헤르미온느와 함께 풀지 못한 질문들을 공책에 적기 시작했다.' },
  hermione_tears:   { name: '처음 보여 준 눈물', desc: '헤르미온느가 내 앞에서만 울었다.' },
  ron_chess:        { name: '론의 체스판', desc: '론에게 마법사 체스를 배웠다. 론이 처음으로 자랑스러워 보였다.' },
  harry_cupboard:   { name: '계단 밑 벽장', desc: '해리가 자기 이야기를 처음으로 들려주었다.' },
  cloak_night:      { name: '투명 망토 아래', desc: '해리와 함께 투명 망토를 쓰고 한밤의 성을 걸었다.' },
  hohyeon_story:    { name: '호현의 이야기', desc: '들어 주기만 하던 호현이 처음으로 자기 이야기를 했다.' },
  hohyeon_rumor:    { name: '호현이 들은 소문', desc: '빈 교실에서 누군가에게 빌던 퀴렐의 이야기를 호현에게서 들었다.' },
  quirrell_stare:   { name: '깜박이지 않는 눈', desc: '퀴디치 경기 날, 퀴렐 교수가 눈 한 번 깜박이지 않는 것을 보았다.' },
  three_heads:      { name: '문 뒤의 숨소리', desc: '4층 복도의 잠긴 문 너머에서 거대한 무언가의 숨소리를 들었다.' },
  forest_figures:   { name: '숲으로 가는 두 사람', desc: '천문탑에서 금지된 숲으로 들어가는 두 그림자를 보았다.' },
  flamel_known:     { name: '카드 뒷면의 이름', desc: '덤블도어 카드에서 니콜라스 플라멜이라는 이름을 읽었다.' },
  norbert:          { name: '노버트의 비밀', desc: '해그리드의 오두막에서 아기 용을 보았다. 아무에게도 말하지 않았다.' },
  mirror:           { name: '소망의 거울', desc: '거울 속에서 가장 바라는 것을 보았다.' },
  neville_comfort:  { name: '네빌 옆자리', desc: '모두가 등을 돌렸을 때 네빌 옆에 앉았다.' },
  centaur:          { name: '화성이 밝은 밤', desc: '금지된 숲에서 켄타우로스의 말을 들었다.' },
  myrtle_friend:    { name: '머틀의 친구', desc: '2층 화장실의 울보 머틀과 친구가 되었다.' },
  stopped_world:    { name: '깜박인 세상', desc: '세상이 몇 분 전으로 돌아갔다. 나만 그것을 기억한다. 그리고 호현은 아무 일도 없었다고 한다.' },
  quirrell_office:  { name: '터번 아래의 목소리', desc: '퀴렐의 연구실에서 터번 속 두 번째 목소리를 들었다. 그리고 지워지지 않고 빠져나왔다.' },
  neville_freed:    { name: '굳어 버린 네빌 곁에서', desc: '마지막 밤, 통나무처럼 굳은 네빌을 혼자 두지 않았다.' },
  dumbledore_thanks:{ name: '반달 안경 너머의 윙크', desc: '마지막 밤, 덤블도어가 아무도 모르게 고맙다고 했다.' },
  reserve_list:     { name: '선발전 명단', desc: '블러저 앞에 뛰어들었다. 우드가 내년 선발전 명단에 이름을 적었다.' },
  lost_diadem:      { name: '어머니의 것을 가져간 딸', desc: '회색 숙녀가 빌린 지혜에 대한 오래된 이야기를 들려주었다.' },
  snare_lesson:     { name: '둘만의 수업', desc: '스프라우트 교수에게 악마의 덫을 다루는 법을 배웠다.' },
  secret_passage:   { name: '애꾸눈 마녀의 등', desc: '쌍둥이가 보여 준 지도에서 비밀 통로를 알아냈다.' },
  duel_champion:    { name: '한 걸음 밀린 챔피언', desc: '왕년의 결투 챔피언 플리트윅 교수와 마주 섰다.' },
};
/* 예전 기억 중 flag로 바뀐 것들 (변환할 때 memory: 'x' → flag: 'x', S_HAS(s,'x') → s.flags.x) */
const MEMORY_TO_FLAG = ['letter_brave', 'letter_family', 'mcg_cat', 'same_table', 'ollivander', 'hat_choice', 'hohyeon_stood', 'ron_brothers', 'ron_mirror', 'harry_broom', 'mirror_self', 'mirror_friends', 'squid_toast', 'flyer', 'norbert_night', 'cup_points', 'wood_trust', 'grey_lady', 'sprout_helper', 'twins_partner', 'flitwick_lesson'];

/* 1학년 달력. 0 = 입학 전, 13 = 학년말 */
const CALENDAR = {
  1: {
    0: '1991년 여름', 1: '9월 둘째 주', 2: '9월 셋째 주', 3: '10월 초', 4: '10월 31일', 5: '11월 초',
    6: '11월 말', 7: '12월 중순', 8: '1월', 9: '2월', 10: '3월', 11: '4월', 12: '5월', 13: '6월',
  },
};
const TURNS_PER_YEAR = 12;
