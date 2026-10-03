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
  hp:      { name: '체력',   icon: '❤️', max: 100 },
  heart:   { name: '마음',   icon: '💗', max: 100 },
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
  astronomy:  { name: '천문탑',            icon: '🔭', desc: '성에서 가장 높은 곳' },
  dungeons:   { name: '지하 감옥',         icon: '🧪', desc: '스네이프 교수의 영역', danger: true },
  kitchen:    { name: '주방',              icon: '🍐', desc: '배 그림을 간지럽히면…' },
  myrtle:     { name: '2층 여자 화장실',   icon: '🚿', desc: '아무도 쓰지 않는 화장실' },
  trophy:     { name: '트로피 진열실',     icon: '🏆', desc: '먼지 쌓인 영광들', danger: true },
};

const SPELLS = {
  lumos:       { name: '루모스',               desc: '지팡이 끝에 불을 밝힌다' },
  wingardium:  { name: '윙가르디움 레비오사',  desc: '물건을 공중에 띄운다' },
  alohomora:   { name: '알로호모라',           desc: '잠긴 자물쇠를 연다' },
  petrificus:  { name: '페트리피쿠스 토탈루스', desc: '상대를 통나무처럼 굳힌다' },
  bluebell:    { name: '푸른 불꽃',            desc: '병에 담아 들고 다닐 수 있는 푸른 불을 피운다' },
};

/* use: 소지품 탭에서 쓸 수 있는 1회용 효과 */
const ITEMS = {
  frog:        { name: '개구리 초콜릿',       icon: '🐸', desc: '한 번 뛰어오르니 재빨리 잡을 것. 안에는 유명한 마법사 카드가 들어 있다.', use: { heart: 10, card: 'random' } },
  beans:       { name: '버티 보트의 온갖 맛이 나는 젤리', icon: '🫘', desc: '정말로 온갖 맛이 난다. 정말로.', use: { beans: true } },
  pasty:       { name: '호박 파이',           icon: '🥧', desc: '아직 따뜻하다.', use: { hp: 15, heart: 5 } },
  gimbap:      { name: '엄마의 김밥',         icon: '🍙', desc: '은박지에 싼 김밥 한 줄. 참기름 냄새가 난다.', use: { hp: 20, heart: 15 } },
  rockcake:    { name: '해그리드의 바위과자', icon: '🪨', desc: '이름 그대로다. 이가 성할 때 먹을 것.', use: { hp: 5, heart: 5 } },
  hogwarts_history: { name: '『호그와트의 역사』', icon: '📕', desc: '헤르미온느가 강력히 추천한 책. 성에 대한 거의 모든 것이 들어 있다.' },
  dungbomb:    { name: '똥폭탄',             icon: '💩', desc: '프레드와 조지가 쥐여 준 것. 주의를 돌리는 데는 이만한 게 없다.' },
  invite_card: { name: '해그리드의 쪽지',     icon: '✉️', desc: '“금요일 오후에 차 마시러 오거라. —해그리드”' },
  sweater:     { name: '손뜨개 스웨터',       icon: '🧶', desc: '엄마가 서툰 솜씨로 떠서 보낸 스웨터. 소매 길이가 서로 다르다.' },
  feather:     { name: '불사조 깃털 그림 엽서', icon: '🪶', desc: '영준이가 그린 그림. 불사조라고 우기지만 아무리 봐도 닭이다.' },
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
  hermione:  { name: '헤르미온느 그레인저' },
  neville:   { name: '네빌 롱바텀' },
  ron:       { name: '론 위즐리' },
  harry:     { name: '해리 포터' },
  hagrid:    { name: '루비우스 해그리드' },
  twins:     { name: '프레드와 조지 위즐리' },
  draco:     { name: '드레이코 말포이' },
  mcgonagall:{ name: '맥고나걸 교수' },
  snape:     { name: '스네이프 교수' },
  myrtle:    { name: '울보 머틀' },
  housemate: { name: '기숙사 친구들' },
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
  christmas_home: { name: '뉴몰든의 크리스마스', desc: '크리스마스를 가족과 보냈다. 영준이에게 호그와트 이야기를 해 주었다.' },
  neville_comfort:{ name: '모래시계 아래서', desc: '150점을 잃은 다음 날, 네빌 곁에 앉아 있었다.' },
  centaur:        { name: '화성이 밝은 밤', desc: '금지된 숲에서 켄타우로스를 만났다.' },
  myrtle_friend:  { name: '머틀의 손님', desc: '울보 머틀과 이야기를 나눴다. 머틀이 울지 않은 드문 날이었다.' },
  flamel_known:   { name: '카드 뒷면의 이름', desc: '덤블도어 카드에서 니콜라스 플라멜이라는 이름을 읽었다.' },
  squid_toast:    { name: '오징어에게 토스트를', desc: '검은 호수의 대왕오징어에게 토스트를 던져 주었다.' },
  flyer:          { name: '바람을 탄 날', desc: '빗자루 위에서 처음으로 무섭지 않았다.' },
};

/* 1학년 달력. 0 = 입학 전, 13 = 학년말 */
const CALENDAR = {
  1: {
    0: '1991년 여름', 1: '9월 둘째 주', 2: '9월 셋째 주', 3: '10월 초', 4: '10월 31일', 5: '11월 초',
    6: '11월 말', 7: '12월 중순', 8: '1월', 9: '2월', 10: '3월', 11: '4월', 12: '5월', 13: '6월',
  },
};
const TURNS_PER_YEAR = 12;
