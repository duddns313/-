'use strict';
/* 게임 전역에서 쓰는 고정 데이터: 스탯·자원·기숙사·장소·주문·소지품·인물·카드·기억 */

const STATS = {
  courage:   { name: '용기', icon: '🦁' },
  wisdom:    { name: '지혜', icon: '🦅' },
  diligence: { name: '성실', icon: '🦡' },
  cunning:   { name: '기지', icon: '🐍' },
  magic:     { name: '마법', icon: '✨' },
};

const RESOURCES = {
  hp:      { name: '기운',   icon: '🕯️', max: 100, hidden: true },   /* 예전 체력 — 기운으로 합쳐 처리한다 */
  heart:   { name: '기운',   icon: '🕯️', max: 100 },
  galleon: { name: '갈레온', icon: '🪙' },
  notice:  { name: '주목도', icon: '👁️', max: 100 },
  points:  { name: '기숙사 점수', icon: '🏆' },
};

const HOUSES = {
  gryffindor: { name: '그리핀도르', stat: 'courage',   color: '#9c2a2a', animal: '사자',   head: '맥고나걸 교수', ghost: '목이 달랑달랑한 닉', common: '그리핀도르 탑' },
  ravenclaw:  { name: '래번클로',   stat: 'wisdom',    color: '#24467a', animal: '독수리', head: '플리트윅 교수', ghost: '회색 숙녀',         common: '래번클로 탑' },
  hufflepuff: { name: '후플푸프',   stat: 'diligence', color: '#b88a1b', animal: '오소리', head: '스프라우트 교수', ghost: '뚱뚱한 수도사',   common: '후플푸프 휴게실' },
  slytherin:  { name: '슬리데린',   stat: 'cunning',   color: '#2c6b45', animal: '뱀',     head: '스네이프 교수', ghost: '피투성이 남작',      common: '슬리데린 지하 휴게실' },
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
  lumos:       { name: '루모스',               desc: '지팡이 끝에 불을 밝힌다' },
  wingardium:  { name: '윙가르디움 레비오사',  desc: '물건을 공중에 띄운다' },
  alohomora:   { name: '알로호모라',           desc: '잠긴 자물쇠를 연다' },
  petrificus:  { name: '페트리피쿠스 토탈루스', desc: '상대를 통나무처럼 굳힌다' },
  bluebell:    { name: '푸른 불꽃',            desc: '병에 담아 들고 다닐 수 있는 푸른 불을 피운다' },
};

/* use: 소지품 탭에서 쓸 수 있는 1회용 효과 */
/* use: 소지품에서 쓰는 1회용 효과 · price/shop: 부엉이 주문서에서 살 수 있음 · hint: 어디에 쓰이는지 */
const ITEMS = {
  frog:        { name: '개구리 초콜릿',       icon: '🐸', desc: '한 번 뛰어오르니 재빨리 잡을 것. 안에는 유명한 마법사 카드가 들어 있다.', use: { heart: 10, card: 'random' }, price: 1, shop: 'honeydukes', hint: '기운 회복 · 카드 수집' },
  beans:       { name: '버티 보트의 온갖 맛이 나는 젤리', icon: '🫘', desc: '정말로 온갖 맛이 난다. 정말로.', use: { beans: true }, price: 1, shop: 'honeydukes', hint: '운에 맡기는 간식' },
  pasty:       { name: '호박 파이',           icon: '🥧', desc: '아직 따뜻하다.', use: { heart: 18 }, price: 1, shop: 'honeydukes', hint: '기운 회복' },
  pepperup:    { name: '페퍼업 물약',         icon: '🧪', desc: '마시면 귀에서 김이 난다. 대신 기운이 펄펄 난다.', use: { heart: 40 }, price: 5, shop: 'apothecary', hint: '기운 크게 회복' },
  gimbap:      { name: '엄마의 김밥',         icon: '🍙', desc: '은박지에 싼 김밥 한 줄. 참기름 냄새가 난다.', use: { heart: 25 } },
  rockcake:    { name: '해그리드의 바위과자', icon: '🪨', desc: '이름 그대로다. 이가 성할 때 먹을 것. 던지면 무기도 된다.', use: { heart: 6 } },
  yakgwa:      { name: '약과',               icon: '🍯', desc: '엄마가 보낸 약과. 누군가와 나눠 먹기 좋다.', use: { heart: 15 } },
  hogwarts_history: { name: '『호그와트의 역사』', icon: '📕', desc: '헤르미온느가 강력히 추천한 책. 성에 대한 거의 모든 것이 들어 있다.', price: 2, shop: 'owl', hint: '성의 비밀·조사 판정에 도움' },
  dungbomb:    { name: '똥폭탄',             icon: '💩', desc: '터지면 지독한 냄새가 난다. 주의를 돌리는 데는 이만한 게 없다.', price: 2, shop: 'twins', hint: '주의 돌리기 · 들키지 않기' },
  fireworks:   { name: '필리버스터 폭죽',     icon: '🎆', desc: '물에 젖어도, 열이 없어도 터지는 폭죽. 소리가 아주 크다.', price: 4, shop: 'twins', hint: '신호 보내기 · 크게 시선 끌기' },
  gum:         { name: '드루블의 풍선껌',     icon: '🫧', desc: '절대 터지지 않는 블루벨색 풍선껌. 무엇에든 끈질기게 들러붙는다.', price: 1, shop: 'honeydukes', hint: '붙이고 막기' },
  gloves:      { name: '용가죽 장갑',         icon: '🧤', desc: '불에도 이빨에도 끄떡없는 장갑. 약초학 필수품.', price: 6, shop: 'owl', hint: '물고 뜨거운 것 다루기' },
  bezoar:      { name: '베조아르',            icon: '🟤', desc: '염소 위장에서 나온 돌. 대부분의 독을 해독한다.', price: 5, shop: 'apothecary', hint: '독 · 마법약' },
  spellotape:  { name: '스펠로테이프',        icon: '🩹', desc: '마법사용 접착테이프. 부러진 것도 일단은 붙여 준다.', price: 2, shop: 'owl', hint: '망가진 것 고치기' },
  biscuits:    { name: '개 비스킷 한 봉지',   icon: '🦴', desc: '해그리드가 팽에게 주는 것과 같은 비스킷. 큰 개일수록 좋아한다.', price: 1, shop: 'owl', hint: '개 달래기' },
  wintercloak: { name: '두꺼운 겨울 망토',    icon: '🧥', desc: '안감에 양털을 덧댄 망토. 한겨울 탑 위에서도 따뜻하다.', price: 4, shop: 'owl', hint: '추운 곳 · 밤의 바깥' },
  dragon_book: { name: '『취미와 이익을 위한 용 사육』', icon: '📗', desc: '도서관에서 빌린 책. 반납일이 한참 지났다.' },
  invite_card: { name: '해그리드의 쪽지',     icon: '✉️', desc: '“금요일 오후에 차 마시러 오거라. —해그리드”' },
  sweater:     { name: '손뜨개 스웨터',       icon: '🧶', desc: '엄마가 서툰 솜씨로 떠서 보낸 스웨터. 소매 길이가 서로 다르다.' },
  chess_knight:{ name: '론의 체스 기사',      icon: '♞', desc: '론이 할아버지에게 물려받은 마법사 체스의 기사 말. "작전 짤 때 쥐고 있어. 머리가 잘 돌아가."' },
  hohyeon_cap: { name: '서울 마트 병뚜껑',    icon: '🪙', desc: '호현이 늘 주머니에 넣고 다니던 식혜 병뚜껑. 기차에서 영운 손에 쥐여 주었다. "부적이야."' },
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
  willow: { name: '버드나무, 유니콘 털, 10과 1/4인치, 잘 휘어짐',   stat: 'diligence' },
  ebony:  { name: '흑단, 용의 심금, 11인치, 단단함',               stat: 'courage' },
  cherry: { name: '벚나무, 불사조 깃털, 10과 3/4인치, 유연함',      stat: 'wisdom' },
  hazel:  { name: '개암나무, 용의 심금, 9와 1/2인치, 고집이 셈',     stat: 'cunning' },
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

const MEMORIES = {
  letter_brave:   { name: '봉투를 뜯던 손', desc: '초록 잉크 편지를 받자마자 망설임 없이 뜯었다.' },
  letter_family:  { name: '식탁 위의 편지', desc: '가장 먼저 엄마에게 편지를 보여 주었다.' },
  mcg_cat:        { name: '간판 위의 고양이', desc: '맥고나걸 교수가 고양이에서 사람으로 변하는 것을 처음 보았다.' },
  hermione_book:  { name: '서점의 곱슬머리', desc: '플로리시 앤 블러츠에서 헤르미온느 그레인저를 만났다.' },
  ollivander:     { name: '지팡이가 고른 아이', desc: '올리밴더 씨가 “흥미롭군”이라고 중얼거렸다.' },
  gimbap_shared:  { name: '나눠 먹은 김밥', desc: '호그와트 특급에서 김밥을 나눠 먹었다.' },
  trevor_friend:  { name: '트레버의 친구', desc: '네빌의 두꺼비를 찾아 기차를 끝까지 뒤졌다.' },
  hat_choice:     { name: '모자의 속삭임', desc: '분류 모자와 나눈 대화. 기숙사는 스스로 골랐다.' },
  first_spark:    { name: '첫 불꽃', desc: '처음으로 마법이 손끝에서 제대로 일어났다.' },
  stood_up:       { name: '맞선 날', desc: '말포이 앞에서 물러서지 않았다.' },
  troll_warning:  { name: '트롤의 밤', desc: '핼러윈 밤, 트롤이 있는 쪽으로 걸음을 돌렸다.' },
  quirrell_stare: { name: '깜박이지 않는 눈', desc: '퀴디치 경기 날, 퀴렐 교수가 눈 한 번 깜박이지 않는 것을 보았다.' },
  three_heads:    { name: '문 뒤의 숨소리', desc: '4층 복도의 잠긴 문 너머에서 거대한 무언가의 숨소리를 들었다.' },
  forest_figures: { name: '숲으로 가는 두 사람', desc: '천문탑에서 금지된 숲으로 들어가는 두 그림자를 보았다.' },
  norbert:        { name: '노버트의 비밀', desc: '해그리드의 오두막에서 아기 용을 보았다. 아무에게도 말하지 않았다.' },
  mirror:         { name: '거울 속의 식탁', desc: '소망의 거울 속에서 가족이 모두 호그와트 연회장에 앉아 있었다.' },
  mirror_self:    { name: '거울 속의 배지', desc: '소망의 거울 속에서 수석 배지를 단 자신을 보았다.' },
  mirror_friends: { name: '거울 속의 친구들', desc: '소망의 거울 속에서 자신이 친구들 한가운데서 웃고 있었다.' },
  christmas_home: { name: '뉴몰든의 크리스마스', desc: '크리스마스를 가족과 보냈다. 길 건너 서울 마트의 불 꺼진 2층 창문을 보았다.' },
  two_letters:    { name: '마주 본 두 장의 편지', desc: '같은 날 아침, 길 건너 호현에게도 초록 잉크 편지가 왔다.' },
  same_table:     { name: '한 식탁의 두 엄마', desc: '10년 만에 안빈과 유명란이 한 식탁에 앉았다. 맥고나걸 교수 덕분에.' },
  hohyeon_line:   { name: '호현의 선', desc: '늘 웃던 호현이 처음으로 웃지 않았다. 누군가 호현의 엄마를 비웃었을 때.' },
  hohyeon_stood:  { name: '호현 옆에 선 날', desc: '호현이 선을 그었을 때, 영운은 그 옆에 섰다.' },
  hohyeon_rumor:  { name: '호현이 들은 이야기', desc: '호현이 모은 소문들: 다리를 저는 스네이프, 빈 교실에서 혼자 우는 퀴렐.' },
  hohyeon_story:  { name: '호현의 이야기', desc: '호현이 처음으로 자기 이야기를 꺼냈다. 크리스마스에 집에 가지 않은 진짜 이유.' },
  hermione_alone: { name: '혼자 먹는 점심', desc: '모두가 피하던 헤르미온느 옆에 앉아 점심을 먹었다.' },
  hermione_question: { name: '질문 공책', desc: '헤르미온느와 함께 "아직 답을 못 찾은 질문들" 공책을 만들었다.' },
  hermione_tears: { name: '도서관 서가 뒤에서', desc: '헤르미온느도 운다는 것을 알았다. 그리고 헤르미온느도 영운이 운다는 것을 알았다.' },
  ron_chess:      { name: '론의 체스 수업', desc: '론에게 마법사 체스를 배웠다. 희생할 줄 아는 말이 이긴다.' },
  ron_brothers:   { name: '물려받은 것들', desc: '론의 낡은 지팡이와 쥐와 형들 이야기를 들었다.' },
  ron_mirror:     { name: '론이 본 거울', desc: '론이 거울 속에서 반장 배지를 단 자신을 보았다고 털어놓았다.' },
  harry_cupboard: { name: '계단 밑 벽장', desc: '해리가 열한 해를 계단 밑 벽장에서 살았다는 것을 알았다.' },
  harry_broom:    { name: '빗속의 연습', desc: '빗속에서 해리의 퀴디치 연습을 끝까지 지켜보았다.' },
  cloak_night:    { name: '망토 아래의 밤', desc: '해리의 투명 망토를 함께 뒤집어쓰고 밤의 성을 걸었다.' },
  neville_comfort:{ name: '모래시계 아래서', desc: '150점을 잃은 다음 날, 네빌 곁에 앉아 있었다.' },
  centaur:        { name: '화성이 밝은 밤', desc: '금지된 숲에서 켄타우로스를 만났다.' },
  myrtle_friend:  { name: '머틀의 손님', desc: '울보 머틀과 이야기를 나눴다. 머틀이 울지 않은 드문 날이었다.' },
  flamel_known:   { name: '카드 뒷면의 이름', desc: '덤블도어 카드에서 니콜라스 플라멜이라는 이름을 읽었다.' },
  squid_toast:    { name: '오징어에게 토스트를', desc: '검은 호수의 대왕오징어에게 토스트를 던져 주었다.' },
  flyer:          { name: '바람을 탄 날', desc: '빗자루 위에서 처음으로 무섭지 않았다.' },
  quirrell_office: { name: '터번 아래의 목소리', desc: '퀴렐의 연구실에서 터번 속 두 번째 목소리를 들었다. 그리고 지워지지 않고 빠져나왔다.' },
  norbert_night:  { name: '자정의 탑', desc: '노버트가 떠나던 밤, 탑 아래에서 해리와 헤르미온느를 도왔다. 결말을 바꾸지는 못했지만.' },
  neville_freed:  { name: '굳어 버린 네빌 곁에서', desc: '마지막 밤, 통나무처럼 굳은 네빌을 혼자 두지 않았다.' },
  lullaby:        { name: '섬집아기', desc: '머리 셋 달린 개 앞에서 엄마의 자장가를 불렀다. 목이 쉴 때까지.' },
  dumbledore_thanks: { name: '반달 안경 너머의 윙크', desc: '마지막 밤, 덤블도어가 아무도 모르게 고맙다고 했다.' },
  cup_points:     { name: '모래시계 속의 내 몫', desc: '1년 동안 기숙사에 보탠 점수가 그 우승 안에 섞여 있었다.' },
};

/* 1학년 달력. 0 = 입학 전, 13 = 학년말 */
const CALENDAR = {
  1: {
    0: '1991년 여름', 1: '9월 둘째 주', 2: '9월 셋째 주', 3: '10월 초', 4: '10월 31일', 5: '11월 초',
    6: '11월 말', 7: '12월 중순', 8: '1월', 9: '2월', 10: '3월', 11: '4월', 12: '5월', 13: '6월',
  },
};
const TURNS_PER_YEAR = 12;
